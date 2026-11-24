import type { APIRoute } from 'astro';

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = () => {
  const root = new URL('/', import.meta.env.SITE).href;
  const lastmod = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${esc(root)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
