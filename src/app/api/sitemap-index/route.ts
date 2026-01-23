import { generateSitemaps } from '@/app/sitemap';

const BASE_URL = 'https://map.stapply.ai';

export async function GET() {
  const sitemaps = await generateSitemaps();
  
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    ({ id }) => `  <sitemap>
    <loc>${BASE_URL}/sitemap/${id}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
