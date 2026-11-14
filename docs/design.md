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
- Installable PWA: `manifest.webmanifest`, service worker (`sw.js`) for offline caching,
  and app icons under `icons/`.
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
  Early (tier 0) gaps are limited to 2 tiles so a basic jump can always clear them.

### World
- Chunk width 160–240 px; templates per tier; ground height continuous.
- Entities: platforms (static/moving/crumbling), hazards (thorns), wind zones,
  low-grav bubbles, bounce pads (mushrooms), collectibles, tutorial triggers.
- Generate ahead of camera right edge; cull behind left edge.
- Checkpoint: last platform touched (for pit respawn).

### Input
Keyboard: Arrow/WASD move, Space jump, Shift dash, Esc pause, R restart,
M mute, T cycle music track.
Touch: on-screen virtual buttons (left/right, jump, dash, pause, mute,
track, restart). Always visible on touch (coarse-pointer) devices; on
mouse (fine-pointer) devices they fade in on mouse movement and hide
after a short idle delay.

### Audio
Web Audio synthesized: SFX + two selectable music loops; mute persisted.
Tracks: "Chiptune" (original), "Ambient Soul/Jazz" (pads, keys, walking bass,
sparse melody), and "Chiptune (Rough)" (rougher sawtooth arpeggios + noise
percussion). Press T to cycle tracks (choice persisted). Music tiers by distance;
the jazz and rough tracks add percussion (kick/snare/hat) from 250 m. SFX unchanged.

### Persistence (localStorage)
`bestDistance`, `bestScore`, `muted`, `tutorialSeen`.

### States
MENU, PLAYING, PAUSED, GAMEOVER; tutorial banners during early play.

## Implementation Phases (status)
1. Scaffold & engine skeleton — done
2. Player physics & base movement — done
3. Procedural world v1 — done
4. Collectibles, scoring, hearts, HUD — done
5. Advanced moves + unlocks — done
6. Hazards & difficulty — done
7. Audio — done
8. Tutorial & polish — done
9. Performance & docs — done

## Performance notes
- Internal resolution 320×180; display uses integer (nearest-neighbor) scaling up to
  viewport size (largest whole multiple that fits), so each game pixel maps to an
  identical block of screen pixels.
- Entities culled behind camera; particles pooled via array reuse.
- No build step; ES modules loaded natively.
