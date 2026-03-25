/**
 * Unit tests for challan-parser.js
 * Covers: clean, parseAmount, between, get, parseChallan
 *
 * Run with: npm test
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { clean, parseAmount, between, get, parseChallan } = require('../challan-parser.js');

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures — realistic challan PDF text as it would come out of PDF.js
// ─────────────────────────────────────────────────────────────────────────────

const ITNS280_FULL = `
  CHALLAN NO./ITNS No. : 280
  PAN : ABCDE1234F
  Name : MAYUR J SONDAGAR
  Assessment Year : 2024-25
  Financial Year : 2023-24
  Major Head : 0021 - Income Tax (Other than Companies)
  Minor Head : 300 - Self Assessment Tax
  Nature of Payment : ADVANCE
  Mode of Payment : Net Banking
  Bank Name : State Bank of India
  Bank Reference Number : SBIN0987654321
  Date of Deposit : 15-Mar-2024
  BSR Code : 0000612
  Challan No. : 00042
  Tender Date : 15/03/2024
  A Tax 50,000
  B Surcharge 0
  C Cess 1,500
  D Interest 500
  E Penalty 0
  F Others 0
  Total (A+B+C+D+E+F) 52,000
`;

const ITNS280_WITH_CIN = `
  ITNS No. : 280
  PAN : XYZAB9876G
  Name : RAKESH KUMAR SHARMA
  Assessment Year : 2025-26
  Major Head : 0020 - Corporation Tax
  Minor Head : 100 - Advance Tax
  CIN : 1234567041220000999
  Date of Deposit : 01/04/2025
  A Tax 1,00,000
  B Surcharge 12,000
  C Cess 3,360
  D Interest 0
  E Penalty 0
  F Others 0
  Total (A+B+C+D+E+F) 1,15,360
`;

const ITNS281_TAN_CIN = `
  ITNS No. : 281
  TAN : MUMS12345A
  Name : ABC PRIVATE LIMITED
  Assessment Year : 2024-25
  Major Head : 0021
  Minor Head : 200 - TDS/TCS Payable by Taxpayer
  Nature of Payment : 194C
  CIN : 7654321041220001234
  Date of Deposit : 10-Apr-2024
  Tender Date : 10/04/2024
  A Tax 2,50,000
  B Surcharge 0
  C Cess 0
  D Interest 5,000
  E Penalty 0
  F Others 0
  Total (A+B+C+D+E+F) 2,55,000
`;

const ITNS281_TAN_BSR = `
  CHALLAN NO./ITNS No. : 281
  TAN : DELH98765B
  Name : XYZ EXPORTS LTD
  Assessment Year : 2025-26
  BSR Code : 3456789
  Challan No. : 00178
  A Tax 75,000
  B Surcharge 0
  C Cess 0
  D Interest 0
  E Penalty 0
  F Others 0
  Total (A+B+C+D+E+F) 75,000
`;

const MISSING_PAN_ITNS280 = `
  ITNS No. : 280
  Name : SOME TAXPAYER
  Assessment Year : 2024-25
  BSR Code : 1234567
  A Tax 10,000
  Total (A+B+C+D+E+F) 10,000
`;

const MISSING_TAN_ITNS281 = `
  ITNS No. : 281
  Name : SOME COMPANY
  CIN : 1234567041220000001
  A Tax 5,000
  Total (A+B+C+D+E+F) 5,000
`;

const MISSING_BSR_AND_CIN = `
  ITNS No. : 280
  PAN : ABCDE1234F
  Name : SOME PERSON
  A Tax 1,000
`;

const EMPTY_TEXT = '';

const LARGE_AMOUNTS = `
  ITNS No. : 280
  PAN : LARGE0001Z
  BSR Code : 9999999
  A Tax 1,00,00,000
  B Surcharge 10,00,000
  C Cess 3,30,000
  D Interest 50,000
  E Penalty 10,000
  F Others 5,000
  Total (A+B+C+D+E+F) 1,13,95,000
`;

const DATE_SLASH_FORMAT = `
  ITNS No. : 280
  PAN : ABCDE1234F
  BSR Code : 1234567
  Date of Deposit : 31/03/2025
  A Tax 1,000
  Total (A+B+C+D+E+F) 1,000
`;

const DATE_HYPHEN_FORMAT = `
  ITNS No. : 280
  PAN : ABCDE1234F
  BSR Code : 1234567
  Date of Deposit : 31-Mar-2025
  A Tax 1,000
  Total (A+B+C+D+E+F) 1,000
`;

// ITNS 280 where total line is absent — should sum components
const NO_TOTAL_LINE = `
  ITNS No. : 280
  PAN : ABCDE1234F
  BSR Code : 1234567
  A Tax 10,000
  B Surcharge 0
  C Cess 300
  D Interest 200
  E Penalty 0
  F Others 0
`;

// Default ITNS when the ITNS line is missing (should default to "280")
const NO_ITNS_LINE = `
  PAN : ABCDE1234F
  Name : DEFAULT ITNS TEST
  BSR Code : 1234567
  A Tax 5,000
  Total (A+B+C+D+E+F) 5,000
`;

// ─────────────────────────────────────────────────────────────────────────────
// clean()
// ─────────────────────────────────────────────────────────────────────────────

describe('clean()', () => {
  it('collapses multiple spaces to a single space', () => {
    expect(clean('hello   world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(clean('  hello world  ')).toBe('hello world');
  });

  it('replaces newlines and tabs with a space', () => {
    expect(clean('hello\n\tworld')).toBe('hello world');
  });

  it('returns empty string for null', () => {
    expect(clean(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(clean(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(clean('')).toBe('');
  });

  it('leaves already-clean strings unchanged', () => {
    expect(clean('ABCDE1234F')).toBe('ABCDE1234F');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseAmount()
// ─────────────────────────────────────────────────────────────────────────────

describe('parseAmount()', () => {
  it('returns 0 for null', () => expect(parseAmount(null)).toBe(0));
  it('returns 0 for undefined', () => expect(parseAmount(undefined)).toBe(0));
  it('returns 0 for empty string', () => expect(parseAmount('')).toBe(0));
  it('returns 0 for "0"', () => expect(parseAmount('0')).toBe(0));

  it('parses a plain integer string', () => {
    expect(parseAmount('5000')).toBe(5000);
  });

  it('strips commas (Indian lakh format)', () => {
    expect(parseAmount('5,000')).toBe(5000);
    expect(parseAmount('1,00,000')).toBe(100000);
    expect(parseAmount('1,00,00,000')).toBe(10000000);
  });

  it('strips the rupee symbol', () => {
    // ₹ is a multi-byte char but [^\d] strips it
    expect(parseAmount('₹5,000')).toBe(5000);
  });

  it('strips Rs. prefix', () => {
    expect(parseAmount('Rs.1,000')).toBe(1000);
  });

  it('handles very large challan amounts', () => {
    expect(parseAmount('1,13,95,000')).toBe(11395000);
  });

  it('returns 0 for a string with no digits', () => {
    expect(parseAmount('N/A')).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// between()
// ─────────────────────────────────────────────────────────────────────────────

describe('between()', () => {
  const t = 'Name : JOHN DOE SMITH Assessment Year : 2024-25 Major Head : 0021';

  it('extracts text between two markers', () => {
    expect(between(t, 'Name', 'Assessment\\s*Year')).toBe('JOHN DOE SMITH');
  });

  it('extracts text between two markers (second pair)', () => {
    // The [:\-]? in the pattern consumes the colon, so the value starts after it
    expect(between(t, 'Assessment\\s*Year', 'Major\\s*Head')).toBe('2024-25');
  });

  it('returns empty string when start marker is not found', () => {
    expect(between(t, 'NonExistentMarker', 'Assessment\\s*Year')).toBe('');
  });

  it('returns empty string when end marker is not found', () => {
    expect(between(t, 'Name', 'NonExistentEnd')).toBe('');
  });

  it('is case-insensitive', () => {
    expect(between('name : jane doe assessment year', 'name', 'assessment\\s*year')).toBe('jane doe');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// get()
// ─────────────────────────────────────────────────────────────────────────────

describe('get()', () => {
  it('returns the first capture group on a match', () => {
    expect(get('PAN : ABCDE1234F rest', /PAN\s*[:\-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i)).toBe('ABCDE1234F');
  });

  it('returns empty string when there is no match', () => {
    expect(get('no pan here', /PAN\s*[:\-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i)).toBe('');
  });

  it('cleans extra whitespace from the captured group', () => {
    expect(get('BSR Code :  0000612  end', /BSR\s*code?\s*[:\-]\s*(\d{7})/i)).toBe('0000612');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseChallan() — ITNS 280 (Individual / Non-company tax)
// ─────────────────────────────────────────────────────────────────────────────

describe('parseChallan() — ITNS 280', () => {
  describe('with BSR code', () => {
    let r;
    beforeEach(() => { r = parseChallan(ITNS280_FULL, 'itns280-bsr.pdf'); });

    it('sets ok to true when PAN + BSR are present', () => expect(r.ok).toBe(true));
    it('detects ITNS type as 280', () => expect(r.itns).toBe('280'));
    it('extracts PAN', () => expect(r.pan).toBe('ABCDE1234F'));
    it('tan is empty (not a TDS challan)', () => expect(r.tan).toBe(''));
    it('extracts name', () => expect(r.name).toBe('MAYUR J SONDAGAR'));
    it('extracts assessment year', () => expect(r.ay).toBe('2024-25'));
    it('extracts financial year', () => expect(r.fy).toBe('2023-24'));
    it('extracts BSR code', () => expect(r.bsr).toBe('0000612'));
    it('extracts challan number', () => expect(r.challanNo).toBe('00042'));
    it('extracts bank reference number', () => expect(r.bankRef).toBe('SBIN0987654321'));
    it('extracts date of deposit (Mon-DD-YYYY format)', () => expect(r.dod).toBe('15-Mar-2024'));
    it('extracts tender date', () => expect(r.tenderDate).toBe('15/03/2024'));
    it('stores the filename', () => expect(r.file).toBe('itns280-bsr.pdf'));

    it('parses tax amount', () => expect(r.tax).toBe(50000));
    it('parses surcharge as 0', () => expect(r.surcharge).toBe(0));
    it('parses cess amount', () => expect(r.cess).toBe(1500));
    it('parses interest amount', () => expect(r.interest).toBe(500));
    it('parses penalty as 0', () => expect(r.penalty).toBe(0));
    it('parses others as 0', () => expect(r.others).toBe(0));
    it('parses total from explicit label', () => expect(r.total).toBe(52000));
  });

  describe('with CIN', () => {
    let r;
    beforeEach(() => { r = parseChallan(ITNS280_WITH_CIN, 'itns280-cin.pdf'); });

    it('sets ok to true when PAN + CIN are present', () => expect(r.ok).toBe(true));
    it('extracts CIN', () => expect(r.cin).toBe('1234567041220000999'));
    it('parses multi-component amounts correctly', () => {
      expect(r.tax).toBe(100000);
      expect(r.surcharge).toBe(12000);
      expect(r.cess).toBe(3360);
      expect(r.total).toBe(115360);
    });
    it('extracts date in DD/MM/YYYY format', () => expect(r.dod).toBe('01/04/2025'));
  });

  describe('validity checks', () => {
    it('sets ok to false when PAN is missing', () => {
      const r = parseChallan(MISSING_PAN_ITNS280, 'no-pan.pdf');
      expect(r.ok).toBe(false);
    });

    it('sets ok to false when both BSR and CIN are missing', () => {
      const r = parseChallan(MISSING_BSR_AND_CIN, 'no-ref.pdf');
      expect(r.ok).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseChallan() — ITNS 281 (TDS/TCS)
// ─────────────────────────────────────────────────────────────────────────────

describe('parseChallan() — ITNS 281 (TDS/TCS)', () => {
  describe('with CIN', () => {
    let r;
    beforeEach(() => { r = parseChallan(ITNS281_TAN_CIN, 'itns281-cin.pdf'); });

    it('sets ok to true when TAN + CIN are present', () => expect(r.ok).toBe(true));
    it('detects ITNS type as 281', () => expect(r.itns).toBe('281'));
    it('extracts TAN', () => expect(r.tan).toBe('MUMS12345A'));
    it('pan is empty (TDS uses TAN)', () => expect(r.pan).toBe(''));
    it('extracts CIN', () => expect(r.cin).toBe('7654321041220001234'));
    it('extracts nature of payment (TDS section)', () => expect(r.natureOfPayment).toBe('194C'));
    it('parses tax and interest', () => {
      expect(r.tax).toBe(250000);
      expect(r.interest).toBe(5000);
      expect(r.total).toBe(255000);
    });
  });

  describe('with BSR code', () => {
    let r;
    beforeEach(() => { r = parseChallan(ITNS281_TAN_BSR, 'itns281-bsr.pdf'); });

    it('sets ok to true when TAN + BSR are present', () => expect(r.ok).toBe(true));
    it('extracts TAN', () => expect(r.tan).toBe('DELH98765B'));
    it('extracts BSR code', () => expect(r.bsr).toBe('3456789'));
    it('extracts challan number', () => expect(r.challanNo).toBe('00178'));
  });

  describe('validity checks', () => {
    it('sets ok to false when TAN is missing', () => {
      const r = parseChallan(MISSING_TAN_ITNS281, 'no-tan.pdf');
      expect(r.ok).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseChallan() — edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('parseChallan() — edge cases', () => {
  it('returns ok:false and all-empty fields for empty text', () => {
    const r = parseChallan(EMPTY_TEXT, 'empty.pdf');
    expect(r.ok).toBe(false);
    expect(r.pan).toBe('');
    expect(r.tan).toBe('');
    expect(r.tax).toBe(0);
    expect(r.total).toBe(0);
    expect(r.file).toBe('empty.pdf');
  });

  it('defaults ITNS to "280" when the ITNS line is absent', () => {
    const r = parseChallan(NO_ITNS_LINE, 'no-itns.pdf');
    expect(r.itns).toBe('280');
  });

  it('falls back to summing components when total label is absent', () => {
    const r = parseChallan(NO_TOTAL_LINE, 'no-total.pdf');
    // tax=10000, surcharge=0, cess=300, interest=200, penalty=0, others=0
    expect(r.total).toBe(10500);
  });

  it('parses large crore-level amounts correctly', () => {
    const r = parseChallan(LARGE_AMOUNTS, 'large.pdf');
    expect(r.tax).toBe(10000000);       // 1,00,00,000
    expect(r.surcharge).toBe(1000000);  // 10,00,000
    expect(r.cess).toBe(330000);        // 3,30,000
    expect(r.interest).toBe(50000);
    expect(r.penalty).toBe(10000);
    expect(r.others).toBe(5000);
    expect(r.total).toBe(11395000);     // 1,13,95,000
  });

  it('parses date in DD-Mon-YYYY format', () => {
    const r = parseChallan(DATE_HYPHEN_FORMAT, 'date-hyphen.pdf');
    expect(r.dod).toBe('31-Mar-2025');
  });

  it('parses date in DD/MM/YYYY format', () => {
    const r = parseChallan(DATE_SLASH_FORMAT, 'date-slash.pdf');
    expect(r.dod).toBe('31/03/2025');
  });

  it('handles multiline text (newlines flattened before parsing)', () => {
    const multiline = `ITNS No. : 280\nPAN : ABCDE1234F\nName : TEST NAME\nAssessment Year : 2024-25\nBSR Code : 1234567\nA Tax 1,000\nTotal (A+B+C+D+E+F) 1,000`;
    const r = parseChallan(multiline, 'multiline.pdf');
    expect(r.ok).toBe(true);
    expect(r.pan).toBe('ABCDE1234F');
    expect(r.tax).toBe(1000);
  });

  it('stores the original filename on the result', () => {
    const r = parseChallan(ITNS280_FULL, 'ABCDE1234F_2024-25_280.pdf');
    expect(r.file).toBe('ABCDE1234F_2024-25_280.pdf');
  });

  it('returns all expected keys on every result', () => {
    const expectedKeys = [
      'ok','itns','pan','tan','name','ay','fy',
      'major','minor','natureOfPayment','cin','mode','bank','bankRef',
      'dod','bsr','challanNo','tenderDate',
      'tax','surcharge','cess','interest','penalty','others','total','file',
    ];
    const r = parseChallan(EMPTY_TEXT, 'test.pdf');
    expectedKeys.forEach(k => expect(r).toHaveProperty(k));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseChallan() — total calculation precedence
// ─────────────────────────────────────────────────────────────────────────────

describe('parseChallan() — total calculation precedence', () => {
  it('uses the explicit total label even when it differs from component sum', () => {
    // Simulate a challan where the printed total includes a rounding adjustment
    const text = `
      ITNS No. : 280
      PAN : ABCDE1234F
      BSR Code : 1234567
      A Tax 10,000
      B Surcharge 0
      C Cess 300
      D Interest 200
      E Penalty 0
      F Others 0
      Total (A+B+C+D+E+F) 10,501
    `;
    const r = parseChallan(text, 'rounding.pdf');
    // Explicit total (10501) should take precedence over sum (10500)
    expect(r.total).toBe(10501);
  });
});
