/**
 * Tests for sw.js — Service Worker
 *
 * Because Service Workers run in a specialised global scope (not Node or
 * browser), we test the configuration constants by parsing the source file
 * directly and test the fetch-routing logic as pure functions extracted from
 * the SW implementation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SW_SRC = fs.readFileSync(path.resolve(__dirname, '../sw.js'), 'utf8');

// ─── Parse constants from source ─────────────────────────────────────────────

function extractCacheName(src) {
  const m = src.match(/const CACHE_NAME\s*=\s*'([^']+)'/);
  return m ? m[1] : null;
}

function extractPrecacheUrls(src) {
  const m = src.match(/const PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(line => line.trim().replace(/^'|',?$/g, ''))
    .filter(Boolean);
}

const CACHE_NAME    = extractCacheName(SW_SRC);
const PRECACHE_URLS = extractPrecacheUrls(SW_SRC);

// ─── Fetch-routing logic (pure — extracted from sw.js) ───────────────────────
//
// These functions mirror the conditional inside the 'fetch' event handler.
// Testing them as pure functions lets us verify routing decisions without
// needing a real Service Worker environment.

function isHtmlRequest(acceptHeader) {
  return (acceptHeader || '').includes('text/html');
}

function isSameOrigin(requestUrl, swOrigin) {
  try {
    return new URL(requestUrl).origin === swOrigin;
  } catch {
    return false;
  }
}

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
    '/challan-parser.html',
    '/about.html',
    '/contact.html',
    '/disclaimer.html',
    '/privacy-policy.html',
    '/Compliance_Calendar_FY2627.html',
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
