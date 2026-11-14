import { storage } from './storage.js';

let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let muted = storage.muted;

// ---- Track registry ---------------------------------------------------------
const TRACKS = {
  chiptune: { id: 'chiptune', name: 'Chiptune', bpmBase: 110, bpmStep: 8, gain: 0.28 },
  souljazz: { id: 'souljazz', name: 'Soul/Jazz', bpmBase: 76, bpmStep: 4, gain: 0.5 },
  chiptunerough: { id: 'chiptunerough', name: 'Chiptune (Rough)', bpmBase: 118, bpmStep: 8, gain: 0.28 },
};
const TRACK_ORDER = ['chiptune', 'souljazz', 'chiptunerough'];

let currentTrack = (storage.musicTrack && TRACKS[storage.musicTrack])
  ? storage.musicTrack : 'chiptune';

function currentTrackGain() {
  return (TRACKS[currentTrack] && TRACKS[currentTrack].gain) || 0.28;
}

// ---- Music scheduler state --------------------------------------------------
let musicRunning = false;
let musicTimer = null;
let nextNoteTime = 0;
let beatDur = 60 / 110;
let musicTier = 0;
let trackState = null;

// Noise buffer for percussion
let noiseBuffer = null;

// ---- Chiptune data (unchanged) ---------------------------------------------
const MELODY = [0, 2, 4, 6, 4, 2, 0, -1, 1, 3, 5, 3, 1, -1, 0, 2];
const BASS = [0, 0, 4, 4];
const PENT = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
const BASSF = [65.41, 98.00, 110.00, 130.81];

// ---- Soul/Jazz data --------------------------------------------------------
// Chord progression as MIDI note arrays (root,3rd,5th,7th; 9th added at tier2+)
const JAZZ_CHORDS = [
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
  [50, 53, 57, 60], // Dm7
  [55, 59, 62, 65], // G7
  [60, 64, 67, 71], // Cmaj7
  [53, 57, 60, 64], // Fmaj7
  [50, 53, 57, 60], // Dm7
  [55, 59, 62, 65], // G7
];
// 9th intervals (semitones above root) per chord index
const JAZZ_NINTHS = [2, 2, 2, 2, 2, 2, 2, 2];

// Walking bass: root (octave below chord root) + 5th + approach notes
function jazzBassNote(chordIdx, beatInChord) {
  const root = JAZZ_CHORDS[chordIdx][0] - 12;
  const fifth = root + 7;
  if (beatInChord === 0) return root;
  if (beatInChord === 1) return fifth;
  // approach to next chord root
  const nextRoot = JAZZ_CHORDS[(chordIdx + 1) % JAZZ_CHORDS.length][0] - 12;
  return beatInChord === 2 ? root + 2 : (nextRoot - 1);
}

// Melody: C blues/major-pentatonic pool
const JAZZ_MELODY = [60, 62, 63, 64, 67, 69, 70, 72, 74];

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function audioInit() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = currentTrackGain(); musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);

    // reusable noise buffer for percussion
    const len = Math.floor(ctx.sampleRate * 0.5);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; }
  return ctx;
}

export function setMuted(v) {
  muted = !!v;
  storage.muted = muted;
  if (master) master.gain.value = muted ? 0 : 0.7;
}
export function isMuted() { return muted; }
export function toggleMute() { setMuted(!muted); }

export function ctx_() { return ctx; }
export function musicBus() { return musicGain; }
export function sfxBus() { return sfxGain; }

export function getMusicTrack() { return currentTrack; }
export function getMusicTrackName() { return TRACKS[currentTrack].name; }
export function setMusicTrack(id) {
  if (!TRACKS[id] || id === currentTrack) return;
  currentTrack = id;
  storage.musicTrack = id;
  if (musicGain) musicGain.gain.value = currentTrackGain();
  if (musicRunning) {
    stopMusic();
    startMusic();
  }
}
export function cycleMusicTrack() {
  const i = TRACK_ORDER.indexOf(currentTrack);
  setMusicTrack(TRACK_ORDER[(i + 1) % TRACK_ORDER.length]);
}

function envGain(bus, vol, dur) {
  if (!ctx) return null;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(bus);
  return g;
}

export function beep(freq = 440, dur = 0.08, type = 'square', bus = 'sfx', vol = 0.4) {
  if (!ctx || muted) return;
  const target = bus === 'music' ? musicGain : sfxGain;
  const g = ctx.createGain();
  g.connect(target);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.start(now);
  o.stop(now + dur + 0.02);
}

// Named SFX
export function sfxJump() { beep(520, 0.08, 'square', 'sfx', 0.35); }
export function sfxDoubleJump() { beep(660, 0.08, 'square', 'sfx', 0.35); beep(880, 0.08, 'square', 'sfx', 0.3); }
export function sfxDash() { beep(300, 0.1, 'sawtooth', 'sfx', 0.3); }
export function sfxLand() { beep(180, 0.05, 'triangle', 'sfx', 0.2); }
export function sfxCollect() { beep(880, 0.06, 'square', 'sfx', 0.3); }
export function sfxHeart() { beep(660, 0.1, 'sine', 'sfx', 0.35); beep(880, 0.1, 'sine', 'sfx', 0.35); }
export function sfxUnlock() { beep(520, 0.12, 'square', 'sfx', 0.35); beep(780, 0.12, 'square', 'sfx', 0.35); }
export function sfxHurt() { beep(160, 0.2, 'sawtooth', 'sfx', 0.4); }
export function sfxGameOver() { beep(300, 0.2, 'sawtooth', 'sfx', 0.4); beep(220, 0.25, 'sawtooth', 'sfx', 0.4); beep(140, 0.35, 'sawtooth', 'sfx', 0.4); }
export function sfxBounce() { beep(440, 0.08, 'triangle', 'sfx', 0.3); }
export function sfxUI() { beep(440, 0.05, 'square', 'sfx', 0.25); }

// ---- Music scheduling helpers ----------------------------------------------
function scheduleTone(freq, time, dur, type, vol, attack = 0.02, release = 0.15, detune = 0) {
  if (!ctx || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  o.connect(g); g.connect(musicGain);
  const end = time + dur;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, end + release);
  o.start(time);
  o.stop(end + release + 0.05);
}

function schedulePad(chord, time, dur, tier) {
  const intervals = (tier >= 2) ? chord : chord.slice(0, 3);
  const vol = tier >= 3 ? 0.055 : 0.045;
  for (const semi of intervals) {
    const f = midiToFreq(semi);
    scheduleTone(f, time, dur, 'sine', vol, 0.25, 0.45);
    scheduleTone(f, time, dur, 'triangle', vol * 0.5, 0.25, 0.45, 7);
  }
  // 9th shimmer at tier2+
  if (tier >= 2) {
    const ninth = chord[0] + 14; // major 9th-ish
    scheduleTone(midiToFreq(ninth), time, dur, 'sine', 0.025, 0.3, 0.5);
  }
}

function schedulePiano(chord, time) {
  const beatDurLocal = beatDur;
  for (let i = 0; i < chord.length; i++) {
    const f = midiToFreq(chord[i]);
    scheduleTone(f, time + i * 0.015, beatDurLocal * 0.45, 'sine', 0.09, 0.01, 0.12);
  }
}

function scheduleBassNote(midi, time) {
  scheduleTone(midiToFreq(midi), time, beatDur * 0.85, 'triangle', 0.12, 0.02, 0.1);
}

function scheduleMelody(midi, time, tier) {
  const prob = tier >= 3 ? 0.8 : (tier >= 1 ? 0.6 : 0.4);
  if (Math.random() > prob) return;
  const note = JAZZ_MELODY[Math.floor(Math.random() * JAZZ_MELODY.length)];
  scheduleTone(midiToFreq(note), time, beatDur * 0.9, 'sine', 0.08, 0.03, 0.2);
}

function playNoise(time, dur, vol, hpFreq) {
  if (!ctx || muted || !noiseBuffer) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filt = ctx.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = hpFreq || 1000;
  const g = ctx.createGain();
  src.connect(filt); filt.connect(g); g.connect(musicGain);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.start(time);
  src.stop(time + dur + 0.02);
}

function kick(time) {
  if (!ctx || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, time);
  o.frequency.exponentialRampToValueAtTime(42, time + 0.18);
  o.connect(g); g.connect(musicGain);
  g.gain.setValueAtTime(0.22, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
  o.start(time);
  o.stop(time + 0.22);
}

function snare(time) { playNoise(time, 0.12, 0.16, 1800); }
function hat(time) { playNoise(time, 0.04, 0.07, 7000); }

// ---- Chiptune scheduler ----------------------------------------------------
function schedulerChiptune(lookahead) {
  while (nextNoteTime < ctx.currentTime + lookahead) {
    const mDeg = MELODY[trackState.melodyIdx % MELODY.length];
    if (mDeg >= 0) {
      scheduleTone(PENT[mDeg % PENT.length], nextNoteTime, beatDur * 0.9, 'square', 0.16, 0.01, 0.05);
    }
    if (trackState.melodyIdx % 2 === 0) {
      const bDeg = BASS[trackState.bassIdx % BASS.length];
      scheduleTone(BASSF[bDeg % BASSF.length], nextNoteTime, beatDur * 1.8, 'triangle', 0.2, 0.02, 0.1);
      trackState.bassIdx++;
    }
    nextNoteTime += beatDur;
    trackState.melodyIdx++;
  }
}

// ---- Jazz scheduler --------------------------------------------------------
function schedulerJazz(lookahead) {
  const stepDur = beatDur / 2;
  while (nextNoteTime < ctx.currentTime + lookahead) {
    const s = trackState.stepIdx;          // 0..31 (16 beats)
    const beat = Math.floor(s / 2);       // 0..15
    const chordIdx = Math.floor(beat / 2) % JAZZ_CHORDS.length;
    const chord = JAZZ_CHORDS[chordIdx];

    // chord pad at start of each 2-beat chord block
    if (s % 4 === 0) {
      schedulePad(chord, nextNoteTime, beatDur * 1.9, musicTier);
    }
    // piano stab at chord start (tier1+), every chord
    if (s % 4 === 0 && musicTier >= 1) {
      schedulePiano(chord, nextNoteTime);
    }
    // walking bass on quarter notes
    if (s % 2 === 0) {
      const beatInChord = beat % 2;
      const bn = jazzBassNote(chordIdx, beatInChord);
      scheduleBassNote(bn, nextNoteTime);
    }
    // sparse melody on off-beats
    if (s % 4 === 2) {
      scheduleMelody(0, nextNoteTime, musicTier);
    }
    // percussion (tier1+)
    if (musicTier >= 1) {
      if (s === 0 || s === 16) kick(nextNoteTime);
      if (s === 8 || s === 24) snare(nextNoteTime);
      if (s % 4 === 0) hat(nextNoteTime);
    }

    nextNoteTime += stepDur;
    trackState.stepIdx = (trackState.stepIdx + 1) % 32;
  }
}

// ---- Rough chiptune scheduler (chord-progression arpeggios + noise perc.) ----
// Chord progression (I - vi - IV - V), 4 beats per chord.
const ROUGH_CHORDS = [
  [60, 64, 67], // Cmaj
  [57, 60, 64], // Am
  [65, 69, 72], // Fmaj
  [67, 71, 74], // Gmaj
];
function schedulerChiptuneRough(lookahead) {
  while (nextNoteTime < ctx.currentTime + lookahead) {
    const beat = trackState.beatIdx % 16;
    const chordIdx = Math.floor(beat / 4) % ROUGH_CHORDS.length;
    const chord = ROUGH_CHORDS[chordIdx];

    // Arpeggio following the current chord: up/down pattern.
    const pat = (musicTier >= 3)
      ? [0, 1, 2, 1, 0, 2]   // 6 notes, denser
      : (musicTier >= 1 ? [0, 1, 2, 1] : [0, 2, 1]); // 3-4 notes
    const n = pat.length;
    const step = beatDur / n;
    for (let i = 0; i < n; i++) {
      const freq = midiToFreq(chord[pat[i] % chord.length]);
      scheduleTone(freq, nextNoteTime + i * step, step * 0.8, 'sawtooth', 0.1, 0.005, 0.04, musicTier >= 3 ? 12 : 0);
    }
    // octave shimmer at tier 2+
    if (musicTier >= 2) {
      scheduleTone(midiToFreq(chord[chord.length - 1] + 12), nextNoteTime, beatDur * 0.5, 'square', 0.05, 0.01, 0.08);
    }

    // bass: root on first beat of each chord block
    if (beat % 4 === 0) {
      scheduleBassNote(chord[0] - 12, nextNoteTime);
    }

    // noise percussion
    const beatInBar = beat % 4;
    if (musicTier >= 1) {
      if (beatInBar === 0 || beatInBar === 2) kick(nextNoteTime);
      if (beatInBar === 1 || beatInBar === 3) snare(nextNoteTime);
    }
    // hats (always)
    hat(nextNoteTime);
    if (musicTier >= 2) hat(nextNoteTime + beatDur / 2);
    // rough noise burst every 4 beats at high tier
    if (musicTier >= 3 && beatInBar === 0) {
      playNoise(nextNoteTime, 0.06, 0.09, 3000);
    }

    nextNoteTime += beatDur;
    trackState.beatIdx = (trackState.beatIdx + 1) % 16;
  }
}

function scheduler() {
  if (!ctx || !musicRunning) return;
  const lookahead = 0.12;
  if (muted) {
    // keep time advancing so position is preserved
    const step = (currentTrack === 'souljazz') ? beatDur / 2 : beatDur;
    while (nextNoteTime < ctx.currentTime + lookahead) nextNoteTime += step;
    if (currentTrack === 'souljazz') {
      trackState.stepIdx = (trackState.stepIdx + Math.floor((ctx.currentTime + lookahead - nextNoteTime) / step)) % 32;
    }
  } else {
    if (currentTrack === 'chiptune') schedulerChiptune(lookahead);
    else if (currentTrack === 'chiptunerough') schedulerChiptuneRough(lookahead);
    else schedulerJazz(lookahead);
  }
  musicTimer = setTimeout(scheduler, 25);
}

export function startMusic() {
  audioInit();
  if (!ctx || musicRunning) return;
  musicRunning = true;
  if (musicGain) musicGain.gain.value = currentTrackGain();
  const t = TRACKS[currentTrack];
  musicTier = 0;
  beatDur = 60 / t.bpmBase;
  nextNoteTime = ctx.currentTime + 0.05;
  if (currentTrack === 'chiptune') {
    trackState = { melodyIdx: 0, bassIdx: 0 };
  } else if (currentTrack === 'chiptunerough') {
    trackState = { beatIdx: 0 };
  } else {
    trackState = { stepIdx: 0 };
  }
  scheduler();
}

export function stopMusic() {
  musicRunning = false;
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

export function setMusicBpm(bpm) {
  beatDur = 60 / bpm;
}

export function setMusicDistance(meters) {
  const tier = meters < 250 ? 0 : meters < 500 ? 1 : meters < 750 ? 2 : meters < 1500 ? 3 : 4;
  musicTier = tier;
  const t = TRACKS[currentTrack];
  setMusicBpm(t.bpmBase + t.bpmStep * tier);
}