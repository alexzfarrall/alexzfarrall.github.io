// Resize oversized images in src/assets/uploads to at most 1600px wide and re-encode them.
// JPEG -> mozjpeg q80, PNG stays PNG, metadata stripped. Idempotent: images <= 1600px are left alone.
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MAX_WIDTH = 1600;
const dir = fileURLToPath(new URL('../src/assets/uploads/', import.meta.url));
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

let before = 0;
let after = 0;
for (const name of (await readdir(dir)).sort()) {
  const ext = extname(name).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
  const file = join(dir, name);
  const input = await readFile(file);
  const meta = await sharp(input).metadata();
  if (!meta.width || meta.width <= MAX_WIDTH) continue;

  let pipeline = sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  pipeline = ext === '.png'
    ? pipeline.png({ compressionLevel: 9 })
    : pipeline.jpeg({ quality: 80, mozjpeg: true });
  const output = await pipeline.toBuffer(); // metadata is dropped by default
  const out = await sharp(output).metadata();
  const old = (await stat(file)).size;
  await writeFile(file, output);
  before += old;
  after += output.length;
  console.log(`${name}: ${meta.width}x${meta.height} ${kb(old)} -> ${out.width}x${out.height} ${kb(output.length)}`);
}
console.log(before ? `Total: ${kb(before)} -> ${kb(after)}` : 'Nothing to optimise.');
