/** "All N" toggle for the Featured in row. Extras carry `hidden`; the toggle un-hides them. */
export function initFeaturedToggle(doc: Document = document): void {
  doc.querySelectorAll<HTMLElement>('.featured').forEach((row) => {
    const button = row.querySelector<HTMLButtonElement>('[data-featured-toggle]');
    const extras = [...row.querySelectorAll<HTMLElement>('[data-extra]')];
    if (!button || extras.length === 0) return;
    const total = row.querySelectorAll('.featured__list li').length;
    let open = false;
    button.addEventListener('click', () => {
      open = !open;
      extras.forEach((li) => { li.hidden = !open; });
      row.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Fewer' : `All ${total}`;
    });
  });
}
