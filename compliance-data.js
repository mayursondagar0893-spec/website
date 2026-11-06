/* compliance-data.js — FY 2026-27 statutory due dates (GST, TDS/TCS, PF/ESIC, Income Tax, Company Law).
 * Single source for Compliance_Calendar_FY2627.html (full calendar) and index.html ("Due next" card).
 * Row shape: {id, d:'YYYY-MM-DD', n:name, p:period, c:category}. Rows with _agmBase are shifted
 * by the calendar from the user's AGM date, so they are not shown as fixed dates elsewhere.
 * Loaded as a classic <script> in the browser; require()'d by Vitest.
 */
var COMPLIANCE_DATA = [
  // ── DAY 7: TDS/TCS Payment ──
  {id:1, d:'2026-04-07',n:'TCS Payment',            p:'March 2026',    c:'TDS/TCS'},
  {id:2, d:'2026-05-07',n:'TDS/TCS Payment',        p:'April 2026',    c:'TDS/TCS'},
  {id:3, d:'2026-06-07',n:'TDS/TCS Payment',        p:'May 2026',      c:'TDS/TCS'},
  {id:4, d:'2026-07-07',n:'TDS/TCS Payment',        p:'June 2026',     c:'TDS/TCS'},
  {id:5, d:'2026-08-07',n:'TDS/TCS Payment',        p:'July 2026',     c:'TDS/TCS'},
  {id:6, d:'2026-09-07',n:'TDS/TCS Payment',        p:'August 2026',   c:'TDS/TCS'},
  {id:7, d:'2026-10-07',n:'TDS/TCS Payment',        p:'September 2026',c:'TDS/TCS'},
  {id:8, d:'2026-11-07',n:'TDS/TCS Payment',        p:'October 2026',  c:'TDS/TCS'},
  {id:9, d:'2026-12-07',n:'TDS/TCS Payment',        p:'November 2026', c:'TDS/TCS'},
  {id:10,d:'2027-01-07',n:'TDS/TCS Payment',        p:'December 2026', c:'TDS/TCS'},
  {id:11,d:'2027-02-07',n:'TDS/TCS Payment',        p:'January 2027',  c:'TDS/TCS'},
  {id:12,d:'2027-03-07',n:'TDS/TCS Payment',        p:'February 2027', c:'TDS/TCS'},
  // ── DAY 10: GSTR 7 / GSTR 8 ──
  {id:13,d:'2026-04-10',n:'GSTR 7 / GSTR 8',        p:'March 2026',    c:'GST'},
  {id:14,d:'2026-05-10',n:'GSTR 7 / GSTR 8',        p:'April 2026',    c:'GST'},
  {id:15,d:'2026-06-10',n:'GSTR 7 / GSTR 8',        p:'May 2026',      c:'GST'},
  {id:16,d:'2026-07-10',n:'GSTR 7 / GSTR 8',        p:'June 2026',     c:'GST'},
  {id:17,d:'2026-08-10',n:'GSTR 7 / GSTR 8',        p:'July 2026',     c:'GST'},
  {id:18,d:'2026-09-10',n:'GSTR 7 / GSTR 8',        p:'August 2026',   c:'GST'},
  {id:19,d:'2026-10-10',n:'GSTR 7 / GSTR 8',        p:'September 2026',c:'GST'},
  {id:20,d:'2026-11-10',n:'GSTR 7 / GSTR 8',        p:'October 2026',  c:'GST'},
  {id:21,d:'2026-12-10',n:'GSTR 7 / GSTR 8',        p:'November 2026', c:'GST'},
  {id:22,d:'2027-01-10',n:'GSTR 7 / GSTR 8',        p:'December 2026', c:'GST'},
  {id:23,d:'2027-02-10',n:'GSTR 7 / GSTR 8',        p:'January 2027',  c:'GST'},
  {id:24,d:'2027-03-10',n:'GSTR 7 / GSTR 8',        p:'February 2027', c:'GST'},
  // ── DAY 11: GSTR 1 Monthly ──
  {id:25,d:'2026-04-11',n:'GSTR 1 (Monthly)',        p:'March 2026',    c:'GST'},
  {id:26,d:'2026-05-11',n:'GSTR 1 (Monthly)',        p:'April 2026',    c:'GST'},
  {id:27,d:'2026-06-11',n:'GSTR 1 (Monthly)',        p:'May 2026',      c:'GST'},
  {id:28,d:'2026-07-11',n:'GSTR 1 (Monthly)',        p:'June 2026',     c:'GST'},
  {id:29,d:'2026-08-11',n:'GSTR 1 (Monthly)',        p:'July 2026',     c:'GST'},
  {id:30,d:'2026-09-11',n:'GSTR 1 (Monthly)',        p:'August 2026',   c:'GST'},
  {id:31,d:'2026-10-11',n:'GSTR 1 (Monthly)',        p:'September 2026',c:'GST'},
  {id:32,d:'2026-11-11',n:'GSTR 1 (Monthly)',        p:'October 2026',  c:'GST'},
  {id:33,d:'2026-12-11',n:'GSTR 1 (Monthly)',        p:'November 2026', c:'GST'},
  {id:34,d:'2027-01-11',n:'GSTR 1 (Monthly)',        p:'December 2026', c:'GST'},
  {id:35,d:'2027-02-11',n:'GSTR 1 (Monthly)',        p:'January 2027',  c:'GST'},
  {id:36,d:'2027-03-11',n:'GSTR 1 (Monthly)',        p:'February 2027', c:'GST'},
  // ── DAY 13: QRMP / IFF / GSTR 5/6 ──
  {id:37,d:'2026-04-13',n:'GSTR 1 Q4 FY 25-26 (QRMP)',p:'Jan–Mar 2026', c:'GST'},
  {id:38,d:'2026-04-13',n:'GSTR 5 / GSTR 6',          p:'March 2026',   c:'GST'},
  {id:39,d:'2026-05-13',n:'IFF (QRMP)',                p:'April 2026',   c:'GST'},
  {id:40,d:'2026-05-13',n:'GSTR 5 / GSTR 6',          p:'April 2026',   c:'GST'},
  {id:41,d:'2026-06-13',n:'IFF (QRMP)',                p:'May 2026',     c:'GST'},
  {id:42,d:'2026-06-13',n:'GSTR 5 / GSTR 6',          p:'May 2026',     c:'GST'},
  {id:43,d:'2026-07-13',n:'GSTR 1 Q1 FY 26-27 (QRMP)',p:'Apr–Jun 2026', c:'GST'},
  {id:44,d:'2026-07-13',n:'GSTR 5 / GSTR 6',          p:'June 2026',    c:'GST'},
  {id:45,d:'2026-08-13',n:'IFF (QRMP)',                p:'July 2026',    c:'GST'},
  {id:46,d:'2026-08-13',n:'GSTR 5 / GSTR 6',          p:'July 2026',    c:'GST'},
  {id:47,d:'2026-09-13',n:'IFF (QRMP)',                p:'August 2026',  c:'GST'},
  {id:48,d:'2026-09-13',n:'GSTR 5 / GSTR 6',          p:'August 2026',  c:'GST'},
  {id:49,d:'2026-10-13',n:'GSTR 1 Q2 FY 26-27 (QRMP)',p:'Jul–Sep 2026', c:'GST'},
  {id:50,d:'2026-10-13',n:'GSTR 5 / GSTR 6',          p:'September 2026',c:'GST'},
  {id:51,d:'2026-11-13',n:'IFF (QRMP)',                p:'October 2026', c:'GST'},
  {id:52,d:'2026-11-13',n:'GSTR 5 / GSTR 6',          p:'October 2026', c:'GST'},
  {id:53,d:'2026-12-13',n:'IFF (QRMP)',                p:'November 2026',c:'GST'},
  {id:54,d:'2026-12-13',n:'GSTR 5 / GSTR 6',          p:'November 2026',c:'GST'},
  {id:55,d:'2027-01-13',n:'GSTR 1 Q3 FY 26-27 (QRMP)',p:'Oct–Dec 2026', c:'GST'},
  {id:56,d:'2027-01-13',n:'GSTR 5 / GSTR 6',          p:'December 2026',c:'GST'},
  {id:57,d:'2027-02-13',n:'IFF (QRMP)',                p:'January 2027', c:'GST'},
  {id:58,d:'2027-02-13',n:'GSTR 5 / GSTR 6',          p:'January 2027', c:'GST'},
  {id:59,d:'2027-03-13',n:'IFF (QRMP)',                p:'February 2027',c:'GST'},
  {id:60,d:'2027-03-13',n:'GSTR 5 / GSTR 6',          p:'February 2027',c:'GST'},
  // ── DAY 15 ──
  {id:61,d:'2026-04-15',n:'PF / ESIC Payment',          p:'March 2026',    c:'PF/ESIC'},
  {id:62,d:'2026-05-15',n:'TCS Return Q4',               p:'FY 2025-26',    c:'TDS/TCS'},
  {id:63,d:'2026-05-15',n:'PF / ESIC Payment',           p:'April 2026',    c:'PF/ESIC'},
  {id:64,d:'2026-06-15',n:'TDS Certificate Q4',          p:'FY 2025-26',    c:'TDS/TCS'},
  {id:65,d:'2026-06-15',n:'Advance Tax 1st Instalment',  p:'TY 2026-27 · minimum 15% of tax liability',    c:'Income Tax'},
  {id:66,d:'2026-06-15',n:'PF / ESIC Payment',           p:'May 2026',      c:'PF/ESIC'},
  {id:67,d:'2026-07-31',n:'TDS/TCS Return Q1',           p:'TY 2026-27',    c:'TDS/TCS'},
  {id:68,d:'2026-07-15',n:'PF / ESIC Payment',           p:'June 2026',     c:'PF/ESIC'},
  {id:69,d:'2026-08-15',n:'TDS/TCS Certificate Q1',      p:'TY 2026-27',    c:'TDS/TCS'},
  {id:70,d:'2026-08-15',n:'PF / ESIC Payment',           p:'July 2026',     c:'PF/ESIC'},
  {id:71,d:'2026-09-15',n:'Advance Tax 2nd Instalment',  p:'TY 2026-27 · cumulative 45% of tax liability',c:'Income Tax'},
  {id:72,d:'2026-09-15',n:'PF / ESIC Payment',           p:'August 2026',   c:'PF/ESIC'},
  {id:73,d:'2026-10-31',n:'TDS/TCS Return Q2',           p:'TY 2026-27',    c:'TDS/TCS'},
  {id:74,d:'2026-10-15',n:'PF / ESIC Payment',           p:'September 2026',c:'PF/ESIC'},
  {id:75,d:'2026-11-15',n:'TDS/TCS Certificate Q2',      p:'TY 2026-27',    c:'TDS/TCS'},
  {id:76,d:'2026-11-15',n:'PF / ESIC Payment',           p:'October 2026',  c:'PF/ESIC'},
  {id:77,d:'2026-12-15',n:'Advance Tax 3rd Instalment',  p:'TY 2026-27 · cumulative 75% of tax liability',c:'Income Tax'},
  {id:78,d:'2026-12-15',n:'PF / ESIC Payment',           p:'November 2026', c:'PF/ESIC'},
  {id:79,d:'2027-01-31',n:'TDS/TCS Return Q3',           p:'TY 2026-27',    c:'TDS/TCS'},
  {id:80,d:'2027-01-15',n:'PF / ESIC Payment',           p:'December 2026', c:'PF/ESIC'},
  {id:81,d:'2027-02-15',n:'TDS/TCS Certificate Q3',      p:'TY 2026-27',    c:'TDS/TCS'},
  {id:82,d:'2027-02-15',n:'PF / ESIC Payment',           p:'January 2027',  c:'PF/ESIC'},
  {id:83,d:'2027-03-15',n:'Advance Tax 4th Instalment',  p:'TY 2026-27 · 100% of tax liability',          c:'Income Tax'},
  {id:84,d:'2027-03-15',n:'PF / ESIC Payment',           p:'February 2027', c:'PF/ESIC'},
  // ── DAY 18: GST CMP-08 ──
  {id:85,d:'2026-04-18',n:'GST CMP-08',p:'Q4 FY 2025-26',c:'GST'},
  {id:86,d:'2026-07-18',n:'GST CMP-08',p:'Q1 FY 2026-27',c:'GST'},
  {id:87,d:'2026-10-18',n:'GST CMP-08',p:'Q2 FY 2026-27',c:'GST'},
  {id:88,d:'2027-01-18',n:'GST CMP-08',p:'Q3 FY 2026-27',c:'GST'},
  // ── DAY 20: GSTR 3B / 5A Monthly ──
  {id:89, d:'2026-04-20',n:'GSTR 5A (Monthly)',           p:'March 2026',    c:'GST'},
  {id:149,d:'2026-04-21',n:'GSTR 3B (Monthly)',            p:'March 2026',    c:'GST'},
  {id:90, d:'2026-05-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'April 2026',    c:'GST'},
  {id:91, d:'2026-06-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'May 2026',      c:'GST'},
  {id:92, d:'2026-07-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'June 2026',     c:'GST'},
  {id:93, d:'2026-08-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'July 2026',     c:'GST'},
  {id:94, d:'2026-09-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'August 2026',   c:'GST'},
  {id:95, d:'2026-10-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'September 2026',c:'GST'},
  {id:96, d:'2026-11-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'October 2026',  c:'GST'},
  {id:97, d:'2026-12-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'November 2026', c:'GST'},
  {id:98, d:'2027-01-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'December 2026', c:'GST'},
  {id:99, d:'2027-02-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'January 2027',  c:'GST'},
  {id:100,d:'2027-03-20',n:'GSTR 3B / GSTR 5A (Monthly)',p:'February 2027', c:'GST'},
  // ── DAY 22: GSTR 3B QRMP Group A ──
  {id:101,d:'2026-04-22',n:'GSTR 3B Q4 FY 25-26 (QRMP Grp A)',p:'Q4 FY 2025-26',c:'GST'},
  {id:102,d:'2026-07-22',n:'GSTR 3B Q1 FY 26-27 (QRMP Grp A)',p:'Q1 FY 2026-27',c:'GST'},
  {id:103,d:'2026-10-22',n:'GSTR 3B Q2 FY 26-27 (QRMP Grp A)',p:'Q2 FY 2026-27',c:'GST'},
  {id:104,d:'2027-01-22',n:'GSTR 3B Q3 FY 26-27 (QRMP Grp A)',p:'Q3 FY 2026-27',c:'GST'},
  // ── DAY 24: GSTR 3B QRMP Group B ──
  {id:105,d:'2026-04-24',n:'GSTR 3B Q4 FY 25-26 (QRMP Grp B)',p:'Q4 FY 2025-26',c:'GST'},
  {id:106,d:'2026-07-24',n:'GSTR 3B Q1 FY 26-27 (QRMP Grp B)',p:'Q1 FY 2026-27',c:'GST'},
  {id:107,d:'2026-10-24',n:'GSTR 3B Q2 FY 26-27 (QRMP Grp B)',p:'Q2 FY 2026-27',c:'GST'},
  {id:108,d:'2027-01-24',n:'GSTR 3B Q3 FY 26-27 (QRMP Grp B)',p:'Q3 FY 2026-27',c:'GST'},
  // ── DAY 25: GST PMT-06 QRMP ──
  {id:109,d:'2026-05-25',n:'GST PMT-06 (QRMP)',p:'April 2026',   c:'GST'},
  {id:110,d:'2026-06-25',n:'GST PMT-06 (QRMP)',p:'May 2026',     c:'GST'},
  {id:111,d:'2026-08-25',n:'GST PMT-06 (QRMP)',p:'July 2026',    c:'GST'},
  {id:112,d:'2026-09-25',n:'GST PMT-06 (QRMP)',p:'August 2026',  c:'GST'},
  {id:113,d:'2026-11-25',n:'GST PMT-06 (QRMP)',p:'October 2026', c:'GST'},
  {id:114,d:'2026-12-25',n:'GST PMT-06 (QRMP)',p:'November 2026',c:'GST'},
  {id:115,d:'2027-02-25',n:'GST PMT-06 (QRMP)',p:'January 2027', c:'GST'},
  {id:116,d:'2027-03-25',n:'GST PMT-06 (QRMP)',p:'February 2027',c:'GST'},
  // ── DAY 30 ──
  {id:117,d:'2026-04-30',n:'TDS Payment (March)',              p:'March 2026',  c:'TDS/TCS'},
  {id:118,d:'2026-05-30',n:'TCS Certificate Q4',              p:'FY 2025-26',  c:'TDS/TCS'},
  {id:119,d:'2026-06-30',n:'Equalisation Levy Statement',     p:'FY 2025-26',  c:'Other'},
  {id:120,d:'2026-06-30',n:'GSTR 4',                          p:'FY 2025-26',  c:'GST'},
  {id:122,d:'2026-10-21',n:'Tax Audit Report',                p:'AY 2026-27',  c:'Income Tax'},
  {id:124,d:'2026-11-30',n:'ITR – Transfer Pricing Cases (S. 92E)',p:'AY 2026-27',c:'Income Tax'},
  // ── DAY 31 ──
  {id:126,d:'2026-05-31',n:'TDS Return Q4',                   p:'FY 2025-26',  c:'TDS/TCS'},
  {id:128,d:'2026-07-31',n:'ITR Filing — Non-Audit (Not Having Business Income)',p:'AY 2026-27',c:'Income Tax'},
  {id:129,d:'2026-08-31',n:'ITR Filing — Non-Audit (Having Business Income or Partner of Non Audit Firm)',p:'AY 2026-27',c:'Income Tax'},
  {id:131,d:'2026-11-21',n:'ITR Filing (Audit Cases)',         p:'AY 2026-27',  c:'Income Tax'},
  {id:132,d:'2026-10-31',n:'Transfer Pricing Audit',           p:'AY 2026-27',  c:'Income Tax'},
  {id:133,d:'2026-12-31',n:'Belated ITR',                      p:'AY 2026-27',  c:'Income Tax'},
  {id:134,d:'2026-12-31',n:'GSTR 9 / GSTR 9C',                p:'FY 2025-26',  c:'GST'},
  {id:136,d:'2027-03-31',n:'Revised ITR',                     p:'AY 2026-27',  c:'Income Tax'},
  // ── QRMP ELECTION WINDOW (1st to last day of 1st month of each quarter) ──
  {id:137,d:'2026-04-30',n:'QRMP Election Window closes',     p:'Q1 FY 2026-27 (opt-in/out: 1–30 Apr)',  c:'GST'},
  {id:138,d:'2026-07-31',n:'QRMP Election Window closes',     p:'Q2 FY 2026-27 (opt-in/out: 1–31 Jul)',  c:'GST'},
  {id:139,d:'2026-10-31',n:'QRMP Election Window closes',     p:'Q3 FY 2026-27 (opt-in/out: 1–31 Oct)',  c:'GST'},
  {id:140,d:'2027-01-31',n:'QRMP Election Window closes',     p:'Q4 FY 2026-27 (opt-in/out: 1–31 Jan)',  c:'GST'},
  // ── COMPANY LAW — AGM-based (dates auto-computed from AGM date) ──
  {id:141,d:'2026-09-30',n:'AGM',                             p:'FY 2025-26 (Listed & Unlisted)',         c:'Company Law', _agmBase:true, _agmOffset:0,   _agmAnchor:true},
  {id:142,d:'2026-10-14',n:'ADT-1 – Auditor Appointment',    p:'Within 15 days of AGM',                 c:'Company Law', _agmBase:true, _agmOffset:15},
  {id:143,d:'2026-10-29',n:'AOC-4 – Financial Statements',   p:'Within 30 days of AGM',                 c:'Company Law', _agmBase:true, _agmOffset:30},
  {id:144,d:'2026-11-29',n:'MGT-7 / 7A – Annual Return',     p:'Within 60 days of AGM',                 c:'Company Law', _agmBase:true, _agmOffset:60},
  // ── COMPANY LAW — Fixed dates ──
  {id:145,d:'2026-10-31',n:'MSME Form I (Half-Yearly)',       p:'Apr–Sep 2026 outstanding payments',     c:'Company Law'},
  {id:146,d:'2026-04-30',n:'MSME Form I (Half-Yearly)',       p:'Oct 2025–Mar 2026 outstanding payments',c:'Company Law'},
  {id:147,d:'2026-05-30',n:'LLP Form 11 – Annual Return',    p:'FY 2025-26',                            c:'Company Law'},
  {id:148,d:'2026-10-30',n:'LLP Form 8 – Accounts & Solvency',p:'FY 2025-26',                          c:'Company Law'},
];

/* Next `count` deadlines on or after `today` (Date or 'YYYY-MM-DD'), soonest first.
 * Skips AGM-relative rows, whose real date depends on each company's AGM. */
function upcomingDeadlines(data, today, count) {
  var t = today instanceof Date ? isoDate(today) : String(today);
  return data
    .filter(function (r) { return !r._agmBase && r.d >= t; })
    .sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.id - b.id; })
    .slice(0, count);
}

/* Local-time YYYY-MM-DD (toISOString would shift the date in IST before 05:30). */
function isoDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Whole days from `today` (Date or 'YYYY-MM-DD') to the ISO date `ds`; 0 = same day. */
function daysUntil(ds, today) {
  var t = today instanceof Date ? isoDate(today) : String(today);
  return Math.round((Date.parse(ds + 'T00:00:00Z') - Date.parse(t + 'T00:00:00Z')) / 86400000);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COMPLIANCE_DATA: COMPLIANCE_DATA, upcomingDeadlines: upcomingDeadlines, isoDate: isoDate, daysUntil: daysUntil };
}
