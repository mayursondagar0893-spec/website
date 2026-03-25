/**
 * contact-form.js
 * Pure helper functions for the contact form in index.html.
 * Shared between index.html (browser globals) and the Vitest test suite.
 *
 * All functions are side-effect-free and depend only on their arguments.
 */

/** Email validation regex — same pattern used in the form handler. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate the three required contact form fields.
 * @param {string} name
 * @param {string} email
 * @param {string} msg
 * @returns {{ ok: boolean, error?: 'missing_fields'|'invalid_email' }}
 */
function validateForm(name, email, msg) {
  if (!name || !email || !msg) return { ok: false, error: 'missing_fields' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  return { ok: true };
}

/**
 * Build the WhatsApp message text from form fields.
 * @param {{ name: string, email: string, company?: string, purpose?: string, msg: string }} opts
 * @returns {string}
 */
function buildWAMessage({ name, email, company = '', purpose = 'General', msg }) {
  return (
    `Hello CA Mayur,\n\nName: ${name}\nEmail: ${email}` +
    (company ? `\nCompany: ${company}` : '') +
    `\nPurpose: ${purpose}\n\n${msg}`
  );
}

/**
 * Build the full wa.me URL with URL-encoded message.
 * @param {string} waNumber  - International phone number (digits only, no +)
 * @param {string} message   - Plain-text message (will be URL-encoded)
 * @returns {string}
 */
function buildWAUrl(waNumber, message) {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

// ── Module export (Node / Vitest) ──────────────────────────────────────────
// In the browser this block is a no-op; functions remain as globals.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EMAIL_RE, validateForm, buildWAMessage, buildWAUrl };
}
