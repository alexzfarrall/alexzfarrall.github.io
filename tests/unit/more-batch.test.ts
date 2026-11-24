// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { initMoreBatch } from '../../src/scripts/more-batch';
import { initResearchFilter } from '../../src/scripts/research-filter';

const html = `
<section data-research>
  <h2 id="research-title">Research</h2>
  <div data-filters>
    <button data-filter="all" aria-pressed="true">All</button>
    <button data-filter="Paper" aria-pressed="false">Paper</button>
  </div>
  <p role="status" data-count></p>
  <div><article class="rcard" data-status="Paper"><a href="#a">A</a></article></div>
  <details data-more>
    <summary>Show all</summary>
    <div data-batch="cards">
      <article class="rcard" data-status="Paper"><a href="#b">B</a></article>
      <article class="rcard" data-status="Project"><a href="#c">C</a></article>
    </div>
    <div data-batch="earlier">
      <div data-group><div data-group><ol>
        <li data-status="Paper"><a href="#d">D</a></li>
        <li data-status="Project"><a href="#e">E</a></li>
        <li data-status="Project"><a href="#f">F</a></li>
      </ol></div></div>
    </div>
  </details>
  <p role="status" data-live></p>
</section>`;

let root: HTMLElement;
const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
const btn = () => $<HTMLButtonElement>('[data-more-controls] button');
const batch = (n: string) => $<HTMLElement>(`[data-batch="${n}"]`);

beforeEach(() => {
  document.body.innerHTML = html;
  root = document.querySelector<HTMLElement>('[data-research]')!;
  initMoreBatch(root, document);
});

describe('more-batch', () => {
  it('marks the details as JS-driven so its content box renders straight away', () => {
    expect($<HTMLDetailsElement>('[data-more]').hasAttribute('data-js')).toBe(true);
  });

  it('starts collapsed with one "Show N more" button and the native toggle hidden', () => {
    expect(batch('cards').hidden).toBe(true);
    expect(batch('earlier').hidden).toBe(true);
    expect(btn().textContent).toBe('Show 2 more');
    expect($<HTMLElement>('summary').hidden).toBe(true);
  });

  it('reveals the cards, focuses the first new link and announces it', () => {
    btn().click();
    expect(batch('cards').hidden).toBe(false);
    expect(batch('earlier').hidden).toBe(true);
    expect(document.activeElement?.getAttribute('href')).toBe('#b');
    expect($('[data-live]').textContent).toBe('2 more shown');
    expect(btn().textContent).toBe('Show earlier work (3)');
  });

  it('then reveals earlier work and offers "Show fewer"', () => {
    btn().click();
    btn().click();
    expect(batch('earlier').hidden).toBe(false);
    expect(document.activeElement?.getAttribute('href')).toBe('#d');
    expect($('[data-live]').textContent).toBe('Earlier work shown, 3 items');
    expect(btn().textContent).toBe('Show fewer');
  });

  it('collapses on "Show fewer", scrolls the heading in and focuses the button', () => {
    let scrolled = false;
    $<HTMLElement>('#research-title').scrollIntoView = () => { scrolled = true; };
    btn().click(); btn().click(); btn().click();
    expect(batch('cards').hidden).toBe(true);
    expect(batch('earlier').hidden).toBe(true);
    expect(scrolled).toBe(true);
    expect(document.activeElement).toBe(btn());
    expect(btn().textContent).toBe('Show 2 more');
  });

  it('does nothing when there are no batches (no-JS markup stays a details)', () => {
    document.body.innerHTML = '<section data-research><details data-more><summary>x</summary></details></section>';
    const r = document.querySelector<HTMLElement>('[data-research]')!;
    expect(() => initMoreBatch(r, document)).not.toThrow();
    expect(r.querySelector('[data-more-controls]')).toBeNull();
    expect(r.querySelector<HTMLDetailsElement>('[data-more]')!.open).toBe(false);
  });
});

describe('filter with batches', () => {
  beforeEach(() => initResearchFilter(root, document));
  const click = (f: string) => $<HTMLButtonElement>(`[data-filter="${f}"]`).click();
  const rows = () => [...root.querySelectorAll<HTMLElement>('[data-status]')].filter((r) => !r.hidden && !r.closest('[hidden]'));

  it('reveals every match in both regions, hides the buttons and announces the count', () => {
    click('Paper');
    expect(rows()).toHaveLength(3);
    expect(batch('cards').hidden).toBe(false);
    expect(batch('earlier').hidden).toBe(false);
    expect($<HTMLElement>('[data-more-controls]').hidden).toBe(true);
    expect($('[data-count]').textContent).toBe('Showing 3 papers');
  });

  it('hides year groups with no matching row', () => {
    click('Paper');
    expect($<HTMLElement>('[data-group] [data-group]').hidden).toBe(false);
    document.querySelector('[data-status="Paper"] a[href="#d"]')!.parentElement!.remove();
    click('Paper');
    expect($<HTMLElement>('[data-group]').hidden).toBe(true);
  });

  it('returns to the collapsed default view on "All"', () => {
    btn().click();
    click('Paper');
    click('all');
    expect(batch('cards').hidden).toBe(true);
    expect(batch('earlier').hidden).toBe(true);
    expect($<HTMLElement>('[data-more-controls]').hidden).toBe(false);
    expect(btn().textContent).toBe('Show 2 more');
    expect($('[data-count]').textContent).toBe('Showing 1 item');
  });
});
