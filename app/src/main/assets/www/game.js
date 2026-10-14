/* Arrow Puzzle Advanced v2 - UI + flow.
   Mechanics define puzzles; themes are pure rendering; modes are curated
   (mechanic x theme) presets, each with its own progress. Daily / weekly /
   monthly packs are drawn from the level pools, seeded by the device date, so
   fresh puzzles appear on schedule with no network. An optional online check
   can pull extra packs when a connection is available. */
(function () {
  "use strict";
  var C = window.APCore, DIRS = C.DIRS;

  var DIR_COLOR = { 0: "#5b8cff", 1: "#37d39b", 2: "#ff8a5b", 3: "#c77dff",
                    4: "#4dd0e1", 5: "#ffd166", 6: "#ff6b9d", 7: "#9ae66e" };
  var DIR_ANGLE = { 0: 0, 1: 90, 2: 180, 3: 270, 4: 45, 5: 135, 6: 225, 7: 315 };
  var FRUIT = { 0: "\uD83C\uDF4E", 1: "\uD83C\uDF4A", 2: "\uD83C\uDF4B", 3: "\uD83C\uDF47",
                4: "\uD83C\uDF49", 5: "\uD83C\uDF53", 6: "\uD83C\uDF52", 7: "\uD83C\uDF51" };
  var PIC = { 0: "\u2B50", 1: "\uD83D\uDC8E", 2: "\uD83D\uDD37", 3: "\uD83D\uDD36",
              4: "\uD83C\uDF19", 5: "\u26A1", 6: "\u2764\uFE0F", 7: "\uD83D\uDD3A" };

  var MECHANICS = {
    classic: { files: [["levels_classic.js", "LEVELS_CLASSIC"]], size: 6000, sol: false },
    escape: { files: [["levels_escape_1.js", "LEVELS_ESCAPE_1"], ["levels_escape_2.js", "LEVELS_ESCAPE_2"]], size: 6000, sol: true },
    multi: { files: [["levels_multi.js", "LEVELS_MULTI"]], size: 3000, sol: true }
  };
  var THEMES = {
    arrow: { name: "Arrows", glyph: "\u27A4", board: "dark", render: "tile" },
    round: { name: "Round colours", glyph: "\u25CF", board: "dark", render: "tile" },
    square: { name: "Square colours", glyph: "\u25A0", board: "dark", render: "tile" },
    dots: { name: "Dots", glyph: "\u25CF", board: "dark", render: "tile" },
    dotted: { name: "Dotted", glyph: "\u22EF", board: "dark", render: "tile" },
    snake: { name: "Snake", glyph: "\u301C", board: "dark", render: "tile" },
    fruits: { name: "Fruits", glyph: "\uD83C\uDF4E", board: "dark", render: "tile" },
    picture: { name: "Picture", glyph: "\u2B50", board: "dark", render: "tile" },
    black: { name: "Black arrows", glyph: "\u2B95", board: "light", render: "borderless", color: "#171717" },
    long: { name: "Long arrows", glyph: "\u27A1", board: "light", render: "long", color: "#8a6a4a" },
    neon: { name: "Neon arrows", glyph: "\u2B95", board: "dark", render: "borderless", color: "#66e0ff" }
  };
  var MODES = [
    { id: "classic_arrow", name: "Classic Arrows", mech: "classic", theme: "arrow", desc: "Tap an arrow to launch it off the board when its path is clear." },
    { id: "escape_arrow", name: "Escape", mech: "escape", theme: "arrow", desc: "Each tap slides an arrow one step; arrows leave the board at the edge." },
    { id: "round", name: "Round Colours", mech: "classic", theme: "round", desc: "Round colour tiles under the same clear-the-lane rules." },
    { id: "square", name: "Square Colours", mech: "classic", theme: "square", desc: "Square colour blocks that clear when their lane opens." },
    { id: "dots", name: "Dots", mech: "multi", theme: "dots", desc: "Tick a dot down with each tap; its last tap needs a clear path." },
    { id: "dotted", name: "Dotted Arrows", mech: "multi", theme: "dotted", desc: "Dashed arrows need two taps \u2014 the final one clears the lane." },
    { id: "snake", name: "Snake", mech: "escape", theme: "snake", desc: "Snake tiles slither one step per tap and leave at the edge." },
    { id: "fruits", name: "Fruits", mech: "classic", theme: "fruits", desc: "Fruit tiles that clear when their lane is open." },
    { id: "picture", name: "Picture Puzzles", mech: "classic", theme: "picture", desc: "Objects that look like pictures but play and clear like puzzles." },
    { id: "black", name: "Black Arrows", mech: "classic", theme: "black", desc: "Borderless black arrows on a light board." },
    { id: "black_escape", name: "Black Escape", mech: "escape", theme: "black", desc: "Borderless black arrows that slide and leave at the edge." },
    { id: "long", name: "Long Arrows", mech: "classic", theme: "long", desc: "Long thin arrows that clear when their lane opens." },
    { id: "long_escape", name: "Long Escape", mech: "escape", theme: "long", desc: "Long thin arrows that slide one step per tap." },
    { id: "neon", name: "Neon Arrows", mech: "classic", theme: "neon", desc: "Glowing borderless arrows on a dark board." }
  ];

  // Hard challenge packs, drawn from the toughest level ranges (all offline).
  var CHALLENGES = [
    { id: "expert_classic", name: "Expert Classic", theme: "arrow", desc: "The hardest classic layouts." },
    { id: "expert_escape", name: "Expert Escape", theme: "arrow", desc: "The hardest escape layouts." },
    { id: "multi_master", name: "Multi Master", theme: "dots", desc: "High-count multi tiles." },
    { id: "gauntlet", name: "Gauntlet", theme: "neon", desc: "A brutal mix of every mechanic." },
    { id: "daily_hard", name: "Daily Challenge", theme: "black", desc: "A fresh hard set every day." }
  ];
  var CHAPTER = 50, DAILY_COUNT = 50, WEEKLY_COUNT = 50, MONTHLY_COUNT = 100;
  var HINT_COST = 2000, MAX_COINS = 100, MAX_LIVES = 3;
  var DEFAULT_MANIFEST = "https://raw.githubusercontent.com/merry8989-uk/arrow-puzzle-advanced/main/packs/manifest.json";

  var state = {
    mode: "classic_arrow", data: {}, loading: {},
    progress: loadProgress(),
    current: null, arrows: [], nextId: 1, history: [], moves: 0, hintsUsed: 0,
    chapter: 1, locked: false, screen: "home", els: {}, geo: { S: 40, gap: 2, pad: 8 }
  };

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function toast(m) { var t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 1900); }
  function cmp(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function modeById(id) { for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i]; return MODES[0]; }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function dateKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function weekKey(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    var y = t.getUTCFullYear(), start = new Date(Date.UTC(y, 0, 1));
    return y + "-W" + pad(Math.ceil(((t - start) / 86400000 + 1) / 7));
  }
  function monthKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }

  /* ---------- progress ---------- */
  function blankProgress() {
    return { modes: {}, packs: { daily: { key: "", done: {} }, weekly: { key: "", done: {} }, monthly: { key: "", done: {} } },
             online: { packs: {}, checked: null }, coins: 0, challenges: {}, settings: { theme: "dark", sound: true, lives: true } };
  }
  function loadProgress() {
    try { var raw = localStorage.getItem("apa_progress_v2");
      if (raw) { var p = JSON.parse(raw);
        if (p && p.modes) {
          if (p.coins == null) p.coins = 0; if (!p.challenges) p.challenges = {};
          if (!p.settings) p.settings = { theme: "dark", sound: true, lives: true };
          if (p.settings.lives == null) p.settings.lives = true;
          return p; } } } catch (e) {}
    return blankProgress();
  }
  function saveProgress() { try { localStorage.setItem("apa_progress_v2", JSON.stringify(state.progress)); } catch (e) { toast("Storage full"); } }
  function modeProg(id) { return state.progress.modes[id] || (state.progress.modes[id] = { unlocked: 1, stars: {} }); }

  /* ---------- level data ---------- */
  function ensureLevels(mech, cb) {
    if (state.data[mech]) return cb();
    if (state.loading[mech]) { state.loading[mech].push(cb); return; }
    state.loading[mech] = [cb];
    var files = MECHANICS[mech].files, acc = [], i = 0;
    (function next() {
      if (i >= files.length) { state.data[mech] = acc; var q = state.loading[mech]; state.loading[mech] = null; (q || []).forEach(function (f) { f(); }); return; }
      var f = files[i++], s = document.createElement("script");
      s.src = f[0];
      s.onload = function () { acc = acc.concat(window[f[1]] || []); next(); };
      s.onerror = function () { toast("Could not load levels"); };
      document.head.appendChild(s);
    })();
  }
  function decodeSol(sol, cols) {
    if (!sol) return [];
    if (typeof sol !== "string") return sol;
    var out = [];
    for (var i = 0; i + 1 < sol.length; i += 2) { var code = parseInt(sol.substr(i, 2), 10); out.push([Math.floor(code / cols), code % cols]); }
    return out;
  }

  /* ---------- screens ---------- */
  function showScreen(n) {
    state.screen = n;
    if (n !== "game" && state.timer) { clearInterval(state.timer); state.timer = null; }
    ["home", "modes", "levels", "game", "daily", "packs", "pack", "settings", "challenges"].forEach(function (s) {
      $("screen-" + s).classList.toggle("active", s === n);
    });
    if (n === "home") renderHome();
    if (n === "modes") renderModes();
    if (n === "levels") renderLevels();
    if (n === "daily") renderDaily();
    if (n === "packs") renderPacks();
    if (n === "settings") renderSettings();
    if (n === "challenges") renderChallenges();
  }

  /* ---------- home ---------- */
  function renderHome() {
    var m = modeById(state.mode);
    $("home-mode-chip").textContent = m.name + " \u00b7 " + THEMES[m.theme].name;
    var lv = Math.min(modeProg(m.id).unlocked, MECHANICS[m.mech].size);
    $("continue-sub").textContent = "Level " + lv;
    $("home-total").textContent = totalLevels().toLocaleString("en-IN");
    $("modes-sub").textContent = MODES.length + " modes";
    var d = getPack("daily", DAILY_COUNT);
    var dn = Object.keys(d.done).length;
    $("daily-sub").textContent = dn + " / " + DAILY_COUNT;
    $("daily-mini").innerHTML = "<b>Daily goal</b><div class='progress'><div class='bar' style='width:" +
      Math.round(dn / DAILY_COUNT * 100) + "%'></div></div><b>" + dn + "/" + DAILY_COUNT + "</b>";
    $("packs-sub").textContent = "Weekly & Monthly";
    renderCoins();
  }
  function totalLevels() { var t = 0; for (var k in MECHANICS) t += MECHANICS[k].size; return t; }

  /* ---------- modes ---------- */
  function themeIcon(theme, d) {
    var m = THEMES[theme], color = DIR_COLOR[d === undefined ? 1 : d];
    if (theme === "fruits") return "<div class='glyph'>" + FRUIT[1] + "</div>";
    if (theme === "picture") return "<div class='glyph'>" + PIC[0] + "</div>";
    return "<div class='glyph' style='color:" + color + "'>" + m.glyph + "</div>";
  }
  function renderModes() {
    var box = $("mode-list"); box.innerHTML = "";
    MODES.forEach(function (m) {
      var p = modeProg(m.id), size = MECHANICS[m.mech].size;
      var solved = Object.keys(p.stars).length;
      var el = document.createElement("div");
      el.className = "mode-item" + (m.id === state.mode ? " sel" : "");
      el.innerHTML = "<div class='mi-icon' style='background:#0d1320;border:1px solid #243149'>" + themeIcon(m.theme) + "</div>" +
        "<div class='mi-text'><div class='mi-name'>" + m.name + "</div><div class='mi-desc'>" + m.desc + "</div>" +
        "<div class='mi-tag'>" + THEMES[m.theme].name + " \u00b7 " + solved + "/" + size + " solved</div></div>" +
        "<div class='mi-go'>\u203A</div>";
      el.onclick = function () { state.mode = m.id; state.chapter = Math.ceil(Math.min(p.unlocked, size) / CHAPTER); showScreen("levels"); };
      box.appendChild(el);
    });
  }

  /* ---------- levels ---------- */
  function renderLevels() {
    var m = modeById(state.mode), size = MECHANICS[m.mech].size;
    $("levels-mode").textContent = m.name;
    ensureLevels(m.mech, function () {
      var p = modeProg(m.id);
      $("levels-progress").textContent = Object.keys(p.stars).length + " / " + size + " solved";
      var start = (state.chapter - 1) * CHAPTER + 1;
      $("chap-title").innerHTML = "Chapter " + state.chapter + " \u00b7 " + start + "\u2013" + Math.min(start + CHAPTER - 1, size);
      var grid = $("level-grid"); grid.innerHTML = "";
      for (var i = 0; i < CHAPTER; i++) {
        var id = start + i; if (id > size) break;
        (function (id) {
          var b = document.createElement("button"), st = p.stars[id], unlocked = id <= p.unlocked;
          b.className = "level-btn" + (!unlocked ? " locked" : "") + (st ? " solved done" : "") + (id === p.unlocked ? " current" : "");
          b.innerHTML = "<span>" + id + "</span><span class='st'>" + (st ? "\u2605".repeat(st) : "&nbsp;") + "</span>";
          b.onclick = function () { if (unlocked) playCampaign(id); else toast("Solve earlier levels first"); };
          grid.appendChild(b);
        })(id);
      }
    });
  }

  /* ---------- packs ---------- */
  function getPack(kind, count) {
    var d = new Date();
    var key = kind === "daily" ? dateKey(d) : kind === "weekly" ? weekKey(d) : monthKey(d);
    var p = state.progress.packs[kind];
    if (p.key !== key) { p.key = key; p.done = {}; saveProgress(); }
    var onlyMode = kind === "monthly" ? MODES[hashStr(key) % MODES.length].id : null;
    return { key: key, items: buildPack(key, count, onlyMode), done: p.done, count: count, onlyMode: onlyMode };
  }
  function buildPack(seed, count, onlyMode) {
    var rng = mulberry32(hashStr(seed)), pool = onlyMode ? [modeById(onlyMode)] : MODES, items = [];
    for (var i = 0; i < count; i++) {
      var m = pool[Math.floor(rng() * pool.length)];
      items.push({ modeId: m.id, levelId: 1 + Math.floor(rng() * MECHANICS[m.mech].size) });
    }
    return items;
  }
  function packDone(kind, count) { var p = getPack(kind, count); return Object.keys(p.done).length; }

  function renderDaily() {
    var pk = getPack("daily", DAILY_COUNT), done = Object.keys(pk.done).length;
    $("daily-date").textContent = new Date().toDateString();
    $("daily-count").textContent = done + " / " + DAILY_COUNT + " complete";
    $("daily-bar").style.width = Math.round(done / DAILY_COUNT * 100) + "%";
    var box = $("daily-list"); box.innerHTML = "";
    pk.items.forEach(function (it, i) {
      var m = modeById(it.modeId), ok = !!pk.done[i];
      var el = document.createElement("div");
      el.className = "pack-row" + (ok ? " done" : "");
      el.innerHTML = "<div class='pr-no'>" + (i + 1) + "</div><div class='pr-txt'><div class='pr-mode'>" + m.name +
        "</div><div class='pr-meta'>level " + it.levelId + "</div></div>" + (ok ? "<div class='pr-check'>\u2713</div>" : "<div class='pr-go'>\u203A</div>");
      el.onclick = function () { playPackItem("daily", DAILY_COUNT, i); };
      box.appendChild(el);
    });
  }

  function renderPacks() {
    var w = getPack("weekly", WEEKLY_COUNT), wd = Object.keys(w.done).length;
    $("weekly-title").textContent = "This week (" + w.key + ")";
    $("weekly-count").textContent = wd + " / " + WEEKLY_COUNT + " complete";
    $("weekly-bar").style.width = Math.round(wd / WEEKLY_COUNT * 100) + "%";
    $("weekly-open").onclick = function () { openPackList("weekly", WEEKLY_COUNT, "Weekly pack", w.key); };

    var mo = getPack("monthly", MONTHLY_COUNT), md = Object.keys(mo.done).length;
    $("monthly-title").textContent = "This month (" + (mo.onlyMode ? modeById(mo.onlyMode).name : "mixed") + ")";
    $("monthly-count").textContent = md + " / " + MONTHLY_COUNT + " complete";
    $("monthly-bar").style.width = Math.round(md / MONTHLY_COUNT * 100) + "%";
    $("monthly-open").onclick = function () { openPackList("monthly", MONTHLY_COUNT, "Monthly pack", mo.key); };

    var online = state.progress.online.packs || {}, ids = Object.keys(online);
    $("upd-badge").textContent = ids.length ? (ids.length + " pack(s)") : "optional";
    var ob = $("online-packs");
    if (ob) {
      ob.innerHTML = "";
      ids.forEach(function (id) {
        var p = online[id], m = modeById(p.modeId || "classic_arrow");
        var done = Object.keys(p.done || {}).length, total = (p.levels || []).length;
        var card = document.createElement("div"); card.className = "pack-card";
        card.innerHTML = "<div class='pc-top'><span class='pc-t'>" + p.name + "</span><span class='pc-badge'>v" + p.version + "</span></div>" +
          "<div class='pack-stat'>" + done + " / " + total + " complete \u00b7 " + m.name + "</div>";
        var btn = document.createElement("button"); btn.className = "btn primary"; btn.textContent = "Open downloaded pack";
        btn.onclick = function () { openOnlinePack(id); };
        card.appendChild(btn); ob.appendChild(card);
      });
    }
  }

  function openOnlinePack(id) {
    var p = state.progress.online.packs[id]; if (!p) return;
    var m = modeById(p.modeId || "classic_arrow"), lv = p.levels || [];
    $("pack-title").textContent = p.name;
    $("pack-sub").textContent = lv.length + " levels \u00b7 v" + p.version;
    var box = $("pack-list"); box.innerHTML = "";
    lv.forEach(function (level, i) {
      var done = p.done && p.done[i];
      var el = document.createElement("div"); el.className = "pack-row" + (done ? " done" : "");
      el.innerHTML = "<div class='pr-no'>" + (i + 1) + "</div><div class='pr-txt'><div class='pr-mode'>" + m.name +
        "</div><div class='pr-meta'>" + level.rows + "\u00d7" + level.cols + " \u00b7 " + level.arrows.length + " tiles</div></div>" +
        (done ? "<div class='pr-check'>\u2713</div>" : "<div class='pr-go'>\u203A</div>");
      el.onclick = function () { playLevel(m.id, i, lv, { type: "online", packId: id, slot: i, count: lv.length }); };
      box.appendChild(el);
    });
    showScreen("pack");
  }

  function openPackList(kind, count, title, key) {
    var pk = getPack(kind, count), done = Object.keys(pk.done).length;
    $("pack-title").textContent = title;
    $("pack-sub").textContent = done + " / " + count + " complete \u00b7 " + key;
    var box = $("pack-list"); box.innerHTML = "";
    pk.items.forEach(function (it, i) {
      var m = modeById(it.modeId), ok = !!pk.done[i];
      var el = document.createElement("div");
      el.className = "pack-row" + (ok ? " done" : "");
      el.innerHTML = "<div class='pr-no'>" + (i + 1) + "</div><div class='pr-txt'><div class='pr-mode'>" + m.name +
        "</div><div class='pr-meta'>level " + it.levelId + "</div></div>" + (ok ? "<div class='pr-check'>\u2713</div>" : "<div class='pr-go'>\u203A</div>");
      el.onclick = function () { playPackItem(kind, count, i); };
      box.appendChild(el);
    });
    showScreen("pack");
  }

  /* ---------- play ---------- */
  function playCampaign(levelId) {
    var m = modeById(state.mode);
    ensureLevels(m.mech, function () { playLevel(m.id, levelId - 1, state.data[m.mech], { type: "campaign" }); });
  }
  function playPackItem(kind, count, slot) {
    var pk = getPack(kind, count), it = pk.items[slot], m = modeById(it.modeId);
    ensureLevels(m.mech, function () {
      playLevel(m.id, it.levelId - 1, state.data[m.mech], { type: "pack", kind: kind, count: count, slot: slot });
    });
  }
  function playLevel(modeId, index, levelsArr, ctx) {
    var m = modeById(modeId), lv = levelsArr[index];
    state.current = { modeId: modeId, index: index, levelsArr: levelsArr, ctx: ctx, level: lv };
    state.arrows = lv.arrows.map(function (a, i) { return { id: i + 1, r: a[0], c: a[1], d: a[2], need: a.length > 3 ? a[3] : 1 }; });
    state.nextId = lv.arrows.length + 1;
    state.history = []; state.moves = 0; state.hintsUsed = 0; state.locked = false;
    state.lives = MAX_LIVES; updateLives();
    state.startTime = Date.now(); resetZoom();
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function () { var s = Math.round((Date.now() - state.startTime) / 1000); var e = $("stat-time"); if (e) e.textContent = s + "s"; }, 500);
    state.solArr = decodeSol(lv.sol, lv.cols);
    $("game-level").textContent = ctx.type === "campaign" ? "Level " + (index + 1) : "Pack " + (ctx.slot + 1);
    $("game-mode").textContent = m.name;
    $("hint-note").textContent = m.mech === "classic" ? "Tap a tile whose lane to the edge is clear."
      : m.mech === "escape" ? "Tap a tile to slide it one step; tiles leave at the edge."
      : "Tap a tile to tick it down; its last tap must have a clear lane.";
    updateStats(); buildBoard(); showScreen("game");
  }
  function updateStats() {
    var lv = state.current.level;
    $("stat-moves").textContent = state.moves;
    $("stat-par").textContent = lv.par;
    var s = state.hintsUsed === 0 ? 3 : (state.hintsUsed <= 2 ? 2 : 1);
    $("stat-stars").innerHTML = "\u2605".repeat(s) + "\u2606".repeat(3 - s);
  }

  /* ---------- board ---------- */
  function computeGeo() {
    var lv = state.current.level, R = lv.rows, Cc = lv.cols, area = document.querySelector(".board-area");
    var availW = area.clientWidth - 16, availH = area.clientHeight - 16, gap = 2, pad = 8;
    var S = Math.floor(Math.min((availW - 2 * pad - (Cc - 1) * gap) / Cc, (availH - 2 * pad - (R - 1) * gap) / R));
    S = Math.max(18, Math.min(S, 78));
    state.geo = { S: S, gap: gap, pad: pad };
    return { R: R, Cc: Cc };
  }
  function cellX(c) { return state.geo.pad + c * (state.geo.S + state.geo.gap); }
  function cellY(r) { return state.geo.pad + r * (state.geo.S + state.geo.gap); }
  function tileInner(themeId, d, need) {
    var th = THEMES[themeId] || THEMES.arrow, c = DIR_COLOR[d], ang = DIR_ANGLE[d];
    var cue = "<svg class='cue' viewBox='0 0 24 24' style='transform:rotate(" + ang + "deg)'><path d='M12 2.4 L22 14.2 L15.4 14.2 L15.4 21.6 L8.6 21.6 L8.6 14.2 L2 14.2 Z' fill='rgba(10,14,22,.82)'/></svg>";
    var html;
    if (th.render === "borderless") {
      html = "<svg class='garrow' viewBox='0 0 24 24' style='transform:rotate(" + ang + "deg)'><path d='M12 1.6 L22.6 12.8 L16.7 12.8 L16.7 22.4 L7.3 22.4 L7.3 12.8 L1.4 12.8 Z' fill='" + th.color + "'/></svg>";
    } else if (th.render === "long") {
      html = "<svg class='glong' viewBox='0 0 24 24' style='transform:rotate(" + ang + "deg)'>" +
        "<line x1='12' y1='22.6' x2='12' y2='8' stroke='" + th.color + "' stroke-width='2.9' stroke-linecap='round'/>" +
        "<path d='M12 1 L18.6 10.2 L5.4 10.2 Z' fill='" + th.color + "'/></svg>";
    } else if (themeId === "fruits") html = "<div class='body' style='--c:" + c + "'></div><div class='glyph'>" + FRUIT[d] + "</div>" + cue;
    else if (themeId === "picture") html = "<div class='body' style='--c:" + c + "'></div><div class='glyph'>" + PIC[d] + "</div>" + cue;
    else if (themeId === "dotted") html = "<div class='body' style='--c:" + c + "'></div>" + cue;
    else html = "<div class='body' style='background:" + c + "'></div>" + cue;
    if (need && need > 1) html += "<div class='need'>" + need + "</div>";
    return html;
  }
  function buildBoard() {
    var lv = state.current.level, m = modeById(state.current.modeId);
    var g = computeGeo(), R = g.R, Cc = g.Cc, board = $("board");
    var W = 2 * state.geo.pad + Cc * state.geo.S + (Cc - 1) * state.geo.gap;
    var H = 2 * state.geo.pad + R * state.geo.S + (R - 1) * state.geo.gap;
    board.style.width = W + "px"; board.style.height = H + "px";
    board.style.setProperty("--s", state.geo.S + "px");
    board.className = "board board-" + ((THEMES[m.theme] && THEMES[m.theme].board) || "dark");
    board.innerHTML = ""; state.els = {};
    for (var r = 0; r < R; r++) for (var c = 0; c < Cc; c++) {
      var cell = document.createElement("div"); cell.className = "cellbg";
      cell.style.width = cell.style.height = state.geo.S + "px";
      cell.style.left = cellX(c) + "px"; cell.style.top = cellY(r) + "px"; board.appendChild(cell);
    }
    (lv.walls || []).forEach(function (w) {
      var el = document.createElement("div"); el.className = "wall";
      el.style.width = el.style.height = state.geo.S + "px";
      el.style.left = cellX(w[1]) + "px"; el.style.top = cellY(w[0]) + "px"; board.appendChild(el);
    });
    state.arrows.forEach(function (a) { createArrowEl(a, m.theme); });
  }
  function createArrowEl(a, theme) {
    var el = document.createElement("div");
    el.className = "arrow th-" + theme;
    el.style.width = el.style.height = state.geo.S + "px";
    el.style.transform = "translate(" + cellX(a.c) + "px," + cellY(a.r) + "px)";
    el.innerHTML = tileInner(theme, a.d, a.need);
    el.addEventListener("click", function () { onTap(a.id); });
    $("board").appendChild(el); state.els[a.id] = el;
  }
  function positionArrow(a) { var el = state.els[a.id]; if (el) el.style.transform = "translate(" + cellX(a.c) + "px," + cellY(a.r) + "px)"; }
  function updateNeed(a) {
    var el = state.els[a.id]; if (!el) return;
    var b = el.querySelector(".need");
    if (a.need > 1) { if (!b) { b = document.createElement("div"); b.className = "need"; el.appendChild(b); } b.textContent = a.need; }
    else if (b) b.parentNode.removeChild(b);
  }
  function flyOut(id, d) {
    var el = state.els[id]; if (!el) return;
    var t = el.style.transform.match(/-?[\d.]+/g), dr = DIRS[d][0], dc = DIRS[d][1];
    var x = parseFloat(t[0]) + dc * (state.geo.S + state.geo.gap) * (state.current.level.cols + 2);
    var y = parseFloat(t[1]) + dr * (state.geo.S + state.geo.gap) * (state.current.level.rows + 2);
    el.classList.add("fly"); el.style.transform = "translate(" + x + "px," + y + "px)";
    delete state.els[id];
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
  }
  function shake(id) { var el = state.els[id]; if (!el) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }

  function livesOn() { return !(state.progress.settings && state.progress.settings.lives === false); }
  function updateLives() {
    var e = $("stat-lives"); if (!e) return;
    if (!livesOn()) { e.innerHTML = "\u221E"; return; }
    var n = Math.max(0, state.lives == null ? MAX_LIVES : state.lives);
    e.innerHTML = "<span style='color:#ff5b6e'>" + "\u2665".repeat(n) + "</span>" +
      "<span style='color:#5a6478'>" + "\u2665".repeat(Math.max(0, MAX_LIVES - n)) + "</span>";
  }
  function loseLife(id) {
    shake(id);
    if (!livesOn()) return;
    state.lives = (state.lives == null ? MAX_LIVES : state.lives) - 1;
    updateLives();
    if (state.lives <= 0) {
      state.locked = true;
      toast("Out of lives \u2014 replaying this level");
      setTimeout(function () { restart(); }, 850);
    } else {
      toast(state.lives + (state.lives === 1 ? " life left" : " lives left"));
    }
  }

  function snapshot() { return { arrows: state.arrows.map(function (a) { return { id: a.id, r: a.r, c: a.c, d: a.d, need: a.need }; }), moves: state.moves, hintsUsed: state.hintsUsed, nextId: state.nextId }; }

  function onTap(id) {
    if (state.locked || state.swallow) return;
    var idx = state.arrows.findIndex(function (a) { return a.id === id; });
    if (idx < 0) return;
    var lv = state.current.level, mech = modeById(state.current.modeId).mech;
    var arr = state.arrows.map(function (a) { return [a.r, a.c, a.d, a.need]; });
    var tile = state.arrows[idx];
    var res = C.applyMove(mech, lv.rows, lv.cols, arr, lv.walls, idx);
    if (!res) { loseLife(id); return; }
    state.history.push(snapshot());
    state.moves++;
    if (mech === "escape") {
      var m = C.escapeMoveFor(lv.rows, lv.cols, arr, lv.walls, idx);
      if (m.exit) { state.arrows.splice(idx, 1); flyOut(tile.id, tile.d); }
      else { tile.r += DIRS[tile.d][0]; tile.c += DIRS[tile.d][1]; positionArrow(tile); }
    } else if (mech === "multi") {
      if (tile.need > 1) { tile.need -= 1; updateNeed(tile); }
      else { state.arrows.splice(idx, 1); flyOut(tile.id, tile.d); }
    } else {
      state.arrows.splice(idx, 1); flyOut(tile.id, tile.d);
    }
    updateStats();
    if (state.arrows.length === 0) setTimeout(winLevel, 430);
  }
  function rebuildArrows() {
    var theme = modeById(state.current.modeId).theme;
    Object.keys(state.els).forEach(function (k) { var e = state.els[k]; if (e.parentNode) e.parentNode.removeChild(e); });
    state.els = {}; state.arrows.forEach(function (a) { createArrowEl(a, theme); });
  }
  function undo() {
    if (!state.history.length) { toast("Nothing to undo"); return; }
    var s = state.history.pop();
    state.arrows = s.arrows; state.moves = s.moves; state.hintsUsed = s.hintsUsed; state.nextId = s.nextId;
    rebuildArrows(); updateStats();
  }
  function restart() { if (state.current) playLevel(state.current.modeId, state.current.index, state.current.levelsArr, state.current.ctx); }

  function winLevel() {
    var cur = state.current, lv = cur.level, id = cur.index + 1;
    var stars = state.hintsUsed === 0 ? 3 : (state.hintsUsed <= 2 ? 2 : 1);
    if (cur.ctx.type === "campaign") {
      var p = modeProg(cur.modeId), size = MECHANICS[modeById(cur.modeId).mech].size;
      if (!p.stars[id] || p.stars[id] < stars) p.stars[id] = stars;
      if (id < size && id + 1 > p.unlocked) p.unlocked = id + 1;
      if (id >= size) p.unlocked = size;
    } else if (cur.ctx.type === "pack") {
      var pk = getPack(cur.ctx.kind, cur.ctx.count); pk.done[cur.ctx.slot] = 1;
    } else if (cur.ctx.type === "online") {
      var op = state.progress.online.packs[cur.ctx.packId];
      if (op) { op.done = op.done || {}; op.done[cur.ctx.slot] = 1; }
    } else if (cur.ctx.type === "challenge") {
      var ch = state.progress.challenges[cur.ctx.cid] || (state.progress.challenges[cur.ctx.cid] = { done: {} });
      ch.done[cur.ctx.slot] = 1;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    var secs = Math.max(1, Math.round((Date.now() - (state.startTime || Date.now())) / 1000));
    var award = coinAward(stars, secs, state.moves, lv.par);
    state.progress.coins = (state.progress.coins || 0) + award;
    saveProgress(); renderCoins();
    fireworks(); firecracker();
    $("win-stars").innerHTML = "\u2605".repeat(stars) + "\u2606".repeat(3 - stars);
    $("win-title").textContent = cur.ctx.type === "campaign" ? "Level " + id + " complete" : "Puzzle complete";
    $("win-sub").textContent = "Solved in " + state.moves + " moves \u00b7 " + secs + "s";
    var wc = $("win-coins"); if (wc) wc.textContent = "+" + award + " coins";
    $("win-next").style.display = (cur.ctx.type === "campaign" ? id < MECHANICS[modeById(cur.modeId).mech].size : cur.ctx.slot + 1 < cur.ctx.count) ? "" : "none";
    $("win").classList.add("show");
  }
  function nextLevel() {
    var cur = state.current; $("win").classList.remove("show");
    if (cur.ctx.type === "campaign") { var size = MECHANICS[modeById(cur.modeId).mech].size; if (cur.index + 1 < size) playLevel(cur.modeId, cur.index + 1, cur.levelsArr, cur.ctx); else showScreen("levels"); }
    else if (cur.ctx.type === "pack") { if (cur.ctx.slot + 1 < cur.ctx.count) playPackItem(cur.ctx.kind, cur.ctx.count, cur.ctx.slot + 1); else showScreen(cur.ctx.kind === "daily" ? "daily" : "packs"); }
    else if (cur.ctx.type === "online") { var p = state.progress.online.packs[cur.ctx.packId]; if (cur.ctx.slot + 1 < cur.ctx.count) playLevel(modeById(p.modeId || "classic_arrow").id, cur.ctx.slot + 1, p.levels, { type: "online", packId: cur.ctx.packId, slot: cur.ctx.slot + 1, count: cur.ctx.count }); else showScreen("packs"); }
    else if (cur.ctx.type === "challenge") { if (cur.ctx.slot + 1 < cur.ctx.count) playChallengeItem(cur.ctx.cid, cur.ctx.slot + 1); else showScreen("challenges"); }
  }

  /* ---------- hint ---------- */
  function eqState(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1] || a[i][2] !== b[i][2]) return false; return true; }
  function hintCell() {
    var lv = state.current.level, mech = modeById(state.current.modeId).mech;
    var arr = state.arrows.map(function (a) { return [a.r, a.c, a.d, a.need]; });
    if (mech === "classic" || mech === "multi") { var i = C.hintIndex(mech, lv.rows, lv.cols, arr, lv.walls); return i >= 0 ? [arr[i][0], arr[i][1]] : null; }
    // escape: fast path along stored solution, else solver
    var sol = state.solArr || [], cur = arr.map(function (a) { return [a[0], a[1], a[2]]; }).sort(cmp);
    var st = lv.arrows.map(function (a) { return [a[0], a[1], a[2]]; }).sort(cmp);
    for (var j = 0; j < sol.length; j++) {
      if (eqState(st, cur)) return sol[j];
      var k = -1; for (var t = 0; t < st.length; t++) if (st[t][0] === sol[j][0] && st[t][1] === sol[j][1]) { k = t; break; }
      if (k < 0) break;
      var a = st[k], nr = a[0] + DIRS[a[2]][0], nc = a[1] + DIRS[a[2]][1];
      if (!C.inb(lv.rows, lv.cols, nr, nc)) st.splice(k, 1); else { st[k] = [nr, nc, a[2]]; st.sort(cmp); }
    }
    if (eqState(st, cur)) return null;
    var s = C.escapeSolve(lv.rows, lv.cols, cur, lv.walls, 250000);
    if (s && s.length) return s[0];
    for (var q = 0; q < arr.length; q++) if (C.escapeMoveFor(lv.rows, lv.cols, arr, lv.walls, q)) return [arr[q][0], arr[q][1]];
    return null;
  }
  function doHint() {
    if (state.locked || !state.current) return;
    var cell = hintCell(); if (!cell) { toast("No hint available here"); return; }
    if ((state.progress.coins || 0) < HINT_COST) { toast("A hint costs " + HINT_COST + " coins \u2014 you have " + (state.progress.coins || 0)); return; }
    state.progress.coins -= HINT_COST; saveProgress(); renderCoins();
    var a = state.arrows.find(function (x) { return x.r === cell[0] && x.c === cell[1]; }); if (!a) return;
    state.hintsUsed++; updateStats();
    var el = state.els[a.id]; if (el) { el.classList.remove("hintpulse"); void el.offsetWidth; el.classList.add("hintpulse"); }
    $("hint-note").textContent = "Hint: tap the glowing tile.";
  }

  /* ---------- coins ---------- */
  function coinAward(stars, secs, moves, par) {
    var c = stars * 28;                       // 28 / 56 / 84
    if (moves <= par) c += 8;                 // solved efficiently
    var target = Math.max(20, par * 3);       // target seconds
    if (secs <= target) c += 8; else if (secs <= target * 2) c += 4;
    return Math.min(MAX_COINS, Math.round(c));
  }
  function renderCoins() {
    var v = (state.progress.coins || 0);
    var a = $("home-coins"), b = $("stat-coins");
    if (a) a.textContent = v.toLocaleString("en-IN");
    if (b) b.textContent = v.toLocaleString("en-IN");
  }

  /* ---------- challenges ---------- */
  function hardItems(seed, modeId, from, to, count) {
    var rng = mulberry32(hashStr(seed)), items = [];
    var pool = [["classic_arrow", 5200, 6000], ["escape_arrow", 5200, 6000], ["dots", 2500, 3000]];
    for (var i = 0; i < count; i++) {
      if (modeId) items.push({ modeId: modeId, levelId: from + Math.floor(rng() * (to - from)) });
      else { var p = pool[Math.floor(rng() * pool.length)]; items.push({ modeId: p[0], levelId: p[1] + Math.floor(rng() * (p[2] - p[1])) }); }
    }
    return items;
  }
  function challengeItems(c) {
    if (c.id === "gauntlet") return hardItems("gauntlet", null, 0, 0, 60);
    if (c.id === "daily_hard") return hardItems("daily-" + dateKey(new Date()), null, 0, 0, 30);
    var r = { expert_classic: ["classic_arrow", 5200, 6000, 50], expert_escape: ["escape_arrow", 5200, 6000, 50], multi_master: ["dots", 2500, 3000, 50] }[c.id];
    return hardItems(c.id, r[0], r[1], r[2], r[3]);
  }
  function challengeDone(cid) { var ch = state.progress.challenges[cid]; return ch ? Object.keys(ch.done).length : 0; }
  function renderChallenges() {
    var box = $("challenge-list"); if (!box) return; box.innerHTML = "";
    CHALLENGES.forEach(function (c) {
      var items = challengeItems(c), done = challengeDone(c.id);
      var el = document.createElement("div"); el.className = "mode-item";
      el.innerHTML = "<div class='mi-icon' style='background:#0d1320;border:1px solid #243149'>" + themeIcon(c.theme) + "</div>" +
        "<div class='mi-text'><div class='mi-name'>" + c.name + "</div><div class='mi-desc'>" + c.desc + "</div>" +
        "<div class='mi-tag'>" + done + "/" + items.length + " cleared</div></div><div class='mi-go'>\u203A</div>";
      el.onclick = function () { openChallenge(c); };
      box.appendChild(el);
    });
  }
  function openChallenge(c) {
    var items = challengeItems(c), done = (state.progress.challenges[c.id] || {}).done || {};
    $("pack-title").textContent = c.name;
    $("pack-sub").textContent = Object.keys(done).length + " / " + items.length + " cleared";
    var box = $("pack-list"); box.innerHTML = "";
    items.forEach(function (it, i) {
      var m = modeById(it.modeId), ok = !!done[i];
      var el = document.createElement("div"); el.className = "pack-row" + (ok ? " done" : "");
      el.innerHTML = "<div class='pr-no'>" + (i + 1) + "</div><div class='pr-txt'><div class='pr-mode'>" + m.name +
        "</div><div class='pr-meta'>level " + it.levelId + "</div></div>" + (ok ? "<div class='pr-check'>\u2713</div>" : "<div class='pr-go'>\u203A</div>");
      el.onclick = function () { playChallengeItem(c.id, i); };
      box.appendChild(el);
    });
    showScreen("pack");
  }
  function playChallengeItem(cid, slot) {
    var c = null; for (var i = 0; i < CHALLENGES.length; i++) if (CHALLENGES[i].id === cid) c = CHALLENGES[i];
    var items = challengeItems(c), it = items[slot], m = modeById(it.modeId);
    ensureLevels(m.mech, function () { playLevel(m.id, it.levelId - 1, state.data[m.mech], { type: "challenge", cid: cid, slot: slot, count: items.length }); });
  }

  /* ---------- online updates (optional) ---------- */
  function checkUpdates() {
    var url = state.progress.online.manifestUrl || DEFAULT_MANIFEST;
    toast("Checking for new packs\u2026");
    fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (man) {
      var known = state.progress.online.packs || {};
      var packs = man.packs || [];
      var newer = packs.filter(function (p) { return !known[p.id] || known[p.id].version !== p.version; });
      state.progress.online.checked = new Date().toISOString(); saveProgress();
      if (!newer.length) { toast("You're up to date (" + packs.length + " packs)"); renderPacks(); return; }
      var p = newer[0];
      return fetch(p.url, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (data) {
        known[p.id] = { version: p.version, name: p.name, modeId: p.modeId || "classic_arrow", levels: data.levels || data };
        state.progress.online.packs = known; saveProgress();
        toast("Downloaded: " + p.name);
        renderPacks();
      });
    }).catch(function () { toast("Offline \u2014 bundled packs still work"); });
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var box = $("settings-modes"); box.innerHTML = "";
    MODES.forEach(function (m) {
      var b = document.createElement("button");
      b.className = "mode-opt" + (m.id === state.mode ? " selected" : "");
      b.innerHTML = "<div class='mo-title'>" + m.name + "</div><div class='mo-desc'>" + THEMES[m.theme].name + " \u00b7 " + m.desc + "</div>";
      b.onclick = function () { state.mode = m.id; renderSettings(); toast(m.name + " selected"); };
      box.appendChild(b);
    });
    $("content-info").textContent = totalLevels().toLocaleString("en-IN") + " bundled puzzles. Daily, weekly and monthly packs refresh automatically from your device date. Online check is optional.";
    var th = (state.progress.settings && state.progress.settings.theme) || "dark";
    document.querySelectorAll("#theme-seg .seg-btn").forEach(function (b) { b.classList.toggle("sel", b.getAttribute("data-theme") === th); });
    var st = $("sound-toggle");
    if (st) st.textContent = "Fireworks sound: " + ((state.progress.settings && state.progress.settings.sound === false) ? "Off" : "On");
    var lt = $("lives-toggle");
    if (lt) lt.textContent = "Lives: " + (livesOn() ? "3 per level" : "Relaxed (no limit)");
    var ci = $("coins-info");
    if (ci) ci.textContent = "You have " + (state.progress.coins || 0).toLocaleString("en-IN") + " coins. Earn up to 100 per puzzle; a hint costs 2000.";
  }

  /* ---------- app theme ---------- */
  function resolvedTheme() {
    var t = (state.progress.settings && state.progress.settings.theme) || "dark";
    if (t === "auto") { try { return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; } catch (e) { return "dark"; } }
    return t;
  }
  function applyTheme() {
    var r = resolvedTheme();
    document.documentElement.setAttribute("data-theme", r);
    var t = (state.progress.settings && state.progress.settings.theme) || "dark";
    var lbl = $("theme-sub");
    if (lbl) lbl.textContent = (t === "auto" ? "Auto (" + r + ")" : (r === "light" ? "White theme" : "Dark theme"));
  }

  /* ---------- zoom & pan ---------- */
  var zoom = { s: 1, x: 0, y: 0 }, drag = { on: false, moved: 0, x: 0, y: 0, pinch: 0, s0: 1 };
  function applyZoom() { var b = $("board"); if (b) b.style.transform = "translate(" + zoom.x + "px," + zoom.y + "px) scale(" + zoom.s + ")"; }
  function resetZoom() { zoom = { s: 1, x: 0, y: 0 }; applyZoom(); }
  function setZoom(s) { zoom.s = Math.max(0.6, Math.min(4, s)); clampPan(); applyZoom(); }
  function clampPan() {
    var b = $("board"); if (!b) return;
    var mx = 0.9 * b.offsetWidth * (zoom.s - 1) + 40, my = 0.9 * b.offsetHeight * (zoom.s - 1) + 40;
    zoom.x = Math.max(-mx, Math.min(mx, zoom.x)); zoom.y = Math.max(-my, Math.min(my, zoom.y));
  }
  function initZoom() {
    var area = $("board-area"); if (!area || area._zi) return; area._zi = true;
    function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
    area.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) { drag.pinch = dist(e.touches); drag.s0 = zoom.s; drag.moved = 99; }
      else if (e.touches.length === 1) { drag.on = true; drag.moved = 0; drag.x = e.touches[0].clientX; drag.y = e.touches[0].clientY; }
    }, { passive: true });
    area.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2) { if (drag.pinch) setZoom(drag.s0 * dist(e.touches) / drag.pinch); e.preventDefault(); }
      else if (e.touches.length === 1 && drag.on) {
        var dx = e.touches[0].clientX - drag.x, dy = e.touches[0].clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.touches[0].clientX; drag.y = e.touches[0].clientY;
        if (zoom.s > 1.01) { zoom.x += dx; zoom.y += dy; clampPan(); applyZoom(); e.preventDefault(); }
      }
    }, { passive: false });
    area.addEventListener("touchend", function () {
      if (drag.moved > 12) { state.swallow = true; setTimeout(function () { state.swallow = false; }, 60); }
      drag.on = false; drag.pinch = 0;
    });
    area.addEventListener("wheel", function (e) { setZoom(zoom.s * (e.deltaY < 0 ? 1.12 : 0.9)); e.preventDefault(); }, { passive: false });
    applyZoom();
  }

  /* ---------- fireworks + sound ---------- */
  function fireworks() {
    var cv = $("fx"); if (!cv) return;
    var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return;
    cv.width = window.innerWidth; cv.height = window.innerHeight; cv.style.display = "block";
    var parts = [], bursts = 0, t0 = performance.now(), colors = ["#ffd166", "#ff6b6b", "#5b8cff", "#37d39b", "#c77dff", "#4dd0e1", "#ffb703"];
    function burst(x, y, col) { for (var i = 0; i < 70; i++) { var a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 5; parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: col }); } }
    burst(cv.width * 0.5, cv.height * 0.34, colors[Math.floor(Math.random() * colors.length)]);
    (function loop(now) {
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.globalCompositeOperation = "lighter";
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.012;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.3, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (now - t0 < 2800) {
        if (Math.random() < 0.08 && bursts < 12) { bursts++; burst(Math.random() * cv.width, Math.random() * cv.height * 0.55, colors[Math.floor(Math.random() * colors.length)]); }
        requestAnimationFrame(loop);
      } else { cv.style.display = "none"; ctx.clearRect(0, 0, cv.width, cv.height); }
    })(t0);
  }
  function firecracker() {
    if (state.progress.settings && state.progress.settings.sound === false) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      state.actx = state.actx || new AC(); var ac = state.actx; if (ac.state === "suspended") ac.resume();
      var pops = 12 + Math.floor(Math.random() * 8);
      for (var i = 0; i < pops; i++) (function (i) {
        setTimeout(function () {
          var dur = 0.04 + Math.random() * 0.06, n = Math.floor(ac.sampleRate * dur);
          var buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
          for (var j = 0; j < n; j++) d[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / n, 3);
          var src = ac.createBufferSource(); src.buffer = buf;
          var f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1200 + Math.random() * 2600; f.Q.value = 0.7;
          var g = ac.createGain(); g.gain.value = 0.22;
          src.connect(f); f.connect(g); g.connect(ac.destination); src.start();
        }, i * 65 + Math.random() * 40);
      })(i);
    } catch (e) {}
  }

  /* ---------- wiring ---------- */
  function wire() {
    $("btn-continue").onclick = function () { var m = modeById(state.mode); playCampaign(Math.min(modeProg(m.id).unlocked, MECHANICS[m.mech].size)); };
    $("btn-modes").onclick = function () { showScreen("modes"); };
    $("btn-daily").onclick = function () { showScreen("daily"); };
    $("btn-packs").onclick = function () { showScreen("packs"); };
    $("btn-settings").onclick = function () { showScreen("settings"); };
    $("btn-challenges").onclick = function () { showScreen("challenges"); };
    $("pack-back").onclick = function () { var c = state.current; showScreen(c && c.ctx && c.ctx.type === "challenge" ? "challenges" : "packs"); };
    $("zoom-in").onclick = function () { setZoom(zoom.s * 1.25); };
    $("zoom-out").onclick = function () { setZoom(zoom.s / 1.25); };
    $("zoom-reset").onclick = resetZoom;
    document.querySelectorAll("#theme-seg .seg-btn").forEach(function (b) {
      b.onclick = function () {
        state.progress.settings.theme = b.getAttribute("data-theme");
        saveProgress(); applyTheme(); renderSettings(); toast("Theme: " + b.textContent);
      };
    });
    $("sound-toggle").onclick = function () {
      var cur = state.progress.settings.sound !== false;
      state.progress.settings.sound = !cur; saveProgress(); renderSettings();
      toast("Fireworks sound " + (!cur ? "on" : "off"));
    };
    $("lives-toggle").onclick = function () {
      var cur = livesOn();
      state.progress.settings.lives = !cur; saveProgress(); renderSettings(); updateLives();
      toast("Lives " + (!cur ? "on \u2014 3 per level" : "off \u2014 relaxed"));
    };
    document.querySelectorAll("[data-nav]").forEach(function (b) { b.onclick = function () { showScreen(b.getAttribute("data-nav")); }; });
    $("chap-prev").onclick = function () { if (state.chapter > 1) { state.chapter--; renderLevels(); } };
    $("chap-next").onclick = function () { var size = MECHANICS[modeById(state.mode).mech].size; if (state.chapter < Math.ceil(size / CHAPTER)) { state.chapter++; renderLevels(); } };
    $("game-back").onclick = function () { var c = state.current; if (!c) return showScreen("home"); if (c.ctx.type === "campaign") showScreen("levels"); else if (c.ctx.type === "challenge") showScreen("challenges"); else if (c.ctx.kind === "daily") showScreen("daily"); else showScreen("pack"); };
    $("btn-undo").onclick = undo;
    $("btn-hint").onclick = doHint;
    $("btn-restart").onclick = restart;
    $("win-next").onclick = nextLevel;
    $("win-replay").onclick = function () { $("win").classList.remove("show"); restart(); };
    $("upd-check").onclick = checkUpdates;
    $("btn-check-updates").onclick = checkUpdates;
    $("btn-reset").onclick = function () { if (confirm("Reset all progress for every mode and pack?")) { state.progress = blankProgress(); saveProgress(); toast("Progress reset"); } };
    window.addEventListener("resize", function () { if (state.screen === "game" && state.current) buildBoard(); });
    window.androidBack = function () {
      if (state.screen === "game") { $("game-back").onclick(); return true; }
      if (state.screen === "levels") { showScreen("modes"); return true; }
      if (state.screen === "pack") { showScreen("packs"); return true; }
      if (state.screen !== "home") { showScreen("home"); return true; }
      return false;
    };
  }

  if (window.__APA_DEBUG) {
    window.__APA = { state: state, MODES: MODES, MECHANICS: MECHANICS, THEMES: THEMES, CHALLENGES: CHALLENGES,
      playLevel: playLevel, playCampaign: playCampaign, playPackItem: playPackItem, playChallengeItem: playChallengeItem,
      openChallenge: openChallenge, challengeItems: challengeItems, onTap: onTap, doHint: doHint, undo: undo, restart: restart,
      showScreen: showScreen, ensureLevels: ensureLevels, hintCell: hintCell, getPack: getPack, buildPack: buildPack,
      coinAward: coinAward, applyTheme: applyTheme, setZoom: setZoom, resetZoom: resetZoom,
      dateKey: dateKey, weekKey: weekKey, monthKey: monthKey };
  }

  wire();
  applyTheme(); initZoom();
  try { matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () { if (((state.progress.settings && state.progress.settings.theme) || "dark") === "auto") applyTheme(); }); } catch (e) {}
  ensureLevels("classic", function () {});
  showScreen("home");
})();
