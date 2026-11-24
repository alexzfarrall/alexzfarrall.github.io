const pin = (i: { pinned?: boolean }) => (i.pinned ? 0 : 1);

export function sortNewestFirst<T extends { year: number; title: string; pinned?: boolean }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => pin(a) - pin(b) || b.year - a.year || a.title.localeCompare(b.title));
}

export function sortResearch<T extends { status: string; highlight?: string; year: number; title: string; pinned?: boolean }>(
  items: readonly T[],
): T[] {
  const group = (i: T) => (i.status === 'Paper' ? 0 : i.highlight?.trim() ? 1 : 2);
  return [...items].sort(
    (a, b) => pin(a) - pin(b) || group(a) - group(b) || b.year - a.year || a.title.localeCompare(b.title),
  );
}
