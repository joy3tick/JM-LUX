/* =====================================================================
   JM LUX Painting interactions
   ===================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky header + back-to-top ---------- */
  var header = document.querySelector("[data-header]");
  var btt = document.querySelector("[data-back-to-top]");
  function onScroll() {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 24);
    if (btt) btt.classList.toggle("is-visible", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ---------- scroll reveal ----------
     Handled entirely in CSS now (a pure load animation gated behind .js).
     No JS visibility toggling, so content can never be stranded invisible. */

  /* ---------- marquee: pause off-screen ---------- */
  var marquee = document.querySelector("[data-marquee]");
  if (marquee && "IntersectionObserver" in window && !prefersReduced) {
    var tracks = marquee.querySelectorAll(".marquee-track");
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        tracks.forEach(function (t) { t.style.animationPlayState = e.isIntersecting ? "running" : "paused"; });
      });
    }).observe(marquee);
  }

  /* ---------- gallery filtering ---------- */
  var filterBar = document.querySelector("[data-filters]");
  var gallery = document.querySelector("[data-gallery]");
  if (filterBar && gallery) {
    var shots = Array.prototype.slice.call(gallery.querySelectorAll(".shot"));
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var f = btn.getAttribute("data-filter");
      shots.forEach(function (s) {
        var show = f === "all" || s.getAttribute("data-cat") === f;
        s.hidden = !show;
      });
      syncLightboxList();
    });
  }

  /* ---------- lightbox ---------- */
  var lb = document.querySelector("[data-lightbox]");
  if (lb && gallery) {
    var lbImg = lb.querySelector("[data-lb-img]");
    var lbCap = lb.querySelector("[data-lb-cap]");
    var allShots = Array.prototype.slice.call(gallery.querySelectorAll(".shot"));
    var list = allShots.slice();   // currently-visible shots
    var idx = 0;
    var lastFocus = null;

    function syncLightboxList() {
      list = allShots.filter(function (s) { return !s.hidden; });
    }
    window.syncLightboxList = syncLightboxList; // referenced by filter handler

    function render() {
      var s = list[idx];
      if (!s) return;
      lbImg.src = s.getAttribute("data-full");
      lbImg.alt = s.querySelector("img") ? s.querySelector("img").alt : "";
      lbCap.textContent = s.getAttribute("data-cap") || "";
    }
    function open(shot) {
      syncLightboxList();
      idx = Math.max(0, list.indexOf(shot));
      lastFocus = shot;
      render();
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    function step(d) {
      if (!list.length) return;
      idx = (idx + d + list.length) % list.length;
      render();
    }

    gallery.addEventListener("click", function (e) {
      var shot = e.target.closest(".shot");
      if (shot) open(shot);
    });
    lb.querySelector("[data-lb-close]").addEventListener("click", close);
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { step(-1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) { if (e.key === "Escape") setMenu(false); return; }
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- stat count-up (additive: html already shows final value) ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !prefersReduced && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target; cio.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count")) || 0;
        var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1500, t0 = null;
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var v = target * (1 - Math.pow(1 - p, 3));
          el.textContent = v.toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(dec) + suffix;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- current year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- contact form -> mailto ---------- */
  var form = document.querySelector("[data-contact-form]");
  var note = document.querySelector("[data-form-note]");
  var defaultNote = note ? note.textContent : "";
  function setNote(msg, state) {
    if (!note) return;
    note.textContent = msg;
    note.classList.remove("is-success", "is-error");
    if (state) note.classList.add(state);
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var phone = (data.get("phone") || "").toString().trim();
      var service = (data.get("service") || "").toString().trim();
      var message = (data.get("message") || "").toString().trim();
      if (!name || !email) {
        setNote("Please add your name and email so we can reach you.", "is-error");
        return;
      }
      var subject = "Estimate request: " + service + " (" + name + ")";
      var body = [
        "Name: " + name, "Email: " + email, "Phone: " + (phone || "Not provided"),
        "Project type: " + service, "", "Details:", message || "No details provided"
      ].join("\n");
      window.location.href = "mailto:jmluxpainting@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      setNote("Opening your email app… if nothing happens, email jmluxpainting@gmail.com directly.", "is-success");
      form.reset();
      window.setTimeout(function () { setNote(defaultNote); }, 9000);
    });
  }
})();
