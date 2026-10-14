"""
v2 level generator: the "multi" mechanic (numbered / dotted tap-count tiles).

A multi tile carries a `need` value (1-3). A tap decrements `need`; only the
FINAL tap (need -> 0) must have a clear ray to the edge, and only then is the
tile removed. Intermediate taps never move anything.

Solvability: the layout is produced exactly like Classic (each tile placed with
a clear ray w.r.t. everything already placed), so the reverse of the placement
order is a valid clearing order -- each tile is simply tapped `need` times, and
its final tap has the clear ray the placement guaranteed. Par = sum(need).
"""
import json, random, sys
sys.path.insert(0, "/scratch/work/gen")
from levels import DIRS, ORTHO, ALL8, in_bounds, ray_cells

MULTI_SIZES = [(3,3),(4,4),(4,5),(5,5),(5,6),(6,6),(6,7),(7,7),(8,8),(8,9),(9,9)]

def multi_params(idx):
    ch = min(idx // 50, 59)
    R, C = MULTI_SIZES[min(ch, len(MULTI_SIZES) - 1)]
    area = R * C
    frac = min(0.45, 0.28 + 0.005 * ch)
    n = max(3, min(area - 1, round(area * frac)))
    dirs = ORTHO if ch < 6 else ALL8
    walls = 0 if ch < 3 else min(5, (ch - 2) // 3 + 1)
    return R, C, n, dirs, walls

def gen_multi(rng, R, C, n, dirs, wall_count, ch):
    walls = set()
    tries = 0
    while len(walls) < wall_count and tries < 200:
        tries += 1
        r, c = rng.randrange(R), rng.randrange(C)
        if (r, c) not in walls:
            walls.add((r, c))
    w1 = max(1, 6 - ch // 8); w2 = 5; w3 = min(5, 1 + ch // 8)
    occ = set(walls)
    placed = []
    for _ in range(n):
        chosen = None
        for _t in range(400):
            r, c = rng.randrange(R), rng.randrange(C)
            if (r, c) in occ:
                continue
            d = dirs[rng.randrange(len(dirs))]
            if any(cell in occ for cell in ray_cells(R, C, r, c, d)):
                continue
            chosen = (r, c, d)
            break
        if chosen is None:
            break
        need = rng.choices([1, 2, 3], weights=[w1, w2, w3])[0]
        placed.append((chosen[0], chosen[1], chosen[2], need))
        occ.add((chosen[0], chosen[1]))
    arrows = [[r, c, d, nd] for (r, c, d, nd) in placed]
    sol = []
    for (r, c, d, nd) in reversed(placed):
        for _ in range(nd):
            sol.append([r, c])
    return {"mode": "multi", "rows": R, "cols": C, "arrows": arrows,
            "walls": [[r, c] for (r, c) in sorted(walls)], "sol": sol, "par": len(sol)}

def verify_multi(level):
    R, C = level["rows"], level["cols"]
    occ = {}
    for a in level["arrows"]:
        r, c, d, nd = a[0], a[1], a[2], a[3]
        if (r, c) in occ:
            return False, "overlap"
        occ[(r, c)] = [d, nd]
    walls = set((w[0], w[1]) for w in level["walls"])
    if set(occ) & walls:
        return False, "on wall"
    for (r, c) in level["sol"]:
        if (r, c) not in occ:
            return False, "tap empty"
        st = occ[(r, c)]
        if st[1] > 1:
            st[1] -= 1
            continue
        d = st[0]
        for cell in ray_cells(R, C, r, c, d):
            if cell in occ or cell in walls:
                return False, "blocked final ray"
        del occ[(r, c)]
    if occ:
        return False, "leftover"
    return True, "ok"

def make_multi(idx, rng):
    for _ in range(8):
        R, C, n, dirs, walls = multi_params(idx)
        lv = gen_multi(rng, R, C, n, dirs, walls, min(idx // 50, 59))
        ok, _ = verify_multi(lv)
        if ok:
            lv["id"] = idx + 1
            return lv
    lv["id"] = idx + 1
    return lv

if __name__ == "__main__":
    if sys.argv[1] == "sample":
        rng = random.Random(7)
        for idx in [0, 60, 200, 600, 1500, 2900]:
            lv = make_multi(idx, rng)
            needs = [a[3] for a in lv["arrows"]]
            print(f" idx={idx:5d} {lv['rows']}x{lv['cols']} arrows={len(needs):3d} par={lv['par']:3d} "
                  f"needs {min(needs)}..{max(needs)} avg {sum(needs)/len(needs):.2f}")
    else:
        start, count, outfile = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        rng = random.Random(4242 + start)
        levels = [make_multi(i, rng) for i in range(start, start + count)]
        json.dump(levels, open(outfile, "w"), separators=(",", ":"))
        print(f"multi {start}..{start+count-1} -> {outfile}")
