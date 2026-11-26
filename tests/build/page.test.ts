import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { parse } from 'yaml';
import { beforeAll, describe, expect, it } from 'vitest';

import { RECOGNITION_TYPES, STATUSES } from '../../src/lib/constants';

let doc: Document;

const readYml = (path: string) => (parse(readFileSync(path, 'utf8')) ?? {}) as Record<string, any>;
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Hidden (draft) entries are not rendered, so only visible ones count.
const visibleEntries = (dir: string) =>
  readdirSync(`src/content/${dir}`)
    .filter((f) => f.endsWith('.yml'))
    .map((f) => readYml(`src/content/${dir}/${f}`))
    .filter((d) => d.hidden !== true);
const countFiles = (dir: string) => visibleEntries(dir).length;
const uploads = new Set(readdirSync('src/assets/uploads').map((f) => f.toLowerCase()));
const hasPhoto = (d: Record<string, any>) =>
  d.pinned === true ||
  typeof d.photo === 'string' && uploads.has((d.photo.split(/[\/]/).pop() ?? '').toLowerCase());
const site = readYml('src/content/site/site.yml');
const credField = (k: string) => String(site.credential[k] ?? '').trim();
const memberships = String(site.memberships ?? '').trim();

beforeAll(() => {
  const html = readFileSync('dist/index.html', 'utf8');
  const win = new Window();
  doc = new win.DOMParser().parseFromString(html, 'text/html') as unknown as Document;
});

const all = (sel: string) => Array.from(doc.querySelectorAll(sel));

describe('built page', () => {
  it('has exactly one plain h1 with the headline', () => {
    expect(all('h1')).toHaveLength(1);
    const h1 = doc.querySelector('h1')!;
    expect(h1.textContent).toBe('Engineer, founder and researcher.');
    expect(h1.querySelector('sup, a, .visually-hidden')).toBeNull();
  });

  it('has a hero button that jumps to the contact box', () => {
    expect(doc.querySelector('#top a[href="#contact"]')).not.toBeNull();
  });

  it('has a credential seal with an accessible label and a mark and caption core', () => {
    const seal = doc.querySelector('[data-seal]')!;
    expect(seal.getAttribute('aria-label')).toContain(credField('title'));
    expect(seal.getAttribute('aria-label')).toContain(credField('issuer'));
    expect(seal.querySelector('.seal__ring')).not.toBeNull();
    const core = seal.querySelector('.seal__core')!.textContent!;
    expect(core).toContain(credField('mark'));
    const kicker = credField('kicker');
    if (kicker) expect(core).toContain(kicker);
    for (const w of credField('caption').split(' ')) expect(core).toContain(w);
  });

  it('has the sections in the agreed order', () => {
    const ids = all('main > section[id]').map((s) => s.id);
    expect(ids).toEqual(['top', 'ventures', 'research', 'recognition', 'contact']);
  });

  it('gives every image an alt attribute', () => {
    for (const img of all('img')) expect(img.hasAttribute('alt')).toBe(true);
  });

  it('duplicates the logo track for the marquee without exposing the copy', () => {
    const tracks = all('.strip__track');
    expect(tracks).toHaveLength(2);
    expect(tracks[1].getAttribute('aria-hidden')).toBe('true');
    expect(tracks[1].querySelectorAll('a')).toHaveLength(0);
    expect(tracks[0].querySelectorAll('li')).toHaveLength(countFiles('affiliations'));
  });

  it('caps visible research cards at 8 and renders the filter bar visible (hidden only for no-JS via noscript)', () => {
    const research = doc.querySelector('#research')!;
    const details = research.querySelector('details[data-more]');
    const visible = Array.from(research.querySelectorAll('.rcard')).filter((c) => !details?.contains(c));
    expect(visible.length).toBe(Math.min(visibleEntries('research').filter(hasPhoto).length, 8));
    for (const card of research.querySelectorAll('.rcard')) {
      expect(STATUSES as readonly string[]).toContain(card.getAttribute('data-status'));
    }
    expect(research.querySelector('[data-filters]')?.hasAttribute('hidden')).toBe(false);
    expect(doc.querySelector('noscript')?.innerHTML ?? '').toContain('[data-filters]');
  });

  it('caps visible recognition cards at 6, each with an image area and a known type', () => {
    const rec = doc.querySelector('#recognition')!;
    const details = rec.querySelector('details[data-more]');
    const visible = Array.from(rec.querySelectorAll('[data-recognition]')).filter((c) => !details?.contains(c));
    expect(visible.length).toBe(Math.min(visibleEntries('recognition').filter(hasPhoto).length, 6));
    for (const c of visible) expect(c.querySelector('img, .placeholder')).not.toBeNull();
    expect(rec.querySelector('#recognition-title')?.textContent).toBe('Recognition and media');
    for (const c of rec.querySelectorAll('[data-recognition] .rec__type')) {
      expect(RECOGNITION_TYPES as readonly string[]).toContain(c.textContent!.split(' · ')[0]);
    }
  });

  it('shows only photo cards by default and puts every other item in a year-grouped list', () => {
    const research = visibleEntries('research');
    const rec = visibleEntries('recognition');
    for (const [sel, cap, entries] of [['#research', 20, research], ['#recognition', 6, rec]] as const) {
      const section = doc.querySelector(sel)!;
      const cards = Array.from(section.querySelectorAll('.rcard, [data-recognition]'));
      expect(cards.length).toBe(Math.min(entries.filter(hasPhoto).length, cap));
      // Only a pinned item may show the placeholder in place of a photo.
      const pinnedCount = entries.filter((d) => d.pinned === true).length;
      expect(cards.filter((c) => c.querySelector('.placeholder')).length).toBeLessThanOrEqual(pinnedCount);
      const rows = Array.from(section.querySelectorAll('.earlier__row'));
      expect(rows.length + cards.length).toBe(entries.length);
      for (const h of section.querySelectorAll('.earlier__heading')) {
        expect(h.tagName).toBe('H3');
        expect(h.textContent).toMatch(/^\d{4}$/);
        expect(h.nextElementSibling?.tagName).toBe('OL');
      }
      const years = Array.from(section.querySelectorAll('.earlier__heading')).map((h) => Number(h.textContent));
      expect(years).toEqual([...years].sort((a, b) => b - a));
    }
    for (const row of doc.querySelectorAll('#research .earlier__row')) {
      expect(STATUSES as readonly string[]).toContain(row.getAttribute('data-status'));
    }
    const first = Array.from(doc.querySelectorAll('#research .rcard')).filter((c) => !c.closest('details'));
    expect(first.length).toBeLessThanOrEqual(8);
    for (const c of doc.querySelectorAll('#research details .rcard')) expect(c.getAttribute('style') ?? '').not.toContain('view-transition-name');
    expect(doc.querySelector('#research [role="status"][data-count]')).not.toBeNull();
  });

  it('opens external card links in a new tab safely', () => {
    const links = all('[data-venture], .rcard a, [data-recognition] a')
      .flatMap((el) => (el.tagName === 'A' ? [el] : Array.from(el.querySelectorAll('a'))))
      .concat(all('.rcard a, [data-recognition] a'))
      .filter((a) => (a.getAttribute('href') ?? '').startsWith('http'));
    for (const a of new Set(links)) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
  });

  it('orders research cards Paper, then highlighted, then the rest', () => {
    const group = (c: Element) =>
      c.querySelector('.chip')!.textContent === 'Paper' ? 0 : c.querySelector('.ribbon') ? 1 : 2;
    // Pinned cards sit above the Paper group (ruling R1), so skip them.
    const pinned = visibleEntries('research').filter((d) => d.pinned === true).length;
    const groups = all('#research .rcard').slice(pinned).map(group);
    for (let i = 1; i < groups.length; i++) expect(groups[i]).toBeGreaterThanOrEqual(groups[i - 1]);
  });

  it('shows a static Featured in row with one item per press file', () => {
    const n = countFiles('press');
    const row = doc.querySelector('#recognition .featured');
    if (n === 0) {
      expect(row).toBeNull();
      return;
    }
    expect(row).not.toBeNull();
    expect(row!.querySelectorAll('.featured__list li')).toHaveLength(n);
    expect(row!.querySelector('.strip__track, .strip__viewport')).toBeNull();
    expect(row!.querySelector('[style*="animation"]')).toBeNull();
  });

  it('has no Featured in row inside the research section', () => {
    expect(doc.querySelector('#research .featured')).toBeNull();
  });

  it('has no funders line on research cards', () => {
    expect(all('.rcard__funders')).toHaveLength(0);
    for (const m of all('#research .rcard__meta')) expect(m.textContent).not.toContain('Funded by');
  });

  it('shows a funders panel as the last child of the visible research grid', () => {
    const entries = visibleEntries('funders').map((d) => ({ name: String(d.name ?? ''), short: String(d.short ?? '') }));
    const panel = doc.querySelector('#research .funders');
    if (entries.length === 0) {
      expect(panel).toBeNull();
      return;
    }
    expect(panel).not.toBeNull();
    const grid = doc.querySelector('#research .rgrid')!;
    expect(grid.lastElementChild).toBe(panel);
    expect(panel!.closest('details')).toBeNull();
    expect(panel!.hasAttribute('data-status')).toBe(false);
    expect(panel!.querySelector('.funders__title')?.textContent).toBe('Supported by');
    const items = Array.from(panel!.querySelectorAll('li'));
    expect(items).toHaveLength(entries.length);
    const text = items.map((li) => li.textContent!);
    for (const e of entries) {
      expect(text.some((t) => t.includes(e.name))).toBe(true);
    }
    for (const e of entries.filter((x) => x.short)) {
      const re = new RegExp(String.raw`(?<!\w)${escapeRe(e.short)}(?!\w)`);
      for (const li of items) expect(li.innerHTML.replace(/<[^>]*>/g, ' ')).not.toMatch(re);
    }
  });

  it('caps visible funders at 6 and folds the rest into a quiet details', () => {
    const n = visibleEntries('funders').length;
    const panel = doc.querySelector('#research .funders');
    if (n === 0) {
      expect(panel).toBeNull();
      return;
    }
    expect(panel).not.toBeNull();
    const details = panel!.querySelector('details');
    const deskRest = n - 6 >= 2 ? n - 6 : 0;
    const phoneRest = n - 4 >= 2 ? n - 4 : 0;
    const direct = Array.from(panel!.querySelectorAll('.funders__list:not(.funders__list--rest) > li'));
    expect(direct).toHaveLength(n - deskRest);
    if (phoneRest === 0) {
      expect(details).toBeNull();
      return;
    }
    expect(details!.querySelector('summary')!.textContent).toContain(`+${phoneRest} more`);
    expect(details!.querySelectorAll('li')).toHaveLength(deskRest);
    if (deskRest > 0) expect(details!.querySelector('summary')!.textContent).toContain(`+${deskRest} more`);
    expect(details!.querySelector('summary')!.textContent).not.toContain('+1 more');
  });

  it('caps Featured in at 10 visible, hides extras with the hidden attribute and offers an All N toggle', () => {
    const n = visibleEntries('press').length;
    const row = doc.querySelector('#recognition .featured');
    if (n === 0) return;
    const lis = Array.from(row!.querySelectorAll('.featured__list li'));
    expect(lis.filter((li) => !li.hasAttribute('hidden'))).toHaveLength(n - 10 >= 2 ? 10 : n);
    const toggle = row!.querySelector('[data-featured-toggle]');
    if (n - 10 >= 2) {
      expect(lis.slice(10).every((li) => li.hasAttribute('hidden') && li.hasAttribute('data-extra'))).toBe(true);
      expect(toggle?.textContent).toBe(`All ${n}`);
      expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    } else {
      expect(toggle).toBeNull();
    }
    expect(doc.querySelector('noscript')?.innerHTML ?? '').toContain('data-featured-toggle');
  });

  it('adds a Contact link last in the nav', () => {
    const links = Array.from(doc.querySelectorAll('header nav a'));
    const last = links[links.length - 1];
    expect(last.getAttribute('href')).toBe('#contact');
    expect(last.textContent).toBe('Contact');
  });

  it('wraps the default research and recognition cards in labelled, focusable rails', () => {
    for (const [sel, label] of [['#research', 'Featured research'], ['#recognition', 'Featured recognition']] as const) {
      const rail = doc.querySelector(`${sel} .rail`)!;
      expect(rail.getAttribute('role')).toBe('region');
      expect(rail.getAttribute('aria-label')).toBe(label);
      expect(rail.getAttribute('tabindex')).toBe('0');
      expect(rail.closest('details')).toBeNull();
    }
    expect(doc.querySelector('#research .rgrid > .rail')).not.toBeNull();
    expect(doc.querySelector('#research .rail .funders')).toBeNull();
  });

  it('ends the earlier-work lists with a Back to top link', () => {
    for (const sel of ['#research', '#recognition']) {
      if (!doc.querySelector(`${sel} .earlier`)) continue;
      expect(doc.querySelector(`${sel} .earlier .earlier__top a[href="#top"]`)?.textContent).toContain('Back to top');
    }
  });

  it('marks the duplicated logo track inert', () => {
    expect(all('.strip__track')[1].hasAttribute('inert')).toBe(true);
    expect(all('.strip__track')[0].hasAttribute('inert')).toBe(false);
  });

  it('gives every logo numeric width and height attributes', () => {
    const imgs = all('.strip__track img, .featured img');
    if (imgs.length === 0) return;
    for (const img of imgs) {
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
    }
  });

  it('lists memberships under the email line in the contact section, not in recognition', () => {
    if (!memberships) return;
    expect(doc.querySelector('#contact .contact__members')?.textContent).toMatch(/^Member of /);
    expect(doc.querySelector('#recognition')?.textContent).not.toMatch(/Member of /);
  });

  it('renders a card per venture, each with an image area', () => {
    const cards = all('#ventures [data-venture]');
    expect(cards).toHaveLength(countFiles('ventures'));
    for (const c of cards) expect(c.querySelector('img:not(.card__logo), .placeholder')).not.toBeNull();
  });

  it('works without JS: the challenge form posts to mailto with a subject', () => {
    const forms = all('form[data-problem-box]');
    expect(forms).toHaveLength(1);
    for (const form of forms) {
      expect(form.getAttribute('action')).toMatch(/^mailto:/);
      expect(form.getAttribute('method')).toBe('get');
      expect(form.querySelector('input[name="subject"]')?.getAttribute('value')).toBe('A problem for you');
      expect(form.querySelector('[name="body"]')).not.toBeNull();
    }
  });

  it('includes sharing metadata and Person structured data', () => {
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(/^https:\/\//);
    const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld['@type']).toBe('Person');
  });

  it('has safe, complete Person JSON-LD and richer sharing tags', () => {
    const raw = doc.querySelector('script[type="application/ld+json"]')!.textContent!;
    expect(raw).not.toContain('<');
    const ld = JSON.parse(raw);
    expect(ld.honorificPrefix).toBe('Dr');
    expect(ld.sameAs.every(Boolean)).toBe(true);
    const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content');
    expect(meta('meta[property="og:site_name"]')).toBe('Dr Alexz Farrall');
    expect(meta('meta[property="og:locale"]')).toBe('en_GB');
    expect(meta('meta[name="twitter:image"]')).toMatch(/^https:\/\//);
    expect(doc.querySelector('link[rel="apple-touch-icon"]')).not.toBeNull();
  });

  it('ships robots.txt, a sitemap and a noindex 404 page', () => {
    expect(readFileSync('dist/robots.txt', 'utf8')).toContain('Sitemap: https://alexzfarrall.com/sitemap.xml');
    const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
    expect(sitemap).toContain('<loc>https://alexzfarrall.com/</loc>');
    expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    expect(existsSync('dist/404.html')).toBe(true);
    expect(readFileSync('dist/404.html', 'utf8')).toMatch(/<meta name="robots" content="noindex"/);
  });

  it('never leaks undefined values into the page', () => {
    const clone = doc.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style').forEach((el) => el.remove());
    expect(clone.textContent).not.toMatch(/undefined|\[object Object\]/);
  });

  // Astro inlines small scripts and stylesheets into the HTML, so count both
  // the emitted files and the inline blocks.
  const ASSETS = 'dist/_astro';
  const assetFiles = (ext: string) =>
    existsSync(ASSETS) ? readdirSync(ASSETS).filter((f) => f.endsWith(ext)).map((f) => join(ASSETS, f)) : [];

  it('ships less than 10 KB of JavaScript', () => {
    const fileBytes = assetFiles('.js').reduce((sum, f) => sum + statSync(f).size, 0);
    const inlineBytes = all('script[type="module"]:not([src])').reduce(
      (sum, s) => sum + Buffer.byteLength(s.textContent ?? ''),
      0,
    );
    expect(fileBytes + inlineBytes).toBeLessThan(10240);
  });

  it('defines reduced-motion overrides in the CSS', () => {
    const css = [
      ...assetFiles('.css').map((f) => readFileSync(f, 'utf8')),
      ...all('style').map((s) => s.textContent ?? ''),
    ].join('\n');
    expect(css).toContain('prefers-reduced-motion');
  });
});
