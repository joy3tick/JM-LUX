/* =====================================================================
   JM LUX Painting — interactions
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky header ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (window.scrollY > 24) header.classList.add("is-stuck");
    else header.classList.remove("is-stuck");

    var btt = document.querySelector("[data-back-to-top]");
    if (btt) btt.classList.toggle("is-visible", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // stagger siblings a touch for a polished cascade
          var siblings = Array.prototype.slice.call(
            (el.parentElement || document).querySelectorAll(":scope > [data-reveal]")
          );
          var i = siblings.indexOf(el);
          el.style.transitionDelay = (i > 0 ? Math.min(i, 6) * 70 : 0) + "ms";
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- marquee: pause when off-screen for perf ---------- */
  var marquee = document.querySelector("[data-marquee]");
  if (marquee && "IntersectionObserver" in window && !prefersReduced) {
    var tracks = marquee.querySelectorAll(".marquee-track");
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        tracks.forEach(function (t) {
          t.style.animationPlayState = e.isIntersecting ? "running" : "paused";
        });
      });
    });
    mio.observe(marquee);
  }

  /* ---------- current year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- contact form -> mailto (works without a backend) ---------- */
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
      var bodyLines = [
        "Name: " + name,
        "Email: " + email,
        "Phone: " + (phone || "—"),
        "Project type: " + service,
        "",
        "Details:",
        message || "—"
      ];
      var href =
        "mailto:jmluxpainting@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = href;
      setNote("Opening your email app… if nothing happens, email jmluxpainting@gmail.com directly.", "is-success");
      form.reset();
      window.setTimeout(function () { setNote(defaultNote); }, 9000);
    });
  }
})();
