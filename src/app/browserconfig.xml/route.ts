/**
 * /browserconfig.xml — Windows / Microsoft Edge tile config.
 * Referenced from our root metadata (msapplication-config).
 */
export function GET(): Response {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/icon-70.png"/>
      <square150x150logo src="/icon-150.png"/>
      <square310x310logo src="/icon-310.png"/>
      <wide310x150logo src="/icon-wide-310x150.png"/>
      <TileColor>#06C167</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
