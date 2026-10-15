# Arrow Puzzle Advanced

A clean, offline Android puzzle **game** with **15,000 levels across 16 modes and 12 tile looks**, a **coin economy** with paid hints, **daily / weekly / monthly packs**, and hard **challenge** packs. Pinch-zoom the board, switch between a dark and a white theme, and celebrate solves with fireworks.

<p align="center">
  <img src="docs/icon.png" width="96" alt="app icon">
</p>

## Download

Grab the signed APK from the [Releases](../../releases) page, or from [`dist/`](dist/).

```
dist/ArrowPuzzleAdvanced-5.5.apk
```

Sideload on Android 7.0 (API 24)+ — it runs on phones and tablets of every size and density. Declared as a game (`android:isGame` + `android:appCategory="game"`), so Android and the Play Store treat it as one.

## Mechanics × looks = modes

A **mechanic** defines the rules; a **theme** defines how tiles look. A **mode** pairs them and keeps its own progress.

| Mode | Mechanic | Look |
|------|----------|------|
| Classic Arrows | Classic | Arrows |
| Escape | Escape | Arrows |
| Round Colours | Classic | Round colour bubbles |
| Square Colours | Classic | Square colour blocks |
| Dots | Multi (tap-count) | Dots |
| Dotted Arrows | Multi | Dashed arrows |
| Snake | Escape | Snake tiles |
| Fruits | Classic | Fruit tiles |
| Picture Puzzles | Classic | Object/picture tiles |
| **Black Arrows** | Classic | Borderless black arrows (light board) |
| **Black Escape** | Escape | Borderless black arrows (light board) |
| **Long Arrows** | Classic | Long thin arrows (light board) |
| **Long Escape** | Escape | Long thin arrows (light board) |
| **Neon Arrows** | Classic | Glowing borderless arrows |
| **Curly Arrows** | Classic | Long curly / bent arrows (light board) |
| **Curly Escape** | Escape | Long curly arrows that slide |
| **Mega Curly** | Classic | Giant boards, hundreds of curly arrows |
| **Mega Long** | Classic | Giant boards, hundreds of long arrows |
| **Maze Arrows** | Classic | Dense maze of thin long arrows on a warm board |
| **Maze Escape** | Escape | Maze-style long arrows that slide |

### Mechanics
- **Classic** — tap a tile to launch it off the board; it only leaves if the whole lane to the edge is clear.
- **Escape** — each tap slides a tile one step; tiles leave the board at the edge.
- **Multi (numbered / dotted)** — each tile carries a count (1–3); a tap ticks it down, and only the *final* tap needs a clear lane.

## Difficulty

Arrow counts rise as you progress, and **every 6th level is a VERY HARD level** — a big board with **more than 50 arrows** (up to ~138). All arrows point **straight North / East / South / West**. The **Mega** modes go further: boards from 40×40 to 80×80 with **400–920 arrows**, and a **Mega Boards** challenge pack.

## Coins & hints

- Every solved puzzle pays **coins based on performance** — stars, speed and move efficiency — **capped at 100 coins per puzzle**.
- A **hint costs 2000 coins**. If you don't have enough, the game tells you; hints also lower your star rating, so they cost you coins twice.
- Your balance shows on the home screen and in-game. See [`docs/ECONOMY.md`](docs/ECONOMY.md).

## Challenges

A dedicated **Challenges** screen with hard packs drawn from the toughest level ranges: **Expert Classic**, **Expert Escape**, **Multi Master**, a mixed **Gauntlet**, and a fresh **Daily Challenge** every day.

## Comfort features

- **Pinch to zoom and drag to pan** the board while you play (plus on-screen + / − / reset buttons).
- **App theme: Dark, White, or Auto** (follows your device).
- **Fireworks and a firecracker sound** when you solve a puzzle (sound can be turned off in Settings).
- **Lives.** You start with **3 lives** and gain **+1 life every 25 levels** (levels 1–25 = 3, 26–50 = 4, 51–75 = 5, …). Three wrong taps and the level replays itself. *Relaxed (no limit)* toggle in Settings.
- **Double-press Back to exit** — a single Back press navigates up, never closes the game.
- **Mode archive.** Hide any mode you don't play, and unused modes auto-archive after **3 days**; modes you play rise to the top. Toggle it in Settings.
- **Theme-aware arrows.** Dark theme → **white** arrows; white theme → **dark** arrows. Every mode also has its own board **pattern** so they don't look alike.
- **Sound effects.** Taps, slides and escapes each have their own sound, plus fireworks on a solve (one toggle in Settings).
- **Suggestions & requests.** Message **[@osintgram_io](https://instagram.com/osintgram_io)** for help or to request new modes, themes or difficulty — there's a button in Settings.
- **Undo**, **Restart**, and per-mode stars, unlock progression and continue-where-you-left-off.

## Daily, weekly and monthly content

- **Daily Goal — 50 levels a day**, tracked with a progress bar.
- **Weekly Pack — 50 levels**, refreshed every ISO week.
- **Monthly Pack — 100 levels**, themed, rotating the featured mode each month.

These are seeded from your device date, so they refresh with **no network**. An optional "Check for new packs" button can fetch extra packs when online — the only network use, and the only reason the app requests INTERNET.

## How the levels are made

Every level is generated and **solvable by construction**; all 15,000 were re-verified (0 failures). See [`docs/LEVELS.md`](docs/LEVELS.md).

## Building from source

Standard Gradle Android project (AGP 8.5, JDK 17).

```bash
./gradlew assembleDebug
./gradlew assembleRelease
ANDROID_HOME=/path/sdk bash tools/build-apk.sh   # dependency-free build
```

## Signing

Release APKs are signed with a single release keystore that is **not stored in this repo** — it lives in GitHub Actions secrets plus your own private backup. Because every build uses that one key, a new version installs as an in-place **update** over the previous one — no uninstall needed.

Local build — point the script at your copy of the keystore:

```bash
APA_KEYSTORE=/path/to/apa-release.jks bash tools/build-apk.sh
```

CI — [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) decodes the keystore from secrets and builds on demand (Actions tab → *Run workflow*) or on a `v*` tag, attaching the APK to the release. Set these repository secrets: `KEYSTORE_BASE64` (`base64 -w0 apa-release.jks`), `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

> Keep a private backup of the keystore — lose it and you can never update the app again. Never switch keys once a version is out: Android refuses to update an app across a key change, so you would have to change the `applicationId` to ship a new one.

## Project layout

```
app/src/main/assets/www/     the whole game (HTML/CSS/JS)
  ├─ game_core.js            pure puzzle logic (classic, escape, multi)
  ├─ game.js                 modes, themes, coins, packs, challenges, zoom, fx
  ├─ levels_classic.js       6,000 classic levels
  ├─ levels_escape_1/2.js    6,000 escape levels
  └─ levels_multi.js         3,000 multi levels
packs/                       optional online pack manifest + sample pack
tools/level_generator/       Python generator + verifier + asset builder
tools/build-apk.sh           Gradle-less APK build
.github/workflows/           CI: build + sign the APK from secrets
```

## License

MIT — see [LICENSE](LICENSE).
