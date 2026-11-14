import { pressAction, releaseAction } from './input.js';
import * as audio from './audio.js';

const touchMap = new Map(); // touch identifier -> { action, token }

function anyActive(action) {
  for (const info of touchMap.values()) {
    if (info.action === action) return true;
  }
  return false;
}

function setActive(el, active) {
  if (active) el.classList.add('active');
  else el.classList.remove('active');
}

function initButton(el) {
  const action = el.dataset.action;
  if (!action) return;

  // Mouse support (desktop testing / fine pointer)
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    audio.audioInit();
    pressAction(action, 'mouse:' + action);
    setActive(el, true);
  });
  const releaseMouse = () => {
    releaseAction(action, 'mouse:' + action);
    if (!anyActive(action)) setActive(el, false);
  };
  el.addEventListener('mouseup', releaseMouse);
  el.addEventListener('mouseleave', releaseMouse);

  // Touch support
  el.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    audio.audioInit();
    for (const t of e.changedTouches) {
      const token = 'touch:' + t.identifier;
      pressAction(action, token);
      touchMap.set(t.identifier, { action, token, el });
    }
    setActive(el, true);
  }, { passive: false });

  const endTouch = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const info = touchMap.get(t.identifier);
      if (info) {
        releaseAction(info.action, info.token);
        touchMap.delete(t.identifier);
      }
    }
    if (!anyActive(action)) setActive(el, false);
  };
  el.addEventListener('touchend', endTouch, { passive: false });
  el.addEventListener('touchcancel', endTouch, { passive: false });
}

function initVisibility(root) {
  // Coarse pointers: always visible (CSS). Fine pointers: show on mousemove, hide after delay.
  let hideTimer = null;
  const show = () => {
    root.classList.add('tc-visible');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => root.classList.remove('tc-visible'), 2500);
  };
  // On coarse pointer, keep visible class irrelevant; CSS handles.
  window.addEventListener('mousemove', show, { passive: true });
  // Show briefly on load for discoverability on fine pointers? Keep hidden initially.
}

export function initTouchControls() {
  const root = document.getElementById('touchControls');
  if (!root) return;
  root.querySelectorAll('[data-action]').forEach(initButton);
  initVisibility(root);

  // Audio init on any touch, even outside buttons.
  document.addEventListener('touchstart', () => { audio.audioInit(); }, { once: true, passive: true });
}

initTouchControls();
