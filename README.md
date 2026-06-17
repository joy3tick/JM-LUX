# JM LUX Painting — Website

A modern, fast, fully responsive marketing site for **JM LUX Painting Inc.**, a
residential & commercial painting company serving Massachusetts.

A warm, editorial multi-page experience — bone-paper surfaces, deep ink, and a
single restrained **petrol-teal accent** drawn from the JM LUX logo, set in a
**Fraunces** serif display face over **Inter** — with a full-bleed photo hero, a
filterable project gallery with a lightbox, an interactive service-area map,
restrained scroll-reveal motion, and a contact form. Built as a static site
with **no build step** and no runtime dependencies (aside from Leaflet, loaded
from a CDN, which powers the interactive map on the Service Areas page).

## Highlights

- **Premium, restrained palette** — warm bone paper, deep ink, and one petrol-teal accent (`#1d5c54`) with a brass micro-accent (`#a6864f`), applied as design tokens in `:root` — no rainbow gradients.
- **Real project photography** — the client's own portfolio photos, optimized for web and used in the hero, About, and a filterable gallery (Interior / Exterior / Commercial) with a keyboard-accessible lightbox.
- **Interactive service-area map** — a dependency-free, hand-built SVG map of the Merrimack Valley (`areas.html`) with geographically-accurate town pins, MA/NH state line, distance rings from the Lawrence shop, animated drop-in pins, hover/tap tooltips, connector lines, and a synced, searchable town finder you can filter by state.
- **Zero build tooling** — plain HTML, CSS, and vanilla JS. Open `index.html` and it works.
- **Fully responsive** — refined layouts from large desktops down to small phones, with an animated mobile menu.
- **Accessible** — semantic landmarks, skip link, keyboard-friendly focus states, `aria` labels, and `prefers-reduced-motion` support.
- **Performance-minded** — every photo resized & compressed (~2.5 MB total page weight), lazy-loaded images, lightweight SVG icons, and an off-screen-paused marquee.
- **SEO ready** — descriptive metadata, Open Graph tags, and `LocalBusiness` JSON-LD structured data.
- **Working contact form** — composes a pre-filled email via `mailto:` so it functions on any static host (swap in a form backend later if desired — see below).

## Structure

```
.
├── index.html                  # Home (hero, services, why-us, work, reviews, CTA)
├── services.html               # Services + process
├── areas.html                  # Service-area page + interactive coverage map & town finder
├── gallery.html                # Filterable project gallery + lightbox
├── contact.html                # About + contact form
├── assets/
│   ├── css/styles.css          # Brand tokens + components + responsive rules
│   ├── css/areas.css           # Service-area map, pins, tooltip, and town-finder styles
│   ├── js/main.js              # Header, mobile menu, reveals, marquee, gallery filter, lightbox, form
│   ├── js/areas.js             # Leaflet map: builds markers from the town list; search/filter/sync
│   └── img/
│       ├── logo.png            # JM LUX logo (used in header + footer)
│       ├── favicon.svg         # Brand mark (gradient house + skyline)
│       ├── hero.jpg            # Full-bleed hero (vaulted great room)
│       └── portfolio/          # Optimized project photos used in the gallery
└── README.md
```

> The original full-resolution uploads remain in git history; the versions under
> `assets/img/` are web-optimized (resized + recompressed) for fast loading.

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
