/* Arrow Puzzle Advanced - UI + game flow */
(function () {
  "use strict";
  var C = window.APCore;
  var DIRS = C.DIRS;
  var CHAPTER = 50;
  var TOTAL_PER_MODE = 6000;

  var DIR_COLOR = { 0: "#5b8cff", 1: "#37d39b", 2: "#ff8a5b", 3: "#c77dff",
                    4: "#4dd0e1", 5: "#ffd166", 6: "#ff6b9d", 7: "#9ae66e" };
  var DIR_ANGLE = { 0: 0, 1: 90, 2: 180, 3: 270, 4: 45, 5: 135, 6: 225, 7: 315 };
  var ARROW_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2.4 L22 14.2 L15.4 14.2 L15.4 21.6 L8.6 21.6 L8.6 14.2 L2 14.2 Z"/></svg>';

  var state = {
    mode: "classic",
    data: { classic: null, escape: null },
    loading: { classic: null, escape: null },
    progress: loadProgress(),
    level: null,
    arrows: [],
    nextId: 1,
    history: [],
    moves: 0,
    hintsUsed: 0,
    chapter: 1,
    locked: false,
    screen: "home",
    els: {} // id -> element
  };

  // ---------- progress ----------
  function loadProgress() {
    var d = { classic: { unlocked: 1, stars: {} }, escape: { unlocked: 1, stars: {} } };
    try {
      var raw = localStorage.getItem("apa_progress_v1");
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.classic && p.escape) d = p;
      }
    } catch (e) {}
    return d;
  }
  function saveProgress() {
    try { localStorage.setItem("apa_progress_v1", JSON.stringify(state.progress)); } catch (e) {}
  }
  function prog() { return state.progress[state.mode]; }

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 1600);
  }
  function cmp(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; }
  function inb(R, Cc, r, c) { return r >= 0 && r < R && c >= 0 && c < Cc; }

  // ---------- screens ----------
  function showScreen(name) {
    state.screen = name;
    ["home", "levels", "game", "settings"].forEach(function (s) {
      $("screen-" + s).classList.toggle("active", s === name);
    });
    if (name === "home") refreshHome();
    if (name === "levels") renderLevels();
    if (name === "settings") refreshSettings();
  }

  // ---------- level data ----------
  function ensureLevels(mode, cb) {
    if (state.data[mode]) return cb();
    if (state.loading[mode]) { state.loading[mode].push(cb); return; }
    state.loading[mode] = [cb];
    var s = document.createElement("script");
    s.src = mode === "classic" ? "levels_classic.js" : "levels_escape.js";
    s.onload = function () {
      state.data[mode] = window[mode === "classic" ? "LEVELS_CLASSIC" : "LEVELS_ESCAPE"];
      var q = state.loading[mode]; state.loading[mode] = null;
      (q || []).forEach(function (f) { f(); });
    };
    s.onerror = function () { toast("Could not load levels"); };
    document.head.appendChild(s);
  }

  // ---------- home ----------
  function refreshHome() {
    $("home-mode-chip").textContent = state.mode === "classic" ? "Classic" : "Escape";
    var lvl = Math.min(prog().unlocked, TOTAL_PER_MODE);
    $("continue-sub").textContent = "Level " + lvl;
    $("home-total").textContent = (TOTAL_PER_MODE * 2).toLocaleString("en-IN");
  }

  // ---------- level select ----------
  function renderLevels() {
    $("levels-mode").textContent = state.mode === "classic" ? "Classic" : "Escape";
    ensureLevels(state.mode, function () {
      var solved = Object.keys(prog().stars).length;
      $("levels-progress").textContent = solved + " / " + TOTAL_PER_MODE + " solved";
      var start = (state.chapter - 1) * CHAPTER + 1;
      $("chap-title").innerHTML = "Chapter " + state.chapter + " &middot; levels " + start + "&ndash;" + (start + CHAPTER - 1);
      var grid = $("level-grid"); grid.innerHTML = "";
      for (var i = 0; i < CHAPTER; i++) {
        var id = start + i;
        if (id > TOTAL_PER_MODE) break;
        (function (id) {
          var b = document.createElement("button");
          b.className = "level-btn";
          var st = prog().stars[id];
          var unlocked = id <= prog().unlocked;
          if (!unlocked) b.classList.add("locked");
          if (st) { b.classList.add("solved", "done"); }
          if (id === prog().unlocked) b.classList.add("current");
          b.innerHTML = '<span>' + id + '</span><span class="st">' +
            (st ? "&#9733;".repeat(st) : "&nbsp;") + '</span>';
          b.onclick = function () { if (unlocked) openLevel(id); else toast("Solve earlier levels first"); };
          grid.appendChild(b);
        })(id);
      }
    });
  }

  // ---------- game ----------
  function openLevel(id) {
    ensureLevels(state.mode, function () {
      var arr = state.data[state.mode];
      var lv = arr[id - 1];
      state.level = lv;
      state.arrows = lv.arrows.map(function (a, i) { return { id: i + 1, r: a[0], c: a[1], d: a[2] }; });
      state.nextId = lv.arrows.length + 1;
      state.history = []; state.moves = 0; state.hintsUsed = 0; state.locked = false;
      $("game-level").textContent = "Level " + id;
      $("game-mode").textContent = state.mode === "classic" ? "Classic" : "Escape";
      $("hint-note").textContent = state.mode === "classic"
        ? "Tap an arrow with a clear path to the edge."
        : "Tap an arrow to slide it one step. Arrows leave at the edge.";
      updateStats();
      buildBoard();
      showScreen("game");
    });
  }

  function updateStats() {
    $("stat-moves").textContent = state.moves;
    $("stat-par").textContent = state.level.par;
    var s = state.hintsUsed === 0 ? 3 : (state.hintsUsed <= 2 ? 2 : 1);
    $("stat-stars").innerHTML = "&#9733;".repeat(s) + "&#9734;".repeat(3 - s);
  }

  var geo = { S: 40, gap: 2, pad: 8 };

  function computeGeo() {
    var lv = state.level, R = lv.rows, Cc = lv.cols;
    var area = document.querySelector(".board-area");
    var availW = area.clientWidth - 16, availH = area.clientHeight - 16;
    var gap = 2, pad = 8;
    var S = Math.floor(Math.min((availW - 2 * pad - (Cc - 1) * gap) / Cc,
                                (availH - 2 * pad - (R - 1) * gap) / R));
    S = Math.max(18, Math.min(S, 78));
    geo = { S: S, gap: gap, pad: pad };
    return { R: R, Cc: Cc };
  }

  function cellX(c) { return geo.pad + c * (geo.S + geo.gap); }
  function cellY(r) { return geo.pad + r * (geo.S + geo.gap); }

  function buildBoard() {
    var lv = state.level;
    var d = computeGeo(), R = d.R, Cc = d.Cc;
    var board = $("board");
    var W = 2 * geo.pad + Cc * geo.S + (Cc - 1) * geo.gap;
    var H = 2 * geo.pad + R * geo.S + (R - 1) * geo.gap;
    board.style.width = W + "px"; board.style.height = H + "px";
    board.innerHTML = "";
    state.els = {};
    // background cells
    for (var r = 0; r < R; r++) for (var c = 0; c < Cc; c++) {
      var cell = document.createElement("div");
      cell.className = "cellbg";
      cell.style.width = cell.style.height = geo.S + "px";
      cell.style.left = cellX(c) + "px"; cell.style.top = cellY(r) + "px";
      board.appendChild(cell);
    }
    // walls
    (lv.walls || []).forEach(function (w) {
      var el = document.createElement("div");
      el.className = "wall";
      el.style.width = el.style.height = geo.S + "px";
      el.style.left = cellX(w[1]) + "px"; el.style.top = cellY(w[0]) + "px";
      board.appendChild(el);
    });
    // arrows
    state.arrows.forEach(function (a) { createArrowEl(a); });
  }

  function createArrowEl(a) {
    var el = document.createElement("div");
    el.className = "arrow";
    el.style.width = el.style.height = geo.S + "px";
    el.style.transform = "translate(" + cellX(a.c) + "px," + cellY(a.r) + "px)";
    el.style.left = "0"; el.style.top = "0";
    var tile = document.createElement("div");
    tile.className = "tile";
    tile.style.background = DIR_COLOR[a.d];
    var svgWrap = document.createElement("div");
    svgWrap.innerHTML = ARROW_SVG;
    var svg = svgWrap.firstChild;
    svg.style.transform = "rotate(" + DIR_ANGLE[a.d] + "deg)";
    svg.querySelector("path").setAttribute("fill", "rgba(10,14,22,.82)");
    el.appendChild(tile); el.appendChild(svg);
    el.addEventListener("click", function () { onTap(a.id); });
    $("board").appendChild(el);
    state.els[a.id] = el;
  }

  function positionArrow(a) {
    var el = state.els[a.id];
    if (el) el.style.transform = "translate(" + cellX(a.c) + "px," + cellY(a.r) + "px)";
  }

  function flyOut(id, d) {
    var el = state.els[id];
    if (!el) return;
    var dr = DIRS[d][0], dc = DIRS[d][1];
    var x = parseFloat(el.style.transform.match(/-?[\d.]+/g)[0]) + dc * (geo.S + geo.gap) * (state.level.cols + 2);
    var y = parseFloat(el.style.transform.match(/-?[\d.]+/g)[1]) + dr * (geo.S + geo.gap) * (state.level.rows + 2);
    el.classList.add("fly");
    el.style.transform = "translate(" + x + "px," + y + "px)";
    delete state.els[id];
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
  }

  function shake(id) {
    var el = state.els[id];
    if (!el) return;
    el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
  }

  function snapshot() {
    return { arrows: state.arrows.map(function (a) { return { id: a.id, r: a.r, c: a.c, d: a.d }; }),
             moves: state.moves, hintsUsed: state.hintsUsed, nextId: state.nextId };
  }

  function onTap(id) {
    if (state.locked) return;
    var idx = state.arrows.findIndex(function (a) { return a.id === id; });
    if (idx < 0) return;
    var R = state.level.rows, Cc = state.level.cols, walls = state.level.walls;
    var arr = state.arrows.map(function (a) { return [a.r, a.c, a.d]; });
    var moved = state.arrows[idx];
    if (state.mode === "classic") {
      var ns = C.classicApply(R, Cc, arr, walls, idx);
      if (!ns) { shake(id); return; }
      state.history.push(snapshot());
      state.arrows.splice(idx, 1);
      state.moves++;
      updateStats();
      flyOut(moved.id, moved.d);
    } else {
      var m = C.escapeMoveFor(R, Cc, arr, walls, idx);
      if (!m) { shake(id); return; }
      state.history.push(snapshot());
      if (m.exit) { state.arrows.splice(idx, 1); flyOut(moved.id, moved.d); }
      else { moved.r += DIRS[moved.d][0]; moved.c += DIRS[moved.d][1]; positionArrow(moved); }
      state.moves++;
      updateStats();
    }
    if (state.arrows.length === 0) setTimeout(winLevel, 420);
  }

  function rebuildArrows() {
    Object.keys(state.els).forEach(function (k) { var e = state.els[k]; if (e.parentNode) e.parentNode.removeChild(e); });
    state.els = {};
    state.arrows.forEach(function (a) { createArrowEl(a); });
  }

  function undo() {
    if (!state.history.length) { toast("Nothing to undo"); return; }
    var s = state.history.pop();
    state.arrows = s.arrows; state.moves = s.moves; state.hintsUsed = s.hintsUsed; state.nextId = s.nextId;
    rebuildArrows(); updateStats();
  }

  function restart() {
    if (!state.level) return;
    openLevel(state.level.id);
  }

  function winLevel() {
    var id = state.level.id;
    var stars = state.hintsUsed === 0 ? 3 : (state.hintsUsed <= 2 ? 2 : 1);
    var p = prog();
    if (!p.stars[id] || p.stars[id] < stars) p.stars[id] = stars;
    if (id + 1 > p.unlocked && id < TOTAL_PER_MODE) p.unlocked = id + 1;
    if (id === TOTAL_PER_MODE) p.unlocked = TOTAL_PER_MODE;
    saveProgress();
    $("win-stars").innerHTML = "&#9733;".repeat(stars) + "&#9734;".repeat(3 - stars);
    $("win-title").textContent = "Level " + id + " complete";
    $("win-sub").textContent = "Solved in " + state.moves + " moves (par " + state.level.par + ")";
    $("win-next").style.display = id < TOTAL_PER_MODE ? "" : "none";
    $("win").classList.add("show");
  }

  // ---------- hint ----------
  function eqState(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1] || a[i][2] !== b[i][2]) return false;
    return true;
  }
  function hintCell() {
    var R = state.level.rows, Cc = state.level.cols, walls = state.level.walls;
    var arr = state.arrows.map(function (a) { return [a.r, a.c, a.d]; });
    if (state.mode === "classic") {
      var i = C.classicAnyMove(R, Cc, arr, walls);
      return i >= 0 ? [arr[i][0], arr[i][1]] : null;
    }
    // escape: fast path along the stored solution, then the solver
    var sol = state.level.sol || [];
    var cur = arr.slice().sort(cmp);
    var st = state.level.arrows.map(function (a) { return [a[0], a[1], a[2]]; }).sort(cmp);
    for (var j = 0; j < sol.length; j++) {
      if (eqState(st, cur)) return sol[j];
      var k = -1;
      for (var t = 0; t < st.length; t++) if (st[t][0] === sol[j][0] && st[t][1] === sol[j][1]) { k = t; break; }
      if (k < 0) break;
      var a = st[k], nr = a[0] + DIRS[a[2]][0], nc = a[1] + DIRS[a[2]][1];
      if (!inb(R, Cc, nr, nc)) st.splice(k, 1); else { st[k] = [nr, nc, a[2]]; st.sort(cmp); }
    }
    if (eqState(st, cur)) return null;
    var s = C.escapeSolve(R, Cc, arr, walls, 250000);
    if (s && s.length) return s[0];
    for (var q = 0; q < arr.length; q++) if (C.escapeMoveFor(R, Cc, arr, walls, q)) return [arr[q][0], arr[q][1]];
    return null;
  }
  function doHint() {
    if (state.locked || !state.level) return;
    var cell = hintCell();
    if (!cell) { toast("No hint available here"); return; }
    var a = state.arrows.find(function (x) { return x.r === cell[0] && x.c === cell[1]; });
    if (!a) return;
    state.hintsUsed++; updateStats();
    var el = state.els[a.id];
    if (el) { el.classList.remove("hintpulse"); void el.offsetWidth; el.classList.add("hintpulse"); }
    $("hint-note").textContent = "Hint: tap the glowing arrow.";
  }

  // ---------- settings ----------
  function refreshSettings() {
    document.querySelectorAll(".mode-opt").forEach(function (b) {
      b.classList.toggle("selected", b.getAttribute("data-mode") === state.mode);
    });
  }
  function setMode(mode) {
    state.mode = mode;
    refreshHome(); refreshSettings();
    toast(mode === "classic" ? "Classic mode" : "Escape mode");
  }

  // ---------- wiring ----------
  function wire() {
    $("btn-continue").onclick = function () { openLevel(Math.min(prog().unlocked, TOTAL_PER_MODE)); };
    $("btn-levels").onclick = function () { state.chapter = Math.ceil(Math.min(prog().unlocked, TOTAL_PER_MODE) / CHAPTER); showScreen("levels"); };
    $("btn-settings").onclick = function () { showScreen("settings"); };
    document.querySelectorAll("[data-nav]").forEach(function (b) {
      b.onclick = function () { showScreen(b.getAttribute("data-nav")); };
    });
    $("chap-prev").onclick = function () { if (state.chapter > 1) { state.chapter--; renderLevels(); } };
    $("chap-next").onclick = function () { if (state.chapter < Math.ceil(TOTAL_PER_MODE / CHAPTER)) { state.chapter++; renderLevels(); } };
    $("levels-mode-toggle").onclick = function () {
      setMode(state.mode === "classic" ? "escape" : "classic");
      state.chapter = Math.ceil(Math.min(prog().unlocked, TOTAL_PER_MODE) / CHAPTER);
      renderLevels();
    };
    $("btn-undo").onclick = undo;
    $("btn-hint").onclick = doHint;
    $("btn-restart").onclick = restart;
    $("game-restart-top").onclick = restart;
    $("win-next").onclick = function () {
      $("win").classList.remove("show");
      var n = state.level.id + 1;
      if (n <= TOTAL_PER_MODE) openLevel(n); else showScreen("levels");
    };
    $("win-replay").onclick = function () { $("win").classList.remove("show"); restart(); };
    document.querySelectorAll(".mode-opt").forEach(function (b) {
      b.onclick = function () { setMode(b.getAttribute("data-mode")); };
    });
    $("btn-reset").onclick = function () {
      if (confirm("Reset all progress for both modes?")) {
        state.progress = { classic: { unlocked: 1, stars: {} }, escape: { unlocked: 1, stars: {} } };
        saveProgress(); toast("Progress reset");
      }
    };
    window.addEventListener("resize", function () { if (state.screen === "game" && state.level) { buildBoard(); } });
    window.androidBack = function () {
      if (state.screen === "game") { showScreen("levels"); return true; }
      if (state.screen === "levels" || state.screen === "settings") { showScreen("home"); return true; }
      return false;
    };
  }

  if (window.__APA_DEBUG) {
    window.__APA = { state: state, openLevel: openLevel, onTap: onTap, doHint: doHint,
                     undo: undo, restart: restart, showScreen: showScreen, setMode: setMode,
                     ensureLevels: ensureLevels, hintCell: hintCell };
  }

  wire();
  ensureLevels("classic", function () {});
  showScreen("home");
})();
