'use client';

import { GripVertical, Trash2, ChevronUp, ChevronDown, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface TripStop {
  id: string;
  name: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  sortOrder: number;
  durationMinutes: number;
  notes: string;
  day: number;
  budgetCents: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface StopCardProps {
  stop: TripStop;
  index: number;
  total: number;
  onChange: (patch: Partial<TripStop>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function StopCard({
  stop,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  className,
}: StopCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm',
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        {/* Drag handle + reorder arrows */}
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded p-0.5 hover:bg-muted"
              aria-label="Mover arriba"
            >
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="rounded p-0.5 hover:bg-muted"
              aria-label="Mover abajo"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 space-y-2">
          <Input
            placeholder={`Parada ${index + 1}`}
            value={stop.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-8 text-sm font-medium"
          />

          {/* Day + duration row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Day */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Dia
              </span>
              <Input
                type="number"
                min={1}
                value={stop.day}
                onChange={(e) => onChange({ day: parseInt(e.target.value, 10) || 1 })}
                className="h-7 w-14 text-xs"
              />
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                step={15}
                value={stop.durationMinutes}
                onChange={(e) =>
                  onChange({ durationMinutes: parseInt(e.target.value, 10) || 0 })
                }
                className="h-7 w-16 text-xs"
              />
              <span className="text-[10px] text-muted-foreground">min</span>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                step={100}
                value={stop.budgetCents}
                onChange={(e) =>
                  onChange({ budgetCents: parseInt(e.target.value, 10) || 0 })
                }
                className="h-7 w-20 text-xs"
                placeholder="MXN"
              />
            </div>
          </div>

          {/* Arrival / departure time */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Llegada
              </span>
              <Input
                type="time"
                value={stop.arrivalTime ?? ''}
                onChange={(e) => onChange({ arrivalTime: e.target.value })}
                className="h-7 w-28 text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Salida
              </span>
              <Input
                type="time"
                value={stop.departureTime ?? ''}
                onChange={(e) => onChange({ departureTime: e.target.value })}
                className="h-7 w-28 text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notas (opcional)"
            value={stop.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Remove */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          aria-label="Eliminar parada"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
