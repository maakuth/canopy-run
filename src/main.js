import { W, H } from './config.js';
import { ctx, clear, rect, text } from './engine/renderer.js';
import { Loop } from './engine/loop.js';
import { inputEndFrame, justPressed } from './engine/input.js';
import { storage } from './engine/storage.js';
import * as audio from './engine/audio.js';
import { camera, cameraFollow, cameraOffset } from './engine/camera.js';
import { createPlayer, updatePlayer } from './game/player.js';
import { createWorld, updateWorld } from './game/world.js';

export const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3 };
let state = STATE.MENU;

let world = createWorld();
const player = createPlayer(40, H - 40);

function update(dt) {
  if (justPressed('jump') || justPressed('pause') || justPressed('restart') || justPressed('mute')) audio.audioInit();
  if (justPressed('mute')) audio.toggleMute();

  if (state === STATE.MENU) {
    if (justPressed('jump')) {
      world = createWorld();
      player.x = 40; player.y = H - 40; player.vx = 0; player.vy = 0; player.hearts = 3;
      player.lastSafeX = 40; player.lastSafeY = H - 40;
      state = STATE.PLAYING;
    }
  } else if (state === STATE.PLAYING) {
    updateWorld(world, player, dt);
    updatePlayer(player, world.platforms, dt);
    cameraFollow(player.x + player.w / 2, player.y + player.h / 2, dt);
    if (justPressed('pause')) state = STATE.PAUSED;
    if (player.y > H + 60) {
      player.x = player.lastSafeX; player.y = player.lastSafeY; player.vx = 0; player.vy = 0;
      player.hearts -= 1;
      audio.beep(180, 0.15, 'sawtooth');
      if (player.hearts <= 0) {
        state = STATE.GAMEOVER;
        const dist = Math.floor(player.x / 10); // PIXELS_PER_METER
        if (dist > storage.bestDistance) storage.bestDistance = dist;
      }
    }
  } else if (state === STATE.PAUSED) {
    if (justPressed('pause')) state = STATE.PLAYING;
  } else if (state === STATE.GAMEOVER) {
    if (justPressed('restart')) state = STATE.MENU;
  }

  inputEndFrame();
}

function render(alpha) {
  clear('#1b3a2a');
  const cam = cameraOffset();
  const ox = cam.x, oy = cam.y;

  // ground fill backdrop
  rect(0, 0, W, H, '#1b3a2a');

  // platforms
  for (const pl of world.platforms) {
    rect(pl.x - ox, pl.y - oy, pl.w, pl.h, pl.y >= H - 30 ? '#3a2a1a' : '#6b4a2a');
    if (pl.y < H - 30) rect(pl.x - ox, pl.y - oy, pl.w, 2, '#7fc96a');
    if (pl.y >= H - 30) rect(pl.x - ox, pl.y - oy, pl.w, 4, '#5fa34a');
  }

  // player
  const px = player.x - ox, py = player.y - oy;
  const cx = px + player.w / 2, cy = py + player.h / 2;
  const w = player.w * player.squash, h = player.h * player.stretch;
  rect(cx - w / 2, cy - h / 2, w, h, player.invuln > 0 && Math.floor(player.animT * 8) % 2 ? '#fff' : '#f2c94c');
  // eye
  rect(cx + (player.facing > 0 ? 2 : -4), cy - h / 2 + 2, 2, 2, '#1b3a2a');

  // HUD
  text('Canopy Run', 8, 6, '#e8f0e4', 10);
  text('Best: ' + storage.bestDistance + 'm', W - 8, 6, '#e8f0e4', 8, 'right');
  if (state === STATE.PLAYING || state === STATE.PAUSED) {
    const dist = Math.floor(player.x / 10);
    text(dist + 'm', W / 2, 6, '#e8f0e4', 8, 'center');
  }
  // hearts
  for (let i = 0; i < player.hearts; i++) rect(8 + i * 10, 18, 8, 7, '#e85d75');

  if (state === STATE.MENU) {
    text('Press SPACE to start', W / 2, H / 2 - 6, '#e8f0e4', 10, 'center');
    text('Arrows/WASD move  Space jump  Shift dash', W / 2, H / 2 + 10, '#a8dadc', 7, 'center');
  } else if (state === STATE.PAUSED) {
    text('PAUSED', W / 2, H / 2, '#e8f0e4', 14, 'center');
    text('Esc to resume', W / 2, H / 2 + 16, '#a8dadc', 8, 'center');
  } else if (state === STATE.GAMEOVER) {
    text('GAME OVER', W / 2, H / 2 - 8, '#e85d75', 12, 'center');
    text('Press R for menu', W / 2, H / 2 + 10, '#a8dadc', 8, 'center');
  }
}

const loop = new Loop(update, render);
loop.start();
