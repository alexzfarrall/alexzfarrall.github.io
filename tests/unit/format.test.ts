import { expect, it } from 'vitest';
import { yearRange } from '../../src/lib/format';

it('shows an open range as "start–present"', () => {
  expect(yearRange(2021)).toBe('2021–present');
});

it('shows a closed range with an en dash', () => {
  expect(yearRange(2019, 2023)).toBe('2019–2023');
});

it('collapses a single-year range', () => {
  expect(yearRange(2024, 2024)).toBe('2024');
});
