# JM LUX Painting — Website

A modern, fast, fully responsive marketing site for **JM LUX Painting Inc.**, a
residential & commercial painting company serving Massachusetts.

This is a clean-room redesign: a single-page experience with a luxury-leaning
look (charcoal + brass + cream), smooth scroll-reveal animations, and a
contact form — built as a static site with **no build step and no dependencies**.

## Highlights

- **Zero build tooling** — plain HTML, CSS, and vanilla JS. Open `index.html` and it works.
- **Fully responsive** — refined layouts from large desktops down to small phones, with an animated mobile menu.
- **Accessible** — semantic landmarks, skip link, keyboard-friendly focus states, `aria` labels, and `prefers-reduced-motion` support.
- **Performance-minded** — system-friendly fonts, lightweight SVG icons (no icon library), IntersectionObserver reveals, and an off-screen-paused marquee.
- **SEO ready** — descriptive metadata, Open Graph tags, and `LocalBusiness` JSON-LD structured data.
- **Working contact form** — composes a pre-filled email via `mailto:` so it functions on any static host (swap in a form backend later if desired — see below).

## Structure

```
.
├── index.html              # All sections (hero, services, about, process, gallery, reviews, contact)
├── assets/
│   ├── css/styles.css      # Design tokens + components + responsive rules
│   ├── js/main.js          # Header, mobile menu, reveals, marquee, form
│   └── img/favicon.svg     # Brand mark
└── README.md
```

## Run locally

It's a static site, so just open the file:

```bash
# simplest
open index.html            # macOS  (use xdg-open on Linux)

# or serve it (nice for clean URLs / testing)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Customizing

- **Brand colors & fonts** live as CSS custom properties at the top of `assets/css/styles.css` (`:root`).
- **Business details** (phone, email, address, hours) appear in `index.html` — search for `978-387-0562` / `jmluxpainting@gmail.com` and the JSON-LD block.
- **Services, reviews, and gallery tiles** are plain HTML blocks in `index.html`, easy to add or edit.

### Wiring the contact form to a real inbox

The form currently opens the visitor's email client with the details pre-filled.
To collect submissions server-side instead, point it at a form service
(e.g. Formspree, Basin, Netlify Forms) by giving the `<form>` an `action`/`method`
and removing the `data-contact-form` mailto handler in `assets/js/main.js`.

## Deploy

Any static host works — GitHub Pages, Netlify, Cloudflare Pages, Vercel, S3.
For GitHub Pages: push to the repo and enable Pages on the branch root.

---

© JM LUX Painting Inc. · Licensed & Insured · Lawrence, MA
