#!/usr/bin/env python3
"""
Convert generated level JSON into the JS asset files bundled with the app.

- Classic levels carry no solution (hints are derived at runtime; greedy is
  complete for that mode), so they ship as one file.
- Escape levels carry their solution, packed as a compact 2-digit-per-move
  string (move cell (r,c) -> r*cols + c), and ship split into two files so no
  single asset is huge.

Usage:
    python3 build_assets.py <data_dir> <out_dir>
where <data_dir> holds levels_classic.json and levels_escape.json.
"""
import json, os, sys

def compact_sol(sol, cols):
    return "".join("%02d" % (r * cols + c) for (r, c) in sol)

def expand_sol(s, cols):
    return [[int(s[i:i+2]) // cols, int(s[i:i+2]) % cols] for i in range(0, len(s), 2)]

def emit(levels, globals_names, out_dir, chunk):
    n = len(levels)
    files = []
    for k, i in enumerate(range(0, n, chunk)):
        sub = levels[i:i + chunk]
        gname = globals_names[k] if len(globals_names) > 1 else globals_names[0]
        fname = gname.lower().replace("levels_", "levels_") + ".js"
        path = os.path.join(out_dir, fname)
        with open(path, "w") as f:
            f.write("window.%s=" % gname)
            json.dump(sub, f, separators=(",", ":"))
            f.write(";")
        files.append(fname)
        print("  wrote", fname, "levels", i + 1, "..", i + len(sub))
    return files

def main():
    data_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)

    classic = json.load(open(os.path.join(data_dir, "levels_classic.json")))
    emit(classic, ["LEVELS_CLASSIC"], out_dir, len(classic))  # one file, no solution stored

    escape = json.load(open(os.path.join(data_dir, "levels_escape.json")))
    # verify compact packing round-trips exactly
    for lv in escape:
        packed = compact_sol(lv["sol"], lv["cols"])
        if expand_sol(packed, lv["cols"]) != lv["sol"]:
            raise SystemExit("sol round-trip failed for level %s" % lv["id"])
        lv = lv  # keep array form in memory; pack only for output
    packed_levels = []
    for lv in escape:
        o = dict(lv); o["sol"] = compact_sol(lv["sol"], lv["cols"]); packed_levels.append(o)
    emit(packed_levels, ["LEVELS_ESCAPE_1", "LEVELS_ESCAPE_2"], out_dir, 3000)

    # sanity: sizes
    for fn in sorted(os.listdir(out_dir)):
        if fn.endswith(".js"):
            print("  size", fn, "%.2f MB" % (os.path.getsize(os.path.join(out_dir, fn)) / 1e6))

if __name__ == "__main__":
    main()
