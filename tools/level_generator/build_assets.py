#!/usr/bin/env python3
"""
Convert generated level JSON into the JS asset files bundled with the app.

Level data is produced per MECHANIC; themes are pure rendering and modes are
curated (mechanic, theme) presets, so no level data is duplicated for themes.

- classic : one file, no stored solution (greedy is complete for this mode;
            hints are derived at runtime).
- escape  : two files; each level's solution packed as a compact
            2-digit-per-move string (cell (r,c) -> r*cols + c).
- multi   : one file, solutions packed the same way.

Usage:  python3 build_assets.py <data_dir> <out_dir>
"""
import json, os, sys

MECH = {
    "classic": {"globals": ["LEVELS_CLASSIC"], "store_sol": False, "chunk": 10 ** 9},
    "escape":  {"globals": ["LEVELS_ESCAPE_1", "LEVELS_ESCAPE_2"], "store_sol": True, "chunk": 3000},
    "multi":   {"globals": ["LEVELS_MULTI"], "store_sol": True, "chunk": 10 ** 9},
}

def compact_sol(sol, cols):
    return "".join("%02d" % (r * cols + c) for (r, c) in sol)

def expand_sol(s, cols):
    return [[int(s[i:i+2]) // cols, int(s[i:i+2]) % cols] for i in range(0, len(s), 2)]

def emit(mode, levels, globals_names, store_sol, chunk, out_dir):
    for k, i in enumerate(range(0, len(levels), chunk)):
        sub = levels[i:i + chunk]
        gname = globals_names[k] if len(globals_names) > 1 else globals_names[0]
        fname = gname.lower() + ".js"
        out = []
        for lv in sub:
            o = dict(lv)
            if store_sol and isinstance(o.get("sol"), list):
                o["sol"] = compact_sol(o["sol"], o["cols"])
            elif not store_sol:
                o.pop("sol", None)
            out.append(o)
        with open(os.path.join(out_dir, fname), "w") as f:
            f.write("window.%s=" % gname)
            json.dump(out, f, separators=(",", ":"))
            f.write(";")
        print("  wrote", fname, "levels", i + 1, "..", i + len(sub))

def main():
    data_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for mode, cfg in MECH.items():
        path = os.path.join(data_dir, "levels_%s.json" % mode)
        if not os.path.exists(path):
            print("  skip", mode, "(no data)"); continue
        levels = json.load(open(path))
        if cfg["store_sol"]:
            for lv in levels:
                if isinstance(lv.get("sol"), list):
                    packed = compact_sol(lv["sol"], lv["cols"])
                    assert expand_sol(packed, lv["cols"]) == lv["sol"], "round-trip failed %s" % lv["id"]
        emit(mode, levels, cfg["globals"], cfg["store_sol"], cfg["chunk"], out_dir)
    for fn in sorted(os.listdir(out_dir)):
        if fn.endswith(".js") and fn.startswith("levels_"):
            print("  size", fn, "%.2f MB" % (os.path.getsize(os.path.join(out_dir, fn)) / 1e6))

if __name__ == "__main__":
    main()
