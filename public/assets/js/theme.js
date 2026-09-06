/* Theme picker — same skins and mix/lum derivation as radio.omarchy.org. */
(function () {
  "use strict";

  var STORE_KEY = "omafied-skin";

  var SKINS = [
    { name: "green",            bg: "#0a0b0a", fg: "#e7e6e0", ac: "#5ef2a0", bd: "#23261f" },
    { name: "daylight",         bg: "#f7f6f2", fg: "#23231f", ac: "#2f9e63", bd: "#dedbd2" },
    { name: "catppuccin",       bg: "#1e1e2e", fg: "#cdd6f4", ac: "#89b4fa", bd: "#45475a" },
    { name: "catppuccin latte", bg: "#eff1f5", fg: "#4c4f69", ac: "#1e66f5", bd: "#ccd0da" },
    { name: "ethereal",         bg: "#060b1e", fg: "#ffcead", ac: "#7d82d9", bd: "#252e56" },
    { name: "everforest",       bg: "#2d353b", fg: "#d3c6aa", ac: "#7fbbb3", bd: "#3d484d" },
    { name: "flexoki light",    bg: "#fffcf0", fg: "#100f0f", ac: "#205ea6", bd: "#cecdc3" },
    { name: "gruvbox",          bg: "#282828", fg: "#d4be98", ac: "#7daea3", bd: "#504945" },
    { name: "hackerman",        bg: "#0b0c16", fg: "#ddf7ff", ac: "#82fb9c", bd: "#1f253a" },
    { name: "kanagawa",         bg: "#1f1f28", fg: "#dcd7ba", ac: "#dcd7ba", bd: "#363646" },
    { name: "last horizon",     bg: "#0c0b0c", fg: "#e2dddc", ac: "#b59790", bd: "#584e51" },
    { name: "lumon",            bg: "#16242d", fg: "#f2fcff", ac: "#8bc9eb", bd: "#243d56" },
    { name: "lupine",           bg: "#fafafa", fg: "#000000", ac: "#3264eb", bd: "#d0d0d0" },
    { name: "matte black",      bg: "#121212", fg: "#bebebe", ac: "#e68e0d", bd: "#2a2a2a" },
    { name: "miasma",           bg: "#222222", fg: "#c2c2b0", ac: "#78824b", bd: "#383838" },
    { name: "nord",             bg: "#2e3440", fg: "#d8dee9", ac: "#81a1c1", bd: "#434c5e" },
    { name: "osaka jade",       bg: "#111c18", fg: "#f7e8b2", ac: "#509475", bd: "#32473b" },
    { name: "retro 82",         bg: "#05182e", fg: "#f6dcac", ac: "#faa968", bd: "#134e5a" },
    { name: "ristretto",        bg: "#2c2525", fg: "#e6d9db", ac: "#f38d70", bd: "#403e41" },
    { name: "rose pine",        bg: "#faf4ed", fg: "#575279", ac: "#56949f", bd: "#dfdad9" },
    { name: "solitude",         bg: "#101315", fg: "#a5aeb4", ac: "#798186", bd: "#343d41" },
    { name: "tokyo night",      bg: "#1a1b26", fg: "#c0caf5", ac: "#7aa2f7", bd: "#292e42" },
    { name: "vantablack",       bg: "#000000", fg: "#ffffff", ac: "#8d8d8d", bd: "#1a1a1a" },
    { name: "white",            bg: "#ffffff", fg: "#000000", ac: "#6e6e6e", bd: "#c0c0c0" }
  ];

  var skin = 0;
  var open = false;

  try {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      var si = SKINS.findIndex(function (k) { return k.name === saved; });
      if (si >= 0) skin = si;
    }
  } catch (e) { /* private mode */ }

  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.slice(i, i + 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.slice(i, i + 2), 16); });
    return "#" + pa.map(function (v, i) {
      return Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0");
    }).join("");
  }

  function lum(hex) {
    var p = [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16) / 255; });
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  }

  function theme(i) {
    var t = SKINS[i] || SKINS[0];
    var bg = t.bg, fg = t.fg, ac = t.ac, bd = t.bd;
    var light = lum(bg) > 0.5;
    var deep = light ? "#ffffff" : "#000000";
    var lcd = mix(bg, deep, light ? 0.55 : 0.5);
    var st = light
      ? {
          works: "#1d8a4e",
          partial: "#9a6f00",
          fiddly: "#c45c12",
          broken: "#c62828",
          avoid: "#8b4040",
          unknown: "#5a5e58"
        }
      : {
          works: "#5ef2a0",
          partial: "#f5c542",
          fiddly: "#f08a3a",
          broken: "#ff6b6b",
          avoid: "#c47a7a",
          unknown: "#9aa19a"
        };
    return {
      name: t.name, bg: bg, fg: fg, ac: ac, bd: bd,
      bdF: mix(bd, bg, 0.55),
      c2: mix(fg, bg, 0.30),
      c3: mix(fg, bg, 0.48),
      rowOn: mix(ac, bg, 0.88),
      rowHov: mix(fg, bg, 0.93),
      trk: mix(fg, bg, 0.85),
      lcd: lcd,
      acFg: lum(ac) > 0.55 ? mix(bg, "#000000", 0.35) : "#ffffff",
      acHi: mix(ac, light ? "#000000" : "#ffffff", 0.3),
      g1: mix(ac, light ? bg : fg, light ? 0.22 : 0.38),
      g2: mix(ac, lcd, 0.62),
      stWorks: st.works,
      stPartial: st.partial,
      stFiddly: st.fiddly,
      stBroken: st.broken,
      stAvoid: st.avoid,
      stUnknown: st.unknown,
      light: light
    };
  }

  function $(id) { return document.getElementById(id); }

  function apply() {
    var k = theme(skin);
    var r = document.documentElement.style;
    r.setProperty("--bg", k.bg);
    r.setProperty("--fg", k.fg);
    r.setProperty("--ac", k.ac);
    r.setProperty("--bd", k.bd);
    r.setProperty("--bdF", k.bdF);
    r.setProperty("--c2", k.c2);
    r.setProperty("--c3", k.c3);
    r.setProperty("--rowOn", k.rowOn);
    r.setProperty("--rowHov", k.rowHov);
    r.setProperty("--trk", k.trk);
    r.setProperty("--lcd", k.lcd);
    r.setProperty("--acFg", k.acFg);
    r.setProperty("--acHi", k.acHi);
    r.setProperty("--g1", k.g1);
    r.setProperty("--g2", k.g2);
    r.setProperty("--st-works", k.stWorks);
    r.setProperty("--st-partial", k.stPartial);
    r.setProperty("--st-fiddly", k.stFiddly);
    r.setProperty("--st-broken", k.stBroken);
    r.setProperty("--st-avoid", k.stAvoid);
    r.setProperty("--st-unknown", k.stUnknown);
    r.setProperty("--scan", "repeating-linear-gradient(180deg, " +
      (k.light ? "rgba(0,0,0,.055) 0 1px, transparent 1px 4px"
               : "rgba(0,0,0,.42) 0 2px, transparent 2px 4px") + ")");

    var name = $("skinName");
    if (name) name.textContent = k.name;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", k.bg);

    var menu = $("themeMenu");
    if (menu) {
      Array.prototype.forEach.call(menu.children, function (li, i) {
        li.classList.toggle("is-on", i === skin);
        var b = li.querySelector("button");
        if (b) b.setAttribute("aria-selected", i === skin ? "true" : "false");
      });
    }

    try { localStorage.setItem(STORE_KEY, k.name); } catch (e) { /* private mode */ }
  }

  function closeMenu() {
    open = false;
    var menu = $("themeMenu");
    var btn = $("themeBtn");
    var caret = $("themeCaret");
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (caret) caret.textContent = "▼";
  }

  function openMenu() {
    open = true;
    var menu = $("themeMenu");
    var btn = $("themeBtn");
    var caret = $("themeCaret");
    if (menu) menu.hidden = false;
    if (btn) btn.setAttribute("aria-expanded", "true");
    if (caret) caret.textContent = "▲";
  }

  function buildMenu() {
    var menu = $("themeMenu");
    if (!menu) return;
    var frag = document.createDocumentFragment();
    SKINS.forEach(function (d, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "none");
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "option");
      b.innerHTML =
        '<span class="sw" aria-hidden="true">' +
          '<span style="background:' + d.bg + '"></span>' +
          '<span style="background:' + d.ac + '"></span>' +
          '<span style="background:' + d.fg + '"></span>' +
        '</span><span class="menu-name"></span>';
      b.querySelector(".menu-name").textContent = d.name;
      b.addEventListener("click", function () {
        skin = i;
        closeMenu();
        apply();
      });
      li.appendChild(b);
      frag.appendChild(li);
    });
    menu.appendChild(frag);
  }

  function init() {
    buildMenu();
    apply();
    var btn = $("themeBtn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (open) closeMenu();
        else openMenu();
      });
    }
    document.addEventListener("click", function () { if (open) closeMenu(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) closeMenu();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
