import Image from "next/image";

interface SeoImageProps {
  /** Image source URL. */
  src: string;
  /** Descriptive alt text for accessibility and SEO. Required. */
  alt: string;
  /** Intrinsic width of the image in pixels. */
  width: number;
  /** Intrinsic height of the image in pixels. */
  height: number;
  /**
   * When true, the image is considered above the fold and will be
   * preloaded with `priority` and eager loading.
   */
  priority?: boolean;
  /** Additional CSS class names. */
  className?: string;
  /** Optional `sizes` attribute for responsive images. */
  sizes?: string;
  /** Optional quality setting (1-100). */
  quality?: number;
}

/**
 * SEO-optimized image component that wraps next/image.
 * Ensures alt text is always provided and passes through
 * priority/loading attributes for optimal LCP performance.
 */
export function SeoImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes,
  quality,
}: SeoImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      className={className}
      sizes={sizes}
      quality={quality}
    />
  );
}
