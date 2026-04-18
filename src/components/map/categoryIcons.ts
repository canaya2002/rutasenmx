/**
 * Registers PNG-rasterised category icons in a Mapbox map so they can be used
 * as `icon-image` in symbol layers. Call once per map instance after load.
 *
 * The SVG files live in `/public/icon/<name>.svg`. We rasterise at a generous
 * pixel size and mark `pixelRatio: 2` so retina maps stay crisp.
 *
 * This also wires a `styleimagemissing` listener so the layer never shows an
 * empty slot even if the layer is added before registration finishes.
 */
import { PLACE_CATEGORIES } from '@/lib/constants';

const DEFAULT_SIZE = 160;

type MapboxMap = {
  hasImage: (id: string) => boolean;
  addImage: (id: string, image: ImageBitmap | HTMLImageElement | ImageData, options?: { pixelRatio?: number }) => void;
  on: (type: 'styleimagemissing', cb: (ev: { id: string }) => void) => void;
  off: (type: 'styleimagemissing', cb: (ev: { id: string }) => void) => void;
};

function svgToImage(url: string, size: number): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no 2d context'));
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      try {
        const bmp = await createImageBitmap(canvas);
        resolve(bmp);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`failed to load ${url}`));
    img.src = url;
  });
}

export function categoryImageId(slug: string): string {
  return `cat-${slug}`;
}

function slugFromImageId(id: string): string | null {
  return id.startsWith('cat-') ? id.slice(4) : null;
}

function findIconSvg(slug: string): string | null {
  const cat = PLACE_CATEGORIES.find((c) => c.slug === slug);
  return (cat && 'iconSvg' in cat ? (cat as { iconSvg?: string }).iconSvg : undefined) ?? null;
}

async function loadAndAdd(map: MapboxMap, id: string, slug: string, size: number) {
  const url = findIconSvg(slug);
  if (!url) return;
  try {
    const bmp = await svgToImage(url, size);
    if (!map.hasImage(id)) {
      map.addImage(id, bmp, { pixelRatio: 2 });
    }
  } catch (err) {
    console.warn(`[category-icons] could not load ${slug}:`, err);
  }
}

const registered = new WeakSet<object>();

export async function registerCategoryIcons(
  map: MapboxMap,
  size = DEFAULT_SIZE,
): Promise<void> {
  const key = map as unknown as object;
  if (registered.has(key)) return;
  registered.add(key);

  // Lazy on-demand loader: if Mapbox tries to render a `cat-*` icon that isn't
  // yet registered, fetch it immediately. This makes layer ordering irrelevant.
  const onMissing = (ev: { id: string }) => {
    const slug = slugFromImageId(ev.id);
    if (!slug) return;
    void loadAndAdd(map, ev.id, slug, size);
  };
  try {
    map.on('styleimagemissing', onMissing);
  } catch { /* non-mapbox map shim */ }

  const withIcon = PLACE_CATEGORIES.filter(
    (c): c is typeof c & { iconSvg: string } => {
      const svg = (c as { iconSvg?: string }).iconSvg;
      return typeof svg === 'string' && svg.length > 0;
    },
  );

  await Promise.all(
    withIcon.map((cat) => loadAndAdd(map, categoryImageId(cat.slug), cat.slug, size)),
  );
}
