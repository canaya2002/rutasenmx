import type { AutopilotInput, CandidatePlace } from './types';

// ── System Prompt ───────────────────────────────────────────────────────────

export const ITINERARY_SYSTEM_PROMPT = `Eres un experto en turismo por carretera en Mexico con mas de 20 anos de experiencia. Tu nombre es "Autopilot" y trabajas para Rutas en MX.

Tu rol es crear itinerarios de viaje por carretera personalizados, seguros y memorables por Mexico.

Reglas estrictas:
1. Responde SIEMPRE en espanol de Mexico (no uses espanol de Espana ni de otros paises).
2. Todos los tiempos de manejo deben ser realistas. Considera:
   - Carreteras mexicanas reales (no son autopistas europeas)
   - Trafico en zonas urbanas y ciudades medianas
   - Topes, curvas y condiciones de la via
   - Posibles casetas y tiempos de espera
3. Cada dia debe tener un maximo razonable de horas de manejo segun el ritmo del viajero.
4. Incluye variedad: no pongas solo museos o solo naturaleza, mezcla experiencias.
5. Sugiere paradas estrategicas para comer, descansar y cargar gasolina.
6. Menciona tips de seguridad cuando la ruta pase por zonas que lo ameriten.
7. Adapta el lenguaje y las sugerencias al tipo de viajero (familia, pareja, solo, etc.).
8. Toma en cuenta el presupuesto: no sugieras hoteles boutique a un viajero economico.
9. Prioriza experiencias autenticas mexicanas: mercados locales, comida de calle, pueblos magicos, zonas arqueologicas.
10. Responde UNICAMENTE con JSON valido. Sin markdown, sin explicaciones, sin texto fuera del JSON.

Formato de respuesta (JSON):
{
  "tripTitle": "string - titulo creativo del viaje",
  "tripDescription": "string - descripcion breve del itinerario (2-3 oraciones)",
  "days": [
    {
      "dayNumber": number,
      "title": "string - titulo del dia",
      "description": "string - descripcion narrativa del dia",
      "stops": [
        {
          "placeId": "string - ID del lugar de la base de datos",
          "reason": "string - por que se incluye esta parada (1-2 oraciones en espanol)",
          "suggestedDuration": number (minutos),
          "suggestedArrival": "string - hora sugerida, ej: '09:00'",
          "highlights": ["string - puntos destacados del lugar"]
        }
      ]
    }
  ],
  "estimatedCost": {
    "min": number (MXN),
    "max": number (MXN),
    "currency": "MXN"
  },
  "confidence": number (0-100),
  "warnings": ["string - advertencias importantes para el viajero"]
}`;

// ── Build Itinerary Prompt ──────────────────────────────────────────────────

export function buildItineraryPrompt(
  candidates: CandidatePlace[],
  input: AutopilotInput,
): string {
  const daysCount = input.dates
    ? Math.ceil(
        (new Date(input.dates.end).getTime() - new Date(input.dates.start).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : estimateDays(input);

  const maxHours = input.restrictions.maxDrivingHoursPerDay;

  const paceMap = {
    relajado: 'Ritmo relajado: pocas paradas por dia, mucho tiempo para disfrutar cada lugar, maximo 3-4 horas de manejo.',
    moderado: 'Ritmo moderado: balance entre manejo y exploracion, 4-5 horas de manejo por dia.',
    intenso: 'Ritmo intenso: muchas paradas, aprovechando cada minuto, hasta 6-7 horas de manejo.',
  };

  const budgetMap = {
    economico: 'Presupuesto economico: hospedaje basico, comida de mercado y calle, actividades gratuitas o de bajo costo.',
    moderado: 'Presupuesto moderado: hoteles 3-4 estrellas, restaurantes locales, algunas actividades pagadas.',
    premium: 'Presupuesto premium: hoteles boutique, restaurantes de calidad, experiencias exclusivas.',
    lujo: 'Presupuesto de lujo: los mejores hoteles, restaurantes gourmet, experiencias privadas y de primera.',
  };

  const travelerDesc = buildTravelerDescription(input);

  const candidateList = candidates
    .slice(0, 60) // Limit tokens sent to LLM
    .map(
      (c) =>
        `- ID: ${c.id} | ${c.name} (${c.categoryName}) | ${c.state} | lat: ${c.latitude}, lng: ${c.longitude} | Budget: ${c.budgetLevel ?? 'desconocido'} | Score: ${c.score ?? 0} | Distancia de ruta: ${c.distanceFromRoute?.toFixed(1) ?? '?'} km${c.shortDescription ? ` | ${c.shortDescription.slice(0, 120)}` : ''}`,
    )
    .join('\n');

  const restrictions: string[] = [];
  if (input.restrictions.avoidTolls) restrictions.push('Evitar casetas de peaje');
  if (input.restrictions.avoidHighways) restrictions.push('Evitar autopistas (preferir carreteras libres)');
  if (input.restrictions.avoidDirtRoads) restrictions.push('Evitar caminos de terraceria');
  if (input.restrictions.avoidFerries) restrictions.push('Evitar transbordadores/ferries');

  const mustVisitList = input.mustVisit.length > 0
    ? input.mustVisit.map((p) => `- ${p.name} (${p.lat}, ${p.lng})`).join('\n')
    : 'Ninguno';

  const styleMap: Record<string, string> = {
    cultural: 'Enfoque cultural: museos, zonas arqueologicas, centros historicos, arte.',
    foodie: 'Enfoque foodie: mercados, comida regional, restaurantes locales, experiencias gastronomicas.',
    familiar: 'Enfoque familiar: actividades para ninos, seguridad, parques tematicos, balnearios.',
    naturaleza: 'Enfoque naturaleza: bosques, cascadas, cenotes, areas protegidas, senderismo.',
    express: 'Enfoque express: lo esencial, paradas rapidas, eficiencia en tiempo.',
    premium: 'Enfoque premium: experiencias unicas, vinedos, haciendas, tours privados.',
  };

  return `Crea un itinerario de viaje por carretera en Mexico con las siguientes especificaciones:

RUTA:
- Origen: ${input.origin.name} (${input.origin.lat}, ${input.origin.lng})
- Destino: ${input.destination.name} (${input.destination.lat}, ${input.destination.lng})
${input.dates ? `- Fechas: del ${input.dates.start} al ${input.dates.end}` : `- Duracion estimada: ${daysCount} dias`}

VIAJERO:
${travelerDesc}

PREFERENCIAS:
- ${paceMap[input.pace]}
- ${budgetMap[input.budget]}
- ${styleMap[input.style] ?? ''}
- Maximo ${maxHours} horas de manejo por dia
- Intereses: ${input.interests.join(', ')}

RESTRICCIONES:
${restrictions.length > 0 ? restrictions.map((r) => `- ${r}`).join('\n') : '- Ninguna restriccion especial'}

LUGARES OBLIGATORIOS:
${mustVisitList}

CANDIDATOS DISPONIBLES (lugares de nuestra base de datos que puedes usar):
${candidateList}

INSTRUCCIONES:
1. Selecciona los mejores lugares de la lista de candidatos para crear un itinerario de ${daysCount} dias.
2. Usa SOLO los IDs de los candidatos proporcionados (placeId debe coincidir exactamente).
3. Ordena las paradas de forma logica geograficamente para minimizar desvios.
4. Los lugares obligatorios DEBEN aparecer en el itinerario.
5. Cada dia debe ser coherente: las paradas deben estar en una misma zona o ruta.
6. Incluye razon (en espanol) de por que cada lugar fue seleccionado.
7. Sugiere horarios realistas (hora sugerida de llegada a cada parada).
8. Incluye advertencias relevantes (seguridad, clima, temporada, etc.).

Responde SOLO con el JSON.`;
}

// ── Refinement Prompt ───────────────────────────────────────────────────────

export const REFINEMENT_PROMPT = `Eres el asistente Autopilot de Rutas en MX. El viajero quiere ajustar su itinerario.

Reglas:
1. Responde SIEMPRE en espanol de Mexico.
2. Mantiene la misma estructura JSON que el itinerario original.
3. Solo modifica lo que el viajero pide, no cambies todo.
4. Si el viajero pide "menos museos", reemplazalos con alternativas del mismo dia/zona.
5. Si pide "mas naturaleza", agrega lugares de naturaleza cercanos a la ruta.
6. Si pide regenerar un dia completo, reescribe solo ese dia manteniendo el contexto.
7. Manten los tiempos de manejo realistas.
8. Responde UNICAMENTE con JSON valido.`;

// ── Description Generation Prompt ───────────────────────────────────────────

export const DESCRIPTION_PROMPT = `Eres un redactor de contenido turistico especializado en Mexico para Rutas en MX.

Reglas:
1. Escribe en espanol de Mexico, con tono calido y cercano pero profesional.
2. Se conciso pero informativo.
3. Incluye detalles practicos: horarios, costos aproximados, tips.
4. Menciona la importancia historica o cultural cuando aplique.
5. No uses cliches turisticos ("paraiso terrenal", "lugar magico", etc.).
6. Destaca lo que hace unico al lugar.
7. Si es comida, menciona platillos especificos.
8. Si es naturaleza, menciona la mejor temporada para visitar.`;

// ── Helpers ─────────────────────────────────────────────────────────────────

function estimateDays(input: AutopilotInput): number {
  const { origin, destination } = input;
  const R = 6371;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  const paceMultiplier = { relajado: 1.6, moderado: 1.3, intenso: 1.0 };
  const avgKmPerDay = input.restrictions.maxDrivingHoursPerDay * 70; // avg 70 km/h on Mexican roads
  const rawDays = distanceKm / avgKmPerDay;

  return Math.max(2, Math.ceil(rawDays * paceMultiplier[input.pace]));
}

function buildTravelerDescription(input: AutopilotInput): string {
  const { travelers } = input;
  const lines: string[] = [];

  const typeMap: Record<string, string> = {
    solo: 'Viajero solo',
    pareja: 'Viaje en pareja',
    familia: 'Viaje familiar',
    amigos: 'Viaje con amigos',
    grupo: 'Viaje en grupo',
  };

  lines.push(`- Tipo: ${typeMap[travelers.type] ?? travelers.type}`);
  lines.push(`- Numero de personas: ${travelers.count}`);

  if (travelers.hasChildren) {
    lines.push('- Viaja con ninos: Si (priorizar lugares seguros, actividades para ninos, horarios flexibles)');
  }

  if (travelers.hasPets) {
    lines.push('- Viaja con mascotas: Si (solo sugerir lugares pet-friendly, considerar hospedaje que acepte mascotas)');
  }

  return lines.join('\n');
}
