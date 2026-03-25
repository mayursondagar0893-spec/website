/**
 * Tests for wa-init.js — WhatsApp link initializer
 *
 * Verifies that clicking any .wa-link element opens the correct WhatsApp URL
 * and that the phone number is properly Base64-encoded (never plaintext).
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = fs.readFileSync(path.resolve(__dirname, '../wa-init.js'), 'utf8');

/**
 * Execute the wa-init script fresh against the current jsdom document.
 * We use the Function constructor to avoid polluting the module scope,
 * but we still rely on jsdom's globals (atob, document, window.open).
 */
function runWaInit() {
  // eslint-disable-next-line no-new-func
  new Function(SCRIPT)();
}

describe('wa-init.js', () => {
  let openSpy;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Spy on window.open
    openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Phone number encoding ────────────────────────────────────────────────

  it('Base64-encoded number decodes to a digit-only string', () => {
    const encoded = 'OTE5MTUyMDYyMDkw';
    const decoded = atob(encoded);
    expect(decoded).toMatch(/^\d+$/);
  });

  it('decoded number has a realistic length for an international number', () => {
    const decoded = atob('OTE5MTUyMDYyMDkw');
    // International numbers are 7-15 digits (ITU-T E.164)
    expect(decoded.length).toBeGreaterThanOrEqual(7);
    expect(decoded.length).toBeLessThanOrEqual(15);
  });

  it('script source does not contain the decoded phone number in plaintext', () => {
    const decoded = atob('OTE5MTUyMDYyMDkw');
    expect(SCRIPT).not.toContain(decoded);
  });

  // ── Click handler attachment ─────────────────────────────────────────────

  it('attaches a click handler to a single .wa-link element', () => {
    document.body.innerHTML = '<a class="wa-link" href="#">Chat on WhatsApp</a>';
    runWaInit();
    document.querySelector('.wa-link').click();
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('attaches click handlers to all .wa-link elements', () => {
    document.body.innerHTML = `
      <a class="wa-link">Link 1</a>
      <a class="wa-link">Link 2</a>
      <a class="wa-link">Link 3</a>
    `;
    runWaInit();
    document.querySelectorAll('.wa-link').forEach(el => el.click());
    expect(openSpy).toHaveBeenCalledTimes(3);
  });

  it('does not throw when no .wa-link elements exist in the DOM', () => {
    document.body.innerHTML = '<p>No WhatsApp links here</p>';
    expect(() => runWaInit()).not.toThrow();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('does not attach handler to non-.wa-link anchors', () => {
    document.body.innerHTML = `
      <a class="wa-link">WA link</a>
      <a class="other-link">Other link</a>
    `;
    runWaInit();
    document.querySelector('.other-link').click();
    expect(openSpy).not.toHaveBeenCalled();
  });

  // ── URL format ────────────────────────────────────────────────────────────

  it('opens a https://wa.me/ URL on click', () => {
    document.body.innerHTML = '<a class="wa-link" href="#">Chat</a>';
    runWaInit();
    document.querySelector('.wa-link').click();
    const [url] = openSpy.mock.calls[0];
    expect(url).toMatch(/^https:\/\/wa\.me\//);
  });

  it('opens the link in a new tab (_blank)', () => {
    document.body.innerHTML = '<a class="wa-link" href="#">Chat</a>';
    runWaInit();
    document.querySelector('.wa-link').click();
    const [, target] = openSpy.mock.calls[0];
    expect(target).toBe('_blank');
  });

  it('includes the decoded phone number in the WhatsApp URL', () => {
    document.body.innerHTML = '<a class="wa-link" href="#">Chat</a>';
    runWaInit();
    document.querySelector('.wa-link').click();
    const [url] = openSpy.mock.calls[0];
    const expectedNumber = atob('OTE5MTUyMDYyMDkw');
    expect(url).toContain(expectedNumber);
  });

  // ── Default behaviour ─────────────────────────────────────────────────────

  it('prevents default link navigation when .wa-link is clicked', () => {
    document.body.innerHTML = '<a class="wa-link" href="/somewhere">Chat</a>';
    runWaInit();
    const link = document.querySelector('.wa-link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
