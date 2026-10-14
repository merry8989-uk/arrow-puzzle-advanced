# Daily, weekly and monthly content

The app never needs the network to deliver "new" puzzles. Instead, packs are
**seeded from your device date** and drawn from the bundled level pools, so a
fresh set appears automatically each day, week and month. Everything is
deterministic: the same date always produces the same pack, on any device.

## How a pack is built

`buildPack(seed, count, onlyMode)` hashes the seed string (FNV-1a) into a
mulberry32 PRNG, then picks `count` items. Each item is a `(mode, levelId)`
pair: a random mode from the mode list, and a random level id within that
mode's pool size (Classic/Escape 6,000 · Multi 3,000). The monthly pack is
restricted to a single featured mode, chosen deterministically from the month
key, so each month has a themed flavour.

| Pack | Count | Seed key | Refreshes |
|------|-------|----------|-----------|
| Daily Goal | 50 | `YYYY-MM-DD` | every day |
| Weekly Pack | 50 | `YYYY-Www` (ISO week) | every Monday |
| Monthly Pack | 100 | `YYYY-MM` | every month, themed |

Completion is tracked per pack key. When the key changes, the pack's completed
set resets, so a new day/week/month starts a clean slate. All of this lives in
`localStorage` under `apa_progress_v2`.

## Why not download new puzzles every week?

Because the app is offline-first: with 15,000 bundled levels, a daily goal of 50
plus a weekly pack of 50 and a monthly pack of 100 draw on a deep pool, so the
schedule stays fresh for a long time without any server. If you *do* want to
ship genuinely new level data later, the optional online pack mechanism handles
that (below) without changing the offline experience.

## Optional online packs

`packs/manifest.json` in this repo is the manifest the app reads when you tap
**Check for new packs**:

```json
{
  "version": 2,
  "packs": [
    { "id": "theme-sampler", "name": "Theme Sampler Pack", "version": 1,
      "modeId": "round",
      "url": "https://raw.githubusercontent.com/.../packs/theme-sampler.json" }
  ]
}
```

The app compares each pack's `version` with what it already has, downloads any
newer one (`{ "levels": [ ... ] }`, the same level format the game uses), stores
it in `localStorage`, and lists it on the Packs screen as a playable pack.

To publish a new pack: add a level file under `packs/`, bump its `version` in
`manifest.json`, and commit. Apps pick it up on the next "Check for new packs".

If the device is offline, the fetch fails gracefully and the bundled packs carry
on — the network is only ever touched by that one button.
