/* =====================================================================
   JM LUX Painting - Service Areas interactive map (Leaflet)
   Single source of truth = the semantic town list in the HTML (each <li>
   carries data-lat / data-lng / data-state / data-dist). This builds the
   real map markers from it and keeps map + list + search in sync.
   Progressive enhancement: with JS (or Leaflet) unavailable, the list works.
   ===================================================================== */
(function () {
  "use strict";

  var mapEl = document.querySelector("[data-map]");
  var listEl = document.querySelector("[data-area-list]");
  if (!mapEl || !listEl) return;
  if (!window.L) { mapEl.classList.add("is-unavailable"); return; }

  var searchWrap = document.querySelector("[data-search-wrap]");
  var searchInput = document.querySelector("[data-search]");
  var clearBtn = document.querySelector("[data-search-clear]");
  var chips = [].slice.call(document.querySelectorAll("[data-chip]"));
  var resetBtn = document.querySelector("[data-map-reset]");
  var countEl = document.querySelector("[data-count-out]");
  var emptyEl = document.querySelector("[data-empty]");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ACCENT = "#1d5c54";

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- model from the list ---------- */
  var HQ = null;
  var areas = [].slice.call(listEl.querySelectorAll("[data-area]")).map(function (li) {
    var a = {
      li: li,
      row: li.querySelector(".area-row"),
      lat: parseFloat(li.getAttribute("data-lat")),
      lng: parseFloat(li.getAttribute("data-lng")),
      st: li.getAttribute("data-state"),
      dist: li.getAttribute("data-dist") || "",
      hq: li.hasAttribute("data-hq"),
      name: (li.getAttribute("data-name") || "").trim(),
      marker: null, visible: true
    };
    a.nameLower = a.name.toLowerCase();
    if (a.hq) HQ = a;
    return a;
  });

  /* ---------- map + tiles ---------- */
  var map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd", maxZoom: 19
  }).addTo(map);
  map.zoomControl.setPosition("topright");
  // avoid scroll-jacking: only enable wheel zoom once the map is focused/clicked
  map.on("focus", function () { map.scrollWheelZoom.enable(); });
  map.on("blur", function () { map.scrollWheelZoom.disable(); });

  /* ---------- service-radius rings ---------- */
  if (HQ) {
    [16093.4, 32186.9].forEach(function (r) {
      L.circle([HQ.lat, HQ.lng], {
        radius: r, color: ACCENT, weight: 1.2, opacity: .5, dashArray: "4 7",
        fill: true, fillColor: ACCENT, fillOpacity: .03, interactive: false
      }).addTo(map);
    });
  }

  /* ---------- markers ---------- */
  function icon(a) {
    return L.divIcon({
      className: "",
      html: a.hq
        ? '<span class="pin pin--hq"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-6h5v6"/></svg></span>'
        : '<span class="pin"></span>',
      iconSize: a.hq ? [34, 34] : [20, 20],
      iconAnchor: a.hq ? [17, 17] : [10, 10],
      popupAnchor: [0, a.hq ? -18 : -11]
    });
  }
  function pinEl(a) { return a.marker && a.marker._icon ? a.marker._icon.querySelector(".pin") : null; }

  areas.forEach(function (a) {
    var sub = a.hq
      ? '<span class="pop-sub">Our shop &middot; Lawrence, MA</span>'
      : '<span class="pop-sub"><i class="pop-badge" data-state="' + a.st + '">' + a.st + '</i> ~' + a.dist + ' mi from us</span>';
    a.marker = L.marker([a.lat, a.lng], {
      icon: icon(a), title: a.name + (a.hq ? " (our shop)" : ", " + a.st), riseOnHover: true, keyboard: false
    }).bindPopup("<b>" + esc(a.name) + "</b>" + sub, {
      className: "area-popup", closeButton: false, offset: [0, a.hq ? -8 : -4]
    });
    a.marker.on("mouseover", function () { setHover(a); });
    a.marker.on("mouseout", function () { clearHover(); });
    a.marker.on("click", function () { selectArea(a); });
    a.marker.addTo(map);
  });

  function visibleBounds() {
    var pts = areas.filter(function (a) { return a.visible || a.hq; }).map(function (a) { return [a.lat, a.lng]; });
    return pts.length ? L.latLngBounds(pts) : null;
  }
  function fitVisible(animate) {
    var b = visibleBounds();
    if (b) map.fitBounds(b.pad(0.18), { animate: !!animate && !prefersReduced, maxZoom: 12 });
  }

  /* ---------- hover / active sync ---------- */
  var hovered = null, active = null;
  function paint() {
    areas.forEach(function (a) {
      var on = (a === hovered || a === active);
      var p = pinEl(a);
      if (p) p.classList.toggle("is-active", on);
      if (a.marker && a.marker.setZIndexOffset) a.marker.setZIndexOffset(on ? 1000 : 0);
      a.li.classList.toggle("is-active", a === active);
      a.li.classList.toggle("is-hover", a === hovered && a !== active);
    });
  }
  function setHover(a) { hovered = a; paint(); }
  function clearHover() { hovered = null; paint(); }
  function selectArea(a) {
    active = (active === a) ? null : a;
    paint();
    if (active) {
      map.flyTo([a.lat, a.lng], Math.max(map.getZoom(), 12), { animate: !prefersReduced, duration: .6 });
      a.marker.openPopup();
      if (a.li.scrollIntoView) a.li.scrollIntoView({ block: "nearest", behavior: prefersReduced ? "auto" : "smooth" });
    } else {
      map.closePopup();
    }
  }

  areas.forEach(function (a) {
    a.row.addEventListener("mouseenter", function () { setHover(a); });
    a.row.addEventListener("mouseleave", function () { clearHover(); });
    a.row.addEventListener("focus", function () { setHover(a); });
    a.row.addEventListener("blur", function () { clearHover(); });
    a.row.addEventListener("click", function () { selectArea(a); });
  });

  /* ---------- filtering (state chips + search) ---------- */
  var stateFilter = "all", query = "";
  function applyFilter() {
    var q = query.trim().toLowerCase();
    var shown = 0;
    areas.forEach(function (a) {
      var match = (stateFilter === "all" || a.st === stateFilter) && (!q || a.nameLower.indexOf(q) !== -1);
      a.visible = match;
      a.li.classList.toggle("is-hidden", !match);
      var onMap = match || a.hq;                    // keep the shop pinned to the map
      if (a.marker) {
        if (onMap && !map.hasLayer(a.marker)) a.marker.addTo(map);
        else if (!onMap && map.hasLayer(a.marker)) map.removeLayer(a.marker);
      }
      var nameEl = a.li.querySelector(".area-name");
      if (nameEl) {
        var hit = q ? a.nameLower.indexOf(q) : -1;
        nameEl.innerHTML = (hit !== -1)
          ? esc(a.name.slice(0, hit)) + "<mark>" + esc(a.name.slice(hit, hit + q.length)) + "</mark>" + esc(a.name.slice(hit + q.length))
          : esc(a.name);
      }
      if (match) shown++;
    });
    if (active && !active.visible) { active = null; map.closePopup(); }
    if (hovered && !hovered.visible) hovered = null;
    paint();
    if (countEl) countEl.innerHTML = "Showing <b>" + shown + "</b> of " + areas.length + " areas";
    if (emptyEl) emptyEl.hidden = shown !== 0;
    if (searchWrap) searchWrap.classList.toggle("has-text", query.length > 0);
    if (resetBtn) resetBtn.hidden = (stateFilter === "all" && query === "");
  }

  if (searchInput) searchInput.addEventListener("input", function () { query = searchInput.value; applyFilter(); });
  if (clearBtn) clearBtn.addEventListener("click", function () {
    query = ""; if (searchInput) { searchInput.value = ""; searchInput.focus(); }
    applyFilter(); fitVisible(true);
  });
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      stateFilter = chip.getAttribute("data-chip");
      chips.forEach(function (c) { var on = c === chip; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
      applyFilter(); fitVisible(true);
    });
  });
  if (resetBtn) resetBtn.addEventListener("click", function () {
    stateFilter = "all"; query = ""; active = null; hovered = null; map.closePopup();
    if (searchInput) searchInput.value = "";
    chips.forEach(function (c) { var on = c.getAttribute("data-chip") === "all"; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
    applyFilter(); fitVisible(true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && active) { active = null; map.closePopup(); paint(); }
  });

  /* ---------- legend (Leaflet control) ---------- */
  var legend = L.control({ position: "bottomleft" });
  legend.onAdd = function () {
    var d = L.DomUtil.create("div", "map-legend");
    d.innerHTML =
      '<span><span class="lg-dot lg-dot--hq"></span> Our shop</span>' +
      '<span><span class="lg-dot lg-dot--town"></span> Service town</span>' +
      '<span><span class="lg-ring"></span> 10 / 20-mi radius</span>';
    return d;
  };
  legend.addTo(map);

  /* ---------- chip counts ---------- */
  chips.forEach(function (chip) {
    var v = chip.getAttribute("data-chip");
    var nEl = chip.querySelector("[data-chip-n]");
    if (nEl) nEl.textContent = v === "all" ? areas.length : areas.filter(function (a) { return a.st === v; }).length;
  });

  /* ---------- go ---------- */
  applyFilter();
  map.whenReady(function () { map.invalidateSize(); fitVisible(false); });
  window.addEventListener("load", function () { map.invalidateSize(); fitVisible(false); });
})();
