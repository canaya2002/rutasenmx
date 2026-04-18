/**
 * /humans.txt — credit file for humans behind the site.
 * A tiny signal of craftsmanship that some crawlers and curious users enjoy.
 */
export function GET(): Response {
  const body = `/* TEAM */

Platform: Rutas en MX
Site: https://rutasenmx.com
Contact: soporte@rutasenmx.com
Location: México

/* THANKS */

Open data providers: SECTUR, INAH, SIC Cultura, INEGI, DataTur
Map provider: Mapbox
Payment provider: Stripe
Framework: Next.js

/* SITE */

Last update: ${new Date().toISOString().split('T')[0]}
Standards: HTML5, CSS3, JavaScript/TypeScript, JSON-LD
Components: Next.js, React, Tailwind CSS, Mapbox GL, Drizzle ORM
Software: Visual Studio Code, git
Language: Spanish (es-MX), English (en-US)
Country: México
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
