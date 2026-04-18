'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { PLACE_CATEGORIES, BUDGET_LEVELS } from '@/lib/constants';
import type { AutopilotInput, AutopilotOutput } from '@/lib/ai/types';
import { useLocale } from '@/components/providers/LocaleProvider';

// ── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10;

const buildPaceOptions = (isEn: boolean) => [
  {
    value: 'relajado' as const,
    label: isEn ? 'Relaxed' : 'Relajado',
    description: isEn
      ? 'Few stops, lots of time to enjoy. 3-4h of driving/day.'
      : 'Pocas paradas, mucho tiempo para disfrutar. 3-4h de manejo/día.',
    icon: '\u2615',
  },
  {
    value: 'moderado' as const,
    label: isEn ? 'Moderate' : 'Moderado',
    description: isEn
      ? 'Balance between driving and exploring. 4-5h of driving/day.'
      : 'Balance entre manejo y exploración. 4-5h de manejo/día.',
    icon: '\u26F0\uFE0F',
  },
  {
    value: 'intenso' as const,
    label: isEn ? 'Intense' : 'Intenso',
    description: isEn
      ? 'Many stops, making the most of every minute. 6-7h of driving/day.'
      : 'Muchas paradas, aprovechando cada minuto. 6-7h de manejo/día.',
    icon: '\u26A1',
  },
];

const buildTravelerTypes = (isEn: boolean) => [
  { value: 'solo' as const, label: isEn ? 'Solo' : 'Solo', icon: '\uD83E\uDDD1' },
  { value: 'pareja' as const, label: isEn ? 'Couple' : 'Pareja', icon: '\uD83D\uDC91' },
  { value: 'familia' as const, label: isEn ? 'Family' : 'Familia', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66' },
  { value: 'amigos' as const, label: isEn ? 'Friends' : 'Amigos', icon: '\uD83E\uDD1D' },
  { value: 'grupo' as const, label: isEn ? 'Group' : 'Grupo', icon: '\uD83D\uDC65' },
];

const buildBudgetOptions = (isEn: boolean) => [
  {
    value: 'economico' as const,
    label: isEn ? 'Budget' : 'Económico',
    description: isEn
      ? 'Basic lodging, market food, free activities.'
      : 'Hospedaje básico, comida de mercado, actividades gratuitas.',
    range: isEn ? '$300 - $1,200 MXN/day' : '$300 - $1,200 MXN/día',
  },
  {
    value: 'moderado' as const,
    label: isEn ? 'Moderate' : 'Moderado',
    description: isEn
      ? '3-4 star hotels, local restaurants.'
      : 'Hoteles 3-4 estrellas, restaurantes locales.',
    range: isEn ? '$1,000 - $3,500 MXN/day' : '$1,000 - $3,500 MXN/día',
  },
  {
    value: 'premium' as const,
    label: 'Premium',
    description: isEn
      ? 'Boutique hotels, quality restaurants.'
      : 'Hoteles boutique, restaurantes de calidad.',
    range: isEn ? '$3,000 - $8,000 MXN/day' : '$3,000 - $8,000 MXN/día',
  },
  {
    value: 'lujo' as const,
    label: isEn ? 'Luxury' : 'Lujo',
    description: isEn
      ? 'The best hotels and exclusive experiences.'
      : 'Los mejores hoteles y experiencias exclusivas.',
    range: isEn ? '$6,000+ MXN/day' : '$6,000+ MXN/día',
  },
];

const buildStyleOptions = (isEn: boolean) => [
  {
    value: 'cultural' as const,
    label: isEn ? 'Cultural' : 'Cultural',
    description: isEn
      ? 'Museums, archaeological zones, historic centers.'
      : 'Museos, zonas arqueológicas, centros históricos.',
    icon: '\uD83C\uDFDB\uFE0F',
  },
  {
    value: 'foodie' as const,
    label: 'Foodie',
    description: isEn
      ? 'Markets, regional food, gastronomic experiences.'
      : 'Mercados, comida regional, experiencias gastronómicas.',
    icon: '\uD83C\uDF2E',
  },
  {
    value: 'familiar' as const,
    label: isEn ? 'Family' : 'Familiar',
    description: isEn
      ? 'Activities for the whole family.'
      : 'Actividades para toda la familia.',
    icon: '\uD83C\uDFA0',
  },
  {
    value: 'naturaleza' as const,
    label: isEn ? 'Nature' : 'Naturaleza',
    description: isEn
      ? 'Waterfalls, cenotes, forests, hiking.'
      : 'Cascadas, cenotes, bosques, senderismo.',
    icon: '\uD83C\uDF3F',
  },
  {
    value: 'express' as const,
    label: 'Express',
    description: isEn ? 'The essentials, quick and efficient.' : 'Lo esencial, rápido y eficiente.',
    icon: '\uD83D\uDE80',
  },
  {
    value: 'premium' as const,
    label: 'Premium',
    description: isEn
      ? 'Vineyards, haciendas, private tours.'
      : 'Viñedos, haciendas, tours privados.',
    icon: '\uD83C\uDF1F',
  },
];

const MEXICO_FUN_FACTS_ES = [
  'México tiene 35 sitios declarados Patrimonio de la Humanidad por la UNESCO.',
  'Existen más de 130 Pueblos Mágicos en todo el país.',
  'La gastronomía mexicana es Patrimonio Inmaterial de la Humanidad.',
  'México tiene la segunda barrera de coral más grande del mundo.',
  'En México se hablan 68 lenguas indígenas además del español.',
  'La Barranca del Cobre es más grande y profunda que el Gran Cañón.',
  'Chichén Itzá fue nombrada una de las Nuevas 7 Maravillas del Mundo.',
  'México es el país con más taxis en el mundo: más de 300,000.',
  'El cenote más profundo de México mide más de 300 metros.',
  'México tiene más de 11,000 km de costas en ambos océanos.',
  'La CDMX se hunde entre 5 y 40 cm por año debido a la extracción de agua.',
  'El chile habanero de Yucatán es uno de los más picantes del mundo.',
  'México tiene 6 zonas horarias diferentes.',
  'El Nevado de Toluca tiene un lago dentro de su cráter.',
  'Guanajuato tiene una red de túneles subterráneos que sirven como calles.',
];

const MEXICO_FUN_FACTS_EN = [
  'Mexico has 35 UNESCO World Heritage sites.',
  'There are more than 130 Pueblos Mágicos across the country.',
  'Mexican cuisine is recognized as UNESCO Intangible Cultural Heritage.',
  'Mexico has the second-largest coral barrier reef in the world.',
  '68 indigenous languages are spoken in Mexico in addition to Spanish.',
  'Copper Canyon is larger and deeper than the Grand Canyon.',
  'Chichén Itzá was named one of the New 7 Wonders of the World.',
  'Mexico has more taxis than any other country: over 300,000.',
  "Mexico's deepest cenote is over 300 meters deep.",
  'Mexico has more than 11,000 km of coastline on both oceans.',
  'Mexico City sinks between 5 and 40 cm per year due to water extraction.',
  'The Yucatán habanero pepper is one of the spiciest in the world.',
  'Mexico has 6 different time zones.',
  'Nevado de Toluca has a lake inside its crater.',
  'Guanajuato has a network of underground tunnels used as streets.',
];

// ── Types ───────────────────────────────────────────────────────────────────

interface WizardState {
  origin: { name: string; lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  dateStart: string;
  dateEnd: string;
  pace: AutopilotInput['pace'];
  travelerType: AutopilotInput['travelers']['type'];
  travelerCount: number;
  hasChildren: boolean;
  hasPets: boolean;
  budget: AutopilotInput['budget'];
  interests: string[];
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidDirtRoads: boolean;
  avoidFerries: boolean;
  maxDrivingHours: number;
  mustVisit: Array<{ name: string; lat: number; lng: number }>;
  style: AutopilotInput['style'];
}

interface AutopilotWizardProps {
  onComplete?: (result: AutopilotOutput) => void;
  isPremium?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export function AutopilotWizard({ onComplete, isPremium = false }: AutopilotWizardProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const T = (es: string, en: string) => (isEn ? en : es);

  const PACE_OPTIONS = React.useMemo(() => buildPaceOptions(isEn), [isEn]);
  const TRAVELER_TYPES = React.useMemo(() => buildTravelerTypes(isEn), [isEn]);
  const BUDGET_OPTIONS = React.useMemo(() => buildBudgetOptions(isEn), [isEn]);
  const STYLE_OPTIONS = React.useMemo(() => buildStyleOptions(isEn), [isEn]);
  const MEXICO_FUN_FACTS = isEn ? MEXICO_FUN_FACTS_EN : MEXICO_FUN_FACTS_ES;

  const [step, setStep] = React.useState(1);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [funFactIndex, setFunFactIndex] = React.useState(0);

  const [state, setState] = React.useState<WizardState>({
    origin: null,
    destination: null,
    dateStart: '',
    dateEnd: '',
    pace: 'moderado',
    travelerType: 'pareja',
    travelerCount: 2,
    hasChildren: false,
    hasPets: false,
    budget: 'moderado',
    interests: [],
    avoidTolls: false,
    avoidHighways: false,
    avoidDirtRoads: false,
    avoidFerries: false,
    maxDrivingHours: 5,
    mustVisit: [],
    style: 'cultural',
  });

  // Origin/destination search state
  const [originSearch, setOriginSearch] = React.useState('');
  const [destSearch, setDestSearch] = React.useState('');
  const [mustVisitSearch, setMustVisitSearch] = React.useState('');

  // Rotate fun facts during generation
  React.useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setFunFactIndex((prev) => (prev + 1) % MEXICO_FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const update = React.useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const canAdvance = React.useMemo(() => {
    switch (step) {
      case 1: return state.origin !== null && state.destination !== null;
      case 2: return true; // Dates are optional
      case 3: return true; // Pace has a default
      case 4: return state.travelerCount > 0;
      case 5: return true; // Budget has a default
      case 6: return state.interests.length > 0;
      case 7: return state.maxDrivingHours >= 2 && state.maxDrivingHours <= 10;
      case 8: return true; // Must visit is optional
      case 9: return true; // Style has a default
      case 10: return true; // Generate
      default: return false;
    }
  }, [step, state]);

  const handleGenerate = React.useCallback(async () => {
    if (!state.origin || !state.destination) return;

    setIsGenerating(true);
    setError(null);

    const input: AutopilotInput = {
      origin: state.origin,
      destination: state.destination,
      dates: state.dateStart && state.dateEnd
        ? { start: state.dateStart, end: state.dateEnd }
        : undefined,
      pace: state.pace,
      travelers: {
        type: state.travelerType,
        count: state.travelerCount,
        hasChildren: state.hasChildren,
        hasPets: state.hasPets,
      },
      budget: state.budget,
      interests: state.interests,
      restrictions: {
        avoidTolls: state.avoidTolls,
        avoidHighways: state.avoidHighways,
        avoidDirtRoads: state.avoidDirtRoads,
        avoidFerries: state.avoidFerries,
        maxDrivingHoursPerDay: state.maxDrivingHours,
      },
      mustVisit: state.mustVisit,
      style: state.style,
    };

    try {
      const response = await fetch('/api/autopilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ?? `Error ${response.status}: ${T('No se pudo generar el itinerario.', 'Could not generate the itinerary.')}`,
        );
      }

      const result: AutopilotOutput = await response.json();
      onComplete?.(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : T('Ocurrió un error inesperado. Intenta de nuevo.', 'An unexpected error occurred. Please try again.'),
      );
    } finally {
      setIsGenerating(false);
    }
  }, [state, onComplete, T]);

  // Geocode helper (simplified - uses coordinates from search text)
  const handleSetLocation = React.useCallback(
    (
      field: 'origin' | 'destination',
      name: string,
    ) => {
      // In production this would call Mapbox geocoding API
      // For now, use placeholder coordinates based on well-known cities
      const knownCities: Record<string, { lat: number; lng: number }> = {
        'ciudad de mexico': { lat: 19.4326, lng: -99.1332 },
        'cdmx': { lat: 19.4326, lng: -99.1332 },
        'guadalajara': { lat: 20.6597, lng: -103.3496 },
        'monterrey': { lat: 25.6866, lng: -100.3161 },
        'cancun': { lat: 21.1619, lng: -86.8515 },
        'oaxaca': { lat: 17.0732, lng: -96.7266 },
        'merida': { lat: 20.9674, lng: -89.5926 },
        'puebla': { lat: 19.0414, lng: -98.2063 },
        'san miguel de allende': { lat: 20.9144, lng: -100.7452 },
        'guanajuato': { lat: 21.0190, lng: -101.2574 },
        'queretaro': { lat: 20.5888, lng: -100.3899 },
        'san cristobal de las casas': { lat: 16.7370, lng: -92.6376 },
        'playa del carmen': { lat: 20.6296, lng: -87.0739 },
        'tulum': { lat: 20.2114, lng: -87.4654 },
        'puerto vallarta': { lat: 20.6534, lng: -105.2253 },
        'los cabos': { lat: 22.8905, lng: -109.9167 },
        'leon': { lat: 21.1221, lng: -101.6821 },
        'morelia': { lat: 19.7060, lng: -101.1950 },
        'zacatecas': { lat: 22.7709, lng: -102.5832 },
        'aguascalientes': { lat: 21.8818, lng: -102.2916 },
        'veracruz': { lat: 19.1738, lng: -96.1342 },
        'tijuana': { lat: 32.5149, lng: -117.0382 },
        'chihuahua': { lat: 28.6353, lng: -106.0889 },
        'durango': { lat: 24.0277, lng: -104.6532 },
        'mazatlan': { lat: 23.2494, lng: -106.4111 },
        'taxco': { lat: 18.5564, lng: -99.6050 },
        'cuernavaca': { lat: 18.9242, lng: -99.2216 },
        'toluca': { lat: 19.2826, lng: -99.6557 },
        'pachuca': { lat: 20.1011, lng: -98.7591 },
        'villahermosa': { lat: 17.9869, lng: -92.9303 },
        'campeche': { lat: 19.8301, lng: -90.5349 },
        'tuxtla gutierrez': { lat: 16.7528, lng: -93.1152 },
        'acapulco': { lat: 16.8531, lng: -99.8237 },
        'ixtapa': { lat: 17.6567, lng: -101.6511 },
        'huatulco': { lat: 15.7741, lng: -96.1349 },
      };

      const normalized = name.toLowerCase().trim();
      const found = knownCities[normalized];

      if (found) {
        update(field, { name, lat: found.lat, lng: found.lng });
      } else {
        // Default to Mexico center - in production use geocoding API
        update(field, { name, lat: 19.4326 + (Math.random() - 0.5) * 10, lng: -99.1332 + (Math.random() - 0.5) * 10 });
      }
    },
    [update],
  );

  const toggleInterest = React.useCallback(
    (slug: string) => {
      setState((prev) => ({
        ...prev,
        interests: prev.interests.includes(slug)
          ? prev.interests.filter((i) => i !== slug)
          : [...prev.interests, slug],
      }));
    },
    [],
  );

  const addMustVisit = React.useCallback(
    (name: string) => {
      if (!name.trim()) return;
      const knownCities: Record<string, { lat: number; lng: number }> = {
        'chichen itza': { lat: 20.6843, lng: -88.5678 },
        'teotihuacan': { lat: 19.6925, lng: -98.8438 },
        'monte alban': { lat: 17.0437, lng: -96.7676 },
        'palenque': { lat: 17.4838, lng: -92.0460 },
        'tulum ruinas': { lat: 20.2145, lng: -87.4290 },
        'guanajuato': { lat: 21.0190, lng: -101.2574 },
        'san miguel de allende': { lat: 20.9144, lng: -100.7452 },
      };

      const normalized = name.toLowerCase().trim();
      const found = knownCities[normalized];
      const coords = found ?? { lat: 19.4326 + (Math.random() - 0.5) * 10, lng: -99.1332 + (Math.random() - 0.5) * 10 };

      setState((prev) => ({
        ...prev,
        mustVisit: [...prev.mustVisit, { name: name.trim(), ...coords }],
      }));
      setMustVisitSearch('');
    },
    [],
  );

  // ── Loading screen ──────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16 px-4">
        <div className="relative">
          <Spinner size="xl" label={T('Generando itinerario...', 'Generating itinerary…')} />
        </div>
        <div className="text-center max-w-md space-y-4">
          <h3 className="text-xl font-display font-semibold text-foreground">
            {T('Estamos planeando tu ruta...', 'We are planning your route…')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {T(
              'Nuestro Autopilot está analizando cientos de lugares para crear el itinerario perfecto para ti.',
              'Our Autopilot is analyzing hundreds of places to create the perfect itinerary for you.',
            )}
          </p>
          <div className="bg-muted/50 rounded-lg p-4 min-h-[80px] flex items-center justify-center transition-all duration-500">
            <p className="text-sm text-muted-foreground italic">
              {MEXICO_FUN_FACTS[funFactIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // Step 1: Origin & Destination
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{T('Origen', 'Origin')}</label>
              <div className="flex gap-2">
                <Input
                  placeholder={T(
                    'Ej: Ciudad de México, Guadalajara, Monterrey...',
                    'E.g. Mexico City, Guadalajara, Monterrey…',
                  )}
                  value={originSearch}
                  onChange={(e) => setOriginSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && originSearch.trim()) {
                      handleSetLocation('origin', originSearch.trim());
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (originSearch.trim()) handleSetLocation('origin', originSearch.trim());
                  }}
                >
                  {T('Fijar', 'Set')}
                </Button>
              </div>
              {state.origin && (
                <Badge variant="success">{state.origin.name}</Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{T('Destino', 'Destination')}</label>
              <div className="flex gap-2">
                <Input
                  placeholder={T(
                    'Ej: Cancún, Oaxaca, Mérida...',
                    'E.g. Cancún, Oaxaca, Mérida…',
                  )}
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && destSearch.trim()) {
                      handleSetLocation('destination', destSearch.trim());
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (destSearch.trim()) handleSetLocation('destination', destSearch.trim());
                  }}
                >
                  {T('Fijar', 'Set')}
                </Button>
              </div>
              {state.destination && (
                <Badge variant="success">{state.destination.name}</Badge>
              )}
            </div>
          </div>
        );

      // Step 2: Dates
      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {T(
                'Las fechas son opcionales. Si no las defines, calcularemos la duración ideal automáticamente.',
                "Dates are optional. If you don't set them, we'll calculate the ideal duration automatically.",
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{T('Fecha de salida', 'Start date')}</label>
                <Input
                  type="date"
                  value={state.dateStart}
                  onChange={(e) => update('dateStart', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{T('Fecha de regreso', 'Return date')}</label>
                <Input
                  type="date"
                  value={state.dateEnd}
                  onChange={(e) => update('dateEnd', e.target.value)}
                  min={state.dateStart || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        );

      // Step 3: Pace
      case 3:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PACE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update('pace', option.value)}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all',
                  state.pace === option.value
                    ? 'border-terracotta bg-terracotta/5 shadow-md'
                    : 'border-border hover:border-terracotta/40 hover:bg-muted/50',
                )}
              >
                <span className="text-3xl">{option.icon}</span>
                <span className="font-semibold text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>
        );

      // Step 4: Travelers
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {TRAVELER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => update('travelerType', type.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    state.travelerType === type.value
                      ? 'border-terracotta bg-terracotta/5'
                      : 'border-border hover:border-terracotta/40',
                  )}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {T('Número de viajeros', 'Number of travelers')}
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={state.travelerCount}
                onChange={(e) => update('travelerCount', Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.hasChildren}
                  onChange={(e) => update('hasChildren', e.target.checked)}
                  className="h-5 w-5 rounded border-border text-terracotta focus:ring-terracotta"
                />
                <span className="text-sm">{T('Viajamos con niños', 'Traveling with children')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.hasPets}
                  onChange={(e) => update('hasPets', e.target.checked)}
                  className="h-5 w-5 rounded border-border text-terracotta focus:ring-terracotta"
                />
                <span className="text-sm">{T('Viajamos con mascotas', 'Traveling with pets')}</span>
              </label>
            </div>
          </div>
        );

      // Step 5: Budget
      case 5:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update('budget', option.value)}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border-2 p-5 text-left transition-all',
                  state.budget === option.value
                    ? 'border-terracotta bg-terracotta/5 shadow-md'
                    : 'border-border hover:border-terracotta/40 hover:bg-muted/50',
                )}
              >
                <span className="font-semibold text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
                <span className="text-xs font-medium text-terracotta">{option.range}</span>
              </button>
            ))}
          </div>
        );

      // Step 6: Interests
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {T(
                'Selecciona las categorías que te interesan. Puedes elegir varias.',
                'Select the categories that interest you. You can choose several.',
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACE_CATEGORIES.filter(
                (cat) => !['gasolineras', 'casetas', 'paradas-utiles', 'talleres-auxilio'].includes(cat.slug),
              ).map((cat) => (
                <Chip
                  key={cat.slug}
                  label={cat.name}
                  active={state.interests.includes(cat.slug)}
                  onClick={() => toggleInterest(cat.slug)}
                />
              ))}
            </div>
            {state.interests.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? `${state.interests.length} categor${state.interests.length !== 1 ? 'ies' : 'y'} selected`
                  : `${state.interests.length} categoría${state.interests.length !== 1 ? 's' : ''} seleccionada${state.interests.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        );

      // Step 7: Restrictions
      case 7:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.avoidTolls}
                  onChange={(e) => update('avoidTolls', e.target.checked)}
                  className="h-5 w-5 rounded border-border text-terracotta focus:ring-terracotta"
                />
                <div>
                  <span className="text-sm font-medium">{T('Evitar casetas de peaje', 'Avoid tolls')}</span>
                  <p className="text-xs text-muted-foreground">{T('Preferir carreteras libres (el viaje puede ser más largo).', 'Prefer free roads (the trip may take longer).')}</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.avoidHighways}
                  onChange={(e) => update('avoidHighways', e.target.checked)}
                  className="h-5 w-5 rounded border-border text-terracotta focus:ring-terracotta"
                />
                <div>
                  <span className="text-sm font-medium">{T('Evitar autopistas', 'Avoid highways')}</span>
                  <p className="text-xs text-muted-foreground">{T('Viajar por carreteras secundarias y pueblitos.', 'Travel by secondary roads and small towns.')}</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.avoidDirtRoads}
                  onChange={(e) => update('avoidDirtRoads', e.target.checked)}
                  className="h-5 w-5 rounded border-border text-terracotta focus:ring-terracotta"
                />
                <div>
                  <span className="text-sm font-medium">{T('Evitar terracería', 'Avoid dirt roads')}</span>
                  <p className="text-xs text-muted-foreground">{T('Solo caminos pavimentados.', 'Paved roads only.')}</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.avoidFerries}
                  onChange={(e) => update('avoidFerries', e.target.checked)}
                  className="h-5 w-5 rounded border-border text-terracotta focus:ring-terracotta"
                />
                <div>
                  <span className="text-sm font-medium">{T('Evitar transbordadores', 'Avoid ferries')}</span>
                  <p className="text-xs text-muted-foreground">{T('No cruzar por ferry o lancha.', 'Do not cross by ferry or boat.')}</p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {T(`Máximo de horas de manejo por día: ${state.maxDrivingHours}h`, `Max driving hours per day: ${state.maxDrivingHours}h`)}
              </label>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={state.maxDrivingHours}
                onChange={(e) => update('maxDrivingHours', parseFloat(e.target.value))}
                className="w-full accent-terracotta"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{T('2h (poco manejo)', '2h (little driving)')}</span>
                <span>{T('10h (máximo)', '10h (max)')}</span>
              </div>
            </div>
          </div>
        );

      // Step 8: Must-Visit Places
      case 8:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {T(
                'Agrega lugares que no pueden faltar en tu viaje. Este paso es opcional.',
                'Add places that cannot be missed on your trip. This step is optional.',
              )}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={T(
                  'Ej: Chichén Itzá, Teotihuacán, Monte Albán...',
                  'E.g. Chichén Itzá, Teotihuacán, Monte Albán…',
                )}
                value={mustVisitSearch}
                onChange={(e) => setMustVisitSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addMustVisit(mustVisitSearch);
                }}
              />
              <Button
                variant="outline"
                onClick={() => addMustVisit(mustVisitSearch)}
                disabled={!mustVisitSearch.trim()}
              >
                {T('Agregar', 'Add')}
              </Button>
            </div>
            {state.mustVisit.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.mustVisit.map((place, idx) => (
                  <Chip
                    key={`${place.name}-${idx}`}
                    label={place.name}
                    active
                    removable
                    onRemove={() => {
                      setState((prev) => ({
                        ...prev,
                        mustVisit: prev.mustVisit.filter((_, i) => i !== idx),
                      }));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );

      // Step 9: Style
      case 9:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update('style', option.value)}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all',
                  state.style === option.value
                    ? 'border-terracotta bg-terracotta/5 shadow-md'
                    : 'border-border hover:border-terracotta/40 hover:bg-muted/50',
                )}
              >
                <span className="text-3xl">{option.icon}</span>
                <span className="font-semibold text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>
        );

      // Step 10: Review & Generate
      case 10:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Origen', 'Origin')}</span>
                <p className="text-foreground">{state.origin?.name ?? '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Destino', 'Destination')}</span>
                <p className="text-foreground">{state.destination?.name ?? '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Fechas', 'Dates')}</span>
                <p className="text-foreground">
                  {state.dateStart && state.dateEnd
                    ? `${state.dateStart} ${T('al', 'to')} ${state.dateEnd}`
                    : T('Automático', 'Automatic')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Ritmo', 'Pace')}</span>
                <p className="text-foreground capitalize">{state.pace}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Viajeros', 'Travelers')}</span>
                <p className="text-foreground">
                  {state.travelerCount} - {state.travelerType}
                  {state.hasChildren ? T(' (con niños)', ' (with children)') : ''}
                  {state.hasPets ? T(' (con mascotas)', ' (with pets)') : ''}
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Presupuesto', 'Budget')}</span>
                <p className="text-foreground capitalize">{state.budget}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="font-medium text-muted-foreground">{T('Intereses', 'Interests')}</span>
                <div className="flex flex-wrap gap-1">
                  {state.interests.map((slug) => {
                    const cat = PLACE_CATEGORIES.find((c) => c.slug === slug);
                    return (
                      <Badge key={slug} variant="outline">
                        {cat?.name ?? slug}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Estilo', 'Style')}</span>
                <p className="text-foreground capitalize">{state.style}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">{T('Max manejo/día', 'Max driving/day')}</span>
                <p className="text-foreground">{state.maxDrivingHours}h</p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              size="lg"
              className="w-full text-base"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {T('Generar mi itinerario con Autopilot', 'Generate my itinerary with Autopilot')}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Step titles ─────────────────────────────────────────────────────────

  const stepTitles: Record<number, { title: string; description: string }> = isEn
    ? {
        1: { title: 'Origin and destination', description: 'Define where you start and where you want to go.' },
        2: { title: 'Dates', description: 'When do you want to travel? (optional)' },
        3: { title: 'Travel pace', description: 'How fast do you want to go?' },
        4: { title: 'Travelers', description: 'Who is going on the trip?' },
        5: { title: 'Budget', description: 'How much do you want to spend?' },
        6: { title: 'Interests', description: 'What kind of places interest you?' },
        7: { title: 'Restrictions', description: 'Is there anything you want to avoid on the way?' },
        8: { title: 'Must-visit places', description: 'Any place you cannot miss?' },
        9: { title: 'Travel style', description: 'What kind of experience are you looking for?' },
        10: { title: 'Summary', description: 'Review your preferences before generating.' },
      }
    : {
        1: { title: 'Origen y destino', description: 'Define de dónde sales y a dónde quieres llegar.' },
        2: { title: 'Fechas', description: '¿Cuándo quieres viajar? (opcional)' },
        3: { title: 'Ritmo de viaje', description: '¿Qué tan rápido quieres ir?' },
        4: { title: 'Viajeros', description: '¿Quién va en el viaje?' },
        5: { title: 'Presupuesto', description: '¿Cuánto quieres gastar?' },
        6: { title: 'Intereses', description: '¿Qué tipo de lugares te interesan?' },
        7: { title: 'Restricciones', description: '¿Hay algo que quieras evitar en el camino?' },
        8: { title: 'Lugares imperdibles', description: '¿Hay algún lugar que no puede faltar?' },
        9: { title: 'Estilo del viaje', description: '¿Qué tipo de experiencia buscas?' },
        10: { title: 'Resumen', description: 'Revisa tus preferencias antes de generar.' },
      };

  const currentStep = stepTitles[step];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i + 1 <= step ? 'bg-terracotta' : 'bg-muted',
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>
              {T(`Paso ${step} de ${TOTAL_STEPS}`, `Step ${step} of ${TOTAL_STEPS}`)}
            </CardDescription>
            <CardTitle className="text-xl">{currentStep.title}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            {T('Anterior', 'Previous')}
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={!canAdvance}
            >
              {T('Siguiente', 'Next')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
