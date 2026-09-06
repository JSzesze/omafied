/* Live submit — no auth in v1. */
(function () {
  "use strict";

  var SEG_FIELDS = ["wifi", "gpu", "sleep", "audio", "tier", "battery", "fingerprint", "build"];

  var $ = function (id) { return document.getElementById(id); };

  function setStatus(s) {
    var el = $("status");
    if (el) el.textContent = s;
  }

  function msg(text, kind) {
    var el = $("formMsg");
    if (!el) return;
    el.textContent = text;
    el.className = "form-msg" + (kind ? " is-" + kind : "");
  }

  function selected(field, fallback) {
    var on = document.querySelector('[data-field="' + field + '"].is-on');
    return on ? on.getAttribute("data-value") : fallback;
  }

  function optionalInt(id) {
    var raw = $(id).value.trim();
    if (raw === "") return null;
    var n = Number(raw);
    return n;
  }

  function payload() {
    return {
      brand: $("brand").value,
      model: $("model").value,
      year: optionalInt("year"),
      wifi: selected("wifi", "unknown"),
      gpu: selected("gpu", "unknown"),
      sleep: selected("sleep", "unknown"),
      audio: selected("audio", "unknown"),
      notes: $("notes").value,
      reporter: $("reporter").value,
      tier: selected("tier", "works"),
      battery: selected("battery", "unknown"),
      fingerprint: selected("fingerprint", "unknown"),
      build: selected("build", "unknown"),
      quirks: $("quirks").value,
      uniques: $("uniques").value,
      cost: optionalInt("cost"),
      used_cost: optionalInt("used_cost"),
      sweet_spot: $("sweet_spot").value
    };
  }

  function wireSegs() {
    SEG_FIELDS.forEach(function (field) {
      var wrap = document.querySelector('[data-seg="' + field + '"]');
      if (!wrap) return;
      wrap.addEventListener("click", function (e) {
        var b = e.target.closest(".seg-b");
        if (!b) return;
        Array.prototype.forEach.call(wrap.querySelectorAll(".seg-b"), function (x) {
          x.classList.toggle("is-on", x === b);
        });
      });
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    var body = payload();
    if (!body.brand.trim() || !body.model.trim()) {
      msg("brand and model are required", "err");
      setStatus("invalid");
      return;
    }
    if (body.year != null && (isNaN(body.year) || !Number.isInteger(body.year))) {
      msg("year must be an integer", "err");
      setStatus("invalid");
      return;
    }
    if (body.cost != null && (isNaN(body.cost) || !Number.isInteger(body.cost))) {
      msg("cost must be an integer", "err");
      setStatus("invalid");
      return;
    }
    if (body.used_cost != null && (isNaN(body.used_cost) || !Number.isInteger(body.used_cost))) {
      msg("used cost must be an integer", "err");
      setStatus("invalid");
      return;
    }

    var btn = $("submitBtn");
    btn.disabled = true;
    msg("sending…");
    setStatus("sending");

    fetch("/api/laptops", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, status: r.status, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          msg((res.data && res.data.error) || "could not save", "err");
          setStatus("error");
          btn.disabled = false;
          return;
        }
        msg("report in — back to the table", "ok");
        setStatus("saved");
        window.location.href = "/";
      })
      .catch(function () {
        msg("network error", "err");
        setStatus("error");
        btn.disabled = false;
      });
  }

  function onReady() {
    wireSegs();
    $("submitForm").addEventListener("submit", onSubmit);
    setStatus("ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();
})();
