/**
 * Tests for the contact form logic extracted to contact-form.js.
 *
 * Covers:
 *   - Email address validation regex
 *   - Required field validation (name, email, message)
 *   - WhatsApp message construction (with/without optional fields)
 *   - URL-encoding of the outgoing message
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { EMAIL_RE, validateForm, buildWAMessage, buildWAUrl } = require('../contact-form.js');

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Email validation regex', () => {
  const valid = [
    'user@example.com',
    'user.name+tag@sub.domain.org',
    'x@y.z',
    'ca.mayur@taxationupdates.com',
    '123@456.789',
  ];

  const invalid = [
    '',
    'notanemail',
    '@nodomain.com',
    'missing@',
    'missing@domain',
    'spaces in@email.com',
    'double@@at.com',
  ];

  valid.forEach(addr => {
    it(`accepts valid address: ${addr}`, () => {
      expect(EMAIL_RE.test(addr)).toBe(true);
    });
  });

  invalid.forEach(addr => {
    it(`rejects invalid address: "${addr}"`, () => {
      expect(EMAIL_RE.test(addr)).toBe(false);
    });
  });
});

describe('validateForm', () => {
  it('passes when all required fields are provided', () => {
    expect(validateForm('Mayur', 'ca@example.com', 'Tax query').ok).toBe(true);
  });

  it('fails when name is missing', () => {
    const r = validateForm('', 'ca@example.com', 'Query');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('missing_fields');
  });

  it('fails when email is missing', () => {
    const r = validateForm('Mayur', '', 'Query');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('missing_fields');
  });

  it('fails when message is missing', () => {
    const r = validateForm('Mayur', 'ca@example.com', '');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('missing_fields');
  });

  it('fails for an invalid email format', () => {
    const r = validateForm('Mayur', 'not-an-email', 'Query');
    expect(r.ok).toBe(false);
    expect(r.error).toBe('invalid_email');
  });

  it('trims whitespace-only values as empty (mirrors .trim() in HTML)', () => {
    // index.html does .value.trim() before passing to validation
    const trimmed = (v) => v.trim();
    const r = validateForm(trimmed('   '), 'ca@example.com', 'Query');
    expect(r.ok).toBe(false);
  });
});

describe('buildWAMessage', () => {
  it('includes name, email and message', () => {
    const msg = buildWAMessage({ name: 'Mayur', email: 'ca@test.com', msg: 'Hello' });
    expect(msg).toContain('Name: Mayur');
    expect(msg).toContain('Email: ca@test.com');
    expect(msg).toContain('Hello');
  });

  it('includes company when provided', () => {
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', company: 'ACME Ltd', msg: 'Query' });
    expect(msg).toContain('Company: ACME Ltd');
  });

  it('omits Company line when company is empty', () => {
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', company: '', msg: 'Query' });
    expect(msg).not.toContain('Company:');
  });

  it('omits Company line when company is not provided', () => {
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', msg: 'Query' });
    expect(msg).not.toContain('Company:');
  });

  it('includes purpose in the message', () => {
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', purpose: 'Tax Consultation', msg: 'Q' });
    expect(msg).toContain('Purpose: Tax Consultation');
  });

  it('defaults purpose to "General" when not provided', () => {
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', msg: 'Q' });
    expect(msg).toContain('Purpose: General');
  });

  it('starts with the greeting line', () => {
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', msg: 'Q' });
    expect(msg.startsWith('Hello CA Mayur,')).toBe(true);
  });

  it('preserves multiline messages', () => {
    const multiline = 'Line one\nLine two\nLine three';
    const msg = buildWAMessage({ name: 'A', email: 'a@b.com', msg: multiline });
    expect(msg).toContain('Line one\nLine two\nLine three');
  });
});

describe('buildWAUrl', () => {
  const WA_NUMBER = '919152062090'; // decoded from Base64 in wa-init.js

  it('produces a valid wa.me URL', () => {
    const url = buildWAUrl(WA_NUMBER, 'Hello');
    expect(url).toMatch(/^https:\/\/wa\.me\//);
  });

  it('includes the phone number in the URL', () => {
    const url = buildWAUrl(WA_NUMBER, 'Hello');
    expect(url).toContain(WA_NUMBER);
  });

  it('URL-encodes the message text', () => {
    const url = buildWAUrl(WA_NUMBER, 'Hello World & More');
    expect(url).toContain(encodeURIComponent('Hello World & More'));
  });

  it('encodes newlines in the message', () => {
    const url = buildWAUrl(WA_NUMBER, 'Line1\nLine2');
    expect(url).toContain('%0A'); // %0A is the URL-encoded newline
  });

  it('encodes special characters like @, +, =', () => {
    const url = buildWAUrl(WA_NUMBER, 'email@example.com');
    expect(url).not.toMatch(/\s/); // no literal whitespace in URL
    expect(url).toContain(encodeURIComponent('email@example.com'));
  });

  it('has correct structure: base + number + ?text= + encoded message', () => {
    const message = 'Test message';
    const url = buildWAUrl(WA_NUMBER, message);
    expect(url).toBe(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`);
  });
});
