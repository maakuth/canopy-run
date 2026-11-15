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

Static files only — no build step required. Host on any static host (GitHub Pages,
Netlify, itch.io).

### GitHub Pages
This repository ships a GitHub Actions workflow (`.github/workflows/pages.yml`)
that publishes the site automatically on every push to `master`/`main`.

1. Push the repository to GitHub.
2. In the repository settings, open **Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `master` (or run the workflow manually) — the site will be
   published at `https://<user>.github.io/<repo>/`.

The site uses only relative URLs, so it works both at the repository subpath
above and on a custom domain. `.nojekyll` is included to disable Jekyll
processing, and the service worker caches all game assets for offline play
after the first load.
