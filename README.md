# Arrow Puzzle Advanced

A clean, offline Android arrow-puzzle game with **12,000 hand-crafted-by-generator levels**
— 6,000 in each of two play modes — every single one guaranteed solvable.

<p align="center">
  <img src="docs/icon.png" width="96" alt="app icon">
</p>

## Download

Grab the signed APK from the [Releases](../../releases) page, or from [`dist/`](dist/).

```
dist/ArrowPuzzleAdvanced-1.0.apk
```

Sideload it on any Android 7.0 (API 24) or newer device. The app requests **no
permissions at all** and works completely offline.

## Two modes, one game

Switch modes any time from **Settings**; each mode keeps its own progress.

**Classic** — tap an arrow and it launches off the board. It only leaves if every
cell between it and the edge is clear, so arrows block each other and you must find
the order that frees them. Clear the whole board.

**Escape** — each tap slides an arrow one step in its direction. Arrows that reach
the edge slide off the board and are gone. Arrows that cannot move do nothing. Get
every arrow off the board.

## Features

- **12,000 levels** (6,000 per mode), split into chapters of 50 with a smooth difficulty curve.
- Boards grow from 3×3 to 9×9; later levels add static **walls** and **diagonal** arrows.
- **Undo**, **Restart**, and a **Hint** that always points at a valid next move.
- Per-level star rating, unlock progression, and continue-where-you-left-off — saved on device.
- Modern dark theme, smooth slide/fly animations, works fully offline, no ads, no tracking.

## How the levels are made

Levels are **generated, not hand-drawn**, and every one is proven solvable *by construction*:

- **Classic** levels are built by placing arrows one at a time, each requiring a clear
  ray at the moment it is placed. The reverse of the placement order is therefore a
  valid clearing order.
- **Escape** levels are built by starting from the solved (empty) board and applying
  *reverse* moves — spawning an arrow at the border, or stepping an arrow backwards.
  The reverse of that move sequence is a valid forward solution.

The full generator lives in [`tools/level_generator/`](tools/level_generator) and the
final 12,000 levels were independently re-verified (0 failures) before shipping.
See [`docs/LEVELS.md`](docs/LEVELS.md) for the details.

## Building from source

The project is a standard Gradle Android project (Android Gradle Plugin 8.5, JDK 17).

```bash
# Android Studio: File > Open > this folder, then Run.
# Or from the command line:
./gradlew assembleDebug      # debug APK -> app/build/outputs/apk/debug/
./gradlew assembleRelease    # unsigned release APK
```

A dependency-free, Gradle-less build is also included, using only the Android SDK
build-tools (aapt2 → d8 → zipalign → apksigner):

```bash
ANDROID_HOME=/path/to/android-sdk bash tools/build-apk.sh
```

## Project layout

```
app/src/main/java/…/MainActivity.java   WebView host + back-button bridge
app/src/main/assets/www/                the entire game (HTML/CSS/JS)
  ├─ game_core.js                       pure puzzle logic + escape solver
  ├─ game.js                            UI, screens, animation, progress
  ├─ levels_classic.js                  6,000 classic levels
  └─ levels_escape.js                   6,000 escape levels
tools/level_generator/                  Python level generator + verifier
tools/build-apk.sh                      Gradle-less APK build
```

## License

MIT — see [LICENSE](LICENSE).
