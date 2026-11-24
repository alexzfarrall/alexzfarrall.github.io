// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initReveal } from '../../src/scripts/reveal';

const setReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
};

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.className = '';
});

describe('initReveal', () => {
  it('shows every section at once when reduced motion is preferred', () => {
    document.body.innerHTML = '<section class="reveal"></section><section class="reveal"></section>';
    setReducedMotion(true);
    initReveal(document);
    expect(document.querySelectorAll('.reveal.is-visible')).toHaveLength(2);
    expect(document.documentElement.classList.contains('reveal-on')).toBe(false);
  });

  it('reveals a section once it scrolls into view, then stops watching it', () => {
    document.body.innerHTML = '<section class="reveal"></section>';
    setReducedMotion(false);
    let callback!: IntersectionObserverCallback;
    class FakeObserver {
      constructor(cb: IntersectionObserverCallback) { callback = cb; }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeObserver;

    initReveal(document);
    expect(document.documentElement.classList.contains('reveal-on')).toBe(true);
    const el = document.querySelector('.reveal')!;
    expect(el.classList.contains('is-visible')).toBe(false);

    const unobserve = vi.fn();
    callback(
      [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
      { unobserve } as unknown as IntersectionObserver,
    );
    expect(el.classList.contains('is-visible')).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(el);
  });

  it('shows sections that are already on screen without hiding them', () => {
    document.body.innerHTML = '<section class="reveal" id="a"></section><section class="reveal" id="b"></section>';
    setReducedMotion(false);
    const observed: Element[] = [];
    class FakeObserver {
      observe(el: Element) { observed.push(el); }
      unobserve() {}
      disconnect() {}
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeObserver;
    const a = document.querySelector('#a')!;
    const b = document.querySelector('#b')!;
    a.getBoundingClientRect = () => ({ top: 0, bottom: 100 }) as DOMRect;

    initReveal(document);
    expect(a.classList.contains('is-visible')).toBe(true);
    expect(observed).not.toContain(a);
    expect(observed).toContain(b);
    expect(b.classList.contains('is-visible')).toBe(false);
  });
});
