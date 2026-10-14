/* Arrow Puzzle Advanced - pure game logic (no DOM). Usable in browser + node.
   Mechanics: classic, escape, multi. Themes are pure rendering and live in the UI. */
(function (root) {
  "use strict";
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]];

  function inb(R, C, r, c) { return r >= 0 && r < R && c >= 0 && c < C; }
  function k(r, c) { return r + "," + c; }
  function wallSet(walls) { var s = new Set(); for (var i = 0; i < (walls || []).length; i++) s.add(k(walls[i][0], walls[i][1])); return s; }
  function occSet(arrows) { var s = new Set(); for (var i = 0; i < arrows.length; i++) s.add(k(arrows[i][0], arrows[i][1])); return s; }
  function cmp(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; }
  function asWalls(w) { return w instanceof Set ? w : wallSet(w); }

  /* ---------- classic ---------- */
  function classicRayClear(R, C, r, c, d, occ, walls) {
    var rr = r + DIRS[d][0], cc = c + DIRS[d][1];
    while (inb(R, C, rr, cc)) {
      if (occ.has(k(rr, cc)) || walls.has(k(rr, cc))) return false;
      rr += DIRS[d][0]; cc += DIRS[d][1];
    }
    return true;
  }
  function classicAnyMove(R, C, arrows, walls) {
    walls = asWalls(walls); var occ = occSet(arrows);
    for (var i = 0; i < arrows.length; i++)
      if (classicRayClear(R, C, arrows[i][0], arrows[i][1], arrows[i][2], occ, walls)) return i;
    return -1;
  }
  function classicApply(R, C, arrows, walls, i) {
    walls = asWalls(walls); var occ = occSet(arrows), a = arrows[i];
    if (!classicRayClear(R, C, a[0], a[1], a[2], occ, walls)) return null;
    var ns = arrows.slice(); ns.splice(i, 1); return ns;
  }
  function classicSolve(R, C, arrows, walls) {
    walls = asWalls(walls); var st = arrows.slice().sort(cmp), path = [];
    while (st.length) {
      var occ = occSet(st), found = -1;
      for (var i = 0; i < st.length; i++)
        if (classicRayClear(R, C, st[i][0], st[i][1], st[i][2], occ, walls)) { found = i; break; }
      if (found < 0) return null;
      path.push([st[found][0], st[found][1]]); st.splice(found, 1);
    }
    return path;
  }

  /* ---------- escape ---------- */
  function escapeMoveFor(R, C, arrows, walls, i) {
    walls = asWalls(walls); var occ = occSet(arrows), a = arrows[i];
    var nr = a[0] + DIRS[a[2]][0], nc = a[1] + DIRS[a[2]][1];
    if (!inb(R, C, nr, nc)) return { i: i, exit: true };
    if (occ.has(k(nr, nc)) || walls.has(k(nr, nc))) return null;
    return { i: i, exit: false };
  }
  function escapeApply(R, C, arrows, walls, i) {
    walls = asWalls(walls);
    var m = escapeMoveFor(R, C, arrows, walls, i); if (!m) return null;
    var ns = arrows.slice();
    if (m.exit) { ns.splice(i, 1); return ns; }
    var a = ns[i]; ns[i] = [a[0] + DIRS[a[2]][0], a[1] + DIRS[a[2]][1], a[2]]; return ns;
  }
  function escapeSolve(R, C, arrows, walls, maxNodes) {
    maxNodes = maxNodes || 300000;
    var wset = asWalls(walls);
    var start = arrows.map(function (a) { return [a[0], a[1], a[2]]; }).sort(cmp);
    var visited = new Set(), path = [], nodes = 0, aborted = false;
    function sk(st) { var s = ""; for (var i = 0; i < st.length; i++) s += st[i][0] + "," + st[i][1] + "," + st[i][2] + ";"; return s; }
    function rec(st) {
      if (st.length === 0) return true;
      if (nodes++ > maxNodes) { aborted = true; return false; }
      var key = sk(st); if (visited.has(key)) return false; visited.add(key);
      var occ = occSet(st), moves = [];
      for (var i = 0; i < st.length; i++) {
        var nr = st[i][0] + DIRS[st[i][2]][0], nc = st[i][1] + DIRS[st[i][2]][1];
        if (!inb(R, C, nr, nc)) moves.push([i, 1]);
        else if (!occ.has(k(nr, nc)) && !wset.has(k(nr, nc))) moves.push([i, 0]);
      }
      moves.sort(function (a, b) { return b[1] - a[1]; });
      for (var m = 0; m < moves.length; m++) {
        var idx = moves[m][0], isExit = moves[m][1], r = st[idx][0], c = st[idx][1], d = st[idx][2], ns;
        if (isExit) { ns = st.slice(); ns.splice(idx, 1); }
        else { ns = st.slice(); ns[idx] = [r + DIRS[d][0], c + DIRS[d][1], d]; ns.sort(cmp); }
        path.push([r, c]); if (rec(ns)) return true; path.pop();
        if (aborted) return false;
      }
      return false;
    }
    return rec(start) ? path.slice() : null;
  }

  /* ---------- multi (numbered / dotted tap-count tiles) ----------
     arrows are [r, c, d, need]. A tap decrements `need`; only the final tap
     (need 1 -> 0) must have a clear ray, and only then is the tile removed. */
  function multiNeed(a) { return a.length > 3 ? a[3] : 1; }
  function multiApply(R, C, arrows, walls, i) {
    walls = asWalls(walls); var a = arrows[i], ns = arrows.slice();
    if (multiNeed(a) > 1) { ns[i] = [a[0], a[1], a[2], a[3] - 1]; return ns; }
    var occ = occSet(arrows);
    if (!classicRayClear(R, C, a[0], a[1], a[2], occ, walls)) return null;
    ns.splice(i, 1); return ns;
  }
  // Prefer a real removal; otherwise any tile that can be decremented.
  function multiHint(R, C, arrows, walls) {
    walls = asWalls(walls); var occ = occSet(arrows), dec = -1;
    for (var i = 0; i < arrows.length; i++) {
      if (multiNeed(arrows[i]) > 1) { dec = i; continue; }
      if (classicRayClear(R, C, arrows[i][0], arrows[i][1], arrows[i][2], occ, walls)) return i;
    }
    return dec;
  }
  function multiSolve(R, C, arrows, walls) {
    walls = asWalls(walls); var st = arrows.map(function (a) { return a.slice(); }), path = [];
    while (st.length) {
      var i = multiHint(R, C, st, walls); if (i < 0) return null;
      path.push([st[i][0], st[i][1]]); st = multiApply(R, C, st, walls, i);
    }
    return path;
  }

  /* ---------- dispatcher ---------- */
  function applyMove(mech, R, C, arrows, walls, i) {
    if (mech === "classic") return classicApply(R, C, arrows, walls, i);
    if (mech === "escape") return escapeApply(R, C, arrows, walls, i);
    if (mech === "multi") return multiApply(R, C, arrows, walls, i);
    return null;
  }
  function hintIndex(mech, R, C, arrows, walls) {
    if (mech === "classic") return classicAnyMove(R, C, arrows, walls);
    if (mech === "multi") return multiHint(R, C, arrows, walls);
    return -1; // escape handled by the UI (stored solution / solver)
  }

  root.APCore = {
    DIRS: DIRS, inb: inb,
    classicRayClear: classicRayClear, classicAnyMove: classicAnyMove, classicApply: classicApply, classicSolve: classicSolve,
    escapeMoveFor: escapeMoveFor, escapeApply: escapeApply, escapeSolve: escapeSolve,
    multiNeed: multiNeed, multiApply: multiApply, multiHint: multiHint, multiSolve: multiSolve,
    applyMove: applyMove, hintIndex: hintIndex
  };
})(typeof window !== "undefined" ? window : globalThis);
