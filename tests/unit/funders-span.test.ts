// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { funderSpan } from '../../src/lib/funders-span';
import { initFundersSpan } from '../../src/scripts/funders-span';

describe('funderSpan', () => {
  it.each([
    [5, 8, 2], [4, 8, 4], [3, 8, 3], [2, 8, 2], [1, 8, 1], [5, 7, 3], [5, 9, 5],
    [3, 7, 2], [3, 9, 3], [2, 7, 2],
  ])('columns %i, cards %i -> %i', (c, n, want) => {
    expect(funderSpan(c, n)).toBe(want);
  });
});

describe('initFundersSpan', () => {
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; });
  it('sets grid-column from the computed track count', () => {
    document.body.innerHTML = `<section id="research"><div class="rgrid">${'<a class="rcard"></a>'.repeat(8)}<aside class="funders"></aside></div></section>`;
    const grid = document.querySelector('.rgrid') as HTMLElement;
    const orig = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) =>
      el === grid ? ({ gridTemplateColumns: '200px 200px 200px 200px 200px' } as CSSStyleDeclaration) : orig(el));
    initFundersSpan(document);
    expect((document.querySelector('.funders') as HTMLElement).style.gridColumn).toBe('span 2');
  });
  it('leaves the CSS default when columns are none or empty', () => {
    for (const v of ['none', '']) {
      document.body.innerHTML = `<section id="research"><div class="rgrid"><a class="rcard"></a><aside class="funders"></aside></div></section>`;
      const grid = document.querySelector('.rgrid') as HTMLElement;
      const orig = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) =>
        el === grid ? ({ gridTemplateColumns: v } as CSSStyleDeclaration) : orig(el));
      initFundersSpan(document);
      expect((document.querySelector('.funders') as HTMLElement).style.gridColumn).toBe('');
      vi.restoreAllMocks();
    }
  });
  it('leaves the panel alone when the cards are a phone rail', () => {
    document.body.innerHTML = '<section id="research"><div class="rgrid"><div class="rail"><a class="rcard"></a></div><aside class="funders"></aside></div></section>';
    const grid = document.querySelector('.rgrid') as HTMLElement;
    const rail = document.querySelector('.rail') as HTMLElement;
    const orig = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) =>
      el === grid ? ({ gridTemplateColumns: '200px 200px 200px' } as CSSStyleDeclaration)
        : el === rail ? ({ display: 'none' } as CSSStyleDeclaration) : orig(el));
    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ matches: true }) as MediaQueryList);
    const panel = document.querySelector('.funders') as HTMLElement;
    panel.style.gridColumn = 'span 2';
    initFundersSpan(document);
    expect(panel.style.gridColumn).toBe('');
  });
  it('still spans on wide screens when the rail is display: contents or hidden by a filter', () => {
    document.body.innerHTML = '<section id="research"><div class="rgrid"><div class="rail"><a class="rcard"></a></div><aside class="funders"></aside></div></section>';
    const grid = document.querySelector('.rgrid') as HTMLElement;
    const rail = document.querySelector('.rail') as HTMLElement;
    const orig = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) =>
      el === grid ? ({ gridTemplateColumns: '200px 200px 200px 200px' } as CSSStyleDeclaration)
        : el === rail ? ({ display: 'none' } as CSSStyleDeclaration) : orig(el));
    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ matches: false }) as MediaQueryList);
    initFundersSpan(document);
    expect((document.querySelector('.funders') as HTMLElement).style.gridColumn).toMatch(/^span \d$/);
  });
  it('does nothing without a panel', () => {
    document.body.innerHTML = '<section id="research"></section>';
    expect(() => initFundersSpan(document)).not.toThrow();
  });
});
