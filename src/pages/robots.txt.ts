import type { APIRoute } from 'astro';
import { site as reglages } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const regle = reglages.indexable ? 'Allow: /' : 'Disallow: /';
  return new Response(`User-agent: *\n${regle}\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
