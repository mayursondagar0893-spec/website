/**
 * Tests for tu-tabbar.js — mobile bottom tab bar injected on every page.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { tabKeyFor, mount, ITEMS } = require('../tu-tabbar.js');

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
