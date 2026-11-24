/** Split a list into the first `cap` items and the remainder; the cap only applies when at least `minHidden` items would be hidden. */
export function capList<T>(items: readonly T[], cap: number, minHidden = 2): { shown: T[]; rest: T[] } {
  const n = Math.max(0, Math.floor(cap));
  // Never hide a single item behind a toggle ("+1 more"): show it instead.
  if (items.length - n < minHidden) return { shown: [...items], rest: [] };
  return { shown: items.slice(0, n), rest: items.slice(n) };
}

export const FUNDERS_CAP = 6;
export const FUNDERS_CAP_PHONE = 4;
export const FEATURED_CAP = 10;
