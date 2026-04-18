'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMap } from './MapProvider';
import { PLACE_CATEGORIES } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface MapMarkerProps {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category?: string;
  /** Number of clustered items (if > 1 renders a cluster badge) */
  clusterCount?: number;
  /** Whether this marker is currently selected */
  selected?: boolean;
  /** Badge identifiers such as "pueblo-magico", "inah", etc. */
  badges?: string[];
  /** Image thumbnail url */
  imageUrl?: string;
  /** Short description for popup */
  description?: string;
  /** Rating value 0-5 */
  rating?: number;
  /** Slug for the "Ver detalles" link */
  slug?: string;
  /** Fired when the marker (or its popup button) is clicked */
  onClick?: (id: string) => void;
  /** Fired when "Agregar a ruta" is clicked inside the popup */
  onAddToRoute?: (id: string) => void;
  /** Fired when "Guardar" is clicked inside the popup */
  onSave?: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function categoryMeta(slug?: string) {
  const cat = PLACE_CATEGORIES.find((c) => c.slug === slug);
  return { color: cat?.color ?? '#6B7280', label: cat?.name ?? '' };
}

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
export default function MapMarker({
  id,
  lat,
  lng,
  name,
  category,
  clusterCount,
  selected = false,
  badges,
  imageUrl,
  description,
  rating,
  slug,
  onClick,
  onAddToRoute,
  onSave,
}: MapMarkerProps) {
  const { map, isReady } = useMap();
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const onAddRef = useRef(onAddToRoute);
  onAddRef.current = onAddToRoute;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const buildMarker = useCallback(async () => {
    if (!map) return;
    const mapboxgl = (await import('mapbox-gl')).default;

    /* Remove existing marker */
    markerRef.current?.remove();
    popupRef.current?.remove();

    const { color, label: catLabel } = categoryMeta(category);
    const isCluster = (clusterCount ?? 0) > 1;

    /* Build DOM element */
    const el = document.createElement('div');
    el.className = 'map-marker-root';
    el.style.cursor = 'pointer';

    if (isCluster) {
      el.innerHTML = `
        <div style="
          width:40px;height:40px;border-radius:50%;
          background:${color};color:#fff;
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:14px;
          box-shadow:0 2px 6px rgba(0,0,0,.3);
          border:2px solid #fff;
        ">${clusterCount}</div>`;
    } else {
      const ring = selected ? 'border:3px solid #facc15;' : 'border:2px solid #fff;';
      let badgeHtml = '';
      if (badges?.length) {
        badgeHtml = `<span style="
          position:absolute;top:-6px;right:-6px;
          background:#fff;color:${color};font-size:9px;
          padding:1px 4px;border-radius:9999px;
          font-weight:700;white-space:nowrap;
          box-shadow:0 1px 3px rgba(0,0,0,.2);
        ">${badgeLabel(badges[0])}</span>`;
      }

      el.innerHTML = `
        <div style="position:relative;">
          <div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};${ring}
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,.25);
            transition:transform 150ms;
          " class="marker-dot"></div>
          ${badgeHtml}
        </div>`;
    }

    el.addEventListener('click', () => onClickRef.current?.(id));

    /* Build popup */
    const popupHtml = buildPopupHtml({
      id,
      name,
      catLabel,
      color,
      imageUrl,
      description,
      rating,
      slug,
      badges,
    });

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      maxWidth: '280px',
    }).setHTML(popupHtml);

    /* Wire popup button clicks after it opens */
    popup.on('open', () => {
      const container = popup.getElement();
      container
        ?.querySelector('[data-action="add-route"]')
        ?.addEventListener('click', () => onAddRef.current?.(id));
      container
        ?.querySelector('[data-action="save"]')
        ?.addEventListener('click', () => onSaveRef.current?.(id));
    });

    popupRef.current = popup;

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    markerRef.current = marker;
  }, [
    map,
    id,
    lat,
    lng,
    name,
    category,
    clusterCount,
    selected,
    badges,
    imageUrl,
    description,
    rating,
    slug,
  ]);

  useEffect(() => {
    if (isReady) buildMarker();
    return () => {
      markerRef.current?.remove();
      popupRef.current?.remove();
    };
  }, [isReady, buildMarker]);

  /* This component renders nothing to the React tree —
     it imperatively manages a Mapbox Marker. */
  return null;
}

/* ------------------------------------------------------------------ */
/*  Popup HTML builder (kept outside the component for readability)    */
/* ------------------------------------------------------------------ */

function buildPopupHtml(opts: {
  id: string;
  name: string;
  catLabel: string;
  color: string;
  imageUrl?: string;
  description?: string;
  rating?: number;
  slug?: string;
  badges?: string[];
}): string {
  const { name, catLabel, color, imageUrl, description, rating, slug, badges } =
    opts;

  const img = imageUrl
    ? `<img src="${imageUrl}" alt="${name}" style="width:100%;height:100px;object-fit:cover;border-radius:6px 6px 0 0;" />`
    : '';

  const ratingHtml =
    rating != null
      ? `<div style="font-size:12px;color:#f59e0b;margin-top:2px;">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))} <span style="color:#6b7280;">${rating.toFixed(1)}</span></div>`
      : '';

  const badgesHtml = (badges ?? [])
    .map(
      (b) =>
        `<span style="font-size:10px;background:${color}20;color:${color};padding:1px 6px;border-radius:9999px;font-weight:600;">${badgeLabel(b)}</span>`,
    )
    .join(' ');

  const detailLink = slug
    ? `<a href="/lugares/${slug}" style="font-size:12px;color:${color};font-weight:600;text-decoration:underline;">Ver detalles</a>`
    : '';

  return `
    <div style="font-family:system-ui,sans-serif;min-width:200px;">
      ${img}
      <div style="padding:8px 10px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;background:${color};color:#fff;padding:1px 6px;border-radius:9999px;font-weight:600;">${catLabel}</span>
          ${badgesHtml}
        </div>
        <h3 style="margin:4px 0 2px;font-size:14px;font-weight:700;">${name}</h3>
        ${ratingHtml}
        ${description ? `<p style="font-size:12px;color:#4b5563;margin:4px 0 0;">${description}</p>` : ''}
        <div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap;">
          ${detailLink}
          <button data-action="add-route" style="font-size:11px;background:${color};color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-weight:600;">Agregar a ruta</button>
          <button data-action="save" style="font-size:11px;background:transparent;color:${color};border:1px solid ${color};padding:3px 10px;border-radius:6px;cursor:pointer;font-weight:600;">Guardar</button>
        </div>
      </div>
    </div>`;
}
