import { describe, expect, it } from 'vitest';
import { groupByYear, splitByPhoto } from '../../src/lib/batches';

const it_ = (title: string, year: number, photo: boolean) => ({ title, year, photo });
const has = (i: { photo: boolean }) => i.photo;
const titles = (xs: { title: string }[]) => xs.map((x) => x.title);

describe('splitByPhoto', () => {
  const items = [
    it_('a', 2025, true), it_('b', 2025, false), it_('c', 2024, true),
    it_('d', 2023, true), it_('e', 2022, false), it_('f', 2021, true),
  ];

  it('fills each batch with the next photo items, in order', () => {
    const { batches, rest } = splitByPhoto(items, has, [2, 1]);
    expect(batches.map(titles)).toEqual([['a', 'c'], ['d']]);
    expect(titles(rest)).toEqual(['b', 'e', 'f']);
  });

  it('keeps photo-less items out of every batch', () => {
    const { batches } = splitByPhoto(items, has, [10]);
    expect(titles(batches[0])).toEqual(['a', 'c', 'd', 'f']);
  });

  it('keeps sort order in the rest list', () => {
    const { rest } = splitByPhoto(items, has, [1]);
    expect(titles(rest)).toEqual(['b', 'c', 'd', 'e', 'f']);
  });

  it('handles an empty input and zero caps', () => {
    expect(splitByPhoto([], has, [8, 12])).toEqual({ batches: [[], []], rest: [] });
    expect(splitByPhoto(items, has, []).rest).toHaveLength(6);
  });
});

describe('groupByYear', () => {
  it('groups newest year first, preserving order within a year', () => {
    const out = groupByYear([it_('a', 2022, true), it_('b', 2024, true), it_('c', 2022, false), it_('d', 2024, false)]);
    expect(out.map((g) => g.year)).toEqual([2024, 2022]);
    expect(out.map((g) => titles(g.items))).toEqual([['b', 'd'], ['a', 'c']]);
  });

  it('returns an empty list for no items', () => {
    expect(groupByYear([])).toEqual([]);
  });
});
