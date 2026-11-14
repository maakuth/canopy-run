export function updateParticles(world, dt) {
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.life -= dt;
  }
  world.particles = world.particles.filter(p => p.life > 0);
}

export function drawParticles(ctx, world, camX, camY) {
  for (const p of world.particles) {
    const a = Math.max(0, p.life / 0.5);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
