/* Live submit — no auth in v1. */
(function () {
  "use strict";

  var FIELDS = ["wifi", "gpu", "sleep", "audio"];

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

  function selected(field) {
    var on = document.querySelector('[data-field="' + field + '"].is-on');
    return on ? on.getAttribute("data-value") : "unknown";
  }

  function payload() {
    var yearRaw = $("year").value.trim();
    var year = yearRaw === "" ? null : Number(yearRaw);
    var body = {
      brand: $("brand").value,
      model: $("model").value,
      year: year,
      wifi: selected("wifi"),
      gpu: selected("gpu"),
      sleep: selected("sleep"),
      audio: selected("audio"),
      notes: $("notes").value,
      reporter: $("reporter").value
    };
    return body;
  }

  function wireSegs() {
    FIELDS.forEach(function (field) {
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
