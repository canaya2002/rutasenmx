/**
 * /.well-known/security.txt (RFC 9116) — lets security researchers find a
 * responsible-disclosure contact. Trust signal for search engines and users.
 */
export function GET(): Response {
  const expiresDate = new Date();
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);

  const body = `Contact: mailto:seguridad@rutasenmx.com
Contact: https://rutasenmx.com/contacto
Expires: ${expiresDate.toISOString()}
Preferred-Languages: es, en
Canonical: https://rutasenmx.com/.well-known/security.txt
Policy: https://rutasenmx.com/privacidad
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
