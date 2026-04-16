/* ------------------------------------------------------------------ */
/*  GPX Export Utility                                                 */
/* ------------------------------------------------------------------ */

export interface GPXWaypoint {
  name: string;
  lat: number;
  lng: number;
  description?: string;
  elevation?: number;
}

export interface GPXInput {
  name: string;
  description?: string;
  waypoints: GPXWaypoint[];
  /** Optional route coordinates (ordered polyline) */
  routeCoordinates?: [number, number][];
}

/**
 * Generate a valid GPX 1.1 XML string from trip data.
 */
export function generateGPX(input: GPXInput): string {
  const { name, description, waypoints, routeCoordinates } = input;

  const escapeXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  /* Waypoints */
  const wptElements = waypoints
    .map((wp) => {
      const desc = wp.description
        ? `\n    <desc>${escapeXml(wp.description)}</desc>`
        : '';
      const ele = wp.elevation != null ? `\n    <ele>${wp.elevation}</ele>` : '';
      return `  <wpt lat="${wp.lat}" lon="${wp.lng}">
    <name>${escapeXml(wp.name)}</name>${desc}${ele}
  </wpt>`;
    })
    .join('\n');

  /* Route (rte) */
  let rteElement = '';
  if (routeCoordinates && routeCoordinates.length >= 2) {
    const rtePts = routeCoordinates
      .map(([lng, lat]) => `    <rtept lat="${lat}" lon="${lng}" />`)
      .join('\n');
    rteElement = `
  <rte>
    <name>${escapeXml(name)}</name>
${rtePts}
  </rte>`;
  } else if (waypoints.length >= 2) {
    /* Build route from waypoints if no explicit coordinates */
    const rtePts = waypoints
      .map(
        (wp) =>
          `    <rtept lat="${wp.lat}" lon="${wp.lng}"><name>${escapeXml(wp.name)}</name></rtept>`,
      )
      .join('\n');
    rteElement = `
  <rte>
    <name>${escapeXml(name)}</name>
${rtePts}
  </rte>`;
  }

  /* Metadata */
  const descMeta = description
    ? `\n    <desc>${escapeXml(description)}</desc>`
    : '';

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="Rutas en MX - rutasenmx.com"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>${descMeta}
    <time>${new Date().toISOString()}</time>
    <link href="https://rutasenmx.com">
      <text>Rutas en MX</text>
    </link>
  </metadata>
${wptElements}
${rteElement}
</gpx>`;

  return gpx;
}
