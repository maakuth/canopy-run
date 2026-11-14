import { STORAGE_KEYS } from '../config.js';

export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
  get bestDistance() { return this.get(STORAGE_KEYS.bestDistance, 0); },
  set bestDistance(v) { this.set(STORAGE_KEYS.bestDistance, v); },
  get bestScore() { return this.get(STORAGE_KEYS.bestScore, 0); },
  set bestScore(v) { this.set(STORAGE_KEYS.bestScore, v); },
  get muted() { return this.get(STORAGE_KEYS.muted, false); },
  set muted(v) { this.set(STORAGE_KEYS.muted, !!v); },
  get tutorialSeen() { return this.get(STORAGE_KEYS.tutorialSeen, false); },
  set tutorialSeen(v) { this.set(STORAGE_KEYS.tutorialSeen, !!v); },
  get musicTrack() { return this.get(STORAGE_KEYS.musicTrack, 'chiptune'); },
  set musicTrack(v) { this.set(STORAGE_KEYS.musicTrack, v); },
};