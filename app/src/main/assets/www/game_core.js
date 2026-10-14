/* Arrow Puzzle Advanced - pure game logic (no DOM). Usable in browser + node. */
(function (root) {
  "use strict";
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]];

  function inb(R, C, r, c) { return r >= 0 && r < R && c >= 0 && c < C; }
  function k(r, c) { return r + "," + c; }

  function wallSet(walls) {
    var s = new Set();
    for (var i = 0; i < (walls || []).length; i++) s.add(k(walls[i][0], walls[i][1]));
    return s;
  }
  function occSet(arrows) {
    var s = new Set();
    for (var i = 0; i < arrows.length; i++) s.add(k(arrows[i][0], arrows[i][1]));
    return s;
  }
  function cmp(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; }
  function asWalls(w) { return w instanceof Set ? w : wallSet(w); }

  /* ---- CLASSIC ---- */
  function classicRayClear(R, C, r, c, d, occ, walls) {
    var rr = r + DIRS[d][0], cc = c + DIRS[d][1];
    while (inb(R, C, rr, cc)) {
      if (occ.has(k(rr, cc)) || walls.has(k(rr, cc))) return false;
      rr += DIRS[d][0]; cc += DIRS[d][1];
    }
    return true;
  }
  // Returns the arrow index that can be cleared, or -1.
  function classicAnyMove(R, C, arrows, walls) {
    walls = asWalls(walls);
    var occ = occSet(arrows);
    for (var i = 0; i < arrows.length; i++) {
      if (classicRayClear(R, C, arrows[i][0], arrows[i][1], arrows[i][2], occ, walls)) return i;
    }
    return -1;
  }
  // Returns new arrow list after tapping index i (removes it), or null if invalid.
  function classicApply(R, C, arrows, walls, i) {
    walls = asWalls(walls);
    var occ = occSet(arrows);
    var a = arrows[i];
    if (!classicRayClear(R, C, a[0], a[1], a[2], occ, walls)) return null;
    var ns = arrows.slice(); ns.splice(i, 1); return ns;
  }
  // Full greedy clear (used to validate / produce a solution).
  function classicSolve(R, C, arrows, walls) {
    walls = asWalls(walls);
    var st = arrows.slice().sort(cmp), path = [];
    while (st.length) {
      var occ = occSet(st), found = -1;
      for (var i = 0; i < st.length; i++) {
        if (classicRayClear(R, C, st[i][0], st[i][1], st[i][2], occ, walls)) { found = i; break; }
      }
      if (found < 0) return null;
      path.push([st[found][0], st[found][1]]);
      st.splice(found, 1);
    }
    return path;
  }

  /* ---- ESCAPE ---- */
  // Find the arrow index (by cell) that can move; returns {i, exit} or null.
  function escapeMoveFor(R, C, arrows, walls, i) {
    walls = asWalls(walls);
    var occ = occSet(arrows), a = arrows[i];
    var nr = a[0] + DIRS[a[2]][0], nc = a[1] + DIRS[a[2]][1];
    if (!inb(R, C, nr, nc)) return { i: i, exit: true };
    if (occ.has(k(nr, nc)) || walls.has(k(nr, nc))) return null;
    return { i: i, exit: false };
  }
  function escapeApply(R, C, arrows, walls, i) {
    walls = asWalls(walls);
    var m = escapeMoveFor(R, C, arrows, walls, i);
    if (!m) return null;
    var ns = arrows.slice();
    if (m.exit) { ns.splice(i, 1); return ns; }
    var a = ns[i];
    ns[i] = [a[0] + DIRS[a[2]][0], a[1] + DIRS[a[2]][1], a[2]];
    return ns;
  }

  // Depth-first search with memoised states. Returns a list of tapped cells or null.
  function escapeSolve(R, C, arrows, walls, maxNodes) {
    maxNodes = maxNodes || 400000;
    var wset = wallSet(walls);
    var start = arrows.map(function (a) { return [a[0], a[1], a[2]]; }).sort(cmp);
    var visited = new Set(), path = [], nodes = 0, aborted = false;

    function stateKey(st) { var s = ""; for (var i = 0; i < st.length; i++) s += st[i][0] + "," + st[i][1] + "," + st[i][2] + ";"; return s; }

    function rec(st) {
      if (st.length === 0) return true;
      if (nodes++ > maxNodes) { aborted = true; return false; }
      var sk = stateKey(st);
      if (visited.has(sk)) return false;
      visited.add(sk);
      var occ = occSet(st);
      var moves = [];
      for (var i = 0; i < st.length; i++) {
        var nr = st[i][0] + DIRS[st[i][2]][0], nc = st[i][1] + DIRS[st[i][2]][1];
        if (!inb(R, C, nr, nc)) moves.push([i, 1]);
        else if (!occ.has(k(nr, nc)) && !wset.has(k(nr, nc))) moves.push([i, 0]);
      }
      moves.sort(function (a, b) { return b[1] - a[1]; }); // exits first
      for (var m = 0; m < moves.length; m++) {
        var idx = moves[m][0], isExit = moves[m][1];
        var r = st[idx][0], c = st[idx][1], d = st[idx][2];
        var ns;
        if (isExit) { ns = st.slice(); ns.splice(idx, 1); }
        else { ns = st.slice(); ns[idx] = [r + DIRS[d][0], c + DIRS[d][1], d]; ns.sort(cmp); }
        path.push([r, c]);
        if (rec(ns)) return true;
        path.pop();
        if (aborted) return false;
      }
      return false;
    }
    return rec(start) ? path.slice() : null;
  }

  root.APCore = {
    DIRS: DIRS, inb: inb,
    classicRayClear: classicRayClear, classicAnyMove: classicAnyMove,
    classicApply: classicApply, classicSolve: classicSolve,
    escapeMoveFor: escapeMoveFor, escapeApply: escapeApply, escapeSolve: escapeSolve
  };
})(typeof window !== "undefined" ? window : globalThis);
