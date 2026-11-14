// Fixed-timestep game loop.
export class Loop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.accumulator = 0;
    this.last = 0;
    this.dt = 1 / 60;
    this.maxFrame = 0.25;
  }
  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }
  stop() { this.running = false; }
  tick(now) {
    if (!this.running) return;
    let frame = (now - this.last) / 1000;
    this.last = now;
    if (frame > this.maxFrame) frame = this.maxFrame;
    this.accumulator += frame;
    while (this.accumulator >= this.dt) {
      this.update(this.dt);
      this.accumulator -= this.dt;
    }
    this.render(this.accumulator / this.dt);
    requestAnimationFrame((t) => this.tick(t));
  }
}
