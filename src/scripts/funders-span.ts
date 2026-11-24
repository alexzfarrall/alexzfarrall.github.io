import { funderSpan } from '../lib/funders-span';

export function initFundersSpan(doc: Document = document): void {
  const panel = doc.querySelector<HTMLElement>('#research .funders');
  const grid = panel?.parentElement;
  const win = doc.defaultView;
  if (!panel || !grid || !win) return;
  const update = () => {
    // On phones the default cards are a swipe rail and the panel sits below it at full width.
    const rail = grid.querySelector<HTMLElement>(':scope > .rail');
    if (rail && win.matchMedia('(max-width: 36rem)').matches) {
      panel.style.gridColumn = '';
      return;
    }
    const tracks = win.getComputedStyle(grid).gridTemplateColumns.trim();
    const cols = tracks === '' || tracks === 'none' ? 0 : tracks.split(/\s+/).length;
    const cards = grid.querySelectorAll('.rcard').length;
    if (cols > 0) panel.style.gridColumn = `span ${funderSpan(cols, cards)}`;
  };
  let frame = 0;
  win.addEventListener('resize', () => {
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(update);
  });
  update();
}
