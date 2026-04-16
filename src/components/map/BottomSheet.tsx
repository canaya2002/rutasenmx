'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export type SnapPoint = 'peek' | 'half' | 'full';

export interface BottomSheetProps {
  /** Content shown in the "peek" header area (always visible) */
  header?: ReactNode;
  /** Main scrollable content */
  children: ReactNode;
  /** Controlled snap point */
  snap?: SnapPoint;
  /** Called when the snap point changes (via drag or programmatic) */
  onSnapChange?: (snap: SnapPoint) => void;
  className?: string;
}

/* Heights in viewport-height percent */
const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  peek: 12, // ~12vh — shows search bar / categories
  half: 50,
  full: 92,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function BottomSheet({
  header,
  children,
  snap: controlledSnap,
  onSnapChange,
  className,
}: BottomSheetProps) {
  const [internalSnap, setInternalSnap] = useState<SnapPoint>('peek');
  const snap = controlledSnap ?? internalSnap;

  const setSnap = useCallback(
    (s: SnapPoint) => {
      setInternalSnap(s);
      onSnapChange?.(s);
    },
    [onSnapChange],
  );

  /* Drag state */
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const isDragging = useRef(false);
  const currentHeight = useRef(SNAP_HEIGHTS[snap]);

  /* Keep in sync when controlled snap changes */
  useEffect(() => {
    currentHeight.current = SNAP_HEIGHTS[snap];
  }, [snap]);

  /* ---- Touch handlers ---- */
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = currentHeight.current;
  }, []);

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const next = Math.max(
      SNAP_HEIGHTS.peek,
      Math.min(SNAP_HEIGHTS.full, dragStartHeight.current + deltaVh),
    );
    currentHeight.current = next;
    sheetRef.current.style.height = `${next}vh`;
    sheetRef.current.style.transition = 'none';
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (!sheetRef.current) return;

    /* Determine closest snap point */
    const h = currentHeight.current;
    let closest: SnapPoint = 'peek';
    let minDist = Infinity;
    for (const [key, val] of Object.entries(SNAP_HEIGHTS) as [SnapPoint, number][]) {
      const d = Math.abs(h - val);
      if (d < minDist) {
        minDist = d;
        closest = key;
      }
    }

    sheetRef.current.style.transition = 'height 300ms cubic-bezier(.4,0,.2,1)';
    sheetRef.current.style.height = `${SNAP_HEIGHTS[closest]}vh`;
    currentHeight.current = SNAP_HEIGHTS[closest];
    setSnap(closest);
  }, [setSnap]);

  return (
    <div
      ref={sheetRef}
      className={cn(
        'md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-[height] duration-300 ease-[cubic-bezier(.4,0,.2,1)]',
        className,
      )}
      style={{ height: `${SNAP_HEIGHTS[snap]}vh` }}
    >
      {/* Drag handle */}
      <div
        className="flex shrink-0 cursor-grab items-center justify-center py-2.5 active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header (always visible at peek) */}
      {header && <div className="shrink-0 border-b border-border px-4 pb-3">{header}</div>}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe">
        {children}
      </div>
    </div>
  );
}
