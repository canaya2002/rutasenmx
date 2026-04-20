import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  /** `light` = normal. `dark` = brighten for dark backgrounds. */
  variant?: 'light' | 'dark';
  /** Logo height in px — width auto-scales from the aspect ratio. */
  height?: number;
  className?: string;
  /** If false, renders just the <img> (no Link wrapper). */
  linked?: boolean;
}

// Intrinsic size of public/icon.png (visual crop is ~1.5:1).
const INTRINSIC_W = 1152;
const INTRINSIC_H = 768;

export function Logo({
  variant = 'light',
  height = 40,
  className = '',
  linked = true,
}: LogoProps) {
  const width = Math.round((INTRINSIC_W / INTRINSIC_H) * height);
  const img = (
    <Image
      src="/icon.png"
      alt="Rutas en México"
      width={width}
      height={height}
      priority
      className={`object-contain ${variant === 'dark' ? 'brightness-0 invert' : ''} ${className}`}
    />
  );
  if (!linked) return img;
  return (
    <Link href="/" aria-label="Rutas en México — Inicio" className="inline-flex items-center">
      {img}
    </Link>
  );
}
