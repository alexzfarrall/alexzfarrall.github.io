import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { FIELDS, RECOGNITION_TYPES, STATUSES } from './lib/constants';
import { urlField } from './lib/url';
import { clampText, normalisePdf } from './lib/details';

const yaml = (dir: string) => glob({ pattern: '*.yml', base: `./src/content/${dir}` });
// Pages CMS may write "" or null for an emptied optional field.
const opt = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());
// Forgiving link: blank/whitespace means none; https:// is added when the scheme is missing.
const url = urlField;
const hidden = opt(z.boolean()).transform((v) => v ?? false);
const pinned = opt(z.boolean()).transform((v) => v ?? false);
const order = opt(z.number().int()).transform((v) => v ?? 1000);
const year = z.number().int().min(1990).max(2100);
const text = z.string().trim().min(1);
// Optional text: spaces-only counts as blank.
const blank = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v === null ? undefined : v);
// Pop-out text never fails the build: text over the limit is shortened with an ellipsis (and a warning).
const optText = (max: number) => z.preprocess((v) => clampText(v, max), z.string().optional());
// Optional list: a single value becomes a list, blank entries are dropped, extras beyond `max` are ignored,
// and each entry is shortened to `itemMax` characters when given.
const optList = (max: number, itemMax?: number) =>
  z.preprocess((v) => {
    const list = (Array.isArray(v) ? v : [v])
      .map((x) => (itemMax ? clampText(x, itemMax) : blank(x)))
      .filter((x) => x !== undefined);
    return list.length ? list.slice(0, max) : undefined;
  }, z.array(z.string()).optional());

const site = defineCollection({
  loader: yaml('site'),
  schema: z.object({
    name: text,
    description: text.max(160),
    headline: text,
    subline: text,
    heroPhoto: text,
    heroAlt: text,
    socialImage: text,
    credential: z.object({
      title: text.max(30),
      issuer: text.max(30),
      year,
      mark: text.max(4),
      kicker: opt(z.string().trim().max(6)),
      caption: text.max(20),
      url,
    }),
    email: z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.email()),
    links: z.object({ linkedin: url, scholar: url, github: url }),
    memberships: opt(z.string()),
  }),
});

// A photo without a description falls back to the card's title so the build never fails.
const altFrom = (key: 'title' | 'name') => <T extends { photo?: string; photoAlt?: string }>(v: T) => ({
  ...v,
  photoAlt: v.photo && !v.photoAlt ? (v as Record<string, any>)[key] : v.photoAlt,
});

const ventures = defineCollection({
  loader: yaml('ventures'),
  schema: z
    .object({
      name: text,
      logo: opt(z.string()),
      field: text.max(60),
      role: text,
      startYear: year,
      endYear: opt(year),
      proof: text.max(120),
      url,
      photo: opt(z.string()),
      photoAlt: opt(z.string()),
      order,
      hidden,
    })
    .transform(altFrom('name')),
});

const research = defineCollection({
  loader: yaml('research'),
  schema: z
    .object({
      title: text,
      status: z.enum(STATUSES),
      field: z.enum(FIELDS),
      year,
      venue: opt(z.string()),
      highlight: opt(z.string().trim().max(40)),
      funders: opt(z.string()),
      pinned,
      hidden,
      url,
      photo: opt(z.string()),
      photoAlt: opt(z.string()),
      // Pop-out details (all optional).
      summary: optText(600),
      gallery: optList(6),
      results: optList(5, 120),
      pdf: z.preprocess(normalisePdf, z.string().optional()),
      linkLabel: optText(40),
    })
    .transform(altFrom('title')),
});

const recognition = defineCollection({
  loader: yaml('recognition'),
  schema: z
    .object({
      title: text,
      type: z.enum(RECOGNITION_TYPES),
      organisation: opt(z.string()),
      pinned,
      hidden,
      year,
      url,
      photo: opt(z.string()),
      photoAlt: opt(z.string()),
    })
    .transform(altFrom('title')),
});

const affiliations = defineCollection({
  loader: yaml('affiliations'),
  schema: z.object({
    name: text,
    logo: opt(z.string()),
    url,
    order,
    hidden,
  }),
});

const press = defineCollection({
  loader: yaml('press'),
  schema: z.object({
    name: text,
    logo: opt(z.string()),
    url,
    order,
    hidden,
  }),
});

const funders = defineCollection({
  loader: yaml('funders'),
  schema: z.object({
    name: text,
    short: opt(z.string().trim().max(12)),
    url,
    order,
    hidden,
  }),
});

export const collections = { site, ventures, research, recognition, affiliations, press, funders };
