import { describe, expect, it } from 'vitest';
import { sortNewestFirst, sortResearch } from '../../src/lib/lists';

describe('sortNewestFirst', () => {
  it('orders by year descending, then title ascending', () => {
    const out = sortNewestFirst([
      { year: 2022, title: 'B' },
      { year: 2025, title: 'Z' },
      { year: 2022, title: 'A' },
    ]);
    expect(out.map((i) => `${i.year}${i.title}`)).toEqual(['2025Z', '2022A', '2022B']);
  });

  it('does not mutate its input', () => {
    const input = [{ year: 1, title: 'a' }, { year: 2, title: 'b' }];
    sortNewestFirst(input);
    expect(input[0].year).toBe(1);
  });
});

describe('pinned', () => {
  it('sortNewestFirst puts pinned items first, then year desc', () => {
    const out = sortNewestFirst([
      { year: 2025, title: 'New' },
      { year: 2010, title: 'Pinned old', pinned: true },
      { year: 2020, title: 'Mid' },
    ]);
    expect(out.map((i) => i.title)).toEqual(['Pinned old', 'New', 'Mid']);
  });

  it('sortResearch puts pinned first, keeping Paper > highlighted > rest beneath', () => {
    const r = (title: string, status: string, year: number, pinned = false, highlight?: string) => ({ title, status, year, pinned, highlight });
    const out = sortResearch([
      r('paper', 'Paper', 2024), r('star', 'Project', 2023, false, 'News'),
      r('plainPin', 'Supervised', 2001, true), r('paperPin', 'Paper', 2005, true), r('plain', 'Project', 2022),
    ]);
    expect(out.map((i) => i.title)).toEqual(['paperPin', 'plainPin', 'paper', 'star', 'plain']);
  });
});

describe('sortResearch', () => {
  const r = (title: string, status: string, year: number, highlight?: string) => ({ title, status, year, highlight });
  const titles = (xs: { title: string }[]) => xs.map((x) => x.title);

  it('puts papers first even when older than projects', () => {
    const out = sortResearch([r('P', 'Project', 2025), r('Old paper', 'Paper', 2015)]);
    expect(titles(out)).toEqual(['Old paper', 'P']);
  });

  it('puts highlighted non-papers before plain ones', () => {
    const out = sortResearch([r('Plain', 'Project', 2025), r('Star', 'Supervised', 2018, 'Award-winning')]);
    expect(titles(out)).toEqual(['Star', 'Plain']);
  });

  it('orders newest first within each group', () => {
    const out = sortResearch([
      r('p1', 'Paper', 2020), r('p2', 'Paper', 2024),
      r('h1', 'Project', 2019, 'In the news'), r('h2', 'Project', 2023, 'In the news'),
      r('o1', 'Supervised', 2018), r('o2', 'Supervised', 2022),
    ]);
    expect(titles(out)).toEqual(['p2', 'p1', 'h2', 'h1', 'o2', 'o1']);
  });

  it('breaks ties by title ascending', () => {
    const out = sortResearch([r('B', 'Paper', 2022), r('A', 'Paper', 2022)]);
    expect(titles(out)).toEqual(['A', 'B']);
  });

  it('does not mutate its input', () => {
    const input = [r('b', 'Project', 2020), r('a', 'Paper', 2010)];
    sortResearch(input);
    expect(input[0].title).toBe('b');
  });
});
