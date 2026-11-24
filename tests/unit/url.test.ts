import { describe, expect, it } from 'vitest';
import { normaliseUrl, urlField } from '../../src/lib/url';

describe('normaliseUrl', () => {
  it('treats blank, whitespace-only and null as no link', () => {
    expect(normaliseUrl('')).toBeUndefined();
    expect(normaliseUrl('   ')).toBeUndefined();
    expect(normaliseUrl(null)).toBeUndefined();
    expect(normaliseUrl(undefined)).toBeUndefined();
  });
  it('adds https:// when the scheme is missing, after trimming', () => {
    expect(normaliseUrl('bbc.com')).toBe('https://bbc.com');
    expect(normaliseUrl('  www.bbc.com/news ')).toBe('https://www.bbc.com/news');
  });
  it('treats host:port as missing a scheme', () => {
    expect(normaliseUrl('bbc.com:8080/x')).toBe('https://bbc.com:8080/x');
  });
  it('keeps full addresses, mailto and tel unchanged', () => {
    expect(normaliseUrl('https://x.org')).toBe('https://x.org');
    expect(normaliseUrl('http://x.org')).toBe('http://x.org');
    expect(normaliseUrl('mailto:a@b.co')).toBe('mailto:a@b.co');
    expect(normaliseUrl('tel:+441234')).toBe('tel:+441234');
  });
});

describe('urlField', () => {
  it('accepts web, mail and phone links and blanks', () => {
    for (const v of ['https://x.org', 'bbc.com', 'mailto:a@b.co', 'tel:+441234', '', undefined]) {
      expect(urlField.safeParse(v).success).toBe(true);
    }
  });
  it('rejects javascript: and other schemes', () => {
    expect(urlField.safeParse('javascript://x.org/%0Aalert(1)').success).toBe(false);
    expect(urlField.safeParse('javascript:alert(1)').success).toBe(false);
    expect(urlField.safeParse('ftp://x.org').success).toBe(false);
  });
});
