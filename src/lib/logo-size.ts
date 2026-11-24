import { readFileSync } from 'node:fs';
import { extname, isAbsolute, join, relative } from 'node:path';

export interface Dims { width: number; height: number }
export interface SizeOpts { area: number; maxHeight: number; maxWidth: number }

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];

export function pngDims(buf: Buffer): Dims | null {
  if (buf.length < 24 || PNG_SIG.some((b, i) => buf[i] !== b)) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return width > 0 && height > 0 ? { width, height } : null;
}

export function svgDims(text: string): Dims | null {
  const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(text);
  if (vb && +vb[1] > 0 && +vb[2] > 0) return { width: +vb[1], height: +vb[2] };
  const w = /<svg[^>]*\swidth\s*=\s*["']([\d.]+)(?:px)?["']/i.exec(text);
  const h = /<svg[^>]*\sheight\s*=\s*["']([\d.]+)(?:px)?["']/i.exec(text);
  return w && h && +w[1] > 0 && +h[1] > 0 ? { width: +w[1], height: +h[1] } : null;
}

export function readLogoDims(publicPath: string, root = join(process.cwd(), 'public')): Dims | null {
  try {
    const file = join(root, publicPath.replace(/^[\\/]+/, ''));
    // Lexical check: symlinks inside public/ are trusted; any name starting with '..' is rejected too.
    const rel = relative(root, file);
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
    const ext = extname(file).toLowerCase();
    if (ext === '.png') return pngDims(readFileSync(file));
    if (ext === '.svg') return svgDims(readFileSync(file, 'utf8'));
    return null;
  } catch {
    return null;
  }
}

export function opticalSize(
  dims: Dims,
  opts: SizeOpts = { area: 4200, maxHeight: 52, maxWidth: 170 },
): Dims {
  const r = dims.width / dims.height;
  let width = Math.sqrt(opts.area * r);
  let height = Math.sqrt(opts.area / r);
  if (height > opts.maxHeight) { width *= opts.maxHeight / height; height = opts.maxHeight; }
  if (width > opts.maxWidth) { height *= opts.maxWidth / width; width = opts.maxWidth; }
  return { width: Math.round(width), height: Math.round(height) };
}
