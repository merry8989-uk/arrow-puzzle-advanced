# How the 12,000 levels are generated

Every level in Arrow Puzzle Advanced is produced by a generator, and every level is
**solvable by construction** — no level can ever be unsolvable. The generator and its
verifier live in `tools/level_generator/` (`levels.py`, `gen_all.py`, `combine_verify.py`).

## The two mechanics

| Mode | Tap a cell containing an arrow… | Win condition |
|------|--------------------------------|---------------|
| **Classic** | removes the arrow, *if* the whole ray from it to the board edge (in its own direction) is free of arrows and walls | no arrows remain |
| **Escape** | slides the arrow one step in its direction; if that step leaves the board the arrow is gone; if the target cell is occupied or a wall, nothing happens | no arrows remain |

Directions are 0=N, 1=E, 2=S, 3=W, and diagonals 4=NE, 5=SE, 6=SW, 7=NW (later levels only).

## Classic: forward placement, reversed

We place arrows one at a time onto an empty board (plus any walls). When placing an
arrow we require that its ray is currently clear of everything already placed. After
`n` placements the board holds `n` arrows, and the **reverse of the placement order is a
valid clearing order**: when we come to clear the k-th placed arrow, only the
earlier-placed arrows are still present, and the placement rule already guaranteed its
ray was clear of exactly those.

A nice property falls out: because a tap only ever *removes* an arrow, removing arrows
can never create a new blockage. So "repeatedly tap any arrow with a clear ray" always
finishes if the level is solvable at all. The challenge in Classic is therefore
spotting the currently-free arrows among the blocked ones — the generator keeps levels
non-trivial by requiring a minimum number of initially-blocked arrows.

## Escape: reverse moves from the solved state

Escape is not monotonic (sliding one arrow can block another), so we build it backwards
from the solved, empty board. Two reverse moves are allowed:

- **spawn** — place a new arrow on a border cell pointing outward (the inverse of an arrow
  exiting the board), or
- **unstep** — move an existing arrow one cell *opposite* its direction (the inverse of a
  forward slide).

Applying a sequence of reverse moves to the empty board yields a puzzle whose **forward
solution is that sequence played backwards**. Arrows are tracked by identity so the
generator can emit the exact forward tap sequence, which is then re-simulated to confirm
it clears the board.

Because every forward move advances one arrow exactly one step toward its exit, the
number of moves in *any* solution is fixed and equal to the sum of each arrow's initial
distance to the edge — this is the level's **par**.

## Difficulty curve

Per mode there are 6,000 levels in 120 chapters of 50. Board size ramps from 3×3 to 9×9
over the first ~12 chapters, then stays large while arrow counts, walls, and diagonals
increase. Classic levels average ~36 arrows; escape levels average ~25 arrows with a par
of ~100 moves.

## Verification

`combine_verify.py` re-checks all 12,000 levels after generation:

- Classic — a greedy clear is run to completion (complete for this mode); failure if any
  arrow is left.
- Escape — the stored solution is re-simulated move by move; failure on any illegal tap
  or leftover arrow.

Result at ship time: **12,000 / 12,000 verified, 0 failures.**
