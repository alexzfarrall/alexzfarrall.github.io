// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { initFeaturedToggle } from '../../src/scripts/featured-toggle';

const html = `<div class="featured"><ul class="featured__list"><li>a</li><li>b</li><li data-extra hidden>c</li></ul>
<button type="button" data-featured-toggle aria-expanded="false">All 3</button></div>`;

describe('initFeaturedToggle', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  it('reveals and re-hides the extras', () => {
    document.body.innerHTML = html;
    initFeaturedToggle(document);
    const btn = document.querySelector('button')!;
    const extra = document.querySelector<HTMLElement>('[data-extra]')!;
    btn.click();
    expect(extra.hidden).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.textContent).toBe('Fewer');
    btn.click();
    expect(extra.hidden).toBe(true);
    expect(btn.textContent).toBe('All 3');
  });
  it('does nothing without extras', () => {
    document.body.innerHTML = '<div class="featured"><ul class="featured__list"><li>a</li></ul></div>';
    expect(() => initFeaturedToggle(document)).not.toThrow();
  });
});
