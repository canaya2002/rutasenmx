import { allGuides } from '@/lib/data/guides';

const SITE_URL = 'https://rutasenmx.com';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * RSS 2.0 feed of all guides — consumed by readers, aggregators and
 * increasingly by search/AI indexers that crawl feeds for fresh content.
 * Accessible at https://rutasenmx.com/guias/rss.xml
 */
export async function GET(): Promise<Response> {
  const sorted = [...allGuides].sort(
    (a, b) =>
      new Date(b.dateModified || b.datePublished).getTime() -
      new Date(a.dateModified || a.datePublished).getTime(),
  );

  const now = new Date().toUTCString();

  const items = sorted
    .slice(0, 100)
    .map((g) => {
      const url = `${SITE_URL}/guias/${g.slug}`;
      const pubDate = new Date(g.datePublished).toUTCString();
      const summary = stripHtml(g.description).slice(0, 500);
      const imageUrl = g.image.startsWith('http') ? g.image : `${SITE_URL}${g.image}`;
      return `    <item>
      <title>${escapeXml(g.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(summary)}</description>
      <author>editorial@rutasenmx.com (${escapeXml(g.author)})</author>
      ${g.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0"/>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Rutas en MX — Guías de viaje por México</title>
    <link>${SITE_URL}/guias</link>
    <atom:link href="${SITE_URL}/guias/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Guías editoriales para viajar por México: Pueblos Mágicos, zonas arqueológicas, road trips, gastronomía regional e itinerarios por estado.</description>
    <language>es-MX</language>
    <copyright>© ${new Date().getFullYear()} Rutas en MX</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>120</ttl>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>Rutas en MX</title>
      <link>${SITE_URL}</link>
    </image>
    <generator>Rutas en MX RSS Generator</generator>
    <webMaster>soporte@rutasenmx.com (Rutas en MX)</webMaster>
    <managingEditor>editorial@rutasenmx.com (Rutas en MX)</managingEditor>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
