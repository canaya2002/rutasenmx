import Image from 'next/image';

/**
 * Decorative image primitives backed by `/public/General`. All of them are
 * purely ornamental — they use `aria-hidden` so screen readers skip them.
 */

export interface DecorCircleProps {
  src: string;
  /** Tailwind class for size, e.g. "h-40 w-40". */
  size?: string;
  /** Extra positioning classes applied to the wrapper. */
  className?: string;
  ringColor?: string;
  rotate?: number;
}

export function DecorCircle({
  src,
  size = 'h-40 w-40',
  className = '',
  ringColor = 'ring-white/80',
  rotate = 0,
}: DecorCircleProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative overflow-hidden rounded-full shadow-xl ring-4 ${ringColor} ${size} ${className}`}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="240px"
        className="object-cover"
      />
    </div>
  );
}

/**
 * Two-circle overlap decoration (the second circle peeks over the first).
 */
export function DecorOverlapPair({
  primary,
  secondary,
  className = '',
}: {
  primary: string;
  secondary: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={`relative ${className}`}>
      <DecorCircle src={primary} size="h-48 w-48 sm:h-56 sm:w-56" rotate={-4} />
      <DecorCircle
        src={secondary}
        size="h-32 w-32 sm:h-40 sm:w-40"
        className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8"
        ringColor="ring-emerald-100"
        rotate={6}
      />
    </div>
  );
}

/**
 * Soft blurred blob in brand colour. Use as a page accent.
 */
export function DecorBlob({
  color = 'bg-emerald-300/30',
  size = 'h-80 w-80',
  className = '',
}: {
  color?: string;
  size?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${color} ${size} ${className}`}
    />
  );
}

/**
 * Diagonal "scattered" gallery — 3–5 small squared images at varied rotations.
 */
export interface DecorGalleryProps {
  images: string[];
  className?: string;
}
export function DecorScatterGallery({ images, className = '' }: DecorGalleryProps) {
  const positions = [
    'top-0    left-4    rotate-[-6deg]',
    'top-10   right-0   rotate-[4deg]',
    'bottom-4 left-8    rotate-[3deg]',
    'bottom-0 right-10  rotate-[-5deg]',
    'top-1/2  left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[2deg]',
  ];
  return (
    <div aria-hidden className={`pointer-events-none relative ${className}`}>
      {images.slice(0, positions.length).map((src, i) => (
        <div
          key={src + i}
          className={`absolute h-24 w-24 overflow-hidden rounded-2xl shadow-xl ring-4 ring-white/80 ${positions[i]}`}
        >
          <Image src={src} alt="" fill sizes="120px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

/**
 * Thin horizontal film-strip of images. Great for hero dividers.
 */
export function DecorFilmStrip({
  images,
  className = '',
}: {
  images: string[];
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5 ${className}`}
    >
      {images.slice(0, 6).map((src, i) => (
        <div
          key={src + i}
          className={`relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/5 ${
            i % 2 === 1 ? 'sm:translate-y-2' : ''
          }`}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 33vw, 15vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

/** Wraps a content card with a tilted image peeking from behind. */
export function DecorPeek({
  src,
  side = 'right',
  className = '',
}: {
  src: string;
  side?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute hidden h-40 w-40 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white lg:block ${
        side === 'right' ? '-right-10 rotate-6' : '-left-10 -rotate-6'
      } ${className}`}
    >
      <Image src={src} alt="" fill sizes="160px" className="object-cover" />
    </div>
  );
}
