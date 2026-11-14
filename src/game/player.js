import { GRAVITY, MOVE_SPEED, MOVE_ACCEL, MOVE_FRICTION, JUMP_VEL, JUMP_CUT,
  DOUBLE_JUMP_VEL, DASH_SPEED, DASH_DURATION, DASH_COOLDOWN,
  COYOTE, JUMP_BUFFER, PLAYER_W, PLAYER_H, MAX_FALL,
  WALL_SLIDE_SPEED, WALL_JUMP_X, WALL_JUMP_Y } from '../config.js';
import { aabb } from '../util/math.js';
import { isDown, justPressed } from '../engine/input.js';

export function createPlayer(x, y) {
  return {
    x, y, vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H,
    onGround: false, coyote: 0, jumpBuffer: 0,
    facing: 1, invuln: 0, hearts: 3,
    doubleJump: false, dash: false, wall: false,
    jumpsLeft: 0, dashCd: 0, dashTimer: 0, dashing: false,
    wallDir: 0, wallSlide: false,
    cutDone: false,
    squash: 1, stretch: 1,
    animT: 0,
    lastSafeX: x, lastSafeY: y,
  };
}

export function updatePlayer(p, world, dt) {
  const platforms = world.platforms || [];
  const windZones = world.windZones || [];
  const lowGravZones = world.lowGravZones || [];
  const bouncePads = world.bouncePads || [];
  if (p.invuln > 0) p.invuln -= dt;
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.dashTimer > 0) { p.dashTimer -= dt; if (p.dashTimer <= 0) p.dashing = false; }
  p.animT += dt;

  if (justPressed('jump')) p.jumpBuffer = JUMP_BUFFER;
  else if (p.jumpBuffer > 0) p.jumpBuffer -= dt;

  const left = isDown('left'), right = isDown('right');
  let target = 0;
  if (left) target = -MOVE_SPEED;
  if (right) target = MOVE_SPEED;
  if (target !== 0) {
    p.vx += (target > 0 ? MOVE_ACCEL : -MOVE_ACCEL) * dt;
    if (Math.abs(p.vx) > MOVE_SPEED) p.vx = Math.sign(p.vx) * MOVE_SPEED;
    p.facing = target > 0 ? 1 : -1;
  } else {
    if (p.vx > 0) { p.vx -= MOVE_FRICTION * dt; if (p.vx < 0) p.vx = 0; }
    else if (p.vx < 0) { p.vx += MOVE_FRICTION * dt; if (p.vx > 0) p.vx = 0; }
  }

  // dash
  if (p.dash && justPressed('dash') && p.dashCd <= 0 && !p.dashing) {
    p.dashing = true;
    p.dashTimer = DASH_DURATION;
    p.dashCd = DASH_COOLDOWN;
    p.vx = p.facing * DASH_SPEED;
    p.vy = 0;
  }

  // environment: wind + low gravity
  let gravMult = 1;
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  for (const z of lowGravZones) {
    if (cx > z.x && cx < z.x + z.w && cy > z.y && cy < z.y + z.h) { gravMult = z.mult || 0.4; }
  }
  for (const z of windZones) {
    if (cx > z.x && cx < z.x + z.w && cy > z.y && cy < z.y + z.h) {
      p.vx += (z.force || 0) * dt;
      if (Math.abs(p.vx) > MOVE_SPEED * 1.6) p.vx = Math.sign(p.vx) * MOVE_SPEED * 1.6;
    }
  }

  // gravity
  if (!p.dashing) {
    p.vy += GRAVITY * gravMult * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
  }

  // wall slide detection (wall ability)
  p.wallSlide = false;
  if (p.wall && !p.onGround && p.vy > 0) {
    // check if touching wall in facing direction by probing
    const probeX = p.facing > 0 ? p.x + p.w + 1 : p.x - 1;
    let touching = false;
    for (const pl of platforms) {
      if (aabb(probeX, p.y + 2, 2, p.h - 4, pl.x, pl.y, pl.w, pl.h)) { touching = true; break; }
    }
    if (touching && ((p.facing < 0 && left) || (p.facing > 0 && right))) {
      p.wallSlide = true;
      if (p.vy > WALL_SLIDE_SPEED) p.vy = WALL_SLIDE_SPEED;
    }
  }

  // move X
  p.x += p.vx * dt;
  for (const pl of platforms) {
    if (aabb(p.x, p.y, p.w, p.h, pl.x, pl.y, pl.w, pl.h)) {
      if (p.vx > 0) p.x = pl.x - p.w;
      else if (p.vx < 0) p.x = pl.x + pl.w;
      p.vx = 0;
    }
  }

  // move Y
  p.onGround = false;
  p.onPlatform = null;
  p.y += p.vy * dt;
  for (const pl of platforms) {
    if (aabb(p.x, p.y, p.w, p.h, pl.x, pl.y, pl.w, pl.h)) {
      if (p.vy > 0) {
        if (pl.type === 'bounce') {
          p.y = pl.y - p.h;
          p.vy = -(pl.power || 320);
          p.onGround = false;
          p.squash = 0.6; p.stretch = 1.4;
          continue;
        }
        p.y = pl.y - p.h; p.onGround = true; p.vy = 0;
        p.onPlatform = pl;
        p.jumpsLeft = p.doubleJump ? 1 : 0;
        p.cutDone = false;
        p.lastSafeX = p.x; p.lastSafeY = p.y;
        if (pl.type === 'crumbling') {
          pl.crumble = true;
          if (!pl.crumbleT || pl.crumbleT <= 0) pl.crumbleT = 0.7;
        }
      } else if (p.vy < 0) {
        p.y = pl.y + pl.h; p.vy = 0;
      }
    }
  }
  // bounce pads (separate entities)
  for (const bp of bouncePads) {
    if (aabb(p.x, p.y, p.w, p.h, bp.x, bp.y, bp.w, bp.h) && p.vy > 0) {
      p.y = bp.y - p.h;
      p.vy = -(bp.power || 320);
      p.onGround = false;
      p.squash = 0.6; p.stretch = 1.4;
    }
  }
  if (p.onGround && p.onPlatform && p.onPlatform.type === 'moving') {
    p.x += (p.onPlatform.vx || 0) * dt;
  }
  if (!p.onGround) p.onPlatform = null;

  // coyote
  if (p.onGround) p.coyote = COYOTE;
  else if (p.coyote > 0) p.coyote -= dt;

  // jump
  if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
    p.vy = JUMP_VEL;
    p.jumpBuffer = 0;
    p.coyote = 0;
    p.onGround = false;
    p.jumpsLeft = p.doubleJump ? 1 : 0;
    p.cutDone = false;
    p.squash = 0.7; p.stretch = 1.3;
  } else if (p.jumpBuffer > 0 && p.wall && p.wallSlide) {
    // wall jump
    p.vy = WALL_JUMP_Y;
    p.vx = -p.facing * WALL_JUMP_X;
    p.facing = -p.facing;
    p.jumpBuffer = 0;
    p.cutDone = false;
    p.squash = 0.7; p.stretch = 1.3;
  } else if (p.jumpBuffer > 0 && p.doubleJump && p.jumpsLeft > 0 && !p.onGround && !p.wallSlide) {
    p.vy = DOUBLE_JUMP_VEL;
    p.jumpBuffer = 0;
    p.jumpsLeft = 0;
    p.cutDone = false;
    p.squash = 0.7; p.stretch = 1.3;
  }

  // variable jump cut
  if (!isDown('jump') && p.vy < 0 && !p.cutDone && !p.dashing) {
    p.vy *= JUMP_CUT;
    p.cutDone = true;
  }

  // recover squash/stretch
  p.squash += (1 - p.squash) * Math.min(1, dt * 10);
  p.stretch += (1 - p.stretch) * Math.min(1, dt * 10);
}
