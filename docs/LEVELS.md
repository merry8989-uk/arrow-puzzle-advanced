# How the 15,000 levels are generated

Every level is produced by a generator and is **solvable by construction** — no
level can ever be unsolvable. The generator and its verifier live in
`tools/level_generator/` (`levels.py`, `gen_v2.py`, `gen_all.py`, `build_assets.py`).

Level data is stored per **mechanic** (classic, escape, multi). Themes are pure
rendering and modes are curated (mechanic × theme) presets, so no level data is
duplicated for looks.

## The mechanics

| Mechanic | Tap a tile… | Win condition |
|----------|-------------|---------------|
| **Classic** | removes it, *if* its whole lane to the edge (in its own direction) is free of tiles and walls | no tiles remain |
| **Escape** | slides it one step in its direction; if that step leaves the board it is gone; if the target is occupied or a wall, nothing happens | no tiles remain |
| **Multi** | ticks its count down by one; only the final tap (count 1 → 0) must have a clear lane, and only then is it removed | no tiles remain |

Directions are 0=N, 1=E, 2=S, 3=W, plus diagonals 4=NE, 5=SE, 6=SW, 7=NW in later levels.

## Classic and Multi: forward placement, reversed

We place tiles one at a time onto an empty board (plus any walls). When placing a
tile we require that its lane is currently clear of everything already placed.
After `n` placements the board holds `n` tiles, and the **reverse of the placement
order is a valid clearing order**: when we clear the k-th placed tile, only the
earlier-placed tiles remain, and the placement rule already guaranteed its lane
was clear of exactly those.

A useful property: a tap only ever *removes* a tile, and removing tiles can never
create a new blockage. So "repeatedly tap any tile whose lane is clear" always
finishes if the level is solvable at all — the challenge is spotting the free
tiles among the blocked ones.

**Multi** reuses exactly this layout and adds a per-tile `count` (1–3). The
intermediate taps never move anything, and the final tap of a tile needs the same
clear lane the placement guaranteed, so the reverse order still clears the board.
Par = sum of all counts.

## Escape: reverse moves from the solved state

Escape is not monotonic (sliding one tile can block another), so it is built
backwards from the solved, empty board. Two reverse moves are allowed:

- **spawn** — place a new tile on a border cell pointing outward (the inverse of a
  tile exiting the board), or
- **unstep** — move an existing tile one cell *opposite* its direction (the inverse
  of a forward slide).

Applying a sequence of reverse moves to the empty board yields a puzzle whose
**forward solution is that sequence played backwards**. Tiles are tracked by
identity so the generator emits the exact forward tap sequence, which is then
re-simulated to confirm it clears the board.

Because every forward move advances one tile exactly one step toward its exit, the
number of moves in *any* escape solution is fixed and equals the sum of each
tile's initial distance to the edge — the level's **par**.

## Difficulty curve

| Mechanic | Levels | Boards | Notes |
|----------|--------|--------|-------|
| Classic | 6,000 | 3×3 → 9×9 | walls from ch. 3, diagonals from ch. 6 |
| Escape | 6,000 | 3×3 → 9×9 | avg ~25 tiles, par ~100 |
| Multi | 3,000 | 3×3 → 9×9 | counts rise with chapter |

Levels sit in chapters of 50. Classic/Multi average ~36 tiles; walls and diagonal
directions appear as the chapters progress.

## Verification

`combine_verify.py` and `gen_v2.py` re-check every level after generation:

- Classic / Multi — a greedy clear is run to completion (complete for these modes);
  failure if any tile is left or par does not match.
- Escape — the stored solution is re-simulated move by move; failure on any illegal
  tap or leftover tile.

Result at ship time: **15,000 / 15,000 verified, 0 failures.**
