import { W, H } from '../config.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// High-resolution (browser-scale) overlay used for crisp font rendering after
// the game graphics have been integer-upscaled.
export const uiCanvas = document.getElementById('ui');
export const uiCtx = uiCanvas.getContext('2d', { alpha: true });
uiCtx.imageSmoothingEnabled = true;

let scale = 1;

export function updateScale() {
  // Scale to fit the viewport exactly, allowing non-integer factors so the
  // game fills the available space instead of snapping to whole pixels.
  scale = Math.max(1, Math.min(window.innerWidth / W, window.innerHeight / H));
  const cssW = Math.round(W * scale);
  const cssH = Math.round(H * scale);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  uiCanvas.style.width = `${cssW}px`;
  uiCanvas.style.height = `${cssH}px`;
  // Backing store matches the upscaled CSS size so fonts rasterize at browser
  // resolution instead of the 320x180 internal resolution.
  uiCanvas.width = cssW;
  uiCanvas.height = cssH;
}

updateScale();
window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', updateScale);

export function clear(color = '#0b1a12') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
}

export function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function text(str, x, y, color = '#e8f0e4', size = 8, align = 'left') {
  const s = scale;
  uiCtx.fillStyle = color;
  uiCtx.font = `${size * s}px "Courier New", monospace`;
  uiCtx.textAlign = align;
  uiCtx.textBaseline = 'top';
  const rx = (align === 'center') ? (x * s) : (align === 'right' ? (x * s) : (x * s));
  uiCtx.fillText(str, Math.round(rx), Math.round(y * s));
}

export function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
