/* =====================================================================
   JM LUX Painting - Service Areas interactive map
   Single source of truth = the semantic town list in the HTML (each <li>
   carries data-x / data-y / data-state / data-dist). This script builds
   the map pins from it, then keeps map + list + tooltip + search in sync.
   Progressive enhancement: with JS off, the list + static map still render.
   ===================================================================== */
(function () {
  "use strict";

  var stage = document.querySelector("[data-map-stage]");
  var listEl = document.querySelector("[data-area-list]");
  if (!stage || !listEl) return;

  var pinsLayer = stage.querySelector("[data-pins]");
  var tooltip = stage.querySelector("[data-tooltip]");
  var linesGroup = stage.querySelector("[data-lines]");
  var searchWrap = document.querySelector("[data-search-wrap]");
  var searchInput = document.querySelector("[data-search]");
  var clearBtn = document.querySelector("[data-search-clear]");
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-chip]"));
  var resetBtn = document.querySelector("[data-map-reset]");
  var countEl = document.querySelector("[data-count-out]");
  var emptyEl = document.querySelector("[data-empty]");

  var SVGNS = "http://www.w3.org/2000/svg";
  var VBW = 1000, VBH = 780;
  var HQ = { x: 477.4, y: 440.6 };
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hover = null, pinned = null;
  var stateFilter = "all", query = "";
  var lastRenderedId = null;

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- build model + pins from the list ---------- */
  var items = Array.prototype.slice.call(listEl.querySelectorAll("[data-area]"));
  var areas = items.map(function (li, i) {
    var x = parseFloat(li.getAttribute("data-x"));
    var y = parseFloat(li.getAttribute("data-y"));
    var st = li.getAttribute("data-state");
    var dist = li.getAttribute("data-dist") || "";
    var hq = li.hasAttribute("data-hq");
    var nameEl = li.querySelector(".area-name");
    var name = (li.getAttribute("data-name") || (nameEl ? nameEl.textContent : "")).trim();
    var row = li.querySelector(".area-row");
    var stateName = st === "NH" ? "New Hampshire" : "Massachusetts";

    var pin = document.createElement("button");
    pin.type = "button";
    pin.className = "map-pin" + (hq ? " map-pin--hq" : "");
    pin.style.left = (x / VBW * 100) + "%";
    pin.style.top = (y / VBH * 100) + "%";
    pin.style.setProperty("--d", (hq ? 120 : 260 + i * 42) + "ms");
    pin.setAttribute("aria-label", hq
      ? name + ", " + stateName + " (our shop)"
      : name + ", " + stateName + ", about " + dist + " miles from our shop");

    if (hq) {
      var p1 = document.createElement("span"); p1.className = "pin-pulse";
      var p2 = document.createElement("span"); p2.className = "pin-pulse p2";
      pin.appendChild(p1); pin.appendChild(p2);
    }
    var dot = document.createElement("span");
    dot.className = "pin-dot";
    if (hq) dot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-6h5v6"/></svg>';
    pin.appendChild(dot);
    pinsLayer.appendChild(pin);

    return {
      id: String(i), li: li, row: row, pin: pin,
      x: x, y: y, st: st, dist: dist, hq: hq,
      name: name, nameLower: name.toLowerCase(), visible: true
    };
  });

  /* ---------- connector line (HQ -> active town) ---------- */
  var line = document.createElementNS(SVGNS, "path");
  line.setAttribute("class", "map-line");
  linesGroup.appendChild(line);

  function setLine(a) {
    if (!a || a.hq) { line.classList.remove("is-on"); return; }
    var dx = a.x - HQ.x, dy = a.y - HQ.y;
    var len = Math.hypot(dx, dy) || 1;
    var bow = Math.min(len * 0.16, 64);
    var cx = (HQ.x + a.x) / 2 + (-dy / len) * bow;
    var cy = (HQ.y + a.y) / 2 + (dx / len) * bow;
    line.setAttribute("d", "M " + HQ.x + " " + HQ.y + " Q " + cx.toFixed(1) + " " + cy.toFixed(1) + " " + a.x + " " + a.y);
    var total = line.getTotalLength();
    line.style.transition = "none";
    line.style.strokeDasharray = total;
    line.style.strokeDashoffset = total;
    void line.getBoundingClientRect();          // force reflow so the draw animates
    line.classList.add("is-on");
    line.style.transition = "stroke-dashoffset .55s var(--ease), opacity .3s var(--ease)";
    line.style.strokeDashoffset = "0";
  }

  /* ---------- tooltip ---------- */
  function showTip(a) {
    if (!a) { tooltip.classList.remove("is-on"); return; }
    var sub = a.hq
      ? '<span class="tt-hq">Our shop in Lawrence, MA</span>'
      : '<span class="tt-badge" data-state="' + a.st + '">' + a.st + '</span><span>~' + a.dist + ' mi from us</span>';
    tooltip.innerHTML = '<span class="tt-name">' + esc(a.name) + '</span><span class="tt-sub">' + sub + '</span>';
    tooltip.style.left = (a.x / VBW * 100) + "%";
    tooltip.style.top = (a.y / VBH * 100) + "%";
    tooltip.classList.toggle("flip", a.y < 150);
    tooltip.classList.add("is-on");
  }

  /* ---------- render the currently-shown town ---------- */
  function current() { return hover || pinned; }
  function render() {
    var a = current();
    var id = a ? a.id : null;
    areas.forEach(function (o) {
      var on = (o === a);
      o.pin.classList.toggle("is-active", on);
      o.li.classList.toggle("is-active", on);
    });
    if (id !== lastRenderedId) { showTip(a); setLine(a); lastRenderedId = id; }
  }

  function setHover(a) { hover = a; render(); }
  function clearHover() { hover = null; render(); }
  function togglePin(a) {
    pinned = (pinned === a) ? null : a;
    render();
    if (pinned && pinned.li.scrollIntoView) {
      pinned.li.scrollIntoView({ block: "nearest", behavior: prefersReduced ? "auto" : "smooth" });
    }
  }

  /* ---------- wire pin + row events ---------- */
  areas.forEach(function (a) {
    a.pin.addEventListener("mouseenter", function () { setHover(a); });
    a.pin.addEventListener("mouseleave", clearHover);
    a.pin.addEventListener("focus", function () { setHover(a); });
    a.pin.addEventListener("blur", clearHover);
    a.pin.addEventListener("click", function (e) { e.stopPropagation(); togglePin(a); });

    a.row.addEventListener("mouseenter", function () { setHover(a); });
    a.row.addEventListener("mouseleave", clearHover);
    a.row.addEventListener("focus", function () { setHover(a); });
    a.row.addEventListener("blur", clearHover);
    a.row.addEventListener("click", function () { togglePin(a); });
  });

  // click empty map area to release a pinned town
  stage.addEventListener("click", function (e) {
    if (!e.target.closest(".map-pin") && pinned) { pinned = null; render(); }
  });

  /* ---------- filtering (state chips + search) ---------- */
  function applyFilter() {
    var q = query.trim().toLowerCase();
    var shown = 0;
    areas.forEach(function (a) {
      var match = (stateFilter === "all" || a.st === stateFilter) && (!q || a.nameLower.indexOf(q) !== -1);
      a.visible = match;
      a.li.classList.toggle("is-hidden", !match);
      // map: keep HQ always; dim (not remove) filtered-out towns to preserve the region shape
      if (!a.hq) a.pin.classList.toggle("is-dim", !match);
      if (match) shown++;

      // highlight the matched substring in the list label
      var nameEl = a.li.querySelector(".area-name");
      if (nameEl) {
        var hit = q ? a.nameLower.indexOf(q) : -1;
        if (hit !== -1) {
          nameEl.innerHTML = esc(a.name.slice(0, hit)) + "<mark>" + esc(a.name.slice(hit, hit + q.length)) + "</mark>" + esc(a.name.slice(hit + q.length));
        } else {
          nameEl.textContent = a.name;
        }
      }
    });

    // if the pinned/hovered town got filtered away, drop it
    if (pinned && !pinned.visible) { pinned = null; render(); }
    if (hover && !hover.visible) { hover = null; render(); }

    if (countEl) countEl.innerHTML = "Showing <b>" + shown + "</b> of " + areas.length + " areas";
    if (emptyEl) emptyEl.hidden = shown !== 0;
    if (searchWrap) searchWrap.classList.toggle("has-text", query.length > 0);
    if (resetBtn) resetBtn.hidden = (stateFilter === "all" && query === "" && !pinned);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () { query = searchInput.value; applyFilter(); });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      query = ""; if (searchInput) { searchInput.value = ""; searchInput.focus(); } applyFilter();
    });
  }
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      stateFilter = chip.getAttribute("data-chip");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      applyFilter();
    });
  });
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      stateFilter = "all"; query = ""; pinned = null; hover = null;
      if (searchInput) searchInput.value = "";
      chips.forEach(function (c) {
        var on = c.getAttribute("data-chip") === "all";
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      render(); applyFilter();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && pinned) { pinned = null; render(); applyFilter(); }
  });

  /* ---------- chip counts ---------- */
  chips.forEach(function (chip) {
    var v = chip.getAttribute("data-chip");
    var nEl = chip.querySelector("[data-chip-n]");
    if (!nEl) return;
    nEl.textContent = v === "all"
      ? areas.length
      : areas.filter(function (a) { return a.st === v; }).length;
  });

  applyFilter();
})();
