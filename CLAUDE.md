# CLAUDE.md — AI Assistant Guide for taxationupdates.com

This file provides context for AI assistants (Claude, Copilot, etc.) working on this codebase.

---

## Project Overview

**Domain:** taxationupdates.com (GitHub Pages static site)
**Owner:** CA Mayur Sondagar — Chartered Accountant, content creator, and tax expert
**Purpose:** Personal brand website + interactive tax/CA tools

---

## Repository Structure

```
/
├── index.html              # Main landing page (portfolio/personal brand)
├── CA-Prompt-Library.html  # Searchable AI prompt library for CAs (500+ prompts)
├── TDS-SECTION-CODE.html   # Interactive TDS/TCS section code reference
├── challan-parser.html     # PDF/Excel challan parser tool
├── privacy-policy.html     # Privacy policy page
├── CNAME                   # GitHub Pages custom domain config
└── README.md               # Minimal readme
```

No build system, no package manager, no backend — this is a **pure static site**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Languages | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Hosting | GitHub Pages |
| External Libraries | PDF.js (challan parser), XLSX.js (Excel export) |
| Fonts | Google Fonts (Inter, Poppins) |
| Analytics | Google Analytics (G-YC101DVMH7) |
| Storage | `localStorage` only (no backend/database) |

---

## Development Workflow

### No Build Process
There is no `npm install`, `npm run build`, or compilation step. All files are served as-is.

### Editing
- Edit HTML files directly — changes are immediately visible in a browser.
- All CSS is embedded in `<style>` tags within each HTML file.
- All JavaScript is embedded in `<script>` tags within each HTML file.

### Testing
- No automated test suite exists.
- Manual browser testing is the only testing method.
- Test across light/dark mode, mobile (≤768px), and desktop viewports.

### Deployment
- Push to `master` (or `main`) branch → GitHub Pages auto-deploys.
- Domain configured via `CNAME` file.

---

## Code Conventions

### CSS

- **Theming:** CSS custom properties on `:root` for light mode; overrides on `[data-theme="dark"]`.
  ```css
  :root { --primary: #0ea5e9; --bg: #f8fafc; }
  [data-theme="dark"] { --bg: #0f172a; }
  ```
- **Naming:** Hyphenated class names (BEM-like): `.hero-card`, `.section-title`, `.nav-logo`.
- **Responsive:** Mobile-first. Breakpoint: `768px` for hamburger/drawer nav.
- **Tokens:** Use semantic variables (`--primary`, `--accent`, `--text`, `--bg`) — never hardcode colors.

### JavaScript

- **No frameworks.** Vanilla JS only using modern APIs.
- **Dark mode persistence:**
  ```js
  localStorage.setItem('theme', 'dark');
  document.documentElement.setAttribute('data-theme', 'dark');
  ```
- **Scroll animations:** `IntersectionObserver` with `data-animate` attributes.
- **Security:** Phone/WhatsApp numbers are Base64-encoded to prevent scraping:
  ```js
  const num = atob('...encoded...');
  ```
- **Performance:** Scroll event listeners use `{ passive: true }`.

### HTML

- Semantic HTML5: `<nav>`, `<section id="...">`, `<footer>`, `<main>`.
- IDs follow kebab-case: `id="hero"`, `id="contact-form"`.
- Navigation links use `href="#section-id"` anchors for single-page scroll.
- Meta tags for SEO and Open Graph are present in every page `<head>`.

---

## Key Features per File

### `index.html`
- Hero section with social stats (Twitter/LinkedIn follower counts shown as clickable pills).
- Services, portfolio, testimonials, blog sections.
- Contact via WhatsApp (encoded number).
- Hamburger mobile menu (`id="ham"`) with drawer overlay (`id="mobile-menu"`).
- Back-to-top button appears after scrolling 400px.
- Active nav link highlighting based on scroll position.

### `CA-Prompt-Library.html`
- 500+ categorized prompts for CAs stored as inline JS data.
- Sidebar category navigation.
- Search, sort, bookmark (localStorage), and copy-to-clipboard.
- 6 themes: Dark, Light, Ocean, Forest, Rose, Slate.

### `TDS-SECTION-CODE.html`
- Reference table for Income Tax Act 1961 + Finance Bill 2026 TDS/TCS codes.
- Color-coded categories; light/dark toggle.

### `challan-parser.html`
- Drag-and-drop or click-to-upload PDF/Excel files.
- Parses challans using PDF.js (CDN).
- Exports data to Excel using XLSX.js (CDN).

---

## Important Constraints

1. **No dependencies to install.** Never add `npm`, `yarn`, or build steps unless explicitly requested.
2. **Keep files self-contained.** Each HTML file embeds its own CSS and JS — do not split into separate files unless asked.
3. **Preserve localStorage keys.** Existing keys (`theme`, `bookmarks`, etc.) are used by live users — renaming them breaks persistence.
4. **WhatsApp number encoding.** Never expose the raw phone number in plaintext — always use `atob()` decoding pattern.
5. **Google Analytics tag.** Do not remove or change the GA4 measurement ID `G-YC101DVMH7`.
6. **CNAME file.** Do not delete or modify — it controls the custom domain on GitHub Pages.

---

## Git Workflow

- **Main branch:** `master` (production/live)
- **Feature branches:** `claude/<description>-<id>` naming convention (used by AI assistants)
- Commit messages are imperative and descriptive: `Fix mobile nav overflow`, `Add dark mode to challan parser`
- GPG/SSH commit signing is enabled — commits are signed automatically via git config.

---

## Common Tasks for AI Assistants

| Task | Notes |
|---|---|
| Add a new section to index.html | Follow existing section structure with `<section id="..." class="...">`, add nav link |
| Add a new prompt category | Edit the JS data array in `CA-Prompt-Library.html`, add sidebar entry |
| Update TDS rates/sections | Edit the table rows in `TDS-SECTION-CODE.html` |
| Change brand colors | Update CSS custom properties in `:root` and `[data-theme="dark"]` blocks |
| Add a new standalone tool | Create a new `.html` file following the self-contained pattern; link from `index.html` |
