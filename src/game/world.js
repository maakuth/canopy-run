import { W, H, TILE, PIXELS_PER_METER } from '../config.js';
import { RNG } from '../util/rng.js';
import { generateChunk, tierForDistance } from './chunks.js';
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
    rng,
    groundY: H - 24,
    nextX: 0,
    particles: [],
    collectibles: [],
    hazards: [],
    score: 0,
    triggers: [],
    windZones: [],
    lowGravZones: [],
    bouncePads: [],
  };
  // starter flat ground so player never falls at spawn
  world.platforms.push({ x: -400, y: H - 24, w: 600, h: 24, type: 'solid' });
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
