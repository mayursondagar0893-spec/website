/* tu-tabbar.js — mobile bottom tab bar shared by every page.
 * Load with <script src="/tu-tabbar.js" defer></script> just before </body>.
 * Shows only at ≤768px. Injects its own CSS + markup, so pages need nothing else.
 * Sits at z-index 400: above sticky page headers (≤200), below every modal/overlay (≥500).
 * Floating buttons/toasts that sit near the bottom edge are lifted above the bar via
 * margin-bottom (LIFT_SELECTORS) so their own bottom/transform animations keep working.
 */
(function () {
  var ITEMS = [
    { k: 'home',    href: '/',                                  t: 'Home',
      svg: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>' },
    { k: 'tools',   href: '/#portfolio',                        t: 'Tools',
      svg: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>' },
    { k: 'tax',     href: '/#tax-check',                        t: 'Tax Check',
      svg: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>' },
    { k: 'cal',     href: '/Compliance_Calendar_FY2627.html',   t: 'Calendar',
      svg: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13.5h.01M12 13.5h.01M16.5 13.5h.01M7.5 17h.01M12 17h.01"/>' },
    { k: 'contact', href: '/contact.html',                      t: 'Contact',
      svg: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/>' }
  ];

  var TOOL_PAGES = [
    'tds-section-code.html', 'ca-prompt-library.html', 'income-tax-challan-to-excel.html',
    'form-10-iea-reference.html', 'income-tax-calculator-fy2526-fy2627.html', 'knowledge-hub.html'
  ];

  var LIFT_SELECTORS = '#btt,#scrollTopBtn,#toast,.toast,#resultToast';

  /* Which tab is "current" for a URL path. '' means none (about, disclaimer, 404 …). */
  function tabKeyFor(pathname) {
    var f = String(pathname || '/').split('/').pop().toLowerCase();
    if (f === '' || f === 'index.html') return 'home';
    if (f === 'compliance_calendar_fy2627.html') return 'cal';
    if (f === 'contact.html') return 'contact';
    if (TOOL_PAGES.indexOf(f) > -1) return 'tools';
    return '';
  }

  var CSS =
    '.tu-tabbar{display:none}' +
    '@media (max-width:768px){' +
      'html.tu-has-tabbar body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))!important}' +
      'html.tu-has-tabbar :is(' + LIFT_SELECTORS + '){margin-bottom:calc(62px + env(safe-area-inset-bottom,0px))!important}' +
      '.tu-tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;' +
        'width:auto!important;height:auto!important;min-height:0!important;max-width:none!important;transform:none!important;z-index:400!important;' +
        'padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px));margin:0;' +
        'background:rgba(255,255,252,.96);border-top:1px solid rgba(110,113,18,.18);box-shadow:0 -6px 20px rgba(31,32,6,.08);' +
        '-webkit-backdrop-filter:saturate(1.4) blur(10px);backdrop-filter:saturate(1.4) blur(10px);' +
        'font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}' +
      '.tu-tabbar a{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:48px;justify-content:center;' +
        'color:#5f614a;text-decoration:none;font-size:11px;font-weight:600;line-height:1.1;letter-spacing:0;border-radius:12px;-webkit-tap-highlight-color:transparent}' +
      '.tu-tabbar .tu-tb-ic{display:grid;place-items:center;width:52px;height:28px;border-radius:999px;transition:background .2s}' +
      '.tu-tabbar svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
      '.tu-tabbar a[aria-current="page"]{color:#5b5d0b}' +
      '.tu-tabbar a[aria-current="page"] .tu-tb-ic{background:#e9ebbd}' +
      '.tu-tabbar a[aria-current="page"] svg{stroke-width:2.2}' +
      '.tu-tabbar a:focus-visible{outline:3px solid #5b5d0b;outline-offset:-3px}' +
      ':is([data-theme="dark"],body.dark) .tu-tabbar{background:rgba(18,19,12,.95);border-top-color:rgba(223,227,90,.16);box-shadow:0 -6px 20px rgba(0,0,0,.4)}' +
      ':is([data-theme="dark"],body.dark) .tu-tabbar a{color:#b9bba0}' +
      ':is([data-theme="dark"],body.dark) .tu-tabbar a[aria-current="page"]{color:#dfe35a}' +
      ':is([data-theme="dark"],body.dark) .tu-tabbar a[aria-current="page"] .tu-tb-ic{background:rgba(223,227,90,.14)}' +
      ':is([data-theme="dark"],body.dark) .tu-tabbar a:focus-visible{outline-color:#dfe35a}' +
    '}' +
    '@media print{.tu-tabbar{display:none!important}html.tu-has-tabbar body{padding-bottom:0!important}}';

  function mount(doc, pathname) {
    if (!doc || !doc.body || doc.querySelector('.tu-tabbar')) return null;
    var style = doc.createElement('style');
    style.id = 'tu-tabbar-css';
    style.textContent = CSS;
    doc.head.appendChild(style);

    var current = tabKeyFor(pathname);
    var nav = doc.createElement('nav');
    nav.className = 'tu-tabbar';
    nav.setAttribute('aria-label', 'Quick navigation');
    nav.innerHTML = ITEMS.map(function (it) {
      return '<a href="' + it.href + '"' + (it.k === current ? ' aria-current="page"' : '') + '>' +
        '<span class="tu-tb-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + it.svg + '</svg></span>' + it.t + '</a>';
    }).join('');
    doc.body.appendChild(nav);
    doc.documentElement.classList.add('tu-has-tabbar');
    return nav;
  }

  if (typeof document !== 'undefined' && typeof location !== 'undefined') {
    if (document.body) mount(document, location.pathname);
    else document.addEventListener('DOMContentLoaded', function () { mount(document, location.pathname); });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tabKeyFor: tabKeyFor, mount: mount, ITEMS: ITEMS };
  }
})();
