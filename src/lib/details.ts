/** Pure helpers for project pop-outs (no Astro imports, so they are unit-testable). */

export interface DetailFields {
  summary?: string;
  gallery?: string[];
  results?: string[];
  pdf?: string;
}

interface Checks {
  /** True when a gallery path points at an uploaded photo. */
  image?: (path: string) => boolean;
  /** True when the PDF exists in public/files. */
  file?: (path: string) => boolean;
}

/** A research item gets a project page and pop-out when it has anything beyond the card itself. */
export function hasDetails(item: DetailFields, { image = () => true, file = () => true }: Checks = {}): boolean {
  return (
    Boolean(item.summary?.trim()) ||
    (item.gallery ?? []).some((g) => Boolean(g?.trim()) && image(g)) ||
    (item.results ?? []).some((r) => Boolean(r?.trim())) ||
    (Boolean(item.pdf?.trim()) && file(item.pdf!))
  );
}

/** Text for the main button: the owner's own words, else a sensible default for the item type. */
export function linkLabel(item: { status: string; linkLabel?: string }): string {
  return item.linkLabel?.trim() || (item.status === 'Paper' ? 'Read the paper' : 'Visit project');
}

/** "640 KB" or "1.2 MB". */
export function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1000) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export const projectHref = (id: string) => `/projects/${id}/`;

/** PDFs live in public/files and are linked as /files/<name>.pdf. */
export const isPdfPath = (v: string) => /^\/files\/[^?#]+\.pdf$/i.test(v) && !v.includes('..');

const blankToUndefined = (v: unknown) =>
  typeof v === 'string' ? v.trim() || undefined : v === null ? undefined : v;

/**
 * Overview PDF from the content file. Never fails the build: a missing leading "/" is added,
 * and anything that still isn't /files/<name>.pdf warns and is dropped (no PDF button).
 */
export function normalisePdf(v: unknown): string | undefined {
  const s = blankToUndefined(v);
  if (s === undefined) return undefined;
  if (typeof s === 'string') {
    const path = s.startsWith('/') ? s : `/${s}`;
    if (isPdfPath(path)) return path;
  }
  console.warn(`[files] Overview PDF "${String(s)}" is not a /files/<name>.pdf path; the PDF button is left out.`);
  return undefined;
}

/** Optional text with a length limit: blank means none; longer text is cut with an ellipsis and a warning. */
export function clampText(v: unknown, max: number): unknown {
  const s = blankToUndefined(v);
  if (typeof s !== 'string' || s.length <= max) return s;
  console.warn(`[content] "${s.slice(0, 40)}…" is longer than ${max} characters; it was shortened.`);
  return `${s.slice(0, max - 1).trimEnd()}…`;
}
