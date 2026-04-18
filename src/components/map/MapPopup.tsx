'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Plus, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/LocaleProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface MapPopupProps {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  categoryColor?: string;
  imageUrl?: string;
  description?: string;
  rating?: number;
  badges?: string[];
  onAddToRoute?: (id: string) => void;
  onSave?: (id: string) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Badge labels                                                       */
/* ------------------------------------------------------------------ */
function badgeLabel(badge: string): string {
  const map: Record<string, string> = {
    'pueblo-magico': 'Pueblo Mágico',
    inah: 'INAH',
    'patrimonio-mundial': 'UNESCO',
  };
  return map[badge] ?? badge;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Standalone popup content rendered with React (useful when you want
 * to render popups as React portals instead of raw HTML).
 */
export default function MapPopup({
  id,
  name,
  slug,
  category,
  categoryColor = '#6B7280',
  imageUrl,
  description,
  rating,
  badges,
  onAddToRoute,
  onSave,
  className,
}: MapPopupProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  return (
    <div className={cn('w-[280px] overflow-hidden rounded-lg bg-card text-card-foreground shadow-lg', className)}>
      {/* Thumbnail */}
      {imageUrl && (
        <div className="relative h-[100px] w-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="280px"
          />
        </div>
      )}

      <div className="space-y-2 p-3">
        {/* Category + badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {category && (
            <Badge
              className="text-[10px]"
              style={{ backgroundColor: categoryColor, color: '#fff' }}
            >
              {category}
            </Badge>
          )}
          {badges?.map((b) => (
            <Badge
              key={b}
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: categoryColor, color: categoryColor }}
            >
              {badgeLabel(b)}
            </Badge>
          ))}
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold leading-tight">{name}</h3>

        {/* Rating */}
        {rating != null && (
          <div className="flex items-center gap-1 text-xs text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn('h-3 w-3', i < Math.round(rating) ? 'fill-amber-400' : 'fill-muted stroke-muted-foreground/40')}
              />
            ))}
            <span className="ml-0.5 text-muted-foreground">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {slug && (
            <Link
              href={`/lugares/${slug}`}
              className="text-xs font-semibold underline"
              style={{ color: categoryColor }}
            >
              {isEn ? 'View details' : 'Ver detalles'}
            </Link>
          )}
          <Button
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            style={{ backgroundColor: categoryColor }}
            onClick={() => onAddToRoute?.(id)}
          >
            <Plus className="h-3 w-3" />
            {isEn ? 'Add to route' : 'Agregar a ruta'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-[11px]"
            style={{ borderColor: categoryColor, color: categoryColor }}
            onClick={() => onSave?.(id)}
          >
            <Bookmark className="h-3 w-3" />
            {isEn ? 'Save' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
