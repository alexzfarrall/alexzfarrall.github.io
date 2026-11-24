/** Progressive "Show more" for the research section. Without JS the <details> works as a single toggle. */
export function initMoreBatch(root: HTMLElement | null, doc: Document = document): void {
  const details = root?.querySelector<HTMLDetailsElement>('[data-more]');
  const batches = details ? [...details.querySelectorAll<HTMLElement>(':scope > [data-batch]')] : [];
  if (!root || !details || batches.length === 0) return;
  const reduce = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const live = root.querySelector<HTMLElement>('[data-live]');

  // Take over from the native toggle: keep the details open and let the batches decide what shows.
  details.open = true;
  details.dataset.js = '';
  const summary = details.querySelector<HTMLElement>(':scope > summary');
  if (summary) summary.hidden = true;
  batches.forEach((b) => { b.hidden = true; });

  const bar = doc.createElement('div');
  bar.className = 'morebar';
  bar.setAttribute('data-more-controls', '');
  const button = doc.createElement('button');
  button.type = 'button';
  bar.append(button);
  details.after(bar);

  let step = 0;
  const count = (b: HTMLElement) => b.querySelectorAll(b.dataset.batch === 'cards' ? '.rcard' : 'li').length;
  const say = (text: string) => { if (live) live.textContent = text; };
  const render = () => {
    const next = batches[step];
    button.textContent = !next ? 'Show fewer' : next.dataset.batch === 'cards' ? `Show ${count(next)} more` : `Show earlier work (${count(next)})`;
  };
  const collapse = () => {
    batches.forEach((b) => { b.hidden = true; });
    step = 0;
    render();
  };

  button.addEventListener('click', () => {
    const next = batches[step];
    if (next) {
      next.hidden = false;
      step += 1;
      render();
      say(next.dataset.batch === 'cards' ? `${count(next)} more shown` : `Earlier work shown, ${count(next)} items`);
      const first = next.querySelector<HTMLElement>('.rcard, li');
      let target = first?.querySelector<HTMLElement>('a[href]') ?? null;
      if (!target && first) {
        first.tabIndex = -1; // focus target only; not a tab stop
        target = first;
      }
      target?.focus();
      return;
    }
    collapse();
    root.querySelector<HTMLElement>('#research-title')?.scrollIntoView?.({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    button.focus({ preventScroll: true });
    say('Showing fewer');
  });
  // The filter returns to the collapsed default view when "All" is chosen.
  root.addEventListener('more:reset', collapse);
  render();
}
