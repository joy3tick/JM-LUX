# JM LUX Painting — Website

A modern, fast, fully responsive marketing site for **JM LUX Painting Inc.**, a
residential & commercial painting company serving Massachusetts.

A multi-page experience built around the company's brand identity — the
**emerald → teal → steel-blue gradient** pulled straight from the JM LUX logo —
with a full-bleed photo hero, a filterable project gallery with a lightbox,
smooth scroll-reveal animations, and a contact form. Built as a static site
with **no build step and no dependencies**.

The site is split into five pages that share one header, footer, stylesheet,
and JS bundle: **Home** (`index.html`), **Services** (`services.html`),
**About** (`about.html`), **Gallery** (`gallery.html`), and
**Contact** (`contact.html`).

## Highlights

- **On-brand palette** — colors sampled directly from the logo (`#07875c → #0f8a83 → #3a86c4`), applied as design tokens in `:root`.
- **Real project photography** — the client's own portfolio photos, optimized for web and used in the hero, About, and a filterable gallery (Interior / Exterior / Commercial) with a keyboard-accessible lightbox.
- **Zero build tooling** — plain HTML, CSS, and vanilla JS. Open `index.html` and it works.
- **Fully responsive** — refined layouts from large desktops down to small phones, with an animated mobile menu.
- **Accessible** — semantic landmarks, skip link, keyboard-friendly focus states, `aria` labels, and `prefers-reduced-motion` support.
- **Performance-minded** — every photo resized & compressed (~2.5 MB total page weight), lazy-loaded images, lightweight SVG icons, and an off-screen-paused marquee.
- **SEO ready** — descriptive metadata, Open Graph tags, and `LocalBusiness` JSON-LD structured data.
- **Working contact form** — composes a pre-filled email via `mailto:` so it functions on any static host (swap in a form backend later if desired — see below).

## Structure

```
.
├── index.html                  # Home — hero, marquee, services teaser, CTA
├── services.html               # Services grid, "Why Us", and Process steps
├── about.html                  # About story + customer reviews
├── gallery.html                # Filterable project gallery + lightbox
├── contact.html                # Contact details + estimate request form
├── assets/
│   ├── css/styles.css          # Brand tokens + components + responsive rules
│   ├── js/main.js              # Header, mobile menu, reveals, marquee, gallery filter, lightbox, form
│   └── img/
│       ├── logo.png            # JM LUX logo (used in header + footer)
│       ├── favicon.svg         # Brand mark (gradient house + skyline)
│       ├── hero.jpg            # Full-bleed hero (vaulted great room)
│       └── portfolio/          # Optimized project photos used in the gallery
└── README.md
```

> The shared header/nav, footer, and lightbox markup are duplicated across the
> five HTML pages (no templating, to keep the zero-build promise). When editing
> the nav, contact details, or footer, update each page.

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
- **Business details** (phone, email, address, hours) appear in the header/footer of every page and on `contact.html` — search for `978-387-0562` / `jmluxpainting@gmail.com`. The `LocalBusiness` JSON-LD block lives in `index.html`.
- **Services** are plain HTML blocks in `services.html`, **reviews** in `about.html`, and **gallery tiles** in `gallery.html` — all easy to add or edit.

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
