export function yearRange(start: number, end?: number): string {
  if (end === undefined) return `${start}–present`;
  if (end === start) return `${start}`;
  return `${start}–${end}`;
}
