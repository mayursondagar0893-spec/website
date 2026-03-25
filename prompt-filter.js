/**
 * prompt-filter.js
 * Pure filter, sort and bookmark helpers for CA-Prompt-Library.html.
 * Shared between CA-Prompt-Library.html (browser globals) and the Vitest
 * test suite (CommonJS/ESM import).
 *
 * All functions are side-effect-free and depend only on their arguments.
 */

/**
 * Filter and sort a prompts array according to the given options.
 *
 * @param {object[]} prompts        - Array of prompt objects.
 * @param {object}   opts
 * @param {number[]} opts.bookmarks    - IDs of bookmarked prompts.
 * @param {string}   opts.activeFilter - 'all' | 'bm' (bookmarks) | 'mine' (custom).
 * @param {string}   opts.activeCat   - Category ID to filter by, or 'all'.
 * @param {string}   opts.query       - Free-text search string.
 * @param {string}   opts.sort        - 'az' | 'za' | 'cat' | anything else = default order.
 * @param {Function} opts.getCatLabel - Optional: (catId) => string. Used to search
 *                                      prompts by their category's display label.
 *                                      Defaults to returning the raw catId.
 * @returns {object[]} Filtered and sorted shallow copy of prompts.
 */
function filterAndSort(prompts, {
  bookmarks    = [],
  activeFilter = 'all',
  activeCat    = 'all',
  query        = '',
  sort         = 'default',
  getCatLabel  = (id) => id,
} = {}) {
  let list = [...prompts];

  // Special filter: bookmarks or custom prompts
  if (activeFilter === 'bm')   list = list.filter(p => bookmarks.includes(p.id));
  else if (activeFilter === 'mine') list = list.filter(p => p._custom);

  // Category filter
  if (activeCat !== 'all') list = list.filter(p => p.cat === activeCat);

  // Text search
  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      (p.tags || '').toLowerCase().includes(q) ||
      getCatLabel(p.cat).toLowerCase().includes(q)
    );
  }

  // Sort
  if (sort === 'az')  list.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'za')  list.sort((a, b) => b.title.localeCompare(a.title));
  else if (sort === 'cat') list.sort((a, b) => a.cat.localeCompare(b.cat));

  return list;
}

/**
 * Pure bookmark toggle — returns a new array without mutating the original.
 *
 * @param {number[]} bookmarks - Current bookmark IDs.
 * @param {number}   id        - Prompt ID to toggle.
 * @returns {number[]} New bookmarks array with id added or removed.
 */
function toggleBookmark(bookmarks, id) {
  return bookmarks.includes(id)
    ? bookmarks.filter(b => b !== id)
    : [...bookmarks, id];
}

// ── Module export (Node / Vitest) ──────────────────────────────────────────
// In the browser this block is a no-op; functions remain as globals.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { filterAndSort, toggleBookmark };
}
