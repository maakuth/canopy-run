export class Pool {
  constructor(factory, reset, initial = 0) {
    this.factory = factory;
    this.reset = reset;
    this.free = [];
    for (let i = 0; i < initial; i++) this.free.push(factory());
  }
  get() {
    const o = this.free.pop();
    if (o) { this.reset(o); return o; }
    const n = this.factory();
    this.reset(n);
    return n;
  }
  release(o) { this.free.push(o); }
}
