import { W, H } from '../config.js';
import { clamp, lerp } from '../util/math.js';

export const camera = { x: 0, y: 0, shake: 0, shakeT: 0 };

export function cameraFollow(targetX, targetY, dt) {
  const tx = targetX - W / 2;
  const ty = targetY - H / 2;
  camera.x = lerp(camera.x, tx, 1 - Math.pow(0.001, dt));
  camera.y = lerp(camera.y, ty, 1 - Math.pow(0.001, dt));
  if (camera.x < 0) camera.x = 0;
  if (camera.y < 0) camera.y = 0;
  if (camera.shakeT > 0) {
    camera.shakeT -= dt;
    if (camera.shakeT <= 0) { camera.shake = 0; camera.shakeT = 0; }
  }
}

export function cameraShake(amount, time) {
  camera.shake = Math.max(camera.shake, amount);
  camera.shakeT = Math.max(camera.shakeT, time);
}

export function cameraOffset() {
  let sx = 0, sy = 0;
  if (camera.shakeT > 0) {
    sx = (Math.random() - 0.5) * camera.shake * 2;
    sy = (Math.random() - 0.5) * camera.shake * 2;
  }
  return { x: camera.x + sx, y: camera.y + sy };
}
