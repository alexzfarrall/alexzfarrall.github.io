import type { ImageMetadata } from 'astro';
import { makeImageResolver, makeLenientResolver } from './images';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);

export const resolveImage = makeImageResolver(files);
/** Card photos: never fails the build. Use resolveImage for the hero and sharing image. */
export const resolveOptional = makeLenientResolver(files);
