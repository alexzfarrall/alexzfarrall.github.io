import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { opticalSize, pngDims, readLogoDims, svgDims } from '../../src/lib/logo-size';

function png(w: number, h: number): Buffer {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

describe('pngDims', () => {
  it('reads width/height from the IHDR chunk', () => {
    expect(pngDims(png(640, 200))).toEqual({ width: 640, height: 200 });
  });
  it('returns null for non-PNG data', () => {
    expect(pngDims(Buffer.from('hello world, not a png at all!!'))).toBeNull();
  });
});

describe('svgDims', () => {
  it('prefers the viewBox', () => {
    expect(svgDims('<svg viewBox="0 0 120 40" width="9" height="9"></svg>')).toEqual({ width: 120, height: 40 });
  });
  it('falls back to width/height attributes', () => {
    expect(svgDims('<svg width="90" height="30"></svg>')).toEqual({ width: 90, height: 30 });
  });
  it('ignores relative width/height units', () => {
    expect(svgDims('<svg width="100%" height="50%"></svg>')).toBeNull();
    expect(svgDims('<svg width="2em" height="30"></svg>')).toBeNull();
  });
  it('returns null when nothing usable', () => {
    expect(svgDims('<svg></svg>')).toBeNull();
  });
});

describe('readLogoDims', () => {
  it('returns null for unreadable or unsupported files', () => {
    expect(readLogoDims('/logos/does-not-exist.png')).toBeNull();
    expect(readLogoDims('/logos/x.jpg')).toBeNull();
  });
  it('reads a real file under public', () => {
    const d = readLogoDims('/logos/british-council.png');
    expect(d && d.width > 0 && d.height > 0).toBe(true);
  });
  it('refuses paths that escape the root, using a real out-of-root file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'logo-'));
    mkdirSync(join(dir, 'public', 'logos'), { recursive: true });
    writeFileSync(join(dir, 'secret.png'), png(300, 100));
    writeFileSync(join(dir, 'public', 'logos', 'ok.png'), png(300, 100));
    const root = join(dir, 'public');
    expect(readLogoDims('/../secret.png', root)).toBeNull();
    expect(readLogoDims('/..\\secret.png', root)).toBeNull();
    expect(readLogoDims('/logos/ok.png', root)).toEqual({ width: 300, height: 100 });
  });
  it('reads a PNG from a given root', () => {
    const dir = mkdtempSync(join(tmpdir(), 'logo-'));
    writeFileSync(join(dir, 'a.png'), png(300, 100));
    expect(readLogoDims('/a.png', dir)).toEqual({ width: 300, height: 100 });
  });
});

describe('opticalSize', () => {
  const area = (s: { width: number; height: number }) => s.width * s.height;
  it('gives roughly equal area for different ratios', () => {
    const a = opticalSize({ width: 150, height: 100 });
    const b = opticalSize({ width: 400, height: 100 });
    expect(Math.abs(area(a) - 4200)).toBeLessThan(250);
    expect(Math.abs(area(b) - 4200)).toBeLessThan(250);
  });
  it('respects the height cap', () => {
    const s = opticalSize({ width: 100, height: 400 });
    expect(s.height).toBeLessThanOrEqual(52);
  });
  it('respects the width cap', () => {
    const s = opticalSize({ width: 2000, height: 100 });
    expect(s.width).toBeLessThanOrEqual(170);
  });
  it('keeps the aspect ratio when capping', () => {
    const s = opticalSize({ width: 800, height: 100 });
    expect(Math.abs(s.width / s.height - 8)).toBeLessThan(0.5);
  });
});
