import type { ImageMetadata } from 'astro';

type GlobResult = Record<string, { default: ImageMetadata }>;

const basename = (p: string) => (p.split(/[\\/]/).pop() ?? p).toLowerCase();

export function makeImageResolver(files: GlobResult): (ref: string) => ImageMetadata {
  const byName = new Map<string, ImageMetadata>();
  for (const [path, mod] of Object.entries(files)) byName.set(basename(path), mod.default);
  return (ref: string) => {
    const hit = byName.get(basename(ref));
    if (!hit) {
      throw new Error(`Image "${ref}" not found in src/assets/uploads. Upload it through the CMS or fix the path.`);
    }
    return hit;
  };
}

/** For card photos: a missing file warns and yields undefined so the card shows its placeholder. */
export function makeLenientResolver(files: GlobResult): (ref?: string | null) => ImageMetadata | undefined {
  const strict = makeImageResolver(files);
  return (ref) => {
    if (!ref) return undefined;
    try {
      return strict(ref);
    } catch {
      console.warn(`[images] "${ref}" is not in src/assets/uploads; showing the placeholder instead.`);
      return undefined;
    }
  };
}
