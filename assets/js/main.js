/* =====================================================================
   JM LUX Painting — interactions
   ===================================================================== */
(function () {
  "use strict";

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

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.slice.call(
          (el.parentElement || document).querySelectorAll(":scope > [data-reveal]")
        );
        var i = siblings.indexOf(el);
        el.style.transitionDelay = (i > 0 ? Math.min(i, 6) * 70 : 0) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

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
      var apply = function () {
        var shown = 0;
        shots.forEach(function (s) {
          var show = f === "all" || s.getAttribute("data-cat") === f;
          s.hidden = !show;
          if (show) { s.style.transitionDelay = (shown++ * 45) + "ms"; }
        });
        // next frame: lift the veil so visible tiles fade/rise back in, staggered
        requestAnimationFrame(function () {
          gallery.classList.remove("is-switching");
          window.setTimeout(function () {
            shots.forEach(function (s) { s.style.transitionDelay = ""; });
          }, 700);
        });
        syncLightboxList();
      };
      if (prefersReduced) { apply(); }
      else {
        gallery.classList.add("is-switching");      // fade current set down
        window.setTimeout(apply, 240);
      }
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
      var subject = "Estimate request — " + service + " (" + name + ")";
      var body = [
        "Name: " + name, "Email: " + email, "Phone: " + (phone || "—"),
        "Project type: " + service, "", "Details:", message || "—"
      ].join("\n");
      window.location.href = "mailto:jmluxpainting@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      setNote("Opening your email app… if nothing happens, email jmluxpainting@gmail.com directly.", "is-success");
      form.reset();
      window.setTimeout(function () { setNote(defaultNote); }, 9000);
    });
  }

  /* ===================================================================
     AGENCY MOTION LAYER
     =================================================================== */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- page-load curtain ---------- */
  var loader = document.querySelector("[data-loader]");
  function revealPage() { document.body.classList.add("is-loaded"); }
  if (loader) {
    if (document.readyState === "complete") { revealPage(); }
    else { window.addEventListener("load", revealPage); }
    // never trap the page behind the curtain if `load` is slow/blocked
    window.setTimeout(revealPage, 2600);
  }

  /* ---------- unified scroll loop: progress bar + parallax + hero ---------- */
  var progress = document.querySelector("[data-scroll-progress]");
  var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var scrollHint = document.querySelector(".scroll-hint");
  var heroEl = document.querySelector(".hero");
  var ticking = false;

  function paintScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) {
      var p = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;
      progress.style.transform = "scaleX(" + p + ")";
    }
    if (scrollHint && heroEl) {
      scrollHint.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.4)));
    }
    if (!prefersReduced && parallax.length) {
      var mid = window.innerHeight / 2;
      parallax.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var speed = parseFloat(el.getAttribute("data-speed")) || 0.08;
        var offset = (rect.top + rect.height / 2 - mid) * speed;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
    }
  }
  function requestScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(paintScroll); }
  }
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });
  paintScroll();

  /* ---------- scrollspy: highlight the section you're reading ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-list a[href^='#']"));
  if (navLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    var sections = [];
    navLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) { linkFor[id] = a; sections.push(sec); }
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.remove("is-current"); });
        var current = linkFor[e.target.id];
        if (current) current.classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- count-up numerals ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var start = null, dur = 1500;
    function frame(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (k < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCount(e.target);
        countIO.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 0.32;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (mx * strength).toFixed(1) + "px," + (my * strength).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- service-card spotlight + subtle 3D tilt ---------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll(".service-card").forEach(function (card) {
      var tilt = card.classList.contains("service-card--cta") ? 4 : 6;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        card.style.transform =
          "perspective(1100px) rotateX(" + ((0.5 - py) * tilt).toFixed(2) + "deg) rotateY(" +
          ((px - 0.5) * tilt).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- bespoke cursor (fine pointer, motion allowed) ---------- */
  var ring = document.querySelector("[data-cursor-ring]");
  var dot = document.querySelector("[data-cursor-dot]");
  if (ring && dot && finePointer && !prefersReduced) {
    var rx = window.innerWidth / 2, ry = window.innerHeight / 2;
    var tx = rx, ty = ry, raf;
    function loop() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0) translate(-50%,-50%)";
      if (!document.body.classList.contains("cursor-ready")) document.body.classList.add("cursor-ready");
      if (!raf) loop();
    }, { passive: true });
    window.addEventListener("pointerdown", function () { ring.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { ring.classList.remove("is-down"); });
    var hotSel = "a, button, .shot, input, select, textarea, [data-magnetic]";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest(hotSel)) ring.classList.add("is-hot");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest(hotSel) && !(e.relatedTarget && e.relatedTarget.closest(hotSel))) {
        ring.classList.remove("is-hot");
      }
    });
  }
})();
