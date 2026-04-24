/* ------------------------------------------------------------------ */
/*  PDF Export Utility (jsPDF)                                         */
/* ------------------------------------------------------------------ */

import { jsPDF } from 'jspdf';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface PDFWaypoint {
  name: string;
  lat: number;
  lng: number;
  durationMinutes?: number;
  budgetCents?: number;
  notes?: string;
  day?: number;
}

export interface PDFTripInput {
  title: string;
  description?: string;
  originName?: string;
  destinationName?: string;
  totalDistanceKm?: number;
  totalDurationMinutes?: number;
  totalBudgetCents?: number;
  currency?: string;
  days?: number;
  waypoints: PDFWaypoint[];
  /**
   * Optional diagonal watermark stamped on every page.
   * Used by the Free plan so exported PDFs stay clearly branded until the
   * user upgrades. Passing null/undefined produces a clean export.
   */
  watermark?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function fmtCurrency(cents: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/* ------------------------------------------------------------------ */
/*  Main function                                                      */
/* ------------------------------------------------------------------ */

/**
 * Generate a jsPDF document for the given trip data.
 * Returns the jsPDF instance so the caller can `.save()` or `.output()`.
 */
export function generateTripPDF(input: PDFTripInput): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  /* ── Header ─────────────────────────────────────────────── */
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(input.title, margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Generado por Rutas en MX  |  rutasenmx.com', margin, y);
  doc.setTextColor(0);
  y += 10;

  /* ── Route summary ──────────────────────────────────────── */
  if (input.originName || input.destinationName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Ruta', margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (input.originName && input.destinationName) {
      doc.text(
        `${input.originName}  →  ${input.destinationName}`,
        margin,
        y,
      );
      y += 5;
    }
  }

  const summaryParts: string[] = [];
  if (input.totalDistanceKm != null)
    summaryParts.push(`Distancia: ${input.totalDistanceKm.toFixed(1)} km`);
  if (input.totalDurationMinutes != null)
    summaryParts.push(`Tiempo: ${fmtDuration(input.totalDurationMinutes)}`);
  if (input.days != null) summaryParts.push(`Dias: ${input.days}`);
  if (input.totalBudgetCents != null)
    summaryParts.push(
      `Presupuesto: ${fmtCurrency(input.totalBudgetCents, input.currency)}`,
    );

  if (summaryParts.length) {
    doc.setFontSize(9);
    doc.text(summaryParts.join('   |   '), margin, y);
    y += 8;
  }

  /* ── Description ────────────────────────────────────────── */
  if (input.description) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(input.description, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 4;
    doc.setTextColor(0);
  }

  /* Separator line */
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  /* ── Map snapshot placeholder ───────────────────────────── */
  doc.setFontSize(9);
  doc.setTextColor(160);
  doc.text('[Vista del mapa - disponible en version Premium]', margin, y);
  doc.setTextColor(0);
  y += 10;

  /* ── Itinerary ──────────────────────────────────────────── */
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Itinerario', margin, y);
  y += 7;

  /* Group waypoints by day */
  const byDay = new Map<number, PDFWaypoint[]>();
  for (const wp of input.waypoints) {
    const day = wp.day ?? 1;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(wp);
  }

  const dayKeys = [...byDay.keys()].sort((a, b) => a - b);

  for (const dayNum of dayKeys) {
    const stops = byDay.get(dayNum)!;

    /* Check if we need a new page */
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dia ${dayNum}`, margin, y);
    y += 6;

    for (const stop of stops) {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${stop.name || 'Sin nombre'}`, margin + 2, y);
      y += 4.5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);

      const details: string[] = [];
      if (stop.durationMinutes)
        details.push(`Duracion: ${fmtDuration(stop.durationMinutes)}`);
      if (stop.budgetCents)
        details.push(`Presupuesto: ${fmtCurrency(stop.budgetCents)}`);
      details.push(`Coords: ${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`);

      doc.text(details.join('  |  '), margin + 4, y);
      y += 4;

      if (stop.notes) {
        const noteLines = doc.splitTextToSize(
          stop.notes,
          pageWidth - margin * 2 - 6,
        );
        doc.text(noteLines, margin + 4, y);
        y += noteLines.length * 3.5 + 1;
      }

      doc.setTextColor(0);
      y += 2;
    }

    y += 3;
  }

  /* ── Budget breakdown ───────────────────────────────────── */
  const stopsWithBudget = input.waypoints.filter((w) => (w.budgetCents ?? 0) > 0);
  if (stopsWithBudget.length) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Presupuesto', margin, y);
    y += 7;

    for (const wp of stopsWithBudget) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const label = wp.name || 'Parada';
      doc.text(label, margin + 2, y);
      doc.text(
        fmtCurrency(wp.budgetCents!, input.currency),
        pageWidth - margin,
        y,
        { align: 'right' },
      );
      y += 5;
    }

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Total', margin + 2, y);
    const total = stopsWithBudget.reduce(
      (a, w) => a + (w.budgetCents ?? 0),
      0,
    );
    doc.text(fmtCurrency(total, input.currency), pageWidth - margin, y, {
      align: 'right',
    });
  }

  /* ── Footer ─────────────────────────────────────────────── */
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `Rutas en MX  •  rutasenmx.com  •  Pagina ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  /* ── Watermark (Free plan) ──────────────────────────────── */
  if (input.watermark) {
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      // Render large, rotated, very light diagonal text behind content.
      // jsPDF's `GState` isn't universally supported, so we just use a light colour.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.setTextColor(220);
      doc.text(
        input.watermark,
        pageWidth / 2,
        pageHeight / 2,
        { align: 'center', angle: -30 },
      );
      doc.restoreGraphicsState();
      doc.setTextColor(0);
    }
  }

  return doc;
}
