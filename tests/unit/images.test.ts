import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';
import { makeImageResolver, makeLenientResolver } from '../../src/lib/images';

const fake = (src: string) => ({ src, width: 1, height: 1, format: 'jpg' }) as unknown as ImageMetadata;
const resolve = makeImageResolver({ '/src/assets/uploads/Hero.jpg': { default: fake('h') } });

describe('makeImageResolver', () => {
  it('resolves by file name whatever prefix the CMS wrote', () => {
    expect(resolve('/uploads/hero.jpg').src).toBe('h');
    expect(resolve('hero.jpg').src).toBe('h');
    expect(resolve('../../assets/uploads/Hero.jpg').src).toBe('h');
    expect(resolve('..\\assets\\uploads\\Hero.jpg').src).toBe('h');
  });

  it('throws a helpful error for an unknown image', () => {
    expect(() => resolve('/uploads/missing.jpg')).toThrow(/missing\.jpg.*src\/assets\/uploads/);
  });
});

describe('makeLenientResolver', () => {
  const lenient = makeLenientResolver({ '/src/assets/uploads/Hero.jpg': { default: fake('h') } });

  it('resolves existing images and ignores empty refs', () => {
    expect(lenient('hero.jpg')?.src).toBe('h');
    expect(lenient(undefined)).toBeUndefined();
    expect(lenient('')).toBeUndefined();
  });

  it('warns and returns undefined for a missing file instead of throwing', () => {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (m: string) => warns.push(String(m));
    try {
      expect(lenient('/uploads/gone.jpg')).toBeUndefined();
    } finally {
      console.warn = orig;
    }
    expect(warns.join()).toContain('gone.jpg');
  });
});
