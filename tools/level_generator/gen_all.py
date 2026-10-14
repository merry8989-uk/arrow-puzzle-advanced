import json, random, sys, time
sys.path.insert(0, "/scratch/work/gen")
from levels import *

CLASSIC_SIZES = [(3,3),(4,4),(4,5),(5,5),(5,6),(6,6),(6,7),(7,7),(8,8),(8,9),(9,9)]
ESCAPE_SIZES  = [(3,3),(4,4),(4,5),(5,5),(5,6),(6,6),(6,7),(7,7),(8,8),(8,9),(9,9)]

def classic_params(idx):
    ch = min(idx // 50, 119)
    R, C = CLASSIC_SIZES[min(ch, len(CLASSIC_SIZES) - 1)]
    area = R * C
    frac = min(0.50, 0.28 + 0.006 * ch)
    n = max(3, min(area - 1, round(area * frac)))
    dirs = ORTHO if ch < 5 else ALL8
    walls = 0 if ch < 3 else min(6, (ch - 2) // 3 + 1)
    return R, C, n, dirs, walls

def escape_params(idx):
    ch = min(idx // 50, 119)
    R, C = ESCAPE_SIZES[min(ch, len(ESCAPE_SIZES) - 1)]
    area = R * C
    n_arrows = max(3, min(area // 3, 3 + ch))
    n_unsteps = n_arrows * 2 + min(ch, 40) * 2
    dirs = ORTHO if ch < 6 else ALL8
    walls = 0 if ch < 4 else min(5, (ch - 3) // 3 + 1)
    return R, C, n_arrows, n_unsteps, dirs, walls

def make_classic(idx, rng):
    lv = None
    for _ in range(8):
        R, C, n, dirs, walls = classic_params(idx)
        lv = gen_classic(rng, R, C, n, dirs, walls)
        ok, _ = verify_classic(lv)
        if not ok:
            continue
        if n >= 5 and blocked_count_classic(R, C, lv["arrows"], lv["walls"]) == 0:
            continue
        break
    lv["id"] = idx + 1
    lv.pop("sol", None)  # classic hints are computed at runtime
    return lv

def make_escape(idx, rng):
    R, C, n_arrows, n_unsteps, dirs, walls = escape_params(idx)
    for attempt in range(12):
        lv = gen_escape(rng, R, C, n_arrows, n_unsteps, dirs, walls)
        if lv is None:
            n_unsteps = max(1, n_unsteps - 4)
            continue
        ok, _ = verify_escape(lv)
        if not ok:
            continue
        lv["id"] = idx + 1
        return lv
    for _ in range(12):
        lv = gen_escape(rng, R, C, max(2, n_arrows - 4), max(2, n_unsteps // 2), dirs, walls)
        if lv:
            ok, _ = verify_escape(lv)
            if ok:
                lv["id"] = idx + 1
                return lv
    return None

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "sample":
        rng = random.Random(12345)
        for name, mk, stat in [("CLASSIC", make_classic, lambda l: f"blocked={blocked_count_classic(l['rows'],l['cols'],l['arrows'],l['walls'])}"),
                               ("ESCAPE", make_escape, lambda l: f"exitable={exitable_count_escape(l['rows'],l['cols'],l['arrows'],l['walls'])}")]:
            print(name)
            for idx in [0, 50, 100, 300, 600, 1000, 2000, 3500, 5500]:
                t = time.time()
                lv = mk(idx, rng)
                print(f"  idx={idx:5d} {lv['rows']}x{lv['cols']} arrows={len(lv['arrows']):3d} {stat(lv):12s} par={lv['par']:4d} ({time.time()-t:.3f}s)")
    else:
        mode, start, count, outfile = cmd, int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        rng = random.Random(9000 + start)
        mk = make_classic if mode == "classic" else make_escape
        levels = []
        t0 = time.time()
        for i in range(start, start + count):
            lv = mk(i, rng)
            if lv is None:
                raise SystemExit(f"generation failed at {i}")
            levels.append(lv)
        with open(outfile, "w") as f:
            json.dump(levels, f, separators=(",", ":"))
        print(f"{mode} {start}..{start+count-1} -> {outfile}  ({time.time()-t0:.1f}s)")
