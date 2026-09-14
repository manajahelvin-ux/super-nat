# SUPER-NAT

A polished, post-apocalyptic **top-down twin-stick arena shooter** that runs entirely in the browser — no build step, no assets, no dependencies. Everything (art, sound, world) is generated procedurally at runtime.

![genre](https://img.shields.io/badge/genre-top--down%20shooter-e23b3b) ![tech](https://img.shields.io/badge/tech-vanilla%20JS%20%2B%20Canvas-f2a541) ![deps](https://img.shields.io/badge/dependencies-0-7ef0c9)

## ▶ Play

Open `index.html` in any modern browser, or serve it (recommended):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## The Game

You are the last survivor in the ruins of **City-Z**. Hold out against escalating waves of the infected — walkers, lunging runners, acid-spitting bloated ones, and armored brutes — for as long as you can.

- **Waves** keep escalating; clear one and the next is bigger and nastier
- **Combo multiplier** — chain kills within 3.2s to stack up to **x9** score; taking a hit resets your streak
- **Drops** — medkits, weapon crates (SMG / Shotgun / Marksman rifle), and adrenaline boosts
- **Dash** — quick escape with invincibility frames
- **Local high-score table** — top 8 runs are saved in `localStorage` with your survivor tag

## Controls

| Action | Desktop | Touch |
|---|---|---|
| Move | `WASD` / arrows | Left virtual stick |
| Aim | Mouse | Right virtual stick |
| Fire | Hold `LMB` | Right stick deflection (auto-fire) |
| Dash | `Space` / `Shift` | DASH button |
| Pause | `P` / `Esc` | ▐▐ button |
| Mute | `M` | Sound buttons |

`R` / `Enter` — instant restart from the game-over screen.

## Juicy details

- Trauma-based **screen shake**, **hit-stop** on kills, zoom punch on big kills, slow-mo death
- **Persistent blood decals** — gore accumulates on the streets and slowly weathers away
- Muzzle flashes, shell casings that bounce, gibs, sparks, smoke, dust, drifting fog
- Flashlight cone, off-screen enemy indicators, floating combo/score popups
- Fully **procedural WebAudio SFX** (gunshots per weapon, squelches, alarms, wind ambience) — no audio files

## Tech notes

- 60fps target: pre-rendered sprite canvases, particle pooling with a hard cap, spatial-hash enemy separation, sub-rect world rendering, DPR capped at 2
- Seeded world generation — every run gets a fresh ruin layout (wrecked cars, rubble, barrels along cracked roads)
- Zero external assets; the only network request is the Google Font (with system-font fallbacks)

## Files

```
index.html      — screens, HUD, boot
style.css       — post-apocalyptic UI theme
js/utils.js     — math / RNG / geometry
js/state.js     — config + shared state
js/audio.js     — procedural SFX engine
js/input.js     — keyboard/mouse + dual touch sticks
js/sprites.js   — all pre-rendered art
js/world.js     — arena generation, decals, collisions
js/entities.js  — player, enemies, bullets, pickups, particles
js/render.js    — render pipeline
js/game.js      — loop, waves, HUD, high scores
```
