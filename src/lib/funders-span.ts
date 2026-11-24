/** How many grid columns the funders panel should span after `cards` cards in a `columns`-wide grid. */
export function funderSpan(columns: number, cards: number): number {
  if (columns <= 2) return columns;
  const used = cards % columns;
  if (used === 0) return columns;
  const remaining = columns - used;
  return remaining === 1 ? columns : remaining;
}
