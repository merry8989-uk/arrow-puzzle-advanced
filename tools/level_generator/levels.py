"""
Arrow Puzzle Advanced - level generator.

Two mechanics, both with reverse-generation so every level is guaranteed solvable:

CLASSIC ("tap to clear"):
  A tap on an arrow removes it from the board, but only if every cell along its
  ray (in its own direction, to the board edge) is empty of arrows and walls.
  Goal: clear every arrow.
  Generation: place arrows one at a time, newest-first-removed. When placing an
  arrow we require its ray to be clear of everything already placed, so the
  reverse of the placement order is a valid clearing order.

ESCAPE ("slide & escape"):
  A tap slides an arrow one cell in its direction if that cell is free; an arrow
  on the border pointing outward leaves the board. Arrows that cannot move do
  nothing. Goal: get every arrow off the board.
  Generation: start from the solved (empty) board and apply reverse moves
  (spawn an arrow at the border pointing out, or step an arrow backwards). The
  reverse of that move sequence is a valid forward solution.

Directions: 0=N 1=E 2=S 3=W 4=NE 5=SE 6=SW 7=NW
"""

import json
import random
import sys

DIRS = {
    0: (-1, 0),   # N
    1: (0, 1),    # E
    2: (1, 0),    # S
    3: (0, -1),   # W
    4: (-1, 1),   # NE
    5: (1, 1),    # SE
    6: (1, -1),   # SW
    7: (-1, -1),  # NW
}

ORTHO = [0, 1, 2, 3]
ALL8 = [0, 1, 2, 3, 4, 5, 6, 7]


def in_bounds(R, C, r, c):
    return 0 <= r < R and 0 <= c < C


def ray_cells(R, C, r, c, d):
    """Cells strictly beyond (r,c) along direction d, up to (not incl.) the edge."""
    dr, dc = DIRS[d]
    out = []
    rr, cc = r + dr, c + dc
    while in_bounds(R, C, rr, cc):
        out.append((rr, cc))
        rr += dr
        cc += dc
    return out


def is_border_out(R, C, r, c, d):
    """True if stepping from (r,c) in direction d leaves the board."""
    dr, dc = DIRS[d]
    return not in_bounds(R, C, r + dr, c + dc)


# ----------------------------------------------------------------------------
# CLASSIC
# ----------------------------------------------------------------------------
def gen_classic(rng, R, C, n, dirs, wall_count):
    walls = set()
    tries = 0
    while len(walls) < wall_count and tries < 200:
        tries += 1
        r, c = rng.randrange(R), rng.randrange(C)
        if (r, c) in walls:
            continue
        walls.add((r, c))

    occ = set(walls)
    placed = []  # order of placement; reverse of this is a valid solution
    for _ in range(n):
        chosen = None
        for _try in range(400):
            r, c = rng.randrange(R), rng.randrange(C)
            if (r, c) in occ:
                continue
            d = dirs[rng.randrange(len(dirs))]
            ray = ray_cells(R, C, r, c, d)
            if any(cell in occ for cell in ray):
                continue
            chosen = (r, c, d)
            break
        if chosen is None:
            break
        placed.append(chosen)
        occ.add((chosen[0], chosen[1]))

    arrows = [[r, c, d] for (r, c, d) in placed]
    sol = [[r, c] for (r, c, d) in reversed(placed)]
    walls_list = [[r, c] for (r, c) in sorted(walls)]
    return {
        "mode": "classic",
        "rows": R,
        "cols": C,
        "arrows": arrows,
        "walls": walls_list,
        "sol": sol,
        "par": len(sol),
    }


def blocked_count_classic(R, C, arrows, walls):
    occ = set((a[0], a[1]) for a in arrows) | set((w[0], w[1]) for w in walls)
    blocked = 0
    for (r, c, d) in arrows:
        ray = ray_cells(R, C, r, c, d)
        if any(cell in occ for cell in ray):
            blocked += 1
    return blocked


def verify_classic(level):
    R, C = level["rows"], level["cols"]
    occ = {}
    for (r, c, d) in level["arrows"]:
        if (r, c) in occ:
            return False, "overlap"
        occ[(r, c)] = d
    walls = set((w[0], w[1]) for w in level["walls"])
    if set(occ) & walls:
        return False, "arrow on wall"
    for (r, c) in level["sol"]:
        if (r, c) not in occ:
            return False, "tap empty cell"
        d = occ[(r, c)]
        for cell in ray_cells(R, C, r, c, d):
            if cell in occ or cell in walls:
                return False, "blocked ray"
        del occ[(r, c)]
    if occ:
        return False, "leftover arrows"
    return True, "ok"


# ----------------------------------------------------------------------------
# ESCAPE
# ----------------------------------------------------------------------------
def gen_escape(rng, R, C, n_spawns, n_unsteps, dirs, wall_count):
    walls = set()
    tries = 0
    while len(walls) < wall_count and tries < 300:
        tries += 1
        r, c = rng.randrange(R), rng.randrange(C)
        if (r, c) in walls:
            continue
        walls.add((r, c))

    # id -> (r,c,d); cell -> id
    arrows = {}
    cell_of = {}
    nxt_id = 0
    rev = []  # reverse moves

    def free(cell):
        return cell not in cell_of and cell not in walls and in_bounds(R, C, *cell)

    def do_spawn():
        nonlocal nxt_id
        cands = []
        for c in range(C):
            cands.append((0, c, 0))       # top row points N
            cands.append((R - 1, c, 2))   # bottom row points S
        for r in range(R):
            cands.append((r, C - 1, 1))   # right col points E
            cands.append((r, 0, 3))       # left col points W
        rng.shuffle(cands)
        for (r, c, d) in cands:
            if free((r, c)):
                aid = nxt_id
                nxt_id += 1
                arrows[aid] = (r, c, d)
                cell_of[(r, c)] = aid
                rev.append(("spawn", aid))
                return True
        return False

    def do_unstep():
        ids = list(arrows.keys())
        rng.shuffle(ids)
        for aid in ids:
            r, c, d = arrows[aid]
            dr, dc = DIRS[d]
            t = (r - dr, c - dc)  # one cell opposite the arrow's direction
            if free(t):
                del cell_of[(r, c)]
                arrows[aid] = (t[0], t[1], d)
                cell_of[t] = aid
                rev.append(("unstep", aid, (r, c), t))
                return True
        return False

    spawns_done = 0
    unsteps_done = 0
    guard = 0
    while (spawns_done < n_spawns or unsteps_done < n_unsteps) and guard < 4000:
        guard += 1
        want_spawn = spawns_done < n_spawns and (
            unsteps_done >= n_unsteps or not arrows or rng.random() < 0.45
        )
        if want_spawn:
            if do_spawn():
                spawns_done += 1
        else:
            if do_unstep():
                unsteps_done += 1
            elif spawns_done < n_spawns and do_spawn():
                spawns_done += 1

    # Build forward solution by replaying reverse moves backwards.
    pos = {aid: (v[0], v[1]) for aid, v in arrows.items()}
    sol = []
    ok = True
    for mv in reversed(rev):
        if mv[0] == "unstep":
            _, aid, c_from, t = mv
            if pos.get(aid) != t:
                ok = False
                break
            sol.append([t[0], t[1]])
            pos[aid] = c_from
        else:
            _, aid = mv
            cell = pos.get(aid)
            if cell is None:
                ok = False
                break
            sol.append([cell[0], cell[1]])
            del pos[aid]
    if not ok or pos:
        return None

    arrows_list = [[r, c, d] for (r, c, d) in arrows.values()]
    walls_list = [[r, c] for (r, c) in sorted(walls)]
    return {
        "mode": "escape",
        "rows": R,
        "cols": C,
        "arrows": arrows_list,
        "walls": walls_list,
        "sol": sol,
        "par": len(sol),
    }


def verify_escape(level):
    R, C = level["rows"], level["cols"]
    occ = {}
    for (r, c, d) in level["arrows"]:
        if (r, c) in occ:
            return False, "overlap"
        occ[(r, c)] = d
    walls = set((w[0], w[1]) for w in level["walls"])
    if set(occ) & walls:
        return False, "arrow on wall"
    for (r, c) in level["sol"]:
        if (r, c) not in occ:
            return False, "tap empty cell"
        d = occ.pop((r, c))
        dr, dc = DIRS[d]
        nr, nc = r + dr, c + dc
        if not in_bounds(R, C, nr, nc):
            continue  # escaped
        if (nr, nc) in occ or (nr, nc) in walls:
            return False, "blocked slide"
        occ[(nr, nc)] = d
    if occ:
        return False, "leftover arrows"
    return True, "ok"


def exitable_count_escape(R, C, arrows, walls):
    occ = set((a[0], a[1]) for a in arrows)
    walls = set((w[0], w[1]) for w in walls)
    cnt = 0
    for (r, c, d) in arrows:
        dr, dc = DIRS[d]
        nr, nc = r + dr, c + dc
        if not in_bounds(R, C, nr, nc):
            cnt += 1  # can exit right now
    return cnt
