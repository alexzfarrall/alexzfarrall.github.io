import { z } from 'astro/zod';

// Forgiving link input from the admin page: blank (or only spaces) means "no link";
// a missing scheme gets https://. "host:port" is treated as having no scheme.
const HAS_SCHEME = /^(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|tel:)/i;

export const normaliseUrl = (v: unknown): unknown => {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!t) return undefined;
  return HAS_SCHEME.test(t) ? t : `https://${t}`;
};

/** Forgiving link field: blank means none, https:// is added, and only web, mail and phone links are allowed. */
export const urlField = z.preprocess(normaliseUrl, z.url({ protocol: /^(https?|mailto|tel)$/ }).optional());
