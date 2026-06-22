/**
 * Tests for sw.js — Service Worker
 *
 * CACHE_NAME, PRECACHE_URLS, and the routing helpers (isHtmlRequest,
 * isSameOrigin) are imported directly from sw.js via CommonJS require so
 * that any change to the real implementation is immediately caught here.
 * The event listeners in sw.js are guarded by `typeof self !== 'undefined'`
 * and therefore do not execute in this Node test environment.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { CACHE_NAME, PRECACHE_URLS, isHtmlRequest, isSameOrigin } = require('../sw.js');

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CACHE_NAME', () => {
  it('is defined in sw.js', () => {
    expect(CACHE_NAME).not.toBeNull();
  });

  it('starts with "taxationupdates-"', () => {
    expect(CACHE_NAME).toMatch(/^taxationupdates-/);
  });

  it('ends with a version suffix (e.g. v1, v2, …)', () => {
    expect(CACHE_NAME).toMatch(/v\d+$/);
  });

  it('matches the pattern taxationupdates-vN exactly', () => {
    expect(CACHE_NAME).toMatch(/^taxationupdates-v\d+$/);
  });
});

describe('PRECACHE_URLS — required pages', () => {
  const REQUIRED = [
    '/',
    '/index.html',
    '/TDS-SECTION-CODE.html',
    '/CA-Prompt-Library.html',
    '/INCOME-TAX-CHALLAN-TO-EXCEL.html',
    '/about.html',
    '/contact.html',
    '/disclaimer.html',
    '/privacy-policy.html',
    '/Compliance_Calendar_FY2627.html',
    '/FORM-10-IEA-REFERENCE.html',
    '/INCOME-TAX-CALCULATOR-FY2526-FY2627.html',
  ];

  REQUIRED.forEach(url => {
    it(`includes ${url}`, () => {
      expect(PRECACHE_URLS).toContain(url);
    });
  });
});

describe('PRECACHE_URLS — required assets', () => {
  const ASSETS = [
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json',
  ];

  ASSETS.forEach(asset => {
    it(`includes ${asset}`, () => {
      expect(PRECACHE_URLS).toContain(asset);
    });
  });
});

describe('PRECACHE_URLS — integrity', () => {
  it('contains at least 10 entries', () => {
    expect(PRECACHE_URLS.length).toBeGreaterThanOrEqual(10);
  });

  it('has no duplicate entries', () => {
    const unique = new Set(PRECACHE_URLS);
    expect(unique.size).toBe(PRECACHE_URLS.length);
  });

  it('every entry starts with "/"', () => {
    PRECACHE_URLS.forEach(url => {
      expect(url).toMatch(/^\//);
    });
  });

  it('contains no empty strings', () => {
    PRECACHE_URLS.forEach(url => {
      expect(url.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('fetch routing — isHtmlRequest', () => {
  it('returns true for "text/html" Accept header', () => {
    expect(isHtmlRequest('text/html,application/xhtml+xml')).toBe(true);
  });

  it('returns true for an Accept header that contains text/html', () => {
    expect(isHtmlRequest('text/html')).toBe(true);
  });

  it('returns false for image Accept headers', () => {
    expect(isHtmlRequest('image/webp,image/png')).toBe(false);
  });

  it('returns false for JS/CSS Accept headers', () => {
    expect(isHtmlRequest('application/javascript')).toBe(false);
    expect(isHtmlRequest('text/css')).toBe(false);
  });

  it('returns false for an undefined/null Accept header', () => {
    expect(isHtmlRequest(undefined)).toBe(false);
    expect(isHtmlRequest(null)).toBe(false);
  });
});

describe('fetch routing — isSameOrigin', () => {
  const ORIGIN = 'https://taxationupdates.com';

  it('returns true for same-origin URLs', () => {
    expect(isSameOrigin('https://taxationupdates.com/index.html', ORIGIN)).toBe(true);
    expect(isSameOrigin('https://taxationupdates.com/', ORIGIN)).toBe(true);
  });

  it('returns false for cross-origin URLs', () => {
    expect(isSameOrigin('https://fonts.googleapis.com/css2', ORIGIN)).toBe(false);
    expect(isSameOrigin('https://www.googletagmanager.com/gtag/js', ORIGIN)).toBe(false);
    expect(isSameOrigin('https://cdnjs.cloudflare.com/ajax/libs/pdf.js', ORIGIN)).toBe(false);
  });

  it('returns false for malformed URLs', () => {
    expect(isSameOrigin('not-a-url', ORIGIN)).toBe(false);
    expect(isSameOrigin('', ORIGIN)).toBe(false);
  });
});

describe('fetch routing — strategy selection', () => {
  // Combines both helpers to simulate the SW fetch handler decision
  function getStrategy(requestUrl, acceptHeader, swOrigin) {
    if (!isSameOrigin(requestUrl, swOrigin)) return 'skip'; // cross-origin: do nothing
    if (isHtmlRequest(acceptHeader)) return 'network-first';
    return 'cache-first';
  }

  const ORIGIN = 'https://taxationupdates.com';

  it('uses network-first for same-origin HTML requests', () => {
    expect(getStrategy(`${ORIGIN}/index.html`, 'text/html', ORIGIN)).toBe('network-first');
  });

  it('uses cache-first for same-origin image requests', () => {
    expect(getStrategy(`${ORIGIN}/icons/icon-192.png`, 'image/png', ORIGIN)).toBe('cache-first');
  });

  it('uses cache-first for same-origin JS/CSS requests', () => {
    expect(getStrategy(`${ORIGIN}/brand-icons.css`, 'text/css', ORIGIN)).toBe('cache-first');
    expect(getStrategy(`${ORIGIN}/wa-init.js`, 'application/javascript', ORIGIN)).toBe('cache-first');
  });

  it('skips cross-origin requests entirely', () => {
    expect(getStrategy('https://fonts.googleapis.com/css2', 'text/css', ORIGIN)).toBe('skip');
    expect(getStrategy('https://www.googletagmanager.com/gtag/js', '*/*', ORIGIN)).toBe('skip');
  });
});
