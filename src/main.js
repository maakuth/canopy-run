import { W, H } from './config.js';
import { ctx, clear, rect, text } from './engine/renderer.js';
import { Loop } from './engine/loop.js';
import { input, inputEndFrame, justPressed } from './engine/input.js';
import { storage } from './engine/storage.js';
import * as audio from './engine/audio.js';

// Game states
export const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3 };
let state = STATE.MENU;

// Simple smoke-test entity
const box = { x: 40, y: 100, vx: 60, vy: 0 };

function update(dt) {
  // audio init on first interaction
  if (justPressed('jump') || justPressed('pause') || justPressed('restart')) audio.audioInit();

  if (state === STATE.MENU) {
    if (justPressed('jump')) { state = STATE.PLAYING; box.x = 40; box.y = 100; box.vx = 60; }
  } else if (state === STATE.PLAYING) {
    // move box
    box.x += box.vx * dt;
    if (box.x > W - 12) { box.x = W - 12; box.vx = -Math.abs(box.vx); }
    if (box.x < 0) { box.x = 0; box.vx = Math.abs(box.vx); }
    box.y = 100 + Math.sin(performance.now() / 400) * 20;
    if (justPressed('pause')) state = STATE.PAUSED;
    if (justPressed('mute')) audio.toggleMute();
  } else if (state === STATE.PAUSED) {
    if (justPressed('pause')) state = STATE.PLAYING;
  } else if (state === STATE.GAMEOVER) {
    if (justPressed('restart')) state = STATE.MENU;
  }

  // mute toggle global
  if (justPressed('mute')) audio.toggleMute();

  inputEndFrame();
}

function render(alpha) {
  clear('#1b3a2a');
  // ground
  rect(0, H - 24, W, 24, '#3a2a1a');
  rect(0, H - 24, W, 4, '#5fa34a');
  // box
  rect(box.x, box.y, 12, 12, '#f2c94c');

  // HUD
  text('Canopy Run', 8, 6, '#e8f0e4', 10);
  text('Best: ' + storage.bestDistance + 'm', W - 8, 6, '#e8f0e4', 8, 'right');
  text('Mute: ' + (audio.isMuted() ? 'ON' : 'OFF') + ' (M)', 8, H - 12, '#e8f0e4', 7);

  if (state === STATE.MENU) {
    text('Press SPACE to start', W / 2, H / 2 - 6, '#e8f0e4', 10, 'center');
    text('Arrows/WASD move  Space jump  Shift dash', W / 2, H / 2 + 10, '#a8dadc', 7, 'center');
  } else if (state === STATE.PAUSED) {
    text('PAUSED', W / 2, H / 2, '#e8f0e4', 14, 'center');
    text('Esc to resume', W / 2, H / 2 + 16, '#a8dadc', 8, 'center');
  }
}

const loop = new Loop(update, render);
loop.start();
