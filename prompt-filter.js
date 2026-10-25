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
 * @param {string}   opts.activeFilter - 'all' | 'bm' (bookmarks) | 'mine' (custom) |
 *                                      'recent' (recently used, most recent first) |
 *                                      'new' (prompts flagged isNew or upd).
 * @param {number[]} opts.recent       - IDs of recently used prompts, most recent first.
 * @param {string}   opts.activeCat   - Category ID to filter by, or 'all'.
 * @param {string}   opts.diff         - Difficulty to filter by ('easy'|'med'|'adv'), or 'all'.
 * @param {string}   opts.query       - Free-text search string.
 * @param {string}   opts.sort        - 'az' | 'za' | 'cat' | anything else = default order.
 * @param {Function} opts.getCatLabel - Optional: (catId) => string. Used to search
 *                                      prompts by their category's display label.
 *                                      Defaults to returning the raw catId.
 * @returns {object[]} Filtered and sorted shallow copy of prompts.
 */
function filterAndSort(prompts, {
  bookmarks    = [],
  recent       = [],
  activeFilter = 'all',
  activeCat    = 'all',
  diff         = 'all',
  query        = '',
  sort         = 'default',
  getCatLabel  = (id) => id,
} = {}) {
  let list = [...prompts];

  // Special filter: bookmarks or custom prompts
  if (activeFilter === 'bm')   list = list.filter(p => bookmarks.includes(p.id));
  else if (activeFilter === 'mine') list = list.filter(p => p._custom);
  else if (activeFilter === 'new')  list = list.filter(p => p.isNew || p.upd);
  else if (activeFilter === 'recent') {
    list = list.filter(p => recent.includes(p.id))
               .sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  }

  // Category filter
  if (activeCat !== 'all') list = list.filter(p => p.cat === activeCat);

  // Difficulty filter
  if (diff !== 'all') list = list.filter(p => p.diff === diff);

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

/**
 * Return the unique [placeholder] labels in a prompt, in order of appearance.
 * Labels are the text between square brackets, e.g. 'Write for FY [year]' → ['year'].
 *
 * @param {string} text
 * @returns {string[]}
 */
function extractPlaceholders(text) {
  const out = [];
  const re = /\[([^\[\]\n]{1,80})\]/g;
  let m;
  while ((m = re.exec(String(text || ''))) !== null) {
    const label = m[1].trim();
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

/**
 * Replace [placeholder] tokens with the given values. Blank values leave the
 * placeholder untouched so the user can still see what is missing.
 *
 * @param {string} text
 * @param {Object<string,string>} values - Map of placeholder label → value.
 * @returns {string}
 */
function fillPlaceholders(text, values = {}) {
  return String(text || '').replace(/\[([^\[\]\n]{1,80})\]/g, (whole, label) => {
    const v = values[label.trim()];
    return v != null && String(v).trim() ? String(v).trim() : whole;
  });
}

/** Output-option instructions appended by applyOutputOptions, in display order. */
const OUTPUT_OPTIONS = {
  cite:     'Cite the exact sections, rules, notifications and circulars relied on, and state the law as on today\'s date.',
  risks:    'Highlight risks, possible errors and alternative views; clearly state any limitation instead of guessing.',
  ask:      'If any material fact is missing, ask me clarifying questions before answering.',
  table:    'Present the key output in a table.',
  letter:   'Format the final output as a formal letter ready to send.',
  hindi:    'Write the final answer in Hindi.',
  gujarati: 'Write the final answer in Gujarati.',
};

/**
 * Append the selected output instructions to a prompt.
 *
 * @param {string}   text
 * @param {string[]} keys - Keys of OUTPUT_OPTIONS to apply; unknown keys are ignored.
 * @returns {string}
 */
function applyOutputOptions(text, keys = []) {
  const extra = Object.keys(OUTPUT_OPTIONS).filter(k => keys.includes(k)).map(k => '- ' + OUTPUT_OPTIONS[k]);
  return extra.length ? String(text || '') + '\n\nOutput requirements:\n' + extra.join('\n') : String(text || '');
}

/**
 * Pure "recently used" update — moves id to the front, de-duplicates, caps length.
 *
 * @param {number[]} recent
 * @param {number}   id
 * @param {number}   max
 * @returns {number[]}
 */
function pushRecent(recent, id, max = 12) {
  return [id, ...recent.filter(r => r !== id)].slice(0, max);
}

// ── Module export (Node / Vitest) ──────────────────────────────────────────
// In the browser this block is a no-op; functions remain as globals.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    filterAndSort, toggleBookmark,
    extractPlaceholders, fillPlaceholders, applyOutputOptions, OUTPUT_OPTIONS, pushRecent,
  };
}
