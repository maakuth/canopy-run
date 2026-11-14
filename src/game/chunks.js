import { W, H, TILE } from '../config.js';
import { RNG } from '../util/rng.js';

// Tier helpers
export function tierForDistance(meters) {
  if (meters < 250) return 0;
  if (meters < 500) return 1;
  if (meters < 750) return 2;
  if (meters < 1500) return 3;
  return 4;
}

export function chunkWidth(rng, tier) {
  const base = 160 + tier * 16;
  return base + rng.int(0, 64);
}

// Generate one chunk starting at startX into world. Returns width.
export function generateChunk(world, rng, startX, tier, groundYRef) {
  // groundYRef: { y } mutable current ground top
  const g = groundYRef;
  const w = chunkWidth(rng, tier);
  const endX = startX + w;

  // choose template
  const templates = TEMPLATES[tier] || TEMPLATES[0];
  const tpl = rng.pick(templates);
  tpl(world, rng, startX, w, g, tier);

  return w;
}

// Template functions: (world, rng, startX, width, groundYRef, tier)
const T = (world, x, y, w, h, type = 'solid') => {
  world.platforms.push({ x, y, w, h, type, vx: 0, vy: 0, crumble: false, crumbleT: 0,
    minX: x, maxX: x + w, baseY: y, moveT: 0 });
};

const seed = (world, x, y, kind = 'seed') => {
  world.collectibles.push({ x, y, w: 6, h: 6, type: kind, collected: false, value: kind === 'heart' ? 0 : 10 });
};

const thorn = (world, x, y, w = 12) => {
  world.hazards.push({ x, y, w, h: 8, type: 'thorn' });
};
const movingPlatform = (world, x, y, w, vx = 40, range = 60) => {
  world.platforms.push({ x, y, w, h: 8, type: 'moving', vx, crumble: false, crumbleT: 0,
    minX: x - range, maxX: x + range, baseY: y, moveT: 0 });
};
const crumblingPlatform = (world, x, y, w) => {
  world.platforms.push({ x, y, w, h: 8, type: 'crumbling', vx: 0, crumble: false, crumbleT: 0,
    minX: x, maxX: x + w, baseY: y, moveT: 0 });
};
const windZone = (world, x, y, w, h, force) => {
  world.windZones.push({ x, y, w, h, force });
};
const lowGravZone = (world, x, y, w, h, mult = 0.35) => {
  world.lowGravZones.push({ x, y, w, h, mult });
};
const bouncePad = (world, x, y, w = 16, power = 300) => {
  world.bouncePads.push({ x, y, w, h: 8, power });
};

function flat(world, rng, sx, w, g, tier) {
  T(world, sx, g.y, w, 16, 'solid');
  const n = rng.int(1, 2);
  for (let i = 0; i < n; i++) {
    const px = sx + rng.int(24, w - 40);
    const py = g.y - rng.int(32, 64);
    const pw = rng.int(32, 56);
    if (tier >= 1 && rng.bool(0.35)) {
      if (rng.bool()) movingPlatform(world, px, py, pw, rng.int(30, 60) * (rng.bool() ? 1 : -1), rng.int(30, 70));
      else crumblingPlatform(world, px, py, pw);
    } else {
      T(world, px, py, pw, 8, 'solid');
    }
    seed(world, px + pw/2 - 3, py - 10, rng.bool(0.08) ? 'heart' : 'seed');
  }
  if (rng.bool(0.5)) seed(world, sx + rng.int(16, w - 16), g.y - 16, 'seed');
  // hazards
  if (tier >= 1 && rng.bool(0.4)) thorn(world, sx + rng.int(8, w - 20), g.y - 8);
  if (tier >= 2 && rng.bool(0.25)) windZone(world, sx, g.y - 60, w, 60, rng.bool() ? 90 : -90);
  if (tier >= 3 && rng.bool(0.2)) lowGravZone(world, sx + rng.int(0, w/2), g.y - 90, rng.int(60, 100), 90, 0.35);
  if (tier >= 3 && rng.bool(0.2)) bouncePad(world, sx + rng.int(20, w - 36), g.y - 8);
}

function gapSmall(world, rng, sx, w, g, tier) {
  // Only generate gaps that are crossable with the abilities unlocked at this tier.
  // Basic jump (tier 0) can reliably clear ~2 tiles; double jump (tier 1+) ~4+.
  const maxTiles = tier === 0 ? 2 : 3;
  const minTiles = 2;
  const gap = rng.int(minTiles, maxTiles) * TILE;
  const leftW = rng.int(48, w - gap - 48);
  T(world, sx, g.y, leftW, 16, 'solid');
  const rightX = sx + leftW + gap;
  T(world, rightX, g.y, w - leftW - gap, 16, 'solid');
  const bx = sx + leftW + gap / 2 - 24;
  const by = g.y - rng.int(24, tier === 0 ? 32 : 40);
  if (tier >= 2 && rng.bool(0.4)) crumblingPlatform(world, bx, by, 48);
  else T(world, bx, by, 48, 8, 'solid');
  seed(world, bx + 21, by - 10, 'seed');
  if (rng.bool(0.6)) {
    const fx = sx + rng.int(16, w - 40);
    const fy = g.y - rng.int(56, 80);
    T(world, fx, fy, 40, 8, 'solid');
    seed(world, fx + 17, fy - 10, rng.bool(0.1) ? 'heart' : 'seed');
  }
  if (tier === 0) world.triggers.push({ x: sx + leftW - 8, y: g.y - 40, w: gap + 16, h: 40, text: 'Jump across gaps', fired: false });
  if (tier >= 1) thorn(world, sx + leftW + rng.int(0, gap-12), g.y - 8);
  if (tier >= 3 && rng.bool(0.3)) windZone(world, sx, g.y - 50, w, 50, rng.bool() ? 100 : -100);
}

function steps(world, rng, sx, w, g, tier) {
  // ground with one step up/down
  const stepH = rng.bool() ? -TILE : TILE;
  const split = rng.int(w / 2 - 16, w / 2 + 16);
  T(world, sx, g.y, split, 16, 'solid');
  T(world, sx + split, g.y + stepH, w - split, 16, 'solid');
  g.y = g.y + stepH; // continuity: next chunk ground at new height
  const fx = sx + rng.int(20, w - 40);
  const fy = Math.min(g.y, g.y - stepH) - rng.int(32, 56);
  if (tier >= 2 && rng.bool(0.4)) movingPlatform(world, fx, fy, 40, rng.int(25,50)*(rng.bool()?1:-1), 40);
  else T(world, fx, fy, 40, 8, 'solid');
  seed(world, fx + 17, fy - 10, 'seed');
  if (tier >= 1 && rng.bool(0.3)) thorn(world, sx + rng.int(8, w-20), g.y - 8);
}

function platforms(world, rng, sx, w, g, tier) {
  T(world, sx, g.y, w, 16, 'solid');
  // staircase of floating platforms
  let cx = sx + 16, cy = g.y - 24;
  const n = rng.int(3, 5);
  for (let i = 0; i < n; i++) {
    if (tier >= 1 && rng.bool(0.35)) {
      if (rng.bool()) movingPlatform(world, cx, cy, 32, rng.int(20,45)*(rng.bool()?1:-1), 30);
      else crumblingPlatform(world, cx, cy, 32);
    } else {
      T(world, cx, cy, 32, 8, 'solid');
    }
    if (rng.bool(0.7)) seed(world, cx + 13, cy - 10, 'seed');
    cx += rng.int(28, 44);
    cy -= rng.int(8, 16);
    if (cx > sx + w - 40) break;
  }
  if (tier >= 4 && rng.bool(0.3)) lowGravZone(world, sx, g.y - 100, w, 100, 0.3);
}

const TEMPLATES = {
  0: [flat, gapSmall, steps, platforms],
  1: [flat, gapSmall, steps, platforms],
  2: [flat, gapSmall, steps, platforms],
  3: [flat, gapSmall, steps, platforms],
  4: [flat, gapSmall, steps, platforms],
};

export const CHUNK_TEMPLATES = TEMPLATES;
