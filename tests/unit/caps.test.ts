import { describe, expect, it } from 'vitest';
import { capList } from '../../src/lib/caps';

describe('capList', () => {
  it('returns everything when under the cap', () => {
    expect(capList([1, 2, 3], 6)).toEqual({ shown: [1, 2, 3], rest: [] });
  });
  it('splits at the cap, keeping order', () => {
    const items = Array.from({ length: 12 }, (_, i) => i);
    const { shown, rest } = capList(items, 6);
    expect(shown).toEqual([0, 1, 2, 3, 4, 5]);
    expect(rest).toEqual([6, 7, 8, 9, 10, 11]);
  });
  it('handles empty input and exact fit', () => {
    expect(capList([], 6)).toEqual({ shown: [], rest: [] });
    expect(capList([1, 2], 2).rest).toEqual([]);
  });
  it('never hides exactly one item', () => {
    expect(capList([1, 2, 3, 4, 5, 6, 7], 6)).toEqual({ shown: [1, 2, 3, 4, 5, 6, 7], rest: [] });
    expect(capList([1, 2, 3, 4, 5], 4).rest).toEqual([]);
    expect(capList([1, 2, 3, 4, 5, 6], 4).rest).toEqual([5, 6]);
  });
  it('treats a non-positive cap as zero', () => {
    expect(capList([1, 2], -1)).toEqual({ shown: [], rest: [1, 2] });
  });
});
