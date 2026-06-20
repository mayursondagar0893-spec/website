# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

**taxationupdates.com** — GitHub Pages static site for CA Mayur Sondagar. Personal brand + interactive Indian tax/CA tools. No backend, no build step; files are served as-is by GitHub Pages.

Live site: `https://taxationupdates.com/`  
Repo: `mayursondagar0893-spec/website`  
Deploy: every push to `master` auto-deploys via GitHub Pages.

---

## Commands

```bash
# Install dev dependencies (once — never deployed)
npm install

# Run all tests (single pass)
npm test

# Watch mode
npm run test:watch

# Run a single test file
npx vitest run tests/challan-parser.test.js
```

Tests use **Vitest ^2.1.0 + jsdom ^25.0.0**. After editing any shared JS file (`challan-parser.js`, `contact-form.js`, `prompt-filter.js`, `wa-init.js`, `sw.js`) run `npm test` before committing.

---

## Repository Layout

```
/                               ← repo root = web root
├── index.html                  ← homepage (hero, portfolio grid, contact)
├── about.html
├── contact.html
├── disclaimer.html
├── privacy-policy.html
├── TDS-SECTION-CODE.html       ← TDS/TCS section-code master table
├── CA-Prompt-Library.html      ← AI prompt library for CA professionals
├── INCOME-TAX-CHALLAN-TO-EXCEL.html  ← PDF challan → Excel converter
├── Compliance_Calendar_FY2627.html   ← Interactive compliance calendar
├── FORM-10-IEA-REFERENCE.html       ← Form 10-IEA & tax regime reference
├── INCOME-TAX-CALCULATOR-FY2526-FY2627.html  ← Old vs New regime calculator
├── brand-icons.css             ← Shared: social icon brand colours (all pages)
├── wa-init.js                  ← Shared: WhatsApp click-handler init
├── challan-parser.js           ← Shared: PDF challan parser (ITNS 280/281/282/283)
├── contact-form.js             ← Shared: contact-form validation + WA URL builder
├── prompt-filter.js            ← Shared: filter/sort/bookmark for prompt library
├── sw.js                       ← Service Worker (PWA / offline cache)
├── manifest.json               ← PWA manifest
├── sitemap.xml                 ← XML sitemap (updated by add-tool.sh)
├── robots.txt
├── CNAME                       ← GitHub Pages custom domain — DO NOT TOUCH
├── og-cover.svg                ← OG image source
├── icons/                      ← icon-192.png, icon-512.png
├── add-tool.sh                 ← Integration script for new tools
├── tests/                      ← Vitest test suite
│   ├── challan-parser.test.js
│   ├── contact-form.test.js
│   ├── dark-mode.test.js       ← runs in jsdom
│   ├── prompt-filter.test.js
│   ├── sw.test.js
│   └── wa-init.test.js         ← runs in jsdom
├── vitest.config.js
└── package.json                ← devDependencies only (vitest, jsdom)
```

---

## Architecture

### File layout pattern
Each HTML tool is fully self-contained: its CSS lives in `<style>` tags and its JS lives in `<script>` tags inside that file. The only shared external files are:

| File | Purpose | Exports |
|---|---|---|
| `brand-icons.css` | Social icon brand colours — linked by every page at `/brand-icons.css` | — |
| `wa-init.js` | Initialises `.wa-link` click handlers with a Base64-encoded WhatsApp number | browser global only |
| `challan-parser.js` | PDF challan parsing (ITNS 280/280N/281/281N/282/283) | `clean`, `parseAmount`, `between`, `get`, `parseChallan` |
| `contact-form.js` | Contact form validation + WhatsApp URL builders | `EMAIL_RE`, `validateForm`, `buildWAMessage`, `buildWAUrl` |
| `prompt-filter.js` | Filter/sort/bookmark helpers for the prompt library | `filterAndSort`, `toggleBookmark` |

### Dual-module pattern (critical)
`challan-parser.js`, `contact-form.js`, and `prompt-filter.js` end with:
```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ... };
}
```
In the browser they are loaded as `<script>` tags and their functions become globals. In Vitest they are `require()`'d as CommonJS modules. **Never remove this block.**

### Dark mode
Every page persists and restores theme via `localStorage.getItem/setItem('theme', ...)` and toggles `document.documentElement.setAttribute('data-theme', 'light'|'dark')`. The key **must** stay `'theme'` — live users depend on it.

### PWA / Service Worker
`sw.js` pre-caches tool pages for offline use. Current `CACHE_NAME`: **`taxationupdates-v8`**.  
Strategy: network-first for HTML, cache-first for everything else (same-origin only).  
Bump the version number whenever you add/rename a cached file. The script `add-tool.sh` does this automatically.

### Phone number security
The WhatsApp number is Base64-encoded in `wa-init.js` (`atob('...')`). Never expose the decoded number in plaintext anywhere in the repo.

### Portfolio grid (index.html)
Tool cards in `index.html` use `.portfolio-card` with a `.p-thumb` colour stripe. The stripe cycles through CSS classes `t1` (olive), `t2` (olive-dark), `t3` (no extra CSS — falls back to the base `.p-thumb` olive background). Cards are inserted by `add-tool.sh`.

---

## Test Configuration

`vitest.config.js` sets `environment: 'node'` globally with two jsdom overrides:

| Test file | Environment |
|---|---|
| `tests/wa-init.test.js` | jsdom |
| `tests/dark-mode.test.js` | jsdom |
| all others | node |

`sw.test.js` parses `sw.js` source directly with `fs.readFileSync` — it verifies `CACHE_NAME` format and that all `PRECACHE_URLS` entries are plausible paths.

---

## Adding a New Tool (Automated Workflow)

When the user says "add this tool" / "integrate this" / pastes HTML:

1. **Determine filename** — derive from `<title>` using UPPER-KEBAB-CASE (e.g. `GST-CALCULATOR.html`). Use any user-specified name exactly.

2. **Validate & auto-fix the HTML** before saving. Required in every tool's `<head>`:

   | Check | Required value |
   |---|---|
   | `<html>` attributes | `lang="en" data-theme="light"` |
   | `<title>` | ends with `– Taxation Updates` |
   | `brand-icons.css` | `<link rel="stylesheet" href="/brand-icons.css"/>` |
   | `manifest.json` | `<link rel="manifest" href="/manifest.json"/>` |
   | Favicon | `<link rel="icon" … href="/icons/icon-192.png"/>` |
   | Google Analytics | ID must be `G-YC101DVMH7` — never change |
   | OG tags | `og:title`, `og:description`, `og:type`, `og:url`, `og:image` |
   | Twitter tags | `twitter:card`, `twitter:site`, `twitter:title`, `twitter:description`, `twitter:image` |
   | Canonical | `<link rel="canonical" href="https://taxationupdates.com/FILENAME.html"/>` |
   | Dark mode CSS | `[data-theme="dark"] {}` block in `<style>` |
   | Dark mode JS | `localStorage.getItem('theme')` on load; `localStorage.setItem('theme', …)` on toggle |
   | No raw phone | no 10-digit Indian mobile number in plaintext |
   | WhatsApp link | `.wa-link` class + `<script src="/wa-init.js" defer></script>` |

3. **Save** the file to the repo root.

4. **Run the integration script** — it bumps `sw.js` cache version, adds the URL to `sitemap.xml`, and inserts a portfolio card in `index.html`:
   ```bash
   ./add-tool.sh FILENAME.html "Tool Name" "One-line description" "emoji"
   ```
   Fix any `❌` items the script reports, then confirm the 4 files updated: `FILENAME.html`, `sw.js`, `sitemap.xml`, `index.html`.

### What `add-tool.sh` does (Python-driven)
- Bumps `CACHE_NAME` integer in `sw.js` (e.g. `v8` → `v9`)
- Appends `'/FILENAME.html'` to `PRECACHE_URLS` array in `sw.js`
- Appends `<url>` entry to `sitemap.xml` with today's date, `changefreq: monthly`, `priority: 0.8`
- Inserts a `.portfolio-card` `<a>` element before the closing `</div>` of `.portfolio-grid` in `index.html` — the colour class (`t1`/`t2`/`t3`) is chosen by cycling `(card_count % 3) + 1`
- Prints a 15-point HTML validation report with `✅` / `❌` per check

### Required `<head>` template
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TOOL TITLE – Taxation Updates</title>
  <meta name="description" content="TOOL DESCRIPTION — taxationupdates.com"/>
  <meta property="og:title"       content="TOOL TITLE – Taxation Updates"/>
  <meta property="og:description" content="TOOL DESCRIPTION"/>
  <meta property="og:type"        content="website"/>
  <meta property="og:url"         content="https://taxationupdates.com/FILENAME.html"/>
  <meta property="og:image"       content="https://taxationupdates.com/og-cover.png"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:site"        content="@TaxationUpdates"/>
  <meta name="twitter:title"       content="TOOL TITLE – Taxation Updates"/>
  <meta name="twitter:description" content="TOOL DESCRIPTION"/>
  <meta name="twitter:image"       content="https://taxationupdates.com/og-cover.png"/>
  <link rel="canonical"            href="https://taxationupdates.com/FILENAME.html"/>
  <link rel="stylesheet" href="/brand-icons.css"/>
  <link rel="manifest" href="/manifest.json"/>
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png"/>
  <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png"/>
  <meta name="theme-color" content="#8c9a1a"/>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-YC101DVMH7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-YC101DVMH7');
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet"/>
  <style>
    :root { --primary: #8c9a1a; /* ... */ }
    [data-theme="dark"] { /* ... */ }
  </style>
</head>
```

### Required dark mode JS (before `</body>`)
```html
<script>
  (function() {
    const t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  })();
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
</script>
<script src="/wa-init.js" defer></script>
```

---

## Current Tool Inventory

| File | Tool name | In sitemap | In sw PRECACHE |
|---|---|---|---|
| `index.html` | Homepage | yes | yes |
| `about.html` | About | yes | yes |
| `contact.html` | Contact | yes | yes |
| `disclaimer.html` | Disclaimer | yes | yes |
| `privacy-policy.html` | Privacy Policy | yes | yes |
| `TDS-SECTION-CODE.html` | TDS/TCS Section Codes | yes | yes |
| `CA-Prompt-Library.html` | CA Prompt Library | yes | yes |
| `INCOME-TAX-CHALLAN-TO-EXCEL.html` | Challan PDF → Excel | yes | yes |
| `Compliance_Calendar_FY2627.html` | Compliance Calendar FY 2026-27 | yes | yes |
| `FORM-10-IEA-REFERENCE.html` | Form 10-IEA Reference | yes | yes |
| `INCOME-TAX-CALCULATOR-FY2526-FY2627.html` | Income Tax Calculator FY25-26 & FY26-27 | yes | yes |

---

## Constraints

- **No production dependencies.** `package.json` exists only for the Vitest dev suite. Never add runtime npm deps or a build step.
- **Self-contained HTML files.** Do not split CSS/JS into external files unless it's one of the intentional shared files listed above.
- **`CNAME` file.** Do not delete or modify — it controls the GitHub Pages custom domain.
- **`brand-icons.css` path.** All pages reference it as `/brand-icons.css` (absolute). Do not rename or relocate.
- **Google Analytics.** Do not remove or change `G-YC101DVMH7`.
- **`localStorage` key `'theme'`.** Used by live users. Do not rename.
- **Service Worker cache.** Renaming/moving any file in `PRECACHE_URLS` requires updating `sw.js` and bumping `CACHE_NAME`.
- **`challan-parser.js` dual-module block.** The CommonJS export shim at the bottom is required for Vitest. Never remove it.

---

## CSS Conventions

- Custom properties on `:root` for light mode; overrides on `[data-theme="dark"]`.
- Semantic colour tokens used in `index.html`: `--olive`, `--olive-dark`, `--olive-deep`, `--olive-light`, `--olive-pale`, `--olive-bg`, `--cream`, `--text`, `--text-mid`, `--text-soft`, `--glass`, `--glass-border`, `--nav-bg`, `--card-bg`, `--section-alt`, `--footer-bg`.
- Tool pages use simpler tokens: `--primary`, `--accent`, `--text`, `--bg` — never hardcode colours.
- Mobile-first; breakpoint `768px` for hamburger/drawer nav.
- Hyphenated class names (BEM-like): `.hero-card`, `.section-title`, `.portfolio-card`.
- Font stack: `'Playfair Display'` (headings, serif), `'DM Sans'` (body).
- Brand colour: `#8c9a1a` (olive green), used as `--primary` / `theme-color` everywhere.

---

## SEO / Structured Data

`index.html` includes a `<script type="application/ld+json">` block with Schema.org `Person` and `WebSite` types. Tool pages do not need this block unless they represent a distinct service/product.

---

## Git Workflow

- **Main branch:** `master` (auto-deploys to GitHub Pages on push)
- **Feature branches:** `claude/<description>-<id>`
- Commit messages are imperative: `Fix mobile nav overflow`, `Add dark mode to challan parser`
- When adding a new tool, the commit should include all 4 changed files: the tool HTML, `sw.js`, `sitemap.xml`, `index.html`.
