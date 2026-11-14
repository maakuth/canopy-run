// Simple seeded-ish RNG; uses Math.random by default but supports seed for daily runs.
export class RNG {
  constructor(seed = null) {
    this.seed = seed;
    if (seed !== null) {
      // mulberry32
      this.state = seed >>> 0;
      this._next = () => {
        this.state = (this.state + 0x6D2B79F5) >>> 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    } else {
      this._next = () => Math.random();
    }
  }
  next() { return this._next(); }
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  bool(p = 0.5) { return this.next() < p; }
}
