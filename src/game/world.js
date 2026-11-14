import { W, H, TILE, PIXELS_PER_METER } from '../config.js';
import { RNG } from '../util/rng.js';
import { generateChunk, tierForDistance } from './chunks.js';
import { aabb } from '../util/math.js';
import { updateCollectibles } from './collectibles.js';
import { updateParticles } from './particles.js';

export function createWorld(seed = null) {
  const rng = new RNG(seed);
  const world = {
    platforms: [],
    hazards: [],
    collectibles: [],
    triggers: [],
    windZones: [],
    lowGravZones: [],
    bouncePads: [],
    particles: [],
    score: 0,
    activeTrigger: { msg: '', t: 0 },
    rng,
    groundY: H - 24,
    nextX: 0,
  };
  // starter flat ground so player never falls at spawn
  world.platforms.push({ x: -400, y: H - 24, w: 600, h: 24, type: 'solid' });
  world.triggers.push({ x: 60, y: H - 60, w: 80, h: 40, text: 'Move: Arrow keys / A D', fired: false });
  world.triggers.push({ x: 180, y: H - 60, w: 40, h: 40, text: 'Jump: SPACE', fired: false });
  world.nextX = 200;
  // generate ahead
  generateAhead(world, 200);
  return world;
}

function generateAhead(world, targetX) {
  while (world.nextX < targetX) {
    const meters = world.nextX / PIXELS_PER_METER;
    const tier = tierForDistance(meters);
    const ref = { y: world.groundY };
    const width = generateChunk(world, world.rng, world.nextX, tier, ref);
    world.groundY = ref.y;
    world.nextX += width;
  }
}

export function updateWorld(world, player, dt) {
  if (world.score === undefined) world.score = 0;
  generateAhead(world, player.x + W * 2);
  const cutoff = player.x - W * 1.5;
  world.platforms = world.platforms.filter(p => p.x + p.w > cutoff);
  if (world.collectibles) world.collectibles = world.collectibles.filter(c => c.x + c.w > cutoff);
  if (world.hazards) world.hazards = world.hazards.filter(h => h.x + (h.w||0) > cutoff);
  if (world.windZones) world.windZones = world.windZones.filter(z => z.x + z.w > cutoff);
  if (world.lowGravZones) world.lowGravZones = world.lowGravZones.filter(z => z.x + z.w > cutoff);
  if (world.bouncePads) world.bouncePads = world.bouncePads.filter(b => b.x + b.w > cutoff);
  if (world.triggers) world.triggers = world.triggers.filter(t => t.x + t.w > cutoff);
  // trigger activation
  if (world.activeTrigger.t > 0) world.activeTrigger.t -= dt;
  for (const tr of (world.triggers || [])) {
    if (!tr.fired && aabb(player.x, player.y, player.w, player.h, tr.x, tr.y, tr.w, tr.h)) {
      tr.fired = true;
      world.activeTrigger.msg = tr.text;
      world.activeTrigger.t = 3;
    }
  }
  for (const pl of world.platforms) {
    if (pl.type === 'moving') {
      pl.x += (pl.vx || 0) * dt;
      if (pl.x < pl.minX || pl.x + pl.w > pl.maxX) { pl.vx = -(pl.vx || 0); }
    }
    if (pl.type === 'crumbling' && pl.crumble) {
      pl.crumbleT -= dt;
      if (pl.crumbleT <= 0) pl.dead = true;
    }
  }
  world.platforms = world.platforms.filter(p => !p.dead);
  updateCollectibles(world, player);
  updateParticles(world, dt);
}

export function resetWorld(world) {
  // not needed; create new
}
