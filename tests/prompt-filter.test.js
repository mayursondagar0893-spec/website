/**
 * Tests for the CA Prompt Library filter / sort / bookmark logic
 * imported from prompt-filter.js.
 *
 * Previously, these functions were re-implemented inline in the test file.
 * They now import directly from the production module so that any change to
 * filterAndSort or toggleBookmark is immediately caught by this suite.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { filterAndSort, toggleBookmark } = require('../prompt-filter.js');

// ─── Category helpers (mirrors getCat in CA-Prompt-Library.html) ─────────────

const CATS = [
  { id: 'all',   icon: '📚', label: 'All Prompts' },
  { id: 'tax',   icon: '💼', label: 'Tax & Compliance' },
  { id: 'audit', icon: '🔍', label: 'Audit & Assurance' },
  { id: 'gst',   icon: '📊', label: 'GST' },
  { id: 'fin',   icon: '📈', label: 'Finance & Advisory' },
];

function getCat(id) {
  return CATS.find(c => c.id === id) || { id, icon: '📄', label: id };
}

// Convenience: pass getCatLabel so category-label search works as in the HTML.
const withCatLabel = { getCatLabel: (id) => getCat(id).label };

// ─── Fixture data ────────────────────────────────────────────────────────────

const PROMPTS = [
  { id: 1, title: 'Draft ITR Filing Checklist',     cat: 'tax',   prompt: 'Create a comprehensive ITR filing checklist',           tags: 'itr,checklist,compliance' },
  { id: 2, title: 'GST Reconciliation Template',    cat: 'gst',   prompt: 'Generate a GSTR-2A vs GSTR-3B reconciliation template', tags: 'gst,reconciliation' },
  { id: 3, title: 'Audit Planning Memo',            cat: 'audit', prompt: 'Prepare an audit planning memorandum for a mid-sized company', tags: 'audit,planning' },
  { id: 4, title: 'Cash Flow Forecast',             cat: 'fin',   prompt: 'Build a 12-month cash flow forecast model',             tags: 'finance,forecast,cashflow' },
  { id: 5, title: 'Tax Notice Response',            cat: 'tax',   prompt: 'Draft a professional reply to an income tax notice',    tags: 'tax,notice,compliance' },
  { id: 6, title: 'GST Input Tax Credit Analysis',  cat: 'gst',   prompt: 'Analyse eligible ITC claims under Section 16',         tags: 'gst,itc,section16' },
  { id: 7, title: 'Internal Audit Report',          cat: 'audit', prompt: 'Generate an internal audit report template',            tags: 'audit,report,internal', _custom: true },
  { id: 8, title: 'Investment Advisory Note',       cat: 'fin',   prompt: 'Prepare an investment advisory note for HNI clients',  tags: 'finance,advisory,hni' },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('filterAndSort — no filters', () => {
  it('returns all prompts when no filters are applied', () => {
    expect(filterAndSort(PROMPTS)).toHaveLength(PROMPTS.length);
  });

  it('returns a shallow copy (does not mutate the original array)', () => {
    const original = [...PROMPTS];
    filterAndSort(PROMPTS, { sort: 'az' });
    expect(PROMPTS).toEqual(original);
  });
});

describe('filterAndSort — category filter', () => {
  it('returns only tax prompts when activeCat is "tax"', () => {
    const result = filterAndSort(PROMPTS, { activeCat: 'tax' });
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.cat).toBe('tax'));
  });

  it('returns only gst prompts when activeCat is "gst"', () => {
    const result = filterAndSort(PROMPTS, { activeCat: 'gst' });
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.cat).toBe('gst'));
  });

  it('returns all prompts when activeCat is "all"', () => {
    expect(filterAndSort(PROMPTS, { activeCat: 'all' })).toHaveLength(PROMPTS.length);
  });

  it('returns empty array for a category with no prompts', () => {
    expect(filterAndSort(PROMPTS, { activeCat: 'nonexistent' })).toHaveLength(0);
  });
});

describe('filterAndSort — text search', () => {
  it('matches prompts by title (case-insensitive)', () => {
    const result = filterAndSort(PROMPTS, { query: 'audit' });
    expect(result.length).toBeGreaterThan(0);
    result.forEach(p => {
      const haystack = (p.title + p.prompt + (p.tags || '')).toLowerCase();
      expect(haystack).toContain('audit');
    });
  });

  it('matches prompts by prompt body text', () => {
    const result = filterAndSort(PROMPTS, { query: 'reconciliation' });
    expect(result.some(p => p.id === 2)).toBe(true);
  });

  it('matches prompts by tags', () => {
    const result = filterAndSort(PROMPTS, { query: 'checklist' });
    expect(result.some(p => p.id === 1)).toBe(true);
  });

  it('matches prompts by category label when getCatLabel is provided', () => {
    // "Finance & Advisory" contains "advisory" — not in title/prompt/tags of id 8
    // but IS in its category label
    const withLabel = filterAndSort(PROMPTS, { query: 'Finance & Advisory', ...withCatLabel });
    const withoutLabel = filterAndSort(PROMPTS, { query: 'Finance & Advisory' });
    expect(withLabel.length).toBeGreaterThan(withoutLabel.length);
  });

  it('returns empty array when query matches nothing', () => {
    expect(filterAndSort(PROMPTS, { query: 'zzznomatch' })).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const lower = filterAndSort(PROMPTS, { query: 'gst' });
    const upper = filterAndSort(PROMPTS, { query: 'GST' });
    expect(lower).toEqual(upper);
  });

  it('ignores leading/trailing whitespace in query', () => {
    const trimmed   = filterAndSort(PROMPTS, { query: 'audit' });
    const untrimmed = filterAndSort(PROMPTS, { query: '  audit  ' });
    expect(trimmed).toEqual(untrimmed);
  });
});

describe('filterAndSort — combined category + text search', () => {
  it('applies both category filter and text search', () => {
    const result = filterAndSort(PROMPTS, { activeCat: 'tax', query: 'notice' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });

  it('returns empty when text search eliminates all category matches', () => {
    const result = filterAndSort(PROMPTS, { activeCat: 'gst', query: 'audit' });
    expect(result).toHaveLength(0);
  });
});

describe('filterAndSort — bookmark filter', () => {
  const bookmarks = [1, 3, 5];

  it('returns only bookmarked prompts when activeFilter is "bm"', () => {
    const result = filterAndSort(PROMPTS, { bookmarks, activeFilter: 'bm' });
    expect(result).toHaveLength(3);
    result.forEach(p => expect(bookmarks).toContain(p.id));
  });

  it('returns empty when bookmarks list is empty', () => {
    const result = filterAndSort(PROMPTS, { bookmarks: [], activeFilter: 'bm' });
    expect(result).toHaveLength(0);
  });

  it('bookmark filter stacks with category filter', () => {
    const result = filterAndSort(PROMPTS, { bookmarks, activeFilter: 'bm', activeCat: 'tax' });
    // bookmarked tax prompts are ids 1 and 5
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.cat).toBe('tax'));
  });
});

describe('filterAndSort — custom ("mine") filter', () => {
  it('returns only prompts with _custom flag when activeFilter is "mine"', () => {
    const result = filterAndSort(PROMPTS, { activeFilter: 'mine' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(7);
  });

  it('returns empty when no custom prompts exist', () => {
    const noCustom = PROMPTS.filter(p => !p._custom);
    const result = filterAndSort(noCustom, { activeFilter: 'mine' });
    expect(result).toHaveLength(0);
  });
});

describe('filterAndSort — sort', () => {
  it('sorts A→Z by title', () => {
    const result = filterAndSort(PROMPTS, { sort: 'az' });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].title.localeCompare(result[i].title)).toBeLessThanOrEqual(0);
    }
  });

  it('sorts Z→A by title', () => {
    const result = filterAndSort(PROMPTS, { sort: 'za' });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].title.localeCompare(result[i].title)).toBeGreaterThanOrEqual(0);
    }
  });

  it('sorts by category id', () => {
    const result = filterAndSort(PROMPTS, { sort: 'cat' });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].cat.localeCompare(result[i].cat)).toBeLessThanOrEqual(0);
    }
  });

  it('a→z and z→a sorts are exact reverses of each other', () => {
    const az = filterAndSort(PROMPTS, { sort: 'az' });
    const za = filterAndSort(PROMPTS, { sort: 'za' });
    expect(az.map(p => p.id)).toEqual(za.map(p => p.id).reverse());
  });
});

describe('toggleBookmark', () => {
  it('adds a new id to an empty bookmarks list', () => {
    expect(toggleBookmark([], 1)).toEqual([1]);
  });

  it('adds a new id to an existing bookmarks list', () => {
    expect(toggleBookmark([1, 2], 3)).toContain(3);
  });

  it('removes an id that is already bookmarked', () => {
    expect(toggleBookmark([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it('does not mutate the original bookmarks array', () => {
    const original = [1, 2, 3];
    toggleBookmark(original, 2);
    expect(original).toEqual([1, 2, 3]);
  });

  it('toggling the same id twice returns the original list', () => {
    const start = [1, 2];
    const after  = toggleBookmark(start, 3);
    const back   = toggleBookmark(after, 3);
    expect(back).toEqual(start);
  });

  it('allows bookmarking multiple distinct ids', () => {
    let bm = [];
    bm = toggleBookmark(bm, 1);
    bm = toggleBookmark(bm, 5);
    bm = toggleBookmark(bm, 7);
    expect(bm).toHaveLength(3);
    expect(bm).toContain(1);
    expect(bm).toContain(5);
    expect(bm).toContain(7);
  });
});
