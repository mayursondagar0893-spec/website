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

Tests use **Vitest ^2.1.0 + jsdom ^25.0.0**. Two test files (`wa-init.test.js`, `dark-mode.test.js`) run in the jsdom environment; the rest run in Node. After editing any shared JS file (`challan-parser.js`, `contact-form.js`, `prompt-filter.js`, `wa-init.js`, `sw.js`) run `npm test` before committing.

---

## Architecture

### File layout pattern
Each HTML tool is fully self-contained: its CSS lives in `<style>` tags and its JS lives in `<script>` tags inside that file. The only shared external files are:

| File | Purpose |
|---|---|
| `brand-icons.css` | Social icon brand colours — linked by every page at `/brand-icons.css` |
| `wa-init.js` | Initialises `.wa-link` click handlers with a Base64-encoded WhatsApp number |
| `challan-parser.js` | PDF challan parsing (ITNS 280/281/282/283) — used by the challan tool and unit tests |
| `contact-form.js` | Contact form validation + WhatsApp URL builders — used by `index.html` and tests |
| `prompt-filter.js` | Filter/sort/bookmark helpers for the prompt library — used by `CA-Prompt-Library.html` and tests |

### Dual-module pattern (critical)
The three `*.js` files above (`challan-parser.js`, `contact-form.js`, `prompt-filter.js`) end with:
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
```

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

- Custom properties on `:root` for light mode; overrides on `[data-theme="dark"]`.
- Use semantic tokens (`--primary`, `--accent`, `--text`, `--bg`) — never hardcode colours.
- Mobile-first; breakpoint `768px` for hamburger/drawer nav.
- Hyphenated class names (BEM-like): `.hero-card`, `.section-title`.

---

## Git Workflow

- **Main branch:** `master` (auto-deploys to GitHub Pages on push)
- **Feature branches:** `claude/<description>-<id>`
- Commit messages are imperative: `Fix mobile nav overflow`, `Add dark mode to challan parser`
