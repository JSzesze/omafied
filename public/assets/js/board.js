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
  var COL_COUNT_WIDE = 9;
  var COL_COUNT_NARROW = 3;

  var laptops = [];
  var openId = null;

  var $ = function (id) { return document.getElementById(id); };

  function setStatus(s) {
    var el = $("status");
    if (el) el.textContent = s;
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

  function runText(value) {
    if (!value || value === "unknown") return "—";
    return value;
  }

  function costLine(r) {
    var neu = money(r.cost);
    var used = money(r.used_cost);
    if (!neu && !used) return "—";
    if (neu && used) return neu + " / used " + used;
    if (neu) return neu;
    return "used " + used;
  }

  function visibleColCount() {
    return window.matchMedia("(max-width: 720px)").matches ? COL_COUNT_NARROW : COL_COUNT_WIDE;
  }

  function reportedOn(r) {
    if (!r.created_at) return "";
    var d = new Date(r.created_at);
    if (isNaN(d.getTime())) return "";
    return d.getUTCFullYear() + "-" +
      String(d.getUTCMonth() + 1).padStart(2, "0") + "-" +
      String(d.getUTCDate()).padStart(2, "0");
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

  function modelCell(r, open) {
    var td = document.createElement("td");
    td.className = "c-model";
    td.scope = "row";

    var mark = document.createElement("span");
    mark.className = "expand-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = open ? "▾" : "▸";

    var stack = document.createElement("span");
    stack.className = "model-stack";

    var name = document.createElement("span");
    name.className = "model-name";
    name.textContent = r.model || "—";

    var meta = document.createElement("span");
    meta.className = "model-meta";
    meta.textContent = [r.brand, r.year].filter(Boolean).join(" · ");

    stack.appendChild(name);
    if (meta.textContent) stack.appendChild(meta);
    td.appendChild(mark);
    td.appendChild(stack);
    return td;
  }

  function priceCell(r) {
    var td = document.createElement("td");
    td.className = "c-price";
    var neu = money(r.cost);
    var used = money(r.used_cost);
    if (!neu && !used) {
      td.textContent = "—";
      return td;
    }
    if (neu) {
      var a = document.createElement("span");
      a.className = "price-new";
      a.textContent = neu;
      td.appendChild(a);
    }
    if (used) {
      var b = document.createElement("span");
      b.className = "price-used";
      b.textContent = "used " + used;
      td.appendChild(b);
    }
    return td;
  }

  function pair(label, value, valueClass) {
    var item = document.createElement("div");
    item.className = "detail-pair";
    var dt = document.createElement("dt");
    dt.textContent = label;
    var dd = document.createElement("dd");
    if (valueClass) dd.className = valueClass;
    dd.textContent = value;
    item.appendChild(dt);
    item.appendChild(dd);
    return item;
  }

  function prose(label, text) {
    if (!text) return null;
    var wrap = document.createElement("div");
    wrap.className = "detail-block";
    var h = document.createElement("p");
    h.className = "detail-k";
    h.textContent = label;
    var p = document.createElement("p");
    p.className = "detail-v";
    p.textContent = text;
    wrap.appendChild(h);
    wrap.appendChild(p);
    return wrap;
  }

  function detailRow(r, open) {
    var tr = document.createElement("tr");
    tr.className = "row-detail" + (open ? " is-open" : "");
    tr.id = "detail-" + r.id;
    if (!open) tr.hidden = true;

    var td = document.createElement("td");
    td.colSpan = visibleColCount();

    var pin = document.createElement("div");
    pin.className = "detail-pin";

    var head = document.createElement("div");
    head.className = "detail-head";
    var tier = document.createElement("span");
    tier.className = "detail-tier " + tierClass(r.tier);
    tier.textContent = r.tier || "works";
    var ident = document.createElement("p");
    ident.className = "detail-ident";
    ident.textContent = [r.brand, r.model, r.year].filter(Boolean).join(" · ");
    head.appendChild(tier);
    head.appendChild(ident);
    pin.appendChild(head);

    var dl = document.createElement("dl");
    dl.className = "detail-dl";
    RUN_FIELDS.forEach(function (f) {
      dl.appendChild(pair(f, r[f] || "unknown", stClass(r[f])));
    });
    LIKE_FIELDS.forEach(function (f) {
      dl.appendChild(pair(f.label, r[f.key] || "unknown", chipClass(f.key, r[f.key])));
    });
    dl.appendChild(pair("price", costLine(r)));
    pin.appendChild(dl);

    var proseWrap = document.createElement("div");
    proseWrap.className = "detail-prose";
    var blocks = [
      prose("sweet spot", r.sweet_spot),
      prose("quirks", r.quirks),
      prose("uniques", r.uniques),
      prose("notes", r.notes)
    ].filter(Boolean);
    blocks.forEach(function (b) { proseWrap.appendChild(b); });
    if (!blocks.length) {
      var emptyP = document.createElement("p");
      emptyP.className = "detail-v";
      emptyP.textContent = "no notes";
      proseWrap.appendChild(emptyP);
    }
    pin.appendChild(proseWrap);

    var voteLine = document.createElement("div");
    voteLine.className = "detail-vote";
    voteLine.appendChild(voteBox(r));
    var counts = document.createElement("span");
    counts.className = "detail-vote-n";
    counts.textContent = (r.agree_up || 0) + " up / " + (r.agree_down || 0) + " down";
    voteLine.appendChild(counts);
    pin.appendChild(voteLine);

    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = [
      r.reporter ? "reporter " + r.reporter : "anonymous",
      reportedOn(r),
      r.year ? "year " + r.year : null
    ].filter(Boolean).join(" · ");
    pin.appendChild(meta);

    td.appendChild(pin);
    tr.appendChild(td);
    return tr;
  }

  function collapsedRow(r, open) {
    var tr = document.createElement("tr");
    tr.className = "row" + (open ? " is-open" : "");
    tr.dataset.id = r.id;
    tr.tabIndex = 0;
    tr.setAttribute("aria-expanded", open ? "true" : "false");
    tr.setAttribute("aria-controls", "detail-" + r.id);

    tr.appendChild(modelCell(r, open));

    var tier = document.createElement("td");
    tier.className = "c-tier " + tierClass(r.tier);
    tier.textContent = r.tier || "works";
    tr.appendChild(tier);

    var sweet = document.createElement("td");
    sweet.className = "c-sweet";
    sweet.textContent = r.sweet_spot || "—";
    if (r.sweet_spot) sweet.title = r.sweet_spot;
    tr.appendChild(sweet);

    RUN_FIELDS.forEach(function (f) {
      var cell = document.createElement("td");
      cell.className = "c-run " + stClass(r[f]);
      cell.textContent = runText(r[f]);
      tr.appendChild(cell);
    });

    tr.appendChild(priceCell(r));

    var voteTd = document.createElement("td");
    voteTd.className = "c-vote";
    voteTd.appendChild(voteBox(r));
    tr.appendChild(voteTd);

    return tr;
  }

  function paint() {
    var q = query();
    var rows = laptops.filter(function (r) {
      return matches(r, q.q, q.brand, q.filters);
    });

    var list = $("rows");
    var empty = $("empty");
    var note = $("count");
    var wrap = $("tableWrap");
    list.innerHTML = "";

    if (!rows.length) {
      empty.hidden = false;
      empty.textContent = laptops.length ? "no laptops match" : "no reports yet";
      if (wrap) wrap.hidden = true;
      if (note) note.textContent = "0 reports";
      return;
    }
    empty.hidden = true;
    if (wrap) wrap.hidden = false;
    if (note) {
      note.textContent = rows.length + " report" + (rows.length === 1 ? "" : "s") +
        (rows.length !== laptops.length ? " · " + laptops.length + " total" : "") +
        " · expand a row for detail";
    }

    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      var open = openId === r.id;
      frag.appendChild(collapsedRow(r, open));
      frag.appendChild(detailRow(r, open));
    });
    list.appendChild(frag);
  }

  function toggle(id) {
    openId = openId === id ? null : id;
    paint();
    if (!openId) return;
    var el = document.getElementById("detail-" + openId);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
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
      var row = e.target.closest("tr.row");
      if (!row || !row.dataset.id) return;
      toggle(row.dataset.id);
    });
    $("rows").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest("tr.row");
      if (!row || !row.dataset.id) return;
      if (e.target.closest(".vote-b")) return;
      e.preventDefault();
      toggle(row.dataset.id);
    });

    window.addEventListener("resize", function () {
      var n = visibleColCount();
      var cells = document.querySelectorAll(".row-detail td");
      for (var i = 0; i < cells.length; i++) cells[i].colSpan = n;
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
