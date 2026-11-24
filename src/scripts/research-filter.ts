type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => unknown };

/** Skip the view transition when more elements than this change at once. */
export const MAX_TRANSITION_CHANGES = 12;

const COUNT_LABELS: Record<string, [string, string]> = {
  Paper: ['paper', 'papers'],
  Project: ['project', 'projects'],
  Supervised: ['supervised project', 'supervised projects'],
};

export function describeCount(shown: number, filter: string): string {
  if (filter === 'all') return `Showing ${shown} ${shown === 1 ? 'item' : 'items'}`;
  const [one, many] = COUNT_LABELS[filter] ?? [filter.toLowerCase(), filter.toLowerCase()];
  return `Showing ${shown} ${shown === 1 ? one : many}`;
}

/** Rows whose visibility would flip if `filter` were applied now. */
export function countChanges(root: HTMLElement, filter: string): number {
  let changed = 0;
  root.querySelectorAll<HTMLElement>('[data-status]').forEach((row) => {
    const match = filter === 'all' || row.dataset.status === filter;
    const before = !row.hidden && !row.closest('[data-batch][hidden]');
    // Under "all" the default view keeps the batches collapsed.
    const after = match && (filter !== 'all' || !row.closest('[data-batch]'));
    if (before !== after) changed += 1;
  });
  return changed;
}

export function applyFilter(root: HTMLElement, filter: string): number {
  let shown = 0;
  root.querySelectorAll<HTMLElement>('[data-status]').forEach((row) => {
    const match = filter === 'all' || row.dataset.status === filter;
    row.hidden = !match;
    if (match) shown += 1;
  });
  root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
  });
  root.querySelectorAll<HTMLElement>('.funders').forEach((f) => { f.hidden = filter !== 'all'; });
  // A phone rail with no visible card is hidden so no empty focusable region is left.
  root.querySelectorAll<HTMLElement>('.rail').forEach((r) => {
    r.hidden = r.querySelector('[data-status]') !== null && !r.querySelector('[data-status]:not([hidden])');
  });
  // Year headings and the "Earlier work" label go when none of their rows match.
  root.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => {
    g.hidden = !g.querySelector('[data-status]:not([hidden])') && g.querySelector('[data-status]') !== null;
  });
  const batches = root.querySelectorAll<HTMLElement>('[data-batch]');
  const bar = root.querySelector<HTMLElement>('[data-more-controls]');
  const more = root.querySelector<HTMLDetailsElement>('[data-more]');
  if (filter !== 'all') {
    // A filter shows every match, so reveal both regions and drop the more-buttons.
    if (more) more.open = true;
    // A batch with no matching card or row is hidden so it leaves no empty band.
    batches.forEach((b) => { b.hidden = !b.querySelector('[data-status]:not([hidden])'); });
    if (bar) bar.hidden = true;
  } else if (bar) {
    // "All" returns to the collapsed default view.
    bar.hidden = false;
    batches.forEach((b) => { b.hidden = true; });
    root.dispatchEvent(new Event('more:reset'));
  }
  // Announce only what is actually on screen.
  shown = [...root.querySelectorAll<HTMLElement>('[data-status]')].filter((r) => !r.hidden && !r.closest('[hidden]')).length;
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  if (empty) empty.hidden = shown > 0;
  const count = root.querySelector<HTMLElement>('[data-count]');
  if (count) count.textContent = describeCount(shown, filter);
  return shown;
}

export function initResearchFilter(root: HTMLElement | null, doc: Document = document): void {
  const bar = root?.querySelector<HTMLElement>('[data-filters]');
  if (!root || !bar) return;
  const reduce = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  bar.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!btn) return;
    const filter = btn.dataset.filter ?? 'all';
    const small = countChanges(root, filter) <= MAX_TRANSITION_CHANGES;
    const run = () => applyFilter(root, filter);
    const vtDoc = doc as ViewTransitionDoc;
    if (vtDoc.startViewTransition && !reduce && small) vtDoc.startViewTransition(run);
    else run();
  });
}
