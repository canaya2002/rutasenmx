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
 * Atom 1.0 feed — more modern than RSS 2.0 and still consumed by many
 * aggregators. We offer both formats for maximum compatibility.
 */
export async function GET(): Promise<Response> {
  const sorted = [...allGuides].sort(
    (a, b) =>
      new Date(b.dateModified || b.datePublished).getTime() -
      new Date(a.dateModified || a.datePublished).getTime(),
  );

  const latestUpdate = sorted[0]?.dateModified || sorted[0]?.datePublished || new Date().toISOString();

  const entries = sorted
    .slice(0, 100)
    .map((g) => {
      const url = `${SITE_URL}/guias/${g.slug}`;
      const updated = new Date(g.dateModified || g.datePublished).toISOString();
      const published = new Date(g.datePublished).toISOString();
      const summary = stripHtml(g.description).slice(0, 500);
      return `  <entry>
    <id>${url}</id>
    <title>${escapeXml(g.title)}</title>
    <link rel="alternate" type="text/html" href="${url}"/>
    <published>${published}</published>
    <updated>${updated}</updated>
    <summary>${escapeXml(summary)}</summary>
    <author>
      <name>${escapeXml(g.author)}</name>
      <email>editorial@rutasenmx.com</email>
    </author>
    ${g.tags.map((t) => `<category term="${escapeXml(t)}"/>`).join('\n    ')}
  </entry>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="es-MX">
  <id>${SITE_URL}/guias</id>
  <title>Rutas en MX — Guías de viaje por México</title>
  <subtitle>Guías editoriales para viajar por México: Pueblos Mágicos, zonas arqueológicas, road trips, gastronomía regional e itinerarios por estado.</subtitle>
  <link rel="self" type="application/atom+xml" href="${SITE_URL}/guias/atom.xml"/>
  <link rel="alternate" type="text/html" href="${SITE_URL}/guias"/>
  <updated>${new Date(latestUpdate).toISOString()}</updated>
  <rights>© ${new Date().getFullYear()} Rutas en MX</rights>
  <generator uri="${SITE_URL}">Rutas en MX</generator>
  <icon>${SITE_URL}/favicon.ico</icon>
  <logo>${SITE_URL}/logo.png</logo>
${entries}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
