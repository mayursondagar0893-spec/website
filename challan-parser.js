/**
 * challan-parser.js  v1-2
 * Pure parsing functions for Income Tax challan PDFs (ITNS 280/280N/281/281N/282/283).
 * Shared between INCOME-TAX-CHALLAN-TO-EXCEL.html (browser globals)
 * and the Vitest unit test suite (CommonJS/ESM import).
 *
 * v1-2 changes:
 *   1. ITNS "280N" / "281N" etc. preserved as-is (no longer stripped to "280")
 *   2. is281 covers both "281" and "281N"
 *
 * v1-1 changes:
 *   1. New "Tax Year" field (AY 2026-27 onwards) mapped to ay, fy, ty
 *   2. `name` regex extended to also anchor on "Tax Year"
 *   3. sectionRows: per-code breakdown for ITNS 281 challans
 *   4. sectionRef: section string for single-code TDS challans
 *
 * All functions are side-effect-free and depend only on their arguments.
 */

// ── Text utilities ─────────────────────────────────────────────────────────

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function parseAmount(s) {
  if (!s) return 0;
  return parseFloat(s.replace(/[^\d]/g, '')) || 0;
}

function between(t, sp, ep) {
  const m = t.match(new RegExp(sp + '\\s*[:\\-]?\\s*(.+?)(?=' + ep + ')', 'i'));
  return m ? clean(m[1]) : '';
}

function get(t, pat) {
  const m = t.match(pat);
  return m ? clean(m[1]) : '';
}

// ── Challan parser ─────────────────────────────────────────────────────────

/**
 * Parse the full text of a single challan PDF and return a structured record.
 *
 * @param {string} text     - Raw text extracted from the PDF (may contain newlines).
 * @param {string} filename - Original filename, stored on the result as `file`.
 * @returns {object} Parsed record with ok, itns, pan, tan, name, ay, fy, ty,
 *                   major, minor, natureOfPayment, sectionRef, sectionRows,
 *                   cin, mode, bank, bankRef, tenderDate, bsr, challanNo,
 *                   tax, surcharge, cess, interest, penalty, others, total, file.
 */
function parseChallan(text, filename) {
  const t = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Preserve trailing N (e.g. "280N", "281N") as a distinct ITNS type.
  // Collapse optional space ("280 N" → "280N") before storing.
  const itnsRaw = get(t, /ITNS\s*No\.?\s*[:\-\s]\s*(\d+\s*N?)/i) || '280';
  const itns = itnsRaw.replace(/\s+/g, '').toUpperCase();
  const is281 = itns === '281' || itns === '281N';

  const pan = get(t, /PAN\s*[:\-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i);
  const tan = get(t, /TAN\s*[:\-]\s*([A-Z]{4}[0-9]{5}[A-Z])/i);

  // Fix 3: name block ends at "Tax Year" OR "Assessment Year"
  const name = between(t, 'Name', 'Tax\\s*Year|Assessment\\s*Year');

  // Fix 2: Tax Year field (new format from AY 2026-27)
  const taxYear = get(t, /Tax\s*Year\s*[:\-]\s*(20\d{2}-\d{2,4})/i);
  const ay = get(t, /Assessment\s*Year\s*[:\-]\s*(20\d{2}-\d{2,4})/i) || taxYear;
  const fy = get(t, /Financial\s*Year\s*[:\-]\s*(20\d{2}-\d{2,4})/i) || taxYear;
  const ty = taxYear; // raw Tax Year value (blank for old challans)

  const major = between(t, 'Major\\s*Head', 'Minor\\s*Head');
  const minor = between(t, 'Minor\\s*Head', 'Nature\\s*of\\s*Payment|Amount\\s*\\(in\\s*Rs');

  // sectionRows: per-code breakdown for 281N challans
  const tableAnchor = t.search(/S\.\s*No\s+Description/i);
  const tTable = tableAnchor >= 0 ? t.slice(tableAnchor) : t;
  const sectionRows = [];
  const seenCodes = new Set();
  const rowRx = /\b\d+\s+(.+?)\s+393\s*\(\s*1\s*\)\s*\[Table:\s*Sl\.\s*No\.\s*([\w().]+)\]\s*(?:393\s*\(\s*1\s*\)\s*\[Table:[^\]]+\]\s*|-\s*)?(10\d{2})\s*(?:₹\s*)?([\d,]+)\s*(?:₹\s*)?([\d,]+)\s*(?:₹\s*)?([\d,]+)\s*(?:₹\s*)?([\d,]+)/g;
  let sm;
  while ((sm = rowRx.exec(tTable)) !== null) {
    if (!seenCodes.has(sm[3])) {
      seenCodes.add(sm[3]);
      sectionRows.push({
        desc: sm[1].replace(/\s*-\s*$/, '').replace(/\s+/g, ' ').trim().slice(0, 60),
        section: '393(1)[Table: Sl. No. ' + sm[2] + ']',
        code: sm[3],
        tax: parseAmount(sm[4]), surcharge: parseAmount(sm[5]),
        cess: parseAmount(sm[6]), total: parseAmount(sm[7])
      });
    }
  }

  const npLabel = get(t, /Nature\s*of\s*Payment\s*[:\-]\s*([A-Z0-9]+)/i);
  const natureOfPayment = npLabel || (sectionRows.length > 0 ? sectionRows.map(r => r.code).join(', ') : '');
  const sectionRef = sectionRows.length === 1 ? sectionRows[0].section : '';

  const cin      = get(t, /CIN\s*[:\-]\s*([A-Z0-9]{14,25})/i);
  const mode     = between(t, 'Mode\\s*of\\s*Payment', 'Bank\\s*Name');
  const bank     = between(t, 'Bank\\s*Name', 'Bank\\s*Reference');
  const bankRef  = get(t, /Bank\s*Reference\s*Number\s*[:\-]\s*([A-Z0-9]+)/i);

  const dod =
    get(t, /Date\s*of\s*Deposit\s*:?\s*(\d{1,2}[-\s\/][A-Za-z]{3}[-\s\/]\d{4})/i) ||
    get(t, /Date\s*of\s*Deposit\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);

  const tenderDate =
    get(t, /Tender\s*Date\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i) || dod;

  const bsr       = get(t, /BSR\s*code?\s*[:\-]\s*(\d{7})/i);
  const challanNo = get(t, /Challan\s*No\.?\s*[:\-]\s*(\d+)/i);

  const amtRx = label => new RegExp(label + '[^\\d]+([\\d][\\d,]*)', 'i');
  const tax       = parseAmount((t.match(amtRx('\\bA\\s+Tax'))       || [])[1]);
  const surcharge = parseAmount((t.match(amtRx('\\bB\\s+Surcharge')) || [])[1]);
  const cess      = parseAmount((t.match(amtRx('\\bC\\s+Cess'))      || [])[1]);
  const interest  = parseAmount((t.match(amtRx('\\bD\\s+Interest'))  || [])[1]);
  const penalty   = parseAmount((t.match(amtRx('\\bE\\s+Penalty'))   || [])[1]);
  const others    = parseAmount(
    (t.match(/\bF\s+(?:Others(?:\s*\/\s*Fee)?|Fee)(?:\s+under\s+section\s+\d+[A-Za-z]*)?\s+([\d][\d,]*)/i) || [])[1]);

  const totM =
    t.match(amtRx('Total\\s*\\(A\\+B\\+C\\+D\\+E\\+F\\)')) ||
    t.match(amtRx('Amount\\s*\\(in\\s*Rs\\.\\)\\s*[:\\-]?'));
  let total = totM ? parseAmount(totM[1]) : 0;
  if (!total) total = tax + surcharge + cess + interest + penalty + others;

  const ok = is281 ? !!(tan && (cin || bsr)) : !!(pan && (cin || bsr));

  return {
    ok, itns, pan, tan, name, ay, fy, ty,
    major, minor, natureOfPayment, sectionRef, sectionRows,
    cin, mode, bank, bankRef,
    dod, tenderDate, bsr, challanNo,
    tax, surcharge, cess, interest, penalty, others, total,
    file: filename,
  };
}

// ── Module export (Node / Vitest) ──────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clean, parseAmount, between, get, parseChallan };
}
