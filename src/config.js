// Global configuration & tuning.
export const W = 320;
export const H = 180;
export const TILE = 16;
export const SCALE = 1; // internal; CSS scales

export const GRAVITY = 900;          // px/s^2
export const MOVE_SPEED = 95;        // px/s
export const MOVE_ACCEL = 700;       // px/s^2
export const MOVE_FRICTION = 900;    // px/s^2
export const JUMP_VEL = -260;        // px/s
export const JUMP_CUT = 0.45;        // multiplier when released early
export const DOUBLE_JUMP_VEL = -230;
export const DASH_SPEED = 260;
export const DASH_DURATION = 0.12;   // s
export const DASH_COOLDOWN = 0.6;    // s
export const WALL_SLIDE_SPEED = 60;
export const WALL_JUMP_X = 150;
export const WALL_JUMP_Y = -250;
export const COYOTE = 0.09;          // s
export const JUMP_BUFFER = 0.1;      // s
export const PLAYER_W = 8;
export const PLAYER_H = 12;
export const MAX_FALL = 420;

export const HEARTS_MAX = 3;
export const INVULN_TIME = 1.0;
export const KNOCKBACK_X = 120;
export const KNOCKBACK_Y = -160;

export const UNLOCK_DOUBLE = 250;    // meters
export const UNLOCK_DASH = 500;
export const UNLOCK_WALL = 750;

export const PIXELS_PER_METER = 10;  // distance units

export const PALETTE = {
  sky0: '#1b3a2a',
  sky1: '#2a5a3a',
  ground: '#3a2a1a',
  grass: '#5fa34a',
  wood: '#6b4a2a',
  leaf: '#7fc96a',
  thorn: '#c0392b',
  player: '#f2c94c',
  player2: '#e07b39',
  collect: '#ffd166',
  heart: '#e85d75',
  ui: '#e8f0e4',
  wind: '#a8dadc',
  lowgrav: '#b39ddb',
  bounce: '#ff9f1c',
  crumble: '#8d6e63',
};

export const STORAGE_KEYS = {
  bestDistance: 'canopy.bestDistance',
  bestScore: 'canopy.bestScore',
  muted: 'canopy.muted',
  tutorialSeen: 'canopy.tutorialSeen',
};
