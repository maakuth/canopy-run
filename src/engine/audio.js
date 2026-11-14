import { storage } from './storage.js';

let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let muted = storage.muted;

// Music scheduler state
let musicRunning = false;
let musicTimer = null;
let nextNoteTime = 0;
let beatDur = 60 / 110;
let melodyIdx = 0;
let bassIdx = 0;
let currentBpm = 110;

const MELODY = [0, 2, 4, 6, 4, 2, 0, -1, 1, 3, 5, 3, 1, -1, 0, 2];
const BASS = [0, 0, 4, 4];
const PENT = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
const BASSF = [65.41, 98.00, 110.00, 130.81];

export function audioInit() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.28; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);
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

function scheduleNote(freq, time, dur, type, vol) {
  if (!ctx || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g); g.connect(musicGain);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.start(time);
  o.stop(time + dur + 0.02);
}

function scheduler() {
  if (!ctx || !musicRunning) return;
  const lookahead = 0.12;
  while (nextNoteTime < ctx.currentTime + lookahead) {
    // melody
    const mDeg = MELODY[melodyIdx % MELODY.length];
    if (mDeg >= 0) {
      scheduleNote(PENT[mDeg % PENT.length], nextNoteTime, beatDur * 0.9, 'square', 0.16);
    }
    // bass every 2 beats
    if (melodyIdx % 2 === 0) {
      const bDeg = BASS[bassIdx % BASS.length];
      scheduleNote(BASSF[bDeg % BASSF.length], nextNoteTime, beatDur * 1.8, 'triangle', 0.2);
      bassIdx++;
    }
    nextNoteTime += beatDur;
    melodyIdx++;
  }
  musicTimer = setTimeout(scheduler, 25);
}

export function startMusic() {
  audioInit();
  if (!ctx || musicRunning) return;
  musicRunning = true;
  nextNoteTime = ctx.currentTime + 0.05;
  melodyIdx = 0; bassIdx = 0;
  scheduler();
}

export function stopMusic() {
  musicRunning = false;
  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

export function setMusicBpm(bpm) {
  currentBpm = bpm;
  beatDur = 60 / bpm;
}

export function setMusicDistance(meters) {
  const tier = meters < 250 ? 0 : meters < 500 ? 1 : meters < 750 ? 2 : meters < 1500 ? 3 : 4;
  setMusicBpm(110 + tier * 8);
}
