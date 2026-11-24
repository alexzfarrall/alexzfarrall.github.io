/** Fill each batch with the next `caps[i]` items that have a photo; everything else is `rest`, in order. */
export function splitByPhoto<T>(
  items: readonly T[],
  hasPhoto: (item: T) => boolean,
  caps: readonly number[],
): { batches: T[][]; rest: T[] } {
  const batches: T[][] = caps.map(() => []);
  const rest: T[] = [];
  let b = 0;
  for (const item of items) {
    while (b < caps.length && batches[b].length >= caps[b]) b += 1;
    if (b < caps.length && hasPhoto(item)) batches[b].push(item);
    else rest.push(item);
  }
  return { batches, rest };
}

/** Group by year, newest first; items keep their incoming order within a year. */
export function groupByYear<T extends { year: number }>(items: readonly T[]): { year: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const list = map.get(item.year);
    if (list) list.push(item);
    else map.set(item.year, [item]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, list]) => ({ year, items: list }));
}
