import { expect, it } from 'vitest';
import { buildProblemMailto, PROBLEM_SUBJECT } from '../../src/lib/mailto';

it('uses the fixed subject', () => {
  expect(PROBLEM_SUBJECT).toBe('A problem for you');
});

it('encodes subject and body, with CRLF line breaks', () => {
  expect(buildProblemMailto('a@b.co', 'Line one\nLine & two?')).toBe(
    'mailto:a@b.co?subject=A%20problem%20for%20you&body=Line%20one%0D%0ALine%20%26%20two%3F',
  );
});

it('trims surrounding whitespace', () => {
  expect(buildProblemMailto('a@b.co', '  hi  ')).toBe(
    'mailto:a@b.co?subject=A%20problem%20for%20you&body=hi',
  );
});

it('refuses an empty problem', () => {
  expect(() => buildProblemMailto('a@b.co', '   ')).toThrow('Problem text is empty');
});
