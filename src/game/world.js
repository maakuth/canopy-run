import { W, H, TILE } from '../config.js';

// Simple static test level for Phase 2.
export function createTestWorld() {
  const platforms = [];
  // ground
  platforms.push({ x: -1000, y: H - 24, w: 4000, h: 24, type: 'solid' });
  // platforms
  const layout = [
    [60, H - 56, 48, 8],
    [130, H - 80, 40, 8],
    [200, H - 64, 56, 8],
    [280, H - 96, 40, 8],
    [360, H - 72, 48, 8],
  ];
  for (const [x, y, w, h] of layout) platforms.push({ x, y, w, h, type: 'solid' });
  return { platforms, entities: [], distance: 0 };
}

export function worldUpdate(world, dt) { /* placeholder */ }
export function cullWorld(world, camX) { /* placeholder */ }
