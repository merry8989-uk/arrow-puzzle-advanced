# Coins, hints and the reward economy

## Earning coins

Every completed puzzle pays coins, **capped at 100 per puzzle**. The award mixes
three things so faster, cleaner solves pay more:

```
coins = stars*28                      // 28 / 56 / 84 for 1★ / 2★ / 3★
      + 8   if moves <= par           // solved without waste
      + 8   if seconds <= max(20, par*3)   // solved quickly
      + 4   if seconds <= max(20, par*6)   // (partial speed credit)
coins = min(100, coins)
```

| Outcome | Coins |
|---------|-------|
| 3★, efficient, fast | **100** (the cap) |
| 3★, efficient, slow | 92 |
| 3★ only | 84 |
| 2★, efficient, fast | 72 |
| 1★ only | 28 |

Stars come from hint usage: **0 hints = 3★, 1–2 hints = 2★, 3+ hints = 1★**. So
hints cost you coins twice — once at the till and once in the rating.

`par` is the puzzle's known solution length (for Classic it equals the tile count;
for Multi it is the sum of all counts; for Escape it is the fixed number of slides
in any solution).

## Spending coins

- **A hint costs 2000 coins.** The Hint button checks your balance first: with
  fewer than 2000 coins it refuses and tells you how many you have. When it fires,
  it deducts 2000 and pulses a valid next tile.
- At up to 100 coins per puzzle, a hint is roughly **20 clean solves** — a real
  decision, not a free nudge.

The balance is stored in `localStorage` under `apa_progress_v2` (`coins`) and shown
on the home screen and in the game top bar.

## Challenges

The Challenges screen draws hard packs from the toughest level ranges of each pool
(no extra level data, no network):

| Pack | Source | Size |
|------|--------|------|
| Expert Classic | classic levels 5200–6000 | 50 |
| Expert Escape | escape levels 5200–6000 | 50 |
| Multi Master | multi levels 2500–3000 | 50 |
| Gauntlet | mixed across all three hard ranges | 60 |
| Daily Challenge | mixed hard, seeded by the date | 30/day |

Clearing a challenge puzzle is recorded per pack; challenge puzzles pay coins the
same way campaign levels do.
