/**
 * Tests for tu-tabbar.js — mobile bottom tab bar injected on every page.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { tabKeyFor, mount, isPageNav, ITEMS } = require('../tu-tabbar.js');

describe('tabKeyFor', () => {
  it.each([
    ['/', 'home'],
    ['/index.html', 'home'],
    ['/Compliance_Calendar_FY2627.html', 'cal'],
    ['/contact.html', 'contact'],
    ['/TDS-SECTION-CODE.html', 'tools'],
    ['/INCOME-TAX-CALCULATOR-FY2526-FY2627.html', 'tools'],
    ['/KNOWLEDGE-HUB.html', 'tools'],
    ['/CA-Prompt-Library.html', 'tools'],
    ['/about.html', ''],
    ['/disclaimer.html', ''],
    ['/no-such-page', ''],
  ])('%s → %s', (path, key) => {
    expect(tabKeyFor(path)).toBe(key);
  });
});

describe('mount', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<main></main>';
    document.documentElement.className = '';
  });

  it('adds one nav with 5 links in order', () => {
    mount(document, '/');
    const links = [...document.querySelectorAll('.tu-tabbar a')];
    expect(links.map(a => a.textContent)).toEqual(['Home', 'Tools', 'Tax Check', 'Calendar', 'Contact']);
    expect(links.map(a => a.getAttribute('href'))).toEqual(ITEMS.map(i => i.href));
    expect(document.querySelector('.tu-tabbar').getAttribute('aria-label')).toBe('Quick navigation');
  });

  it('marks only the current tab with aria-current', () => {
    mount(document, '/Compliance_Calendar_FY2627.html');
    const cur = document.querySelectorAll('.tu-tabbar a[aria-current="page"]');
    expect(cur.length).toBe(1);
    expect(cur[0].textContent).toBe('Calendar');
  });

  it('marks nothing on pages outside the five tabs', () => {
    mount(document, '/about.html');
    expect(document.querySelectorAll('.tu-tabbar a[aria-current]').length).toBe(0);
  });

  it('is idempotent and flags <html> for the page padding rule', () => {
    mount(document, '/');
    mount(document, '/');
    expect(document.querySelectorAll('.tu-tabbar').length).toBe(1);
    expect(document.querySelectorAll('#tu-tabbar-css').length).toBe(1);
    expect(document.documentElement.classList.contains('tu-has-tabbar')).toBe(true);
  });

  it('keeps icons decorative (hidden from screen readers)', () => {
    mount(document, '/');
    document.querySelectorAll('.tu-tabbar svg').forEach(svg => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });
});

describe('isPageNav (top loading bar)', () => {
  const loc = { origin: 'https://taxationupdates.com', pathname: '/', search: '' };
  const link = (href, attrs = {}) => {
    const a = document.createElement('a');
    a.href = new URL(href, 'https://taxationupdates.com/').href;
    Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v));
    return a;
  };
  const click = (o = {}) => ({ defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...o });

  it('shows for a same-origin page link', () => {
    expect(isPageNav(link('/TDS-SECTION-CODE.html'), click(), loc)).toBe(true);
  });
  it('ignores same-page hash links, external links and new tabs', () => {
    expect(isPageNav(link('/#portfolio'), click(), loc)).toBe(false);
    expect(isPageNav(link('https://x.com/TaxationUpdates'), click(), loc)).toBe(false);
    expect(isPageNav(link('/about.html', { target: '_blank' }), click(), loc)).toBe(false);
  });
  it('ignores downloads, PDFs and modified clicks', () => {
    expect(isPageNav(link('/articles/A.pdf'), click(), loc)).toBe(false);
    expect(isPageNav(link('/about.html', { download: '' }), click(), loc)).toBe(false);
    expect(isPageNav(link('/about.html'), click({ ctrlKey: true }), loc)).toBe(false);
    expect(isPageNav(link('/about.html'), click({ defaultPrevented: true }), loc)).toBe(false);
  });
});

describe('load bar', () => {
  it('is injected once with the tab bar', () => {
    document.body.innerHTML = '';
    mount(document, '/');
    mount(document, '/');
    expect(document.querySelectorAll('.tu-loadbar').length).toBe(1);
  });
});

describe('speculation rules', () => {
  const { addSpeculationRules, SPECULATION_RULES } = require('../tu-tabbar.js');

  beforeEach(() => {
    document.head.innerHTML = '';
    delete HTMLScriptElement.supports;
  });

  it('prefetches same-site pages with moderate eagerness', () => {
    const rule = SPECULATION_RULES.prefetch[0];
    expect(rule.eagerness).toBe('moderate');
    expect(rule.where.and[0]).toEqual({ href_matches: '/*' });
  });

  it('never prefetches articles, PDFs, downloads or new-tab links', () => {
    const [, files, attrs] = SPECULATION_RULES.prefetch[0].where.and;
    expect(files.not.href_matches).toEqual(expect.arrayContaining(['/articles/*', '/*.pdf', '/*.xlsx']));
    expect(attrs.not.selector_matches).toContain('[download]');
    expect(attrs.not.selector_matches).toContain('[target="_blank"]');
  });

  it('does nothing in browsers without speculation rules support', () => {
    expect(addSpeculationRules(document)).toBeNull();
    expect(document.querySelector('script[type="speculationrules"]')).toBeNull();
  });

  it('injects one valid JSON rules script when supported', () => {
    HTMLScriptElement.supports = t => t === 'speculationrules';
    addSpeculationRules(document);
    addSpeculationRules(document);
    const tags = document.querySelectorAll('script[type="speculationrules"]');
    expect(tags.length).toBe(1);
    expect(JSON.parse(tags[0].textContent)).toEqual(SPECULATION_RULES);
  });
});
