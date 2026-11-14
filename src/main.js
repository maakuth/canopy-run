import { W, H, UNLOCK_DOUBLE, UNLOCK_DASH, UNLOCK_WALL, INVULN_TIME, KNOCKBACK_X, KNOCKBACK_Y, HEARTS_MAX } from './config.js';
import { ctx, uiCtx, clear, rect, text } from './engine/renderer.js';
import { Loop } from './engine/loop.js';
import './engine/touch.js';
import { inputEndFrame, justPressed } from './engine/input.js';
import { storage } from './engine/storage.js';
import * as audio from './engine/audio.js';
import { camera, cameraFollow, cameraOffset, cameraShake } from './engine/camera.js';
import { createPlayer, updatePlayer } from './game/player.js';
import { createWorld, updateWorld } from './game/world.js';
import { aabb } from './util/math.js';
import { drawParticles } from './game/particles.js';

export const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3 };
let state = STATE.MENU;

let world = createWorld();
const player = createPlayer(40, H - 40);
let unlockMsg = '';
let unlockT = 0;
let trackMsg = '';
let trackMsgT = 0;

function update(dt) {
  if (justPressed('jump') || justPressed('pause') || justPressed('restart') || justPressed('mute')) audio.audioInit();
  if (justPressed('mute')) audio.toggleMute();
  if (justPressed('track')) {
    audio.cycleMusicTrack();
    trackMsg = 'Soundtrack: ' + audio.getMusicTrackName();
    trackMsgT = 2;
  }

  if (state === STATE.MENU) {
    if (justPressed('jump')) {
      world = createWorld();
      player.x = 40; player.y = H - 40; player.vx = 0; player.vy = 0; player.hearts = 3;
      player.lastSafeX = 40; player.lastSafeY = H - 40;
      player.doubleJump = false; player.dash = false; player.wall = false;
      unlockMsg = ''; unlockT = 0;
      trackMsg = ''; trackMsgT = 0;
      audio.audioInit();
      audio.startMusic();
      state = STATE.PLAYING;
      audio.audioInit();
      audio.startMusic();
    }
  } else if (state === STATE.PLAYING) {
    audio.setMusicDistance(Math.floor(player.x / 10));
    updateWorld(world, player, dt);
    updatePlayer(player, world, dt);
    // hazard damage
    if (player.invuln <= 0) {
      for (const hz of (world.hazards || [])) {
        if (aabb(player.x, player.y, player.w, player.h, hz.x, hz.y, hz.w, hz.h)) {
          player.hearts -= 1;
          player.invuln = INVULN_TIME;
          const hc = hz.x + hz.w / 2;
          const pc = player.x + player.w / 2;
          player.vx = pc < hc ? -KNOCKBACK_X : KNOCKBACK_X;
          player.vy = KNOCKBACK_Y;
          audio.sfxHurt();
          cameraShake(6, 0.25);
          if (player.hearts <= 0) {
            state = STATE.GAMEOVER;
            audio.stopMusic();
            audio.sfxGameOver();
            const d = Math.floor(player.x / 10);
            if (d > storage.bestDistance) storage.bestDistance = d;
            if ((world.score || 0) > storage.bestScore) storage.bestScore = world.score;
          }
          break;
        }
      }
    }
    // ability unlocks
    const dist = Math.floor(player.x / 10);
    audio.setMusicDistance(dist);
    if (!player.doubleJump && dist >= UNLOCK_DOUBLE) {
      player.doubleJump = true; unlockMsg = 'Double Jump unlocked! (SPACE in air)'; unlockT = 3;
      audio.sfxUnlock();
    }
    if (!player.dash && dist >= UNLOCK_DASH) {
      player.dash = true; unlockMsg = 'Dash unlocked! (SHIFT)'; unlockT = 3;
      audio.sfxUnlock();
    }
    if (!player.wall && dist >= UNLOCK_WALL) {
      player.wall = true; unlockMsg = 'Wall Slide/Jump unlocked!'; unlockT = 3;
      audio.sfxUnlock();
    }
    if (unlockT > 0) unlockT -= dt;
    cameraFollow(player.x + player.w / 2, player.y + player.h / 2, dt);
    if (justPressed('pause')) state = STATE.PAUSED;
    if (player.y > H + 60) {
      player.x = player.lastSafeX; player.y = player.lastSafeY; player.vx = 0; player.vy = 0;
      player.hearts -= 1;
      audio.sfxHurt();
      if (player.hearts <= 0) {
        state = STATE.GAMEOVER;
        audio.stopMusic();
        audio.sfxGameOver();
        const dist = Math.floor(player.x / 10);
        if (dist > storage.bestDistance) storage.bestDistance = dist;
        if ((world.score || 0) > storage.bestScore) storage.bestScore = world.score;
      }
    }
  } else if (state === STATE.PAUSED) {
    if (justPressed('pause')) state = STATE.PLAYING;
  } else if (state === STATE.GAMEOVER) {
    if (justPressed('restart')) state = STATE.MENU;
  }

  if (trackMsgT > 0) trackMsgT -= dt;
  inputEndFrame();
}

function render(alpha) {
  clear('#1b3a2a');
  const cam = cameraOffset();
  const ox = cam.x, oy = cam.y;

  // ground fill backdrop
  rect(0, 0, W, H, '#1b3a2a');

  // wind zones
  for (const z of (world.windZones || [])) {
    ctx.globalAlpha = 0.18;
    rect(z.x - ox, z.y - oy, z.w, z.h, '#a8dadc');
    ctx.globalAlpha = 1;
  }
  // low grav zones
  for (const z of (world.lowGravZones || [])) {
    ctx.globalAlpha = 0.18;
    rect(z.x - ox, z.y - oy, z.w, z.h, '#b39ddb');
    ctx.globalAlpha = 1;
  }
  // bounce pads
  for (const b of (world.bouncePads || [])) {
    rect(b.x - ox, b.y - oy, b.w, b.h, '#ff9f1c');
  }
  // hazards (thorns)
  for (const hz of (world.hazards || [])) {
    rect(hz.x - ox, hz.y - oy, hz.w, hz.h, '#c0392b');
  }
  // collectibles
  for (const c of world.collectibles) {
    if (c.collected) continue;
    const col = c.type === 'heart' ? '#e85d75' : '#ffd166';
    rect(c.x - ox, c.y - oy, c.w, c.h, col);
  }

  // platforms
  for (const pl of world.platforms) {
    let col = pl.y >= H - 30 ? '#3a2a1a' : '#6b4a2a';
    if (pl.type === 'moving') col = '#5dade2';
    if (pl.type === 'crumbling') col = pl.crumble ? '#a1887f' : '#8d6e63';
    rect(pl.x - ox, pl.y - oy, pl.w, pl.h, col);
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

  drawParticles(ctx, world, ox, oy);

  if (unlockT > 0) {
    uiCtx.globalAlpha = Math.min(1, unlockT);
    text(unlockMsg, W / 2, 36, '#ffd166', 9, 'center');
    uiCtx.globalAlpha = 1;
  }
  if (trackMsgT > 0) {
    uiCtx.globalAlpha = Math.min(1, trackMsgT);
    text(trackMsg, W / 2, 50, '#a8dadc', 9, 'center');
    uiCtx.globalAlpha = 1;
  }
  if (world.activeTrigger && world.activeTrigger.t > 0) {
    uiCtx.globalAlpha = Math.min(1, world.activeTrigger.t);
    text(world.activeTrigger.msg, W / 2, H - 28, '#a8dadc', 8, 'center');
    uiCtx.globalAlpha = 1;
  }

  // HUD
  text('Canopy Run', 8, 6, '#e8f0e4', 10);
  text('Best: ' + storage.bestDistance + 'm', W - 8, 6, '#e8f0e4', 8, 'right');
  if (state === STATE.PLAYING || state === STATE.PAUSED) {
    const dist = Math.floor(player.x / 10);
    text(dist + 'm', W / 2, 6, '#e8f0e4', 8, 'center');
    text('Score ' + (world.score || 0), W / 2, H - 12, '#e8f0e4', 7, 'center');
  }
  // hearts
  for (let i = 0; i < player.hearts; i++) rect(8 + i * 10, 18, 8, 7, '#e85d75');
  // current soundtrack
  text('Track: ' + audio.getMusicTrackName() + ' (T)', 8, H - 8, '#a8dadc', 6);

  if (state === STATE.MENU) {
    text('Press SPACE to start', W / 2, H / 2 - 6, '#e8f0e4', 10, 'center');
    text('Arrows/WASD move  Space jump  Shift dash', W / 2, H / 2 + 10, '#a8dadc', 7, 'center');
  } else if (state === STATE.PAUSED) {
    text('PAUSED', W / 2, H / 2, '#e8f0e4', 14, 'center');
    text('Esc to resume', W / 2, H / 2 + 16, '#a8dadc', 8, 'center');
  } else if (state === STATE.GAMEOVER) {
    text('GAME OVER', W / 2, H / 2 - 16, '#e85d75', 12, 'center');
    text('Distance: ' + Math.floor(player.x / 10) + 'm', W / 2, H / 2, '#e8f0e4', 9, 'center');
    text('Score: ' + (world.score || 0), W / 2, H / 2 + 12, '#e8f0e4', 9, 'center');
    text('Best: ' + storage.bestDistance + 'm  ' + storage.bestScore, W / 2, H / 2 + 24, '#a8dadc', 7, 'center');
    text('Press R for menu', W / 2, H / 2 + 40, '#a8dadc', 8, 'center');
  }
}

const loop = new Loop(update, render);
loop.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
