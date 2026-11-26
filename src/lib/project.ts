import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { formatBytes, hasDetails } from './details';
import { resolveImage } from './uploads';

export type ResearchItem = CollectionEntry<'research'>['data'] & { id: string };

const warned = new Set<string>();
/** Size of a PDF in public/files, or undefined (with one warning) when the file is missing. */
export function pdfSize(path?: string): string | undefined {
  if (!path) return undefined;
  const file = join(process.cwd(), 'public', path);
  if (existsSync(file)) return formatBytes(statSync(file).size);
  if (!warned.has(path)) {
    warned.add(path);
    console.warn(`[files] "${path}" is not in public/files; the PDF button is left out.`);
  }
  return undefined;
}

/** An extra (gallery) photo, or undefined (with one warning) when the file is missing: it is skipped. */
export function galleryPhoto(path: string): ImageMetadata | undefined {
  try {
    return resolveImage(path);
  } catch {
    if (!warned.has(path)) {
      warned.add(path);
      console.warn(`[images] Extra photo "${path}" is not in src/assets/uploads; it is skipped.`);
    }
    return undefined;
  }
}

export const isProject = (item: CollectionEntry<'research'>['data']) =>
  !item.hidden &&
  hasDetails(item, { image: (p) => galleryPhoto(p) !== undefined, file: (p) => pdfSize(p) !== undefined });

/** Gallery photos that exist, in order. */
export const galleryImages = (item: { gallery?: string[] }): ImageMetadata[] =>
  (item.gallery ?? []).map(galleryPhoto).filter((m): m is ImageMetadata => m !== undefined);

/** Visible research items with their entry id, for the cards and project pages. */
export async function researchItems(): Promise<ResearchItem[]> {
  return (await getCollection('research')).map((e) => ({ ...e.data, id: e.id })).filter((r) => !r.hidden);
}
