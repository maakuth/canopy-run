// Keyboard input with pressed/justPressed tracking.
const KEYS = {};

const map = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump',
  ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash',
  Escape: 'pause',
  KeyR: 'restart',
  KeyM: 'mute',
};

export const input = {
  pressed: { left:false, right:false, up:false, down:false, jump:false, dash:false, pause:false, restart:false, mute:false },
  justPressed: { left:false, right:false, up:false, down:false, jump:false, dash:false, pause:false, restart:false, mute:false },
  _prev: {},
};

function setKey(code, down) {
  const a = map[code];
  if (!a) return;
  if (down && !input.pressed[a]) input.justPressed[a] = true;
  input.pressed[a] = down;
}

window.addEventListener('keydown', (e) => {
  if (map[e.code]) { e.preventDefault(); setKey(e.code, true); }
});
window.addEventListener('keyup', (e) => {
  if (map[e.code]) { e.preventDefault(); setKey(e.code, false); }
});

export function inputEndFrame() {
  for (const k in input.justPressed) input.justPressed[k] = false;
}
export function isDown(a) { return input.pressed[a]; }
export function justPressed(a) { return input.justPressed[a]; }
