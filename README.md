# Canopy Run

Non-violent, skill-based endless platformer. Guide **Pip** through an ever-harder
natural landscape. No enemies — only thorns, gaps, crumbling branches, wind, and
gravity to master.

## Run locally
Any static server works (ES modules require HTTP, not file://):

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Controls
### Keyboard
- Move: Arrow keys / A D
- Jump: SPACE (variable height; double jump unlocks at 250m)
- Dash: SHIFT (unlocks at 500m)
- Wall slide/jump: touch a wall while falling (unlocks at 750m)
- Pause: ESC
- Restart to menu: R (on game over)
- Mute: M
- Cycle soundtrack: T
### Touch
On-screen virtual buttons (left/right, jump, dash, pause, mute, track,
restart) are shown automatically on touch devices. On desktop they appear
on mouse movement and hide after a short idle delay.

## Performance
Internal resolution 320×180, nearest-neighbor scaling to fit viewport (non-integer allowed), no frameworks, object pooling
for particles, culling of off-screen entities. Targets older PCs.

## Deploy
Static files only — host on any static host (GitHub Pages, Netlify, itch.io).
No build step required. Served over HTTPS, the game is installable as a PWA
(manifest + service worker) and works offline after first load.
