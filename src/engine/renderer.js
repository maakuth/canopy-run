import { W, H } from '../config.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// Integer (nearest-neighbor) scaling: display the fixed internal resolution
// (W x H) at the largest whole multiple that fits the viewport, so every game
// pixel maps to an identical block of screen pixels (no fractional scaling).
export function updateScale() {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
}

updateScale();
window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', updateScale);

export function clear(color = '#0b1a12') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

export function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function text(str, x, y, color = '#e8f0e4', size = 8, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(str, Math.round(x), Math.round(y));
}

export function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
