/**
 * Tests for compliance-data.js — shared FY 2026-27 due-date rows
 * (used by Compliance_Calendar_FY2627.html and the homepage "Due next" card).
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { COMPLIANCE_DATA, upcomingDeadlines, isoDate, daysUntil } = require('../compliance-data.js');

const CATEGORIES = ['GST', 'TDS/TCS', 'PF/ESIC', 'Income Tax', 'Company Law', 'Other'];

describe('COMPLIANCE_DATA — shape', () => {
  it('has the 143 FY 2026-27 rows', () => {
    expect(COMPLIANCE_DATA.length).toBe(143);
  });

  it('has unique ids', () => {
    const ids = COMPLIANCE_DATA.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every row has a real ISO date, name, period and known category', () => {
    COMPLIANCE_DATA.forEach(r => {
      expect(r.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(r.d + 'T00:00:00Z'))).toBe(false);
      expect(new Date(r.d + 'T00:00:00Z').toISOString().slice(0, 10)).toBe(r.d);
      expect(r.n.trim().length).toBeGreaterThan(0);
      expect(typeof r.p).toBe('string');
      expect(CATEGORIES).toContain(r.c);
    });
  });

  it('every date falls in FY 2026-27 (Apr 2026 – Mar 2027)', () => {
    COMPLIANCE_DATA.forEach(r => {
      expect(r.d >= '2026-04-01' && r.d <= '2027-03-31').toBe(true);
    });
  });
});

describe('upcomingDeadlines', () => {
  it('returns the next rows on/after today, soonest first', () => {
    const rows = upcomingDeadlines(COMPLIANCE_DATA, '2026-11-06', 3);
    expect(rows.map(r => r.d)).toEqual(['2026-11-07', '2026-11-10', '2026-11-11']);
    expect(rows[0].n).toBe('TDS/TCS Payment');
  });

  it('includes a deadline that falls on today', () => {
    expect(upcomingDeadlines(COMPLIANCE_DATA, '2026-11-07', 1)[0].d).toBe('2026-11-07');
  });

  it('accepts a Date and uses local calendar date', () => {
    const rows = upcomingDeadlines(COMPLIANCE_DATA, new Date(2026, 10, 6, 23, 59), 1);
    expect(rows[0].d).toBe('2026-11-07');
  });

  it('breaks same-day ties by id', () => {
    const rows = upcomingDeadlines(COMPLIANCE_DATA, '2026-11-13', 2);
    expect(rows.every(r => r.d === '2026-11-13')).toBe(true);
    expect(rows[0].id).toBeLessThan(rows[1].id);
  });

  it('skips AGM-relative company-law rows (their date depends on each AGM)', () => {
    const rows = upcomingDeadlines(COMPLIANCE_DATA, '2026-04-01', 500);
    expect(rows.some(r => r._agmBase)).toBe(false);
    expect(rows.length).toBe(COMPLIANCE_DATA.filter(r => !r._agmBase).length);
  });

  it('returns [] after the last FY 2026-27 date', () => {
    expect(upcomingDeadlines(COMPLIANCE_DATA, '2027-04-01', 3)).toEqual([]);
  });

  it('does not reorder the shared data array', () => {
    const before = COMPLIANCE_DATA.map(r => r.id).join();
    upcomingDeadlines(COMPLIANCE_DATA, '2026-06-01', 5);
    expect(COMPLIANCE_DATA.map(r => r.id).join()).toBe(before);
  });
});

describe('isoDate / daysUntil', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('counts whole days, 0 for today', () => {
    expect(daysUntil('2026-11-06', '2026-11-06')).toBe(0);
    expect(daysUntil('2026-11-07', '2026-11-06')).toBe(1);
    expect(daysUntil('2027-03-31', '2026-11-06')).toBe(145);
  });
});
