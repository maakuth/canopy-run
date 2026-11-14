import { aabb } from '../util/math.js';
import { HEARTS_MAX } from '../config.js';
import * as audio from '../engine/audio.js';

export function updateCollectibles(world, player) {
  for (const c of world.collectibles) {
    if (c.collected) continue;
    if (aabb(player.x, player.y, player.w, player.h, c.x, c.y, c.w, c.h)) {
      c.collected = true;
      if (c.type === 'heart') {
        if (player.hearts < HEARTS_MAX) player.hearts += 1;
        audio.sfxHeart();
      } else {
        world.score += c.value || 10;
        audio.sfxCollect();
      }
      // particle
      world.particles.push({ x: c.x + c.w/2, y: c.y + c.h/2, vx: (Math.random()-0.5)*60, vy: -80, life: 0.5, color: c.type === 'heart' ? '#e85d75' : '#ffd166', size: 2 });
    }
  }
  // cull collected/old
  world.collectibles = world.collectibles.filter(c => !c.collected && c.x + c.w > player.x - 320);
}
