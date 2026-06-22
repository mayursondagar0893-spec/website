/* ═══════════════════════════════════════════════════════════════
   Taxation Updates — Service Worker
   Caches key tool pages for offline access.
   Strategy: Cache-first for static assets, Network-first for HTML.
═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'taxationupdates-v8';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/TDS-SECTION-CODE.html',
  '/CA-Prompt-Library.html',
  '/INCOME-TAX-CHALLAN-TO-EXCEL.html',
  '/about.html',
  '/contact.html',
  '/disclaimer.html',
  '/privacy-policy.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
  '/challan-parser.js',
  '/Compliance_Calendar_FY2627.html',
  '/FORM-10-IEA-REFERENCE.html',
  '/INCOME-TAX-CALCULATOR-FY2526-FY2627.html',
];

// Pure routing helpers — also exported for unit testing (see module.exports below)

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

// Register Service Worker event listeners only in a SW/browser context
if (typeof self !== 'undefined') {
  // Install: pre-cache all listed URLs
  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
  });

  // Activate: delete old caches
  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
    );
    self.clients.claim();
  });

  // Fetch: Network-first for HTML, Cache-first for everything else
  self.addEventListener('fetch', event => {
    const { request } = event;

    // Only handle same-origin requests
    if (!isSameOrigin(request.url, location.origin)) return;

    if (isHtmlRequest(request.headers.get('accept'))) {
      // Network-first for HTML pages — always try to get fresh content
      event.respondWith(
        fetch(request)
          .then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            return response;
          })
          .catch(() => caches.match(request))
      );
    } else {
      // Cache-first for assets (fonts, images, scripts)
      event.respondWith(
        caches.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            return response;
          });
        })
      );
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CACHE_NAME, PRECACHE_URLS, isHtmlRequest, isSameOrigin };
}
