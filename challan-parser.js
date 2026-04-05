/**
 * challan-parser.js
 * Pure parsing functions for Income Tax challan PDFs (ITNS 280/281/282/283).
 * Shared between INCOME-TAX-CHALLAN-TO-EXCEL.html (browser globals)
 * and the Vitest unit test suite (CommonJS/ESM import).
 *
 * All functions are side-effect-free and depend only on their arguments.
 */

// ── Text utilities ─────────────────────────────────────────────────────────

/** Collapse all whitespace sequences to a single space and trim. */
function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

/**
 * Parse an Indian-format currency string to a number.
 * Strips all non-digit characters (commas, ₹, Rs., spaces, decimals)
 * then converts to float.  Returns 0 for null/undefined/empty/NaN.
 */
function parseAmount(s) {
  if (!s) return 0;
  return parseFloat(s.replace(/[^\d]/g, '')) || 0;
}

/**
 * Extract the text that appears between two pattern strings in `t`.
 * `sp` and `ep` are regex source strings (not RegExp objects).
 * Returns '' when no match is found.
 */
function between(t, sp, ep) {
  const m = t.match(new RegExp(sp + '\\s*[:\\-]?\\s*(.+?)(?=' + ep + ')', 'i'));
  return m ? clean(m[1]) : '';
}

/**
 * Extract the first capture group from a regex applied to `t`.
 * Returns '' when no match is found.
 */
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
 * @returns {object} Parsed record with ok, itns, pan, tan, name, ay, fy,
 *                   major, minor, natureOfPayment, cin, mode, bank, bankRef,
 *                   dod, bsr, challanNo, tenderDate, tax, surcharge, cess,
 *                   interest, penalty, others, total, file.
 */
function parseChallan(text, filename) {
  // Flatten to single line so all regexes work uniformly.
  const t = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  const itns = get(t, /ITNS\s*No\.?\s*[:\-\s]\s*(\d+)/i) || '280';
  const is281 = itns === '281';

  const pan  = get(t, /PAN\s*[:\-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i);
  const tan  = get(t, /TAN\s*[:\-]\s*([A-Z]{4}[0-9]{5}[A-Z])/i);
  const name = between(t, 'Name', 'Assessment\\s*Year');
  const ay   = get(t, /Assessment\s*Year\s*[:\-]\s*(20\d{2}-\d{2,4})/i);
  const fy   = get(t, /Financial\s*Year\s*[:\-]\s*(20\d{2}-\d{2,4})/i);

  const major = between(t, 'Major\\s*Head', 'Minor\\s*Head');
  const minor = between(t, 'Minor\\s*Head', 'Nature\\s*of\\s*Payment|Amount\\s*\\(in\\s*Rs');

  const natureOfPayment = get(t, /Nature\s*of\s*Payment\s*[:\-]\s*([A-Z0-9]+)/i);
  const cin             = get(t, /CIN\s*[:\-]\s*([A-Z0-9]{14,25})/i);
  const mode            = between(t, 'Mode\\s*of\\s*Payment', 'Bank\\s*Name');
  const bank            = between(t, 'Bank\\s*Name', 'Bank\\s*Reference');
  const bankRef         = get(t, /Bank\s*Reference\s*Number\s*[:\-]\s*([A-Z0-9]+)/i);

  const dod =
    get(t, /Date\s*of\s*Deposit\s*[:\-]\s*(\d{1,2}[-\s][A-Za-z]{3}[-\s]\d{4})/i) ||
    get(t, /Date\s*of\s*Deposit\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);

  const bsr       = get(t, /BSR\s*code?\s*[:\-]\s*(\d{7})/i);
  const challanNo = get(t, /Challan\s*No\.?\s*[:\-]\s*(\d+)/i);
  const tenderDate = get(t, /Tender\s*Date\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);

  // Amount rows labelled A–F
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

  // Validity: ITNS 281 (TDS) requires TAN; others require PAN. Both need CIN or BSR.
  const ok = is281 ? !!(tan && (cin || bsr)) : !!(pan && (cin || bsr));

  return {
    ok, itns, pan, tan, name, ay, fy,
    major, minor, natureOfPayment,
    cin, mode, bank, bankRef,
    dod, bsr, challanNo, tenderDate,
    tax, surcharge, cess, interest, penalty, others, total,
    file: filename,
  };
}

// ── Module export (Node / Vitest) ──────────────────────────────────────────
// In the browser this block is a no-op; functions remain as globals.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clean, parseAmount, between, get, parseChallan };
}
