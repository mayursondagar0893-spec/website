# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

**taxationupdates.com** — GitHub Pages static site for CA Mayur Sondagar. Personal brand + interactive Indian tax/CA tools. No backend, no build step; files are served as-is by GitHub Pages.

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

If `npm test` says `vitest: not found`, run `npm install` first (`node_modules` is not committed). CI runs the same suite on every push/PR via `.github/workflows/test.yml`.

```bash
# Refresh <lastmod> dates in sitemap.xml (git date per file; today if uncommitted)
./update-sitemap-dates.sh
```

### Test suite (8 files)

| File | Environment | What it tests |
|---|---|---|
| `tests/challan-parser.test.js` | Node | `clean`, `parseAmount`, `between`, `get`, `parseChallan` from `challan-parser.js` |
| `tests/contact-form.test.js` | Node | `validateForm`, `buildWAMessage`, `buildWAUrl` from `contact-form.js` |
| `tests/prompt-filter.test.js` | Node | `filterAndSort` (category, difficulty, bookmark, recent, new filters), `toggleBookmark`, `extractPlaceholders`, `fillPlaceholders`, `applyOutputOptions`, `OUTPUT_OPTIONS`, `pushRecent` from `prompt-filter.js` |
| `tests/sw.test.js` | Node | `CACHE_NAME` format, `PRECACHE_URLS` contents, fetch routing logic from `sw.js` |
| `tests/wa-init.test.js` | **jsdom** | WhatsApp link click handler, Base64 encoding in `wa-init.js` |
| `tests/dark-mode.test.js` | **jsdom** | `localStorage` persistence and theme toggle logic |
| `tests/compliance-data.test.js` | Node | Row shape of `COMPLIANCE_DATA`, `upcomingDeadlines`, `isoDate`, `daysUntil` from `compliance-data.js` |
| `tests/tu-tabbar.test.js` | **jsdom** | `tabKeyFor` page → tab mapping, `mount` (5 links, `aria-current`, idempotent) and `isPageNav` (top loading-bar link filter) from `tu-tabbar.js` |

After editing any shared JS file (`challan-parser.js`, `contact-form.js`, `prompt-filter.js`, `compliance-data.js`, `tu-tabbar.js`, `wa-init.js`, `sw.js`) run `npm test` before committing.

---

## Architecture

### File layout pattern
Each HTML tool is fully self-contained: its CSS lives in `<style>` tags and its JS lives in `<script>` tags inside that file. The only shared external files are:

| File | Purpose | Also precached? |
|---|---|---|
| `brand-icons.css` | Social icon brand colours — linked by every page at `/brand-icons.css` | No |
| `wa-init.js` | Initialises `.wa-link` click handlers with a Base64-encoded WhatsApp number | No |
| `challan-parser.js` | PDF challan parsing (ITNS 280/280N/281/281N/282/283) — used by the challan tool and unit tests | **Yes** — listed in `PRECACHE_URLS` |
| `contact-form.js` | Contact form validation + WhatsApp URL builders — used by `index.html` and tests | No |
| `prompt-filter.js` | Filter/sort/bookmark, placeholder fill, output options and recent-prompts helpers for the prompt library — used by `CA-Prompt-Library.html` and tests | No |
| `compliance-data.js` | FY 2026-27 due-date rows (`COMPLIANCE_DATA`) + `upcomingDeadlines()` — the **only** copy of the calendar data; used by `Compliance_Calendar_FY2627.html` (`const DATA = COMPLIANCE_DATA`) and the homepage "Due next" card | **Yes** |
| `tu-tabbar.js` | Mobile bottom tab bar (Home · Tools · Tax Check · Calendar · Contact), ≤768px only. Also injects the top page-loading bar (`.tu-loadbar`, all widths). Self-injects its CSS + markup; loaded on **every page** with `<script src="/tu-tabbar.js" defer></script>` before `</body>` | **Yes** |

### Dual-module pattern (critical)
The `*.js` files above (`challan-parser.js`, `contact-form.js`, `prompt-filter.js`, `compliance-data.js`, `tu-tabbar.js`) end with:
```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ... };
}
```
In the browser they are loaded as `<script>` tags and their functions become globals. In Vitest they are `require()`'d as CommonJS modules. **Never remove this block.**

### Dark mode
Every page persists and restores theme via `localStorage.getItem/setItem('theme', ...)` and toggles `document.documentElement.setAttribute('data-theme', 'light'|'dark')`. The key **must** stay `'theme'` — live users depend on it.

Placement is flexible — the theme init can appear either:
- Inline at the top of `<head>` (minified, avoids flash-of-wrong-theme), **or**
- In a `<script>` block before `</body>` (original pattern)

Both are valid as long as the `localStorage` key is `'theme'` and the attribute is `data-theme`.

### PWA / Service Worker
`sw.js` pre-caches tool pages for offline use. Current `CACHE_NAME`: **`taxationupdates-v12`**.  
Strategy: network-first for HTML, cache-first for everything else (same-origin only).  
Bump the version number whenever you add/rename a cached file. The script `add-tool.sh` does this automatically.

Current `PRECACHE_URLS` (as of `taxationupdates-v12`):
```
/                                       /index.html
/TDS-SECTION-CODE.html                  /CA-Prompt-Library.html
/INCOME-TAX-CHALLAN-TO-EXCEL.html       /about.html
/contact.html                           /disclaimer.html
/privacy-policy.html                    /icons/icon-192.png
/icons/icon-512.png                     /manifest.json
/challan-parser.js                      /Compliance_Calendar_FY2627.html
/FORM-10-IEA-REFERENCE.html             /INCOME-TAX-CALCULATOR-FY2526-FY2627.html
/KNOWLEDGE-HUB.html                     /icons/logo.svg
/compliance-data.js                     /tu-tabbar.js
```

### Phone number security
The WhatsApp number is Base64-encoded in `wa-init.js` (`atob('...')`). Never expose the decoded number in plaintext anywhere in the repo.

### Articles (blog section on index.html)
Article files (PDF/JPEG) live in `/articles/` and are served directly by GitHub Pages — no upload service, no backend. This replaced the earlier pattern of linking out to Google Drive.

**Current articles:**
- `Section-Comparison-Income-Tax-Act-1961-vs-2025.pdf`
- `Tax-Amount-New-Regime-FY2025-26.pdf`

**To add a new article:**
1. Save the file to `/articles/` using UPPER/kebab-case matching the article title, e.g. `/articles/Article-Title-Here.pdf`.
2. Add a new `.blog-card` in the `.blog-grid` section of `index.html` (copy an existing card as a template — emoji, category badge, date, title, one-line description).
3. Wire up both actions:
   - `Read More →` — a `<button type="button" class="blog-read" onclick="openArticlePreview('/articles/FILENAME.pdf','Article Title')">`. This opens the in-page preview modal (`#article-modal-overlay`, PDF embedded in an `<iframe>` with its own Download button) — do **not** use a new-tab link.
   - `⬇ Download PDF` — `<a href="/articles/FILENAME.pdf" download …>` to force download.
   - Escape any `'` in the title passed to `openArticlePreview`.
4. Articles are **not** added to `sw.js` `PRECACHE_URLS` (they're downloadable documents, not app pages) — no cache version bump needed.
5. Update `sitemap.xml` with the new article URL if you want it indexed by search engines.

---

### Homepage smart features (index.html)
- **Smart Tax Check** (`#tax-check`): live New Regime estimate, 3D slab chart and ready-reckoner table. Slabs, ₹75,000 standard deduction, the s.87A/s.156 rebate (₹60,000 up to ₹12 L, with marginal relief) and 4% cess must stay in sync with `INCOME-TAX-CALCULATOR-FY2526-FY2627.html` (`NR`, `rebN`). Surcharge (10% / 15% / 25% with marginal relief at ₹50 L / ₹1 Cr / ₹2 Cr) mirrors `srN` / `mrN` in the calculator for normal-rate income. It deliberately excludes special-rate income (s.111A/112A), the Old Regime and non-individuals.
- **Command palette** (`#cmdk`, Ctrl/⌘+K or `/`): edit the `ITEMS` array when adding a tool, section or article.

### Mobile navigation (every page)
- **Bottom tab bar** comes from `/tu-tabbar.js` (≤768px). It sits at `z-index:400` — above sticky headers, below every modal (≥500). It adds `body{padding-bottom}` and lifts `#btt, #scrollTopBtn, #toast, .toast, #resultToast` with `margin-bottom`; if a new page has another bottom-anchored floating element, add its selector to `LIFT_SELECTORS`. The bar's positioning uses `!important` because some pages style bare `nav {}`.
- **New tools:** add the filename (lower-case) to `TOOL_PAGES` in `tu-tabbar.js` so the "Tools" tab highlights, and include the script tag (`add-tool.sh` checks for it).
- **Homepage:** the hamburger/drawer is hidden ≤768px (tab bar + section tabs replace it). The "Due next" card (`#due-next`) shows the next 3 rows of `compliance-data.js`, skipping AGM-relative rows.
- **TDS Codes & IT Calculator phones:** `.site-topnav` is hidden ≤768px; page actions live in a "⋯" menu (`#tuMore`). TDS has quick chips (`#tuQuick`) that drive the existing `.typebtn` / `toggleFavFilter()` controls and a Filters toggle (`body.tu-filters-open`). The calculator's result card (`#tuVerdict`) and lakh/crore hints (`.tu-lakh`) mirror `n-total`/`o-total` by wrapping `calc()`, and carry `data-html2canvas-ignore` so PDF/JPEG exports are unchanged.
- **Calculator regime colours:** New = brand olive `#ADB11F`, Old = amber `#EE9A3A`, both with dark ink `#1f2006` text (the old Excel green/orange with white text failed WCAG AA).

### Motion / page transitions (every page)
- **Cross-page transitions:** each page's `tu-a11y` style block ends with a `tu-motion` section: `@view-transition{navigation:auto}` plus fade/slide keyframes on `::view-transition-old/new(root)`. Pure CSS progressive enhancement (Chrome/Edge 126+, Safari 18.2+; other browsers just navigate normally). Copy it into new tools along with the rest of `tu-a11y`.
- **Loading bar:** `tu-tabbar.js` shows a 3px olive bar at the top when a same-origin page link is clicked (`isPageNav` skips hash links, downloads/PDFs, new tabs, modified clicks and links whose handler calls `preventDefault`); reset on `pageshow` for back/forward cache. The tab bar has `view-transition-name:tu-tabbar` so it stays still while pages cross-fade.
- **Homepage hero:** staggered blur-rise entrance (`tuRise`), shimmer on `h1 .accent`, pop on `h1 .highlight`, floating `.hero-deco` glows, avatar ring pulse, and a count-up on `.hero-stats .stat-num` (final text restored exactly).
- Every animation is disabled under `prefers-reduced-motion: reduce` — keep it that way for anything new.

### Accessibility layer (every page)
Each page has a `<style id="tu-a11y">` block immediately before `</head>` and one `<a class="tu-skip">Skip to main content</a>` right after `<body>`. Keep both when editing or adding pages (copy them from an existing page into new tools).
- **Skip link** moves focus to the element marked `data-tu-skip-target` (with `tabindex="-1"`) via `onclick` + `preventDefault`, so it never changes `location.hash` (TDS Codes and Knowledge Hub use the hash for deep links/filters).
- **Focus ring:** `:focus-visible` → 3px outline in `--tu-focus` (`#5b5d0b` light / `#dfe35a` dark). Do not add `outline:none` without a visible replacement. Never use positive `tabindex`.
- **Contrast (WCAG AA 4.5:1):** text on `#ADB11F` olive fills/gradients must be dark ink `#1f2006` (7.1:1), not white (2.3:1). `--tu-grad` ends at `#999d1a` so dark ink passes on every stop. Logo tiles (white logotype) are exempt.
- **Screen-reader results:** calculators announce one debounced sentence through a visually hidden `role="status"` element (`.tu-sr-only`) — homepage `#tc-sr`, calculator `#tu-calc-sr` (`tuAnnounce()`). Don't put `aria-live` on animated number boxes.

## Current Tool Inventory

| File | Title |
|---|---|
| `index.html` | CA Mayur Sondagar – Taxation Updates (homepage) |
| `about.html` | About |
| `contact.html` | Contact |
| `disclaimer.html` | Disclaimer |
| `privacy-policy.html` | Privacy Policy |
| `TDS-SECTION-CODE.html` | TDS Section Code Reference |
| `CA-Prompt-Library.html` | CA Prompt Library |
| `INCOME-TAX-CHALLAN-TO-EXCEL.html` | Income Tax Challan to Excel |
| `Compliance_Calendar_FY2627.html` | Compliance Calendar FY 2026-27 |
| `FORM-10-IEA-REFERENCE.html` | Form 10-IEA Reference |
| `INCOME-TAX-CALCULATOR-FY2526-FY2627.html` | Income Tax Calculator FY 2025-26 & FY 2026-27 |
| `KNOWLEDGE-HUB.html` | Knowledge Hub (curated GST & Income Tax links by author; edit the `AUTHORS` array to add links) |
| `404.html` | Page Not Found (served by GitHub Pages for any missing URL; `noindex`, no canonical, "Did you mean" + tool search — add new tools to its `PAGES` array) |

When a new tool is added via `add-tool.sh`, update this table.

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

5. **Update the tool inventory table** in this file.

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
  <link rel="icon" type="image/svg+xml" href="/icons/logo.svg"/>
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png"/>
  <meta name="theme-color" content="#adb11f"/>
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
    :root { --primary: #ADB11F; /* ... */ }
    [data-theme="dark"] { /* ... */ }
  </style>
</head>
```

### Required dark mode JS (before `</body>` — or inline at top of `<head>` to avoid FOUC)
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
```

### Optional: Schema.org structured data
Newer tools include a `WebApplication` JSON-LD block for richer search results:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TOOL TITLE",
  "url": "https://taxationupdates.com/FILENAME.html",
  "description": "TOOL DESCRIPTION",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
  "author": { "@type": "Person", "@id": "https://taxationupdates.com/#person", "name": "CA Mayur J Sondagar" }
}
</script>
```
This is optional but recommended for tools. `index.html` uses `Person` + `WebSite` types.

---

## Constraints

- **No production dependencies.** `package.json` exists only for the Vitest dev suite. Never add runtime npm deps or a build step.
- **Self-contained HTML files.** Do not split CSS/JS into external files unless it's one of the intentional shared files listed above.
- **`CNAME` file.** Do not delete or modify — it controls the GitHub Pages custom domain.
- **`brand-icons.css` path.** All pages reference it as `/brand-icons.css` (absolute). Do not rename or relocate.
- **Google Analytics.** Do not remove or change `G-YC101DVMH7`.
- **`localStorage` key `'theme'`.** Used by live users. Do not rename.
- **Service Worker cache.** Renaming/moving any file in `PRECACHE_URLS` requires updating `sw.js` and bumping `CACHE_NAME`.

---

## CSS Conventions

- **Brand colour = logo colour `#ADB11F`** (sampled from the Taxation Updates logo). All olive shades sit on the logo's hue (~62°). Use `#ADB11F` for fills, logo tiles, active tabs and `theme-color`; use the darker same-hue ink (`#6e7112` / `--olive` `#73760f`) for text on light backgrounds, because `#ADB11F` text on white is not legible.
- Logo assets: `/icons/logo.svg` (vector), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`; social share image `/og-cover.png` (1200×630, keep under 300–350 KB).

- Custom properties on `:root` for light mode; overrides on `[data-theme="dark"]`.
- Use semantic tokens (`--primary`, `--accent`, `--text`, `--bg`) — never hardcode colours.
- Mobile-first; breakpoint `768px` for hamburger/drawer nav.
- Hyphenated class names (BEM-like): `.hero-card`, `.section-title`.

---

## Git Workflow

- **Main branch:** `master` (auto-deploys to GitHub Pages on push)
- **Feature branches:** `claude/<description>-<id>`
- Commit messages are imperative: `Fix mobile nav overflow`, `Add dark mode to challan parser`
