import json, sys, os
sys.path.insert(0, "/scratch/work/gen")
from levels import verify_escape, ray_cells, DIRS

def load(p):
    with open(p) as f:
        return json.load(f)

def verify_classic_greedy(lv):
    """Greedy clearing is complete for classic (removals never block), so this
    proves solvability."""
    R, C = lv["rows"], lv["cols"]
    arrows = {(a[0], a[1]): a[2] for a in lv["arrows"]}
    walls = set((w[0], w[1]) for w in lv["walls"])
    if set(arrows) & walls:
        return False
    occ = set(arrows)
    while occ:
        moved = False
        for (r, c) in list(occ):
            d = arrows[(r, c)]
            if not any(cell in occ or cell in walls for cell in ray_cells(R, C, r, c, d)):
                occ.discard((r, c))
                moved = True
                break
        if not moved:
            return False
    return True

classic = load("data/levels_classic.json")
escape = []
for p in ["data/escape_a.json", "data/escape_b.json", "data/escape_c1.json", "data/escape_c2.json"]:
    escape += load(p)

print("classic levels:", len(classic), " escape levels:", len(escape))
bad = 0
for lv in classic:
    if not verify_classic_greedy(lv):
        bad += 1; print("  BAD classic", lv["id"])
for lv in escape:
    ok, msg = verify_escape(lv)
    if not ok:
        bad += 1; print("  BAD escape", lv["id"], msg)
print("verification failures:", bad)
assert [l["id"] for l in classic] == list(range(1, len(classic) + 1))
assert [l["id"] for l in escape] == list(range(1, len(escape) + 1))

with open("data/levels_escape.json", "w") as f:
    json.dump(escape, f, separators=(",", ":"))

def stats(name, arr):
    ar = [len(l["arrows"]) for l in arr]; pr = [l["par"] for l in arr]
    print(f"{name}: arrows {min(ar)}..{max(ar)} (avg {sum(ar)/len(ar):.1f}), par {min(pr)}..{max(pr)} (avg {sum(pr)/len(pr):.1f})")
stats("classic", classic); stats("escape", escape)
for p in ["data/levels_classic.json", "data/levels_escape.json"]:
    print(p, f"{os.path.getsize(p)/1e6:.2f} MB")
print("TOTAL LEVELS:", len(classic) + len(escape))
