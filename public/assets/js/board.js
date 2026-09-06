/* Browse + filter the laptop table. */
(function () {
  "use strict";

  var STATUSES = ["works", "partial", "broken", "unknown"];
  var TIERS = ["daily", "works", "fiddly", "avoid"];
  var BUILDS = ["tank", "solid", "meh", "unknown"];
  var RUN_FIELDS = ["wifi", "gpu", "sleep", "audio"];
  var LIKE_FIELDS = [
    { key: "battery", label: "batt" },
    { key: "build", label: "build" },
    { key: "fingerprint", label: "fp" }
  ];

  var laptops = [];
  var openId = null;

  var $ = function (id) { return document.getElementById(id); };

  function setStatus(s) {
    var el = $("status");
    if (el) el.textContent = s;
  }

  function esc(s) {
    return String(s == null ? "" : s);
  }

  function stClass(s) {
    return STATUSES.indexOf(s) >= 0 ? "st st-" + s : "st st-unknown";
  }

  function tierClass(s) {
    return TIERS.indexOf(s) >= 0 ? "tier tier-" + s : "tier tier-works";
  }

  function chipClass(key, value) {
    if (key === "build") {
      return BUILDS.indexOf(value) >= 0 ? "st st-build-" + value : "st st-unknown";
    }
    return stClass(value);
  }

  function money(n) {
    if (n == null || n === "") return null;
    return "$" + String(n);
  }

  function matches(row, q, brand, filters) {
    if (brand && row.brand !== brand) return false;
    if (filters.tier && row.tier !== filters.tier) return false;
    if (filters.battery && row.battery !== filters.battery) return false;
    for (var i = 0; i < RUN_FIELDS.length; i++) {
      var f = RUN_FIELDS[i];
      if (filters[f] && row[f] !== filters[f]) return false;
    }
    if (!q) return true;
    var hay = [
      row.brand, row.model, row.year, row.notes, row.reporter,
      row.tier, row.sweet_spot, row.quirks, row.uniques, row.build
    ]
      .map(function (v) { return v == null ? "" : String(v); })
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function uniqueBrands(rows) {
    var seen = Object.create(null);
    var out = [];
    rows.forEach(function (r) {
      if (r.brand && !seen[r.brand]) {
        seen[r.brand] = true;
        out.push(r.brand);
      }
    });
    out.sort(function (a, b) { return a.localeCompare(b); });
    return out;
  }

  function fillBrandSelect(rows) {
    var sel = $("brandFilter");
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = "";
    var all = document.createElement("option");
    all.value = "";
    all.textContent = "all";
    sel.appendChild(all);
    uniqueBrands(rows).forEach(function (b) {
      var o = document.createElement("option");
      o.value = b;
      o.textContent = b;
      sel.appendChild(o);
    });
    if (current) sel.value = current;
  }

  function query() {
    return {
      q: ($("q") && $("q").value || "").trim().toLowerCase(),
      brand: $("brandFilter") && $("brandFilter").value || "",
      filters: {
        tier: $("tierFilter") && $("tierFilter").value || "",
        battery: $("batteryFilter") && $("batteryFilter").value || "",
        wifi: $("wifiFilter") && $("wifiFilter").value || "",
        gpu: $("gpuFilter") && $("gpuFilter").value || "",
        sleep: $("sleepFilter") && $("sleepFilter").value || "",
        audio: $("audioFilter") && $("audioFilter").value || ""
      }
    };
  }

  function cell(cls, text) {
    var s = document.createElement("span");
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function chip(cls, label, value) {
    var wrap = document.createElement("span");
    wrap.className = "chip";
    var lbl = document.createElement("span");
    lbl.className = "chip-lbl";
    lbl.textContent = label;
    var val = document.createElement("span");
    val.className = cls;
    val.textContent = value || "unknown";
    wrap.appendChild(lbl);
    wrap.appendChild(val);
    return wrap;
  }

  function voteBox(r) {
    var wrap = document.createElement("span");
    wrap.className = "vote";
    wrap.setAttribute("data-vote", r.id);

    var up = document.createElement("button");
    up.type = "button";
    up.className = "vote-b";
    up.setAttribute("data-dir", "1");
    up.setAttribute("aria-label", "agree with this take");
    up.textContent = "▲";

    var n = document.createElement("span");
    n.className = "vote-n";
    n.textContent = String((r.agree_up || 0) - (r.agree_down || 0));

    var down = document.createElement("button");
    down.type = "button";
    down.className = "vote-b";
    down.setAttribute("data-dir", "-1");
    down.setAttribute("aria-label", "disagree with this take");
    down.textContent = "▼";

    wrap.appendChild(up);
    wrap.appendChild(n);
    wrap.appendChild(down);
    return wrap;
  }

  function costLine(r) {
    var neu = money(r.cost);
    var used = money(r.used_cost);
    if (!neu && !used) return "—";
    if (neu && used) return neu + " / used " + used;
    if (neu) return neu;
    return "used " + used;
  }

  function paint() {
    var q = query();
    var rows = laptops.filter(function (r) {
      return matches(r, q.q, q.brand, q.filters);
    });

    var list = $("rows");
    var empty = $("empty");
    var note = $("count");
    list.innerHTML = "";

    if (!rows.length) {
      empty.hidden = false;
      empty.textContent = laptops.length ? "no laptops match" : "no reports yet";
      if (note) note.textContent = "0 reports";
      return;
    }
    empty.hidden = true;
    if (note) {
      note.textContent = rows.length + " report" + (rows.length === 1 ? "" : "s") +
        (rows.length !== laptops.length ? " · " + laptops.length + " total" : "");
    }

    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      var li = document.createElement("li");
      li.className = "row" + (openId === r.id ? " is-open" : "");
      li.dataset.id = r.id;
      li.tabIndex = 0;
      li.setAttribute("role", "button");
      li.setAttribute("aria-expanded", openId === r.id ? "true" : "false");

      var main = document.createElement("div");
      main.className = "row-main";
      main.appendChild(cell("c-brand", esc(r.brand)));
      main.appendChild(cell("c-model", esc(r.model)));
      main.appendChild(cell("c-year", r.year == null ? "—" : String(r.year)));
      main.appendChild(cell("c-tier " + tierClass(r.tier), r.tier || "works"));
      main.appendChild(cell("c-sweet", r.sweet_spot || "—"));
      main.appendChild(voteBox(r));
      li.appendChild(main);

      var chips = document.createElement("div");
      chips.className = "row-chips";

      var run = document.createElement("span");
      run.className = "chip-group";
      RUN_FIELDS.forEach(function (f) {
        run.appendChild(chip("c-" + f + " " + stClass(r[f]), f, r[f] || "unknown"));
      });
      chips.appendChild(run);

      var like = document.createElement("span");
      like.className = "chip-group";
      LIKE_FIELDS.forEach(function (f) {
        like.appendChild(chip("c-" + f.key + " " + chipClass(f.key, r[f.key]), f.label, r[f.key] || "unknown"));
      });
      chips.appendChild(like);

      chips.appendChild(cell("c-cost", costLine(r)));
      chips.appendChild(cell("c-reporter", r.reporter || "anon"));
      li.appendChild(chips);
      frag.appendChild(li);

      var detail = document.createElement("li");
      detail.className = "row-full";

      function block(label, text) {
        if (!text) return;
        var h = document.createElement("p");
        h.className = "detail-k";
        h.textContent = label;
        var p = document.createElement("p");
        p.textContent = text;
        detail.appendChild(h);
        detail.appendChild(p);
      }

      block("sweet spot", r.sweet_spot);
      block("quirks", r.quirks);
      block("uniques", r.uniques);
      block("notes", r.notes);
      if (!r.sweet_spot && !r.quirks && !r.uniques && !r.notes) {
        var emptyP = document.createElement("p");
        emptyP.textContent = "no notes";
        detail.appendChild(emptyP);
      }

      var meta = document.createElement("p");
      meta.className = "meta";
      var when = "";
      if (r.created_at) {
        var d = new Date(r.created_at);
        if (!isNaN(d.getTime())) {
          when = d.getUTCFullYear() + "-" +
            String(d.getUTCMonth() + 1).padStart(2, "0") + "-" +
            String(d.getUTCDate()).padStart(2, "0");
        }
      }
      meta.textContent = [
        r.reporter ? "reporter " + r.reporter : "anonymous",
        when,
        r.year ? "year " + r.year : null,
        costLine(r) !== "—" ? costLine(r) : null,
        (r.agree_up || 0) + " up / " + (r.agree_down || 0) + " down"
      ].filter(Boolean).join(" · ");
      detail.appendChild(meta);
      frag.appendChild(detail);
    });
    list.appendChild(frag);
  }

  function toggle(id) {
    openId = openId === id ? null : id;
    paint();
  }

  function applyVote(id, laptop) {
    laptops = laptops.map(function (row) {
      return row.id === id ? laptop : row;
    });
    paint();
  }

  function vote(id, direction) {
    setStatus("voting");
    fetch("/api/laptops/" + encodeURIComponent(id) + "/vote", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ direction: direction })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok || !res.data || !res.data.laptop) {
          setStatus((res.data && res.data.error) || "vote failed");
          return;
        }
        applyVote(id, res.data.laptop);
        setStatus("ready");
      })
      .catch(function () {
        setStatus("vote failed");
      });
  }

  function load() {
    setStatus("loading");
    fetch("/api/laptops", { headers: { accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      })
      .then(function (data) {
        laptops = (data && data.laptops) || [];
        fillBrandSelect(laptops);
        paint();
        setStatus("ready");
      })
      .catch(function () {
        laptops = [];
        paint();
        setStatus("could not load reports");
      });
  }

  function onReady() {
    ["q", "brandFilter", "tierFilter", "batteryFilter", "wifiFilter", "gpuFilter", "sleepFilter", "audioFilter"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", paint);
      el.addEventListener("change", paint);
    });

    $("rows").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-vote] .vote-b");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        var box = btn.closest("[data-vote]");
        var dir = Number(btn.getAttribute("data-dir"));
        if (box && box.getAttribute("data-vote") && (dir === 1 || dir === -1)) {
          vote(box.getAttribute("data-vote"), dir);
        }
        return;
      }
      var row = e.target.closest(".row");
      if (!row || !row.dataset.id) return;
      toggle(row.dataset.id);
    });
    $("rows").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest(".row");
      if (!row || !row.dataset.id) return;
      if (e.target.closest(".vote-b")) return;
      e.preventDefault();
      toggle(row.dataset.id);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA" && document.activeElement.tagName !== "SELECT") {
        e.preventDefault();
        var q = $("q");
        if (q) q.focus();
      }
    });

    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();
})();
