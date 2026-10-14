"""
v3 difficulty schedule for the Classic pool.

Rules from the design:
  * Arrow counts rise as levels rise.
  * Every 6th level is a VERY HARD level: a large board with more than 50 arrows.
  * All arrows point straight North / East / South / West (no diagonals).

Also builds a "Mega" set: very large boards with as many arrows as generation
can place (targeting the "~1000 long arrows" challenge tier).
"""
import json, random, sys, time
sys.path.insert(0, "/scratch/work/gen")
from levels import ORTHO, gen_classic, verify_classic, blocked_count_classic

def classic_params_v3(idx):
    ch = idx // 50
    hard = (idx % 6 == 5)                      # levels 6, 12, 18, ...
    if hard:
        size = 12 + min(4, ch // 20)           # 12x12 .. 16x16
        R = C = size
        n = R * C                              # ask for maximum; keep what we get
        walls = min(10, 2 + ch // 15)
    else:
        size = 4 + min(6, ch // 4)             # 4x4 .. 10x10
        R = C = size
        frac = min(0.58, 0.30 + 0.005 * ch)
        n = max(3, round(R * C * frac))
        walls = 0 if ch < 3 else min(5, (ch - 2) // 3 + 1)
    return R, C, n, ORTHO, walls, hard

def make_classic_v3(idx, rng):
    hard = (idx % 6 == 5)
    for _ in range(6):
        R, C, n, dirs, walls, hard = classic_params_v3(idx)
        lv = gen_classic(rng, R, C, n, dirs, walls)
        ok, _ = verify_classic(lv)
        if not ok:
            continue
        cnt = len(lv["arrows"])
        if hard and cnt < 50:                  # very hard levels need > 50 arrows
            continue
        if (not hard) and n >= 5 and blocked_count_classic(R, C, lv["arrows"], lv["walls"]) == 0:
            continue
        lv["id"] = idx + 1; lv["hard"] = bool(hard); lv.pop("sol", None)
        return lv
    lv["id"] = idx + 1; lv["hard"] = bool(hard); lv.pop("sol", None)
    return lv

def mega_params(idx):
    size = 40 + 4 * (idx % 11)                 # 40x40 .. 80x80  (~440 .. ~950 arrows)
    R = C = min(size, 80)
    return R, C, R * C, ORTHO, min(12, 4 + idx // 4)

def make_mega(idx, rng):
    R, C, n, dirs, walls = mega_params(idx)
    lv = gen_classic(rng, R, C, n, dirs, walls)
    ok, _ = verify_classic(lv)
    if not ok:
        lv = gen_classic(rng, R, C, max(20, n // 2), dirs, walls)
    lv["id"] = idx + 1; lv["mega"] = True; lv.pop("sol", None)
    return lv

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "sample":
        rng = random.Random(11)
        print("CLASSIC v3 (hard every 6th):")
        for idx in [0, 3, 5, 9, 11, 17, 60, 300, 1200, 5999]:
            t = time.time(); lv = make_classic_v3(idx, rng)
            print(f"  idx={idx:5d} level={lv['id']:5d} hard={str(lv.get('hard')):5s} {lv['rows']}x{lv['cols']} arrows={len(lv['arrows']):3d} ({time.time()-t:.2f}s)")
        print("MEGA:")
        for idx in [0, 5, 11]:
            t = time.time(); lv = make_mega(idx, rng)
            print(f"  idx={idx} {lv['rows']}x{lv['cols']} arrows={len(lv['arrows']):4d} ({time.time()-t:.1f}s)")
    else:
        kind, start, count, outfile = cmd, int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
        rng = random.Random(777 + start)
        mk = make_mega if kind == "mega" else make_classic_v3
        t0 = time.time()
        levels = [mk(i, rng) for i in range(start, start + count)]
        json.dump(levels, open(outfile, "w"), separators=(",", ":"))
        print(f"{kind} {start}..{start+count-1} -> {outfile} ({time.time()-t0:.1f}s)")
