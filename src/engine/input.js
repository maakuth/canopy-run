// Keyboard + touch input with pressed/justPressed tracking.
// Presses are tracked per source token so that overlapping input sources
// (keyboard keys, individual touch fingers) compose correctly.
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
  KeyT: 'track',
};

const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'dash', 'pause', 'restart', 'mute', 'track'];

export const input = {
  pressed: Object.fromEntries(ACTIONS.map((a) => [a, false])),
  justPressed: Object.fromEntries(ACTIONS.map((a) => [a, false])),
};

// Per-action sets of currently active source tokens.
const tokens = Object.fromEntries(ACTIONS.map((a) => [a, new Set()]));

export function pressAction(action, token = 'default') {
  if (!(action in input.pressed)) return;
  const s = tokens[action];
  if (s.size === 0) input.justPressed[action] = true;
  s.add(token);
  input.pressed[action] = s.size > 0;
}

export function releaseAction(action, token = 'default') {
  if (!(action in input.pressed)) return;
  const s = tokens[action];
  s.delete(token);
  input.pressed[action] = s.size > 0;
}

function setKey(code, down) {
  const a = map[code];
  if (!a) return;
  if (down) pressAction(a, code);
  else releaseAction(a, code);
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
