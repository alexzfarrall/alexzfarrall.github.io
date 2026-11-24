import type { APIRoute } from 'astro';
import { projectHref } from '../lib/details';
import { isProject, researchItems } from '../lib/project';

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const root = new URL('/', import.meta.env.SITE).href;
  const lastmod = new Date().toISOString().slice(0, 10);
  const projects = (await researchItems()).filter(isProject).map((r) => new URL(projectHref(r.id), root).href);
  const urls = [root, ...projects]
    .map((loc) => `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
