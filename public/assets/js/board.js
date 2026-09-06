/* Browse + filter the laptop table. */
(function () {
  "use strict";

  var STATUSES = ["works", "partial", "broken", "unknown"];
  var FIELDS = ["wifi", "gpu", "sleep", "audio"];

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

  function matches(row, q, brand, filters) {
    if (brand && row.brand !== brand) return false;
    for (var i = 0; i < FIELDS.length; i++) {
      var f = FIELDS[i];
      if (filters[f] && row[f] !== filters[f]) return false;
    }
    if (!q) return true;
    var hay = [row.brand, row.model, row.year, row.notes, row.reporter]
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
        wifi: $("wifiFilter") && $("wifiFilter").value || "",
        gpu: $("gpuFilter") && $("gpuFilter").value || "",
        sleep: $("sleepFilter") && $("sleepFilter").value || "",
        audio: $("audioFilter") && $("audioFilter").value || ""
      }
    };
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

      function cell(cls, text) {
        var s = document.createElement("span");
        s.className = cls;
        s.textContent = text;
        return s;
      }

      li.appendChild(cell("c-brand", esc(r.brand)));
      li.appendChild(cell("c-model", esc(r.model)));
      li.appendChild(cell("c-year", r.year == null ? "—" : String(r.year)));

      FIELDS.forEach(function (f) {
        var s = cell("c-" + f + " " + stClass(r[f]), r[f] || "unknown");
        li.appendChild(s);
      });

      li.appendChild(cell("c-notes", r.notes || "—"));
      li.appendChild(cell("c-reporter", r.reporter || "anon"));
      frag.appendChild(li);

      var detail = document.createElement("li");
      detail.className = "row-full";
      var p = document.createElement("p");
      p.textContent = r.notes || "no notes";
      detail.appendChild(p);
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
        r.year ? "year " + r.year : null
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
    ["q", "brandFilter", "wifiFilter", "gpuFilter", "sleepFilter", "audioFilter"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", paint);
      el.addEventListener("change", paint);
    });

    $("rows").addEventListener("click", function (e) {
      var row = e.target.closest(".row");
      if (!row || !row.dataset.id) return;
      toggle(row.dataset.id);
    });
    $("rows").addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest(".row");
      if (!row || !row.dataset.id) return;
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
