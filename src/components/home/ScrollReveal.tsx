'use client';

import { useEffect, useRef } from 'react';

/**
 * Wrap a child section: when it scrolls into view, toggles `.is-visible`
 * so the CSS `.reveal-on-scroll` transition runs. Applies `reveal-on-scroll`
 * to the rendered wrapper, so you only need to add `reveal-stagger-N`
 * to descendants that should stagger.
 */
export function ScrollReveal({
  as: As = 'div',
  className = '',
  children,
  threshold = 0.15,
  once = true,
}: {
  as?: 'div' | 'section' | 'article' | 'header' | 'aside';
  className?: string;
  children: React.ReactNode;
  threshold?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      node.classList.add('is-visible');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-visible');
          }
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [threshold, once]);

  const Element = As as unknown as React.ElementType;
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };
  return (
    <Element ref={setRef} className={`reveal-on-scroll ${className}`}>
      {children}
    </Element>
  );
}
