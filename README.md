# Arrow Puzzle Advanced

A clean, offline Android arrow-puzzle game with **15,000 levels across 9 modes and 8 tile looks** — plus **daily, weekly and monthly packs** that refresh on a schedule, and an **optional** online check for extra packs.

<p align="center">
  <img src="docs/icon.png" width="96" alt="app icon">
</p>

## Download

Grab the signed APK from the [Releases](../../releases) page, or from [`dist/`](dist/).

```
dist/ArrowPuzzleAdvanced-2.0.apk
```

Sideload it on Android 7.0 (API 24) or newer. The game works **fully offline**; the only network use is the optional "Check for new packs" button.

## Mechanics × looks = modes

A **mechanic** defines the puzzle rules; a **theme** defines how tiles look. A **mode** is a curated (mechanic × theme) pairing with its own progress. The same rules with a different look is a different mode, so there are many ways to play the same kind of puzzle.

| Mode | Mechanic | Look |
|------|----------|------|
| Classic Arrows | Classic | Arrows |
| Escape | Escape | Arrows |
| Round Colours | Classic | Round colour bubbles |
| Square Colours | Classic | Square colour blocks |
| Dots | Multi (tap-count) | Dots |
| Dotted Arrows | Multi (tap-count) | Dashed arrows |
| Snake | Escape | Snake tiles |
| Fruits | Classic | Fruit tiles |
| Picture Puzzles | Classic | Object/picture tiles |

### The mechanics

- **Classic** — tap a tile to launch it off the board; it only leaves if the whole lane to the edge is clear. Tiles block each other, so you must find the order that frees them.
- **Escape** — each tap slides a tile one step in its direction; tiles leave the board at the edge. Tiles that cannot move do nothing.
- **Multi (numbered / dotted)** — each tile carries a count (1–3). A tap ticks it down; only the **final** tap must have a clear lane, and only then is the tile removed. Dots and dotted arrows both use this mechanic.

### The looks

Arrows, round colour bubbles, square colour blocks, dots, dashed arrows, snake tiles, fruits, and "picture" objects. Every look keeps a clear direction cue so the puzzle stays readable.

## Daily, weekly and monthly content

- **Daily Goal — 50 levels a day.** Each day a fresh set of 50 levels is drawn from the pools and tracked with a progress bar and streak.
- **Weekly Pack — 50 levels.** Refreshes every ISO week.
- **Monthly Pack — 100 levels.** A themed pack that rotates the featured mode each month (snake, round colours, square colours, dots, dotted arrows…).

These are seeded from your device date, so they refresh automatically with **no network**. See [`docs/CONTENT.md`](docs/CONTENT.md).

## Optional online updates

Tapping **Check for new packs** (Packs screen or Settings) fetches a small manifest and downloads any newer pack into local storage, where it appears as a playable pack. If there is no connection, the app says so and the bundled weekly/monthly packs keep working. This is the *only* network use, and it is the reason the app requests the INTERNET permission.

## Features

- **15,000 levels** (Classic 6,000 · Escape 6,000 · Multi 3,000), in chapters of 50, with a smooth difficulty curve from 3×3 to 9×9.
- Later levels add static **walls** and **diagonal** tiles.
- **Undo**, **Restart**, and a **Hint** that always points at a valid move.
- Per-mode star ratings, unlock progression, continue-where-you-left-off, and daily/weekly/monthly pack tracking — all saved on device.
- Dark theme, smooth animations, no ads, no tracking.

## How the levels are made

Levels are **generated, not hand-drawn**, and every one is proven solvable *by construction*:

- **Classic / Multi** — tiles are placed one at a time, each requiring a clear lane at the moment it is placed, so the reverse of the placement order is a valid clearing order. (For Multi, the final tap of each tile has that clear lane.)
- **Escape** — built backwards from the solved, empty board by spawning border tiles and stepping tiles back one cell; the reverse of that move sequence is a valid forward solution.

The generator is in [`tools/level_generator/`](tools/level_generator). All 15,000 levels were independently re-verified (0 failures) before shipping. Details in [`docs/LEVELS.md`](docs/LEVELS.md).

## Building from source

Standard Gradle Android project (Android Gradle Plugin 8.5, JDK 17).

```bash
./gradlew assembleDebug        # debug APK
./gradlew assembleRelease      # unsigned release APK
ANDROID_HOME=/path/sdk bash tools/build-apk.sh   # dependency-free build
```

## Project layout

```
app/src/main/assets/www/     the whole game (HTML/CSS/JS)
  ├─ game_core.js            pure puzzle logic (classic, escape, multi)
  ├─ game.js                 modes, themes, packs, screens, animation
  ├─ levels_classic.js       6,000 classic levels
  ├─ levels_escape_1/2.js    6,000 escape levels (solutions packed)
  └─ levels_multi.js         3,000 multi levels
packs/                       optional online pack manifest + sample pack
tools/level_generator/       Python level generator + verifier + asset builder
tools/build-apk.sh           Gradle-less APK build
```

## License

MIT — see [LICENSE](LICENSE).
