import { expect, it } from 'vitest';
import { initials } from '../../src/lib/initials';

it('takes the first letter of the first two words', () => {
  expect(initials('Dayaq Care')).toBe('DC');
  expect(initials('Top 50 UK Innovator')).toBe('T5');
});
it('uses the first two letters of a single word', () => {
  expect(initials('MindMorph')).toBe('Mi');
  expect(initials('ADEX')).toBe('AD');
});
it('ignores punctuation, brackets and extra spaces', () => {
  expect(initials('  [Award name]  ')).toBe('AN');
  expect(initials('OASIS: On-site Aquatic')).toBe('OO');
});
it('falls back to a dash for empty input', () => {
  expect(initials('  ')).toBe('–');
});
