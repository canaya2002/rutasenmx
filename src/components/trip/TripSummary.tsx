import {
  MapPin,
  Route,
  Clock,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { formatDistance, formatDuration, formatCurrency } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface TripSummaryData {
  title: string;
  originName: string;
  destinationName: string;
  stopsCount: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  days: number;
  budgetEstimateCents: number;
  currency?: string;
  shareToken?: string;
}

export interface TripSummaryProps {
  trip: TripSummaryData;
  /** Render slot for share / export buttons (client components) */
  actions?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Server component                                                   */
/* ------------------------------------------------------------------ */
export default function TripSummary({ trip, actions, className }: TripSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{trip.title}</CardTitle>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
          <span>{trip.originName}</span>
          <span className="mx-1">→</span>
          <MapPin className="h-3.5 w-3.5 text-terracotta" />
          <span>{trip.destinationName}</span>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
        {/* Stops */}
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Paradas</p>
            <p className="font-semibold">{trip.stopsCount}</p>
          </div>
        </div>

        {/* Distance */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Distancia</p>
            <p className="font-semibold">{formatDistance(trip.totalDistanceKm)}</p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Tiempo</p>
            <p className="font-semibold">{formatDuration(trip.totalDurationMinutes)}</p>
          </div>
        </div>

        {/* Days */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Dias</p>
            <p className="font-semibold">{trip.days}</p>
          </div>
        </div>

        {/* Budget */}
        <div className="col-span-2 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Presupuesto estimado</p>
            <p className="font-semibold">
              {formatCurrency(trip.budgetEstimateCents, trip.currency ?? 'MXN')}
            </p>
          </div>
        </div>
      </CardContent>

      {actions && <CardFooter className="gap-2">{actions}</CardFooter>}
    </Card>
  );
}
