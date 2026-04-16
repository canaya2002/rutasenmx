'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Trash2,
  GripVertical,
  CalendarDays,
  Printer,
  Save,
  Clock,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDistance, formatDuration } from '@/lib/utils';
import type { TripStop } from './StopCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date?: string;
  title: string;
  notes: string;
  stops: TripStop[];
}

export interface ItineraryBuilderProps {
  days: ItineraryDay[];
  onChange: (days: ItineraryDay[]) => void;
  /** Show an auto-save indicator */
  isSaving?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Sortable stop item                                                 */
/* ------------------------------------------------------------------ */
function SortableStop({
  stop,
  onRemove,
}: {
  stop: TripStop;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="flex-1 truncate text-sm">{stop.name || 'Sin nombre'}</span>
      {stop.durationMinutes > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDuration(stop.durationMinutes)}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 hover:bg-muted"
        aria-label="Eliminar"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function ItineraryBuilder({
  days,
  onChange,
  isSaving,
  className,
}: ItineraryBuilderProps) {
  const [printMode, setPrintMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* ── Day mutations ─────────────────────────────────────────── */
  const addDay = useCallback(() => {
    onChange([
      ...days,
      {
        id: crypto.randomUUID(),
        dayNumber: days.length + 1,
        title: `Dia ${days.length + 1}`,
        notes: '',
        stops: [],
      },
    ]);
  }, [days, onChange]);

  const removeDay = useCallback(
    (dayId: string) => {
      onChange(
        days
          .filter((d) => d.id !== dayId)
          .map((d, i) => ({ ...d, dayNumber: i + 1 })),
      );
    },
    [days, onChange],
  );

  const updateDay = useCallback(
    (dayId: string, patch: Partial<Omit<ItineraryDay, 'id' | 'stops'>>) => {
      onChange(days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));
    },
    [days, onChange],
  );

  /* ── Stop mutations ────────────────────────────────────────── */
  const addStopToDay = useCallback(
    (dayId: string) => {
      onChange(
        days.map((d) =>
          d.id === dayId
            ? {
                ...d,
                stops: [
                  ...d.stops,
                  {
                    id: crypto.randomUUID(),
                    name: '',
                    sortOrder: d.stops.length,
                    durationMinutes: 60,
                    notes: '',
                    day: d.dayNumber,
                    budgetCents: 0,
                  },
                ],
              }
            : d,
        ),
      );
    },
    [days, onChange],
  );

  const removeStop = useCallback(
    (dayId: string, stopId: string) => {
      onChange(
        days.map((d) =>
          d.id === dayId
            ? { ...d, stops: d.stops.filter((s) => s.id !== stopId) }
            : d,
        ),
      );
    },
    [days, onChange],
  );

  /* ── Drag end (within same day) ────────────────────────────── */
  const handleDragEnd = useCallback(
    (dayId: string) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      onChange(
        days.map((d) => {
          if (d.id !== dayId) return d;
          const oldIdx = d.stops.findIndex((s) => s.id === active.id);
          const newIdx = d.stops.findIndex((s) => s.id === over.id);
          if (oldIdx === -1 || newIdx === -1) return d;
          const next = [...d.stops];
          const [moved] = next.splice(oldIdx, 1);
          next.splice(newIdx, 0, moved);
          return { ...d, stops: next.map((s, i) => ({ ...s, sortOrder: i })) };
        }),
      );
    },
    [days, onChange],
  );

  /* ── Per-day aggregates ────────────────────────────────────── */
  const dayAggregates = useMemo(
    () =>
      days.map((d) => ({
        totalMinutes: d.stops.reduce((a, s) => a + s.durationMinutes, 0),
        stopCount: d.stops.length,
      })),
    [days],
  );

  return (
    <div className={cn('space-y-6', printMode && 'print:block', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <CalendarDays className="h-5 w-5" />
          Itinerario
        </h3>
        <div className="flex items-center gap-2">
          {isSaving !== undefined && (
            <span className="text-xs text-muted-foreground">
              {isSaving ? 'Guardando...' : 'Guardado'}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPrintMode((p) => !p)}
            aria-label="Vista de impresion"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days */}
      {days.map((day, di) => (
        <section
          key={day.id}
          className="rounded-lg border border-border bg-card"
        >
          {/* Day header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-white">
              {day.dayNumber}
            </div>
            <div className="flex-1">
              <Input
                value={day.title}
                onChange={(e) => updateDay(day.id, { title: e.target.value })}
                className="h-7 border-none bg-transparent px-0 text-sm font-semibold focus-visible:ring-0"
              />
              {day.date && (
                <p className="text-xs text-muted-foreground">{day.date}</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(dayAggregates[di].totalMinutes)}
              </span>
              <span>{dayAggregates[di].stopCount} paradas</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => removeDay(day.id)}
              aria-label={`Eliminar dia ${day.dayNumber}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>

          {/* Day notes */}
          <div className="border-b border-border px-4 py-2">
            <textarea
              placeholder="Notas del dia..."
              value={day.notes}
              onChange={(e) => updateDay(day.id, { notes: e.target.value })}
              rows={1}
              className="w-full resize-none bg-transparent text-xs placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>

          {/* Sortable stop list */}
          <div className="space-y-2 p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(day.id)}
            >
              <SortableContext
                items={day.stops.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {day.stops.map((stop) => (
                  <SortableStop
                    key={stop.id}
                    stop={stop}
                    onRemove={() => removeStop(day.id, stop.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1 text-xs"
              onClick={() => addStopToDay(day.id)}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar parada
            </Button>
          </div>
        </section>
      ))}

      <Button variant="outline" onClick={addDay} className="w-full gap-1.5">
        <Plus className="h-4 w-4" />
        Agregar dia
      </Button>
    </div>
  );
}
