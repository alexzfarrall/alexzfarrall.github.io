// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { describeCount, initResearchFilter } from '../../src/scripts/research-filter';

const html = `
<section data-research>
  <div data-filters>
    <button data-filter="all" aria-pressed="true">All</button>
    <button data-filter="Published" aria-pressed="false">Published</button>
    <button data-filter="Supervised" aria-pressed="false">Supervised</button>
  </div>
  <ul><li data-status="Published">A</li><li data-status="In progress">B</li></ul>
  <details data-more><summary>Show all</summary><ul><li data-status="Published">C</li></ul></details>
  <p data-count></p>
  <aside class="funders">Funders</aside>
  <p data-empty hidden>Nothing here yet.</p>
</section>`;

let root: HTMLElement;
const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
const click = (f: string) => $<HTMLButtonElement>(`[data-filter="${f}"]`).click();
const visible = () =>
  [...root.querySelectorAll<HTMLElement>('[data-status]')].filter((r) => !r.hidden).map((r) => r.textContent);

beforeEach(() => {
  document.body.innerHTML = html;
  root = document.querySelector<HTMLElement>('[data-research]')!;
  initResearchFilter(root, document);
});

describe('research filter', () => {
  it('leaves the filter bar as rendered (no JS reveal, so no layout shift)', () => {
    expect($<HTMLElement>('[data-filters]').hidden).toBe(false);
  });

  it('shows only matching rows and opens the overflow list', () => {
    click('Published');
    expect(visible()).toEqual(['A', 'C']);
    expect($<HTMLDetailsElement>('[data-more]').open).toBe(true);
  });

  it('marks the active button with aria-pressed', () => {
    click('Published');
    expect($('[data-filter="Published"]').getAttribute('aria-pressed')).toBe('true');
    expect($('[data-filter="all"]').getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the empty message when nothing matches', () => {
    click('Supervised');
    expect(visible()).toEqual([]);
    expect($<HTMLElement>('[data-empty]').hidden).toBe(false);
  });

  it('restores every row with "all"', () => {
    click('Published');
    click('all');
    expect(visible()).toEqual(['A', 'B', 'C']);
    expect($<HTMLElement>('[data-empty]').hidden).toBe(true);
  });

  it('hides the funders panel for any filter other than "all"', () => {
    const panel = $<HTMLElement>('.funders');
    expect(panel.hidden).toBe(false);
    click('Published');
    expect(panel.hidden).toBe(true);
    click('all');
    expect(panel.hidden).toBe(false);
  });

  it('announces how many rows match', () => {
    click('Published');
    expect($('[data-count]').textContent).toBe('Showing 2 published');
  });

  it('does nothing when the section is missing', () => {
    expect(() => initResearchFilter(null, document)).not.toThrow();
  });
});

describe('countChanges', () => {
  it('counts rows whose visibility flips', async () => {
    const { countChanges } = await import('../../src/scripts/research-filter');
    expect(countChanges(root, 'Published')).toBe(1);
    expect(countChanges(root, 'all')).toBe(0);
  });

  it('hides a rail with no matching card and restores it on All', () => {
    const rail = document.createElement('div');
    rail.className = 'rail';
    rail.append($('li[data-status="Published"]'));
    root.prepend(rail);
    click('Supervised');
    expect($<HTMLElement>('.rail').hidden).toBe(true);
    click('Published');
    expect($<HTMLElement>('.rail').hidden).toBe(false);
    click('Supervised');
    click('all');
    expect($<HTMLElement>('.rail').hidden).toBe(false);
  });
});

describe('describeCount', () => {
  it('pluralises the label', () => {
    expect(describeCount(14, 'Project')).toBe('Showing 14 projects');
    expect(describeCount(1, 'Supervised')).toBe('Showing 1 supervised project');
    expect(describeCount(3, 'Paper')).toBe('Showing 3 papers');
    expect(describeCount(1, 'Paper')).toBe('Showing 1 paper');
    expect(describeCount(1, 'all')).toBe('Showing 1 item');
  });
});
