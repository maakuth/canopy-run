# Audio — Canopy Run

## Tracks
Three synthesized soundtracks, selectable at any time with **T** (persisted):

1. **Chiptune** — original square/triangle loop, BPM `110 + tier*8`.
2. **Ambient Soul/Jazz** — warm pads, electric-piano stabs, walking bass, sparse
   blues/major-pentatonic melody. Base BPM 76, +4 per tier (max ~92).
3. **Chiptune (Rough)** — sawtooth arpeggios following a C–Am–F–G chord
   progression, sawtooth bass, and noise percussion (kick/snare/hats). Base BPM 118, +8 per tier.

## Soul/Jazz progression
8-bar loop, 2 beats per chord:

`Cmaj7 – Am7 – Dm7 – G7 – Cmaj7 – Fmaj7 – Dm7 – G7`

- Pad: chord tones (root/3rd/5th/7th), +9th shimmer at tier 2+.
- Piano stabs: chord tones on each change from tier 1+.
- Walking bass: root → 5th → approach notes.
- Melody: C blues/major-pentatonic pool on off-beats; density grows with tier.
- Percussion: none until 250 m; then kick (1,3), snare (2,4), light hats on 8ths.

## Implementation notes
- Scheduler uses a lookahead of 0.12 s and a 25 ms timer.
- Jazz scheduler runs on an eighth-note grid (`stepDur = beatDur/2`), 32 steps/loop.
- A reusable noise buffer provides snare/hat; kick is a sine sweep.
- When muted, schedulers advance time without scheduling to preserve position.
- Track switching restarts the scheduler and resets cursors.
- Per-track music bus gain: Chiptune 0.28, Soul/Jazz 0.50, Chiptune (Rough) 0.28.
- Rough chiptune scheduler runs on a quarter-note grid like chiptune, arpeggiating each
  melody degree into 4-5 sawtooth notes and adding kick/snare/hats from 250 m.