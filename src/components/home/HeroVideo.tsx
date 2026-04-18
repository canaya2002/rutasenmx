import Image from 'next/image';

interface HeroVideoProps {
  /** MP4 (H.264) video URL. Placed in /public so it's served directly. */
  src: string;
  /** Poster image shown before the video loads and while buffering. */
  poster: string;
  /** Alt for the poster (empty = decorative). */
  posterAlt?: string;
  className?: string;
}

/**
 * Background hero video — autoplay, muted, looping, plays inline on mobile.
 *
 * Performance notes:
 * - `preload="metadata"` tells the browser to fetch only the metadata first,
 *   so the initial HTML payload isn't blocked by a 30+ MB body.
 * - `poster` (a small optimised Next.js Image) paints immediately and covers
 *   any loading gap.
 * - `object-cover` scales a 4K source down cleanly on any viewport.
 * - `fetchPriority="low"` de-prioritises the video vs. LCP text.
 */
export function HeroVideo({ src, poster, posterAlt = '', className = '' }: HeroVideoProps) {
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* Poster — Next/Image for instant paint. Slight overscan prevents any
          rounding gap between the hero section and the next section. */}
      <div aria-hidden className="absolute -inset-1">
        <Image
          src={poster}
          alt={posterAlt}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>

      {/* Actual video, fades over the poster once it can play. `block` removes
          the default inline-baseline whitespace under <video>; `-inset-1` +
          `w-[calc(100%+2px)] h-[calc(100%+2px)]` overscans by 1 px on every
          side so subpixel rounding can't expose the white section below. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden
        // @ts-expect-error — valid HTML attribute not yet typed in React DOM
        fetchPriority="low"
        className="absolute -inset-[1px] block h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
