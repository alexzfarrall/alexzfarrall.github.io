// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initSeal } from '../../src/scripts/seal';

const setScroll = (value: number) =>
  Object.defineProperty(window, 'scrollY', { value, configurable: true });
const mockMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q }));

let ring: SVGGElement;

beforeEach(() => {
  document.body.innerHTML = `<div data-seal><svg><g class="seal__ring"></g></svg></div>`;
  ring = document.querySelector<SVGGElement>('.seal__ring')!;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
});
afterEach(() => vi.unstubAllGlobals());

describe('seal', () => {
  it('does not rotate under reduced motion', () => {
    mockMotion(true);
    initSeal(document);
    setScroll(200);
    window.dispatchEvent(new Event('scroll'));
    expect(ring.style.transform).toBe('');
  });

  it('rotates with scroll when motion is allowed', () => {
    mockMotion(false);
    initSeal(document);
    setScroll(200);
    window.dispatchEvent(new Event('scroll'));
    expect(ring.style.transform).toBe('rotate(30deg)');
  });

  it('does nothing without a seal', () => {
    mockMotion(false);
    document.body.innerHTML = '';
    expect(() => initSeal(document)).not.toThrow();
  });
});
