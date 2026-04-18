'use client';

import { useCallback, useState } from 'react';
import {
  Download,
  FileText,
  Map,
  Link2,
  Share2,
  MessageCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/components/providers/LocaleProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface ExportableTrip {
  title: string;
  shareToken?: string;
  /** Waypoints with lat/lng */
  waypoints: { name: string; lat: number; lng: number }[];
}

export interface ExportMenuProps {
  trip: ExportableTrip;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ExportMenu({ trip, className }: ExportMenuProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const T = (es: string, en: string) => (isEn ? en : es);
  const [copied, setCopied] = useState(false);

  /* GPX export */
  const handleGPX = useCallback(async () => {
    const { generateGPX } = await import('@/lib/trip/gpx');
    const gpxString = generateGPX({
      name: trip.title,
      waypoints: trip.waypoints,
    });

    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.title.replace(/[^a-z0-9]/gi, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [trip]);

  /* PDF export */
  const handlePDF = useCallback(async () => {
    const { generateTripPDF } = await import('@/lib/trip/pdf');
    const doc = generateTripPDF({
      title: trip.title,
      waypoints: trip.waypoints,
    });
    doc.save(`${trip.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  }, [trip]);

  /* Copy share link */
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/viaje/${trip.shareToken ?? ''}`
      : '';

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API might not be available */
    }
  }, [shareUrl]);

  /* Web Share API (WhatsApp / social) */
  const handleWebShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: trip.title,
        text: T(`Mira mi ruta por México: ${trip.title}`, `Check out my route through Mexico: ${trip.title}`),
        url: shareUrl,
      });
    } catch {
      /* user cancelled or API not available */
    }
  }, [trip.title, shareUrl]);

  /* WhatsApp direct */
  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      T(`Mira mi ruta por México: ${trip.title} ${shareUrl}`, `Check out my route through Mexico: ${trip.title} ${shareUrl}`),
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [trip.title, shareUrl]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="mr-1.5 h-4 w-4" />
          {T('Exportar', 'Export')}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{T('Exportar viaje', 'Export trip')}</DropdownMenuLabel>

        <DropdownMenuItem onClick={handleGPX}>
          <Map className="mr-2 h-4 w-4" />
          {T('Descargar GPX', 'Download GPX')}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handlePDF}>
          <FileText className="mr-2 h-4 w-4" />
          {T('Descargar PDF', 'Download PDF')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{T('Compartir', 'Share')}</DropdownMenuLabel>

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-500" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          {copied ? T('Enlace copiado', 'Link copied') : T('Copiar enlace', 'Copy link')}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          {T('Compartir en WhatsApp', 'Share on WhatsApp')}
        </DropdownMenuItem>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleWebShare}>
            <Share2 className="mr-2 h-4 w-4" />
            {T('Compartir...', 'Share…')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
