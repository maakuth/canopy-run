# Canopy Run — Design Document

## Vision
Non-violent, skill-based endless platformer. Guide **Pip** (a small bird) through an
ever-harder natural landscape. No enemies to kill — only thorns, gaps, crumbling
branches, wind, and gravity to master. Movement abilities unlock as distance grows,
so early runs teach fundamentals and later runs demand full mastery. High score
(distance) saved locally.

## Constraints
- Web platform, HTML5 Canvas, pixel art, simple shapes.
- Performant on older PCs: low internal resolution (320×180), no heavy frameworks,
  object pooling, minimal allocations in the hot loop.
- Vanilla JS + ES modules, no build step.
- Commit after each implementation prompt; document changes in detail.

## Architecture
See `src/` tree. Engine: loop, input, camera, storage, audio, renderer.
Game: player, world, chunks, hazards, collectibles, particles, hud, states.
Util: rng, math, pool.

## Game Design
### Player (Pip)
- Size 8×12 px, AABB physics, gravity, variable jump height.
- 3 hearts. Hazard hit → −1 heart + knockback + brief invuln.
- Pit fall → −1 heart + respawn at last touched platform (0 hearts → game over).
- Moveset unlocked by distance: 0 m walk+jump; 250 m double jump; 500 m dash;
  750 m wall slide+jump.
- Feel: coyote time, jump buffering, acceleration/deceleration, squash & stretch.

### Progression & Difficulty
- Endless horizontal run; distance = score basis (+ collectible seeds).
- Tiers by distance: 0 (0–250), 1 (250–500), 2 (500–750), 3 (750–1500),
  4 (1500+). Generator only emits chunks passable with unlocked abilities.

### World
- Chunk width 160–240 px; templates per tier; ground height continuous.
- Entities: platforms (static/moving/crumbling), hazards (thorns), wind zones,
  low-grav bubbles, bounce pads (mushrooms), collectibles, tutorial triggers.
- Generate ahead of camera right edge; cull behind left edge.
- Checkpoint: last platform touched (for pit respawn).

### Input
Keyboard only: Arrow/WASD move, Space jump, Shift dash, Esc pause, R restart,
M mute.

### Audio
Web Audio synthesized: SFX + music loop; mute persisted.

### Persistence (localStorage)
`bestDistance`, `bestScore`, `muted`, `tutorialSeen`.

### States
MENU, PLAYING, PAUSED, GAMEOVER; tutorial banners during early play.

## Implementation Phases
1. Scaffold & engine skeleton
2. Player physics & base movement
3. Procedural world v1
4. Collectibles, scoring, hearts, HUD
5. Advanced moves + unlocks
6. Hazards & difficulty
7. Audio
8. Tutorial & polish
9. Performance & docs
