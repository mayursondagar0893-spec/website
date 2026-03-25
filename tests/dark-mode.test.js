/**
 * Tests for dark mode — localStorage persistence and toggle behaviour
 *
 * The dark mode logic is embedded inline in every HTML page.
 * These tests verify the canonical pattern used across the site:
 *
 *   Load:   read localStorage.getItem('theme') → set data-theme attribute
 *   Toggle: flip data-theme attribute → write localStorage.setItem('theme', …)
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Pure helpers mirroring the pattern used across all HTML pages ──────────
//
// Every page embeds something equivalent to these two functions. Testing them
// as pure logic here gives us confidence that any page following the pattern
// will behave correctly.

function applyThemeOnLoad(root, storage) {
  const saved = storage.getItem('theme');
  if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme(root, storage) {
  const isDark = root.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  storage.setItem('theme', next);
  return next;
}

// ─── Lightweight localStorage stub ──────────────────────────────────────────

function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    _store: store,
  };
}

// ─── Test suite ─────────────────────────────────────────────────────────────

describe('applyThemeOnLoad', () => {
  let root;

  beforeEach(() => {
    root = document.documentElement;
    root.removeAttribute('data-theme');
  });

  it('sets data-theme="dark" when localStorage has theme="dark"', () => {
    const storage = makeStorage({ theme: 'dark' });
    applyThemeOnLoad(root, storage);
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('does not set data-theme when localStorage has theme="light"', () => {
    const storage = makeStorage({ theme: 'light' });
    applyThemeOnLoad(root, storage);
    // light is the HTML default — no attribute override needed
    expect(root.getAttribute('data-theme')).toBeNull();
  });

  it('does not set data-theme when localStorage is empty', () => {
    const storage = makeStorage();
    applyThemeOnLoad(root, storage);
    expect(root.getAttribute('data-theme')).toBeNull();
  });

  it('does not set data-theme for unrecognised stored values', () => {
    const storage = makeStorage({ theme: 'ocean' });
    applyThemeOnLoad(root, storage);
    expect(root.getAttribute('data-theme')).toBeNull();
  });
});

describe('toggleTheme', () => {
  let root;

  beforeEach(() => {
    root = document.documentElement;
    root.removeAttribute('data-theme');
  });

  it('switches from light to dark', () => {
    root.setAttribute('data-theme', 'light');
    const storage = makeStorage({ theme: 'light' });
    const result = toggleTheme(root, storage);
    expect(result).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('switches from dark to light', () => {
    root.setAttribute('data-theme', 'dark');
    const storage = makeStorage({ theme: 'dark' });
    const result = toggleTheme(root, storage);
    expect(result).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('persists the new theme to localStorage with key "theme"', () => {
    root.setAttribute('data-theme', 'light');
    const storage = makeStorage({ theme: 'light' });
    toggleTheme(root, storage);
    expect(storage._store.theme).toBe('dark');
  });

  it('persists "light" to localStorage when switching dark → light', () => {
    root.setAttribute('data-theme', 'dark');
    const storage = makeStorage({ theme: 'dark' });
    toggleTheme(root, storage);
    expect(storage._store.theme).toBe('light');
  });

  it('two consecutive toggles return to the original theme', () => {
    root.setAttribute('data-theme', 'dark');
    const storage = makeStorage({ theme: 'dark' });
    toggleTheme(root, storage);
    toggleTheme(root, storage);
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(storage._store.theme).toBe('dark');
  });

  it('uses the key "theme" (not any other key) for localStorage', () => {
    root.setAttribute('data-theme', 'light');
    const storage = makeStorage();
    toggleTheme(root, storage);
    expect('theme' in storage._store).toBe(true);
    // Confirm no other keys were written
    expect(Object.keys(storage._store)).toEqual(['theme']);
  });
});

describe('dark mode round-trip (load → toggle → reload)', () => {
  it('persisted dark preference survives a simulated page reload', () => {
    const storage = makeStorage();
    const root = document.documentElement;
    root.removeAttribute('data-theme');

    // First visit: toggle to dark
    root.setAttribute('data-theme', 'light');
    toggleTheme(root, storage);
    expect(storage._store.theme).toBe('dark');

    // Simulate reload — clear the DOM attribute then re-apply from storage
    root.removeAttribute('data-theme');
    applyThemeOnLoad(root, storage);
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('persisted light preference does not set any attribute on reload', () => {
    const storage = makeStorage({ theme: 'dark' });
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');

    // Toggle back to light
    toggleTheme(root, storage);
    expect(storage._store.theme).toBe('light');

    // Simulate reload
    root.removeAttribute('data-theme');
    applyThemeOnLoad(root, storage);
    // light is the HTML default; no attribute is set
    expect(root.getAttribute('data-theme')).toBeNull();
  });
});
