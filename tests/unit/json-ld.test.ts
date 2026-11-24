import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '../../src/lib/json-ld';

describe('serializeJsonLd', () => {
  it('escapes < so the data cannot close the script element', () => {
    const input = { note: '</script><b>' };
    const out = serializeJsonLd(input);
    expect(out).not.toContain('<');
    expect(out).toContain(String.fromCharCode(92) + 'u003c/script>');
    expect(JSON.parse(out)).toEqual(input);
  });
});
