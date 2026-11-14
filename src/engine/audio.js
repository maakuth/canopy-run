import { storage } from './storage.js';

// Web Audio synth, initialized on first user gesture.
let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let muted = storage.muted;

export function audioInit() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
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

// Simple beep helper (implemented fully in audio phase).
export function beep(freq = 440, dur = 0.08, type = 'square', bus = 'sfx', vol = 0.4) {
  if (!ctx || muted) return;
  const g = ctx.createGain();
  g.gain.value = vol;
  g.connect(bus === 'music' ? musicGain : sfxGain);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  const now = ctx.currentTime;
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.start(now);
  o.stop(now + dur);
}
