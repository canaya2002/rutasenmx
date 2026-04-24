import { useCallback, useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { APP_URL, type PlanSlug } from '@shared/index';

interface ExportStop {
  name: string;
  lat: number | null;
  lng: number | null;
  day?: number;
  notes?: string;
  durationMinutes?: number;
}

export interface ExportInput {
  title: string;
  description?: string;
  originName?: string | null;
  destinationName?: string | null;
  totalDistanceKm?: number | null;
  totalDurationMinutes?: number | null;
  stops: ExportStop[];
  /** Controls whether the watermark diagonal is stamped. */
  plan: PlanSlug;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(input: ExportInput): string {
  const watermark =
    input.plan === 'free'
      ? `<div class="watermark">Rutas en MX · versión gratis</div>`
      : '';

  const byDay = new Map<number, ExportStop[]>();
  for (const s of input.stops) {
    const d = s.day ?? 1;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(s);
  }

  const days = [...byDay.keys()]
    .sort((a, b) => a - b)
    .map((dayNum) => {
      const stops = byDay.get(dayNum)!;
      const items = stops
        .map(
          (s) => `
          <li>
            <h3>${esc(s.name)}</h3>
            ${s.notes ? `<p class="notes">${esc(s.notes)}</p>` : ''}
            ${
              s.durationMinutes
                ? `<p class="meta">Estancia: ${s.durationMinutes} min</p>`
                : ''
            }
            ${
              s.lat != null && s.lng != null
                ? `<p class="meta">Coords: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</p>`
                : ''
            }
          </li>`,
        )
        .join('');
      return `<section class="day">
        <h2>Día ${dayNum}</h2>
        <ol>${items}</ol>
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(input.title)}</title>
<style>
  @page { margin: 24mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #0A0F14;
    position: relative;
  }
  h1 { font-size: 22pt; margin: 0 0 4pt 0; }
  h2 { font-size: 14pt; margin: 20pt 0 6pt 0; color: #06C167; }
  h3 { font-size: 12pt; margin: 10pt 0 2pt 0; }
  p { margin: 2pt 0; font-size: 10pt; line-height: 1.4; }
  .sub { color: #64748B; font-size: 10pt; }
  .summary { margin: 6pt 0 0 0; font-size: 10pt; color: #475569; }
  .meta { color: #64748B; font-size: 9pt; }
  .notes { color: #334155; font-size: 10pt; }
  ol { padding-left: 18pt; }
  ol li { margin-bottom: 8pt; }
  header {
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 10pt;
    margin-bottom: 12pt;
  }
  .watermark {
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 70pt;
    color: rgba(15, 23, 42, 0.08);
    font-weight: 800;
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
  }
  footer {
    position: fixed;
    bottom: 10mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8pt;
    color: #94A3B8;
  }
</style>
</head>
<body>
  ${watermark}
  <header>
    <h1>${esc(input.title)}</h1>
    <p class="sub">Generado con Rutas en MX · ${APP_URL.replace('https://', '')}</p>
    ${
      input.originName && input.destinationName
        ? `<p class="summary"><strong>Ruta:</strong> ${esc(input.originName)} → ${esc(input.destinationName)}</p>`
        : ''
    }
    ${
      input.totalDistanceKm != null
        ? `<p class="summary"><strong>Distancia:</strong> ${Math.round(input.totalDistanceKm)} km</p>`
        : ''
    }
    ${
      input.totalDurationMinutes != null
        ? `<p class="summary"><strong>Tiempo de manejo:</strong> ${Math.round(input.totalDurationMinutes / 60)}h</p>`
        : ''
    }
    ${input.description ? `<p class="summary">${esc(input.description)}</p>` : ''}
  </header>
  ${days}
  <footer>Rutas en MX · rutasenmx.com</footer>
</body>
</html>`;
}

/**
 * Renders the trip to a native PDF via expo-print and immediately opens the
 * share sheet so the user can save/send it. Watermark is applied server-side
 * via the Free plan's HTML — we mirror that on mobile to keep export parity.
 *
 * Returns the local file URI on success.
 */
export function useExportTrip() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (input: ExportInput): Promise<string | null> => {
      setError(null);
      setExporting(true);
      try {
        const html = buildHtml(input);
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir viaje',
            UTI: 'com.adobe.pdf',
          });
        }
        return uri;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Error al exportar el PDF';
        setError(msg);
        return null;
      } finally {
        setExporting(false);
      }
    },
    [],
  );

  return { run, exporting, error };
}

// Plain GPX builder (XML). Clients can write the string via `expo-file-system`
// + share via `expo-sharing`. Hand-crafted XML so there's no dependency drift.
export function buildGpx(input: ExportInput): string {
  const waypoints = input.stops
    .filter((s) => s.lat != null && s.lng != null)
    .map(
      (s) => `  <wpt lat="${s.lat}" lon="${s.lng}">
    <name>${esc(s.name)}</name>${s.notes ? `\n    <desc>${esc(s.notes)}</desc>` : ''}
  </wpt>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="Rutas en MX"
     xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${esc(input.title)}</name>
    <time>${new Date().toISOString()}</time>
    <link href="${APP_URL}"><text>Rutas en MX</text></link>
  </metadata>
${waypoints}
</gpx>`;
}
