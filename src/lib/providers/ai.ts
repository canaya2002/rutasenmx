// ── Types ───────────────────────────────────────────────────────────────────
export interface TripGenerationInput {
  origin: { name: string; lat: number; lng: number };
  destination?: { name: string; lat: number; lng: number };
  days: number;
  budget: 'economico' | 'moderado' | 'premium' | 'lujo';
  travelerType: string;
  interests: string[];
  avoidTolls?: boolean;
  vehicleType?: string;
  specialRequirements?: string;
}

export interface GeneratedItinerary {
  title: string;
  summary: string;
  days: GeneratedDay[];
  tips: string[];
  estimatedBudget: {
    accommodationCents: number;
    foodCents: number;
    activitiesCents: number;
    transportCents: number;
    totalCents: number;
  };
  tags: string[];
}

export interface GeneratedDay {
  dayNumber: number;
  title: string;
  summary: string;
  stops: GeneratedStop[];
  overnightCity: string;
}

export interface GeneratedStop {
  name: string;
  description: string;
  category: string;
  lat?: number;
  lng?: number;
  estimatedTimeMinutes: number;
  suggestedTimeOfDay: 'morning' | 'afternoon' | 'evening';
  costEstimateCents?: number;
  tips?: string;
}

export interface ItineraryRefinement {
  instruction: string;
  currentItinerary: GeneratedItinerary;
}

export interface DescriptionInput {
  placeName: string;
  placeCategory: string;
  state: string;
  context?: string;
  maxLength?: number;
}

// ── Interface ───────────────────────────────────────────────────────────────
export interface AIProvider {
  generateItinerary(input: TripGenerationInput): Promise<GeneratedItinerary>;
  refineItinerary(refinement: ItineraryRefinement): Promise<GeneratedItinerary>;
  generateDescription(input: DescriptionInput): Promise<string>;
}

// ── System prompts ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT_ITINERARY = `Eres un experto en turismo por carretera en México. Generas itinerarios detallados, prácticos y seguros.

Reglas:
- Responde SIEMPRE en español de México.
- Incluye Pueblos Mágicos, zonas arqueológicas, comida regional y paradas útiles.
- Calcula tiempos de manejo realistas (no más de 5-6 horas por día).
- Incluye tips de seguridad vial cuando aplique.
- Sugiere opciones de hospedaje acorde al presupuesto.
- Responde SOLO con JSON válido, sin markdown ni explicaciones extra.`;

const SYSTEM_PROMPT_DESCRIPTION = `Eres un redactor de contenido turístico para México. Escribes descripciones atractivas, informativas y concisas en español de México. No uses lenguaje exagerado ni clichés. Sé preciso y útil.`;

// ── Claude provider ─────────────────────────────────────────────────────────
class ClaudeProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    this.apiKey = key;
    this.model = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001';
    this.baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  }

  async generateItinerary(input: TripGenerationInput): Promise<GeneratedItinerary> {
    const userPrompt = this.buildItineraryPrompt(input);

    const body = {
      model: this.model,
      max_tokens: 3000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT_ITINERARY,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    };

    const raw = await this.callApi(body);
    return this.parseItinerary(raw);
  }

  async refineItinerary(refinement: ItineraryRefinement): Promise<GeneratedItinerary> {
    const body = {
      model: this.model,
      max_tokens: 3000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT_ITINERARY,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Itinerario actual:\n${JSON.stringify(refinement.currentItinerary, null, 2)}`,
        },
        {
          role: 'assistant',
          content: 'Entendido. Tengo el itinerario actual. ¿Qué cambios deseas?',
        },
        {
          role: 'user',
          content: `Instrucción de cambio: ${refinement.instruction}\n\nDevuelve el itinerario completo actualizado en formato JSON.`,
        },
      ],
    };

    const raw = await this.callApi(body);
    return this.parseItinerary(raw);
  }

  async generateDescription(input: DescriptionInput): Promise<string> {
    const { placeName, placeCategory, state, context, maxLength = 300 } = input;

    const body = {
      model: this.model,
      max_tokens: 400,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT_DESCRIPTION,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Escribe una descripción de máximo ${maxLength} caracteres para:
Lugar: ${placeName}
Categoría: ${placeCategory}
Estado: ${state}
${context ? `Contexto adicional: ${context}` : ''}

Devuelve SOLO el texto de la descripción, sin comillas ni formato extra.`,
        },
      ],
    };

    const raw = await this.callApi(body);
    return raw.trim();
  }

  // ── Private ─────────────────────────────────────────────────────────────
  private buildItineraryPrompt(input: TripGenerationInput): string {
    const parts = [
      `Genera un itinerario de viaje por carretera en México.`,
      `Origen: ${input.origin.name} (${input.origin.lat}, ${input.origin.lng})`,
    ];

    if (input.destination) {
      parts.push(`Destino: ${input.destination.name} (${input.destination.lat}, ${input.destination.lng})`);
    }

    parts.push(
      `Duración: ${input.days} días`,
      `Presupuesto: ${input.budget}`,
      `Tipo de viajero: ${input.travelerType}`,
      `Intereses: ${input.interests.join(', ')}`,
    );

    if (input.avoidTolls) parts.push('Evitar casetas de peaje');
    if (input.vehicleType) parts.push(`Vehículo: ${input.vehicleType}`);
    if (input.specialRequirements) parts.push(`Requisitos especiales: ${input.specialRequirements}`);

    parts.push(
      '',
      'Responde con un objeto JSON que siga esta estructura exacta:',
      '{ "title": string, "summary": string, "days": [{ "dayNumber": number, "title": string, "summary": string, "stops": [{ "name": string, "description": string, "category": string, "lat": number, "lng": number, "estimatedTimeMinutes": number, "suggestedTimeOfDay": "morning"|"afternoon"|"evening", "costEstimateCents": number, "tips": string }], "overnightCity": string }], "tips": [string], "estimatedBudget": { "accommodationCents": number, "foodCents": number, "activitiesCents": number, "transportCents": number, "totalCents": number }, "tags": [string] }',
    );

    return parts.join('\n');
  }

  private async callApi(body: Record<string, unknown>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0];

    if (!content || content.type !== 'text') {
      throw new Error('Unexpected Anthropic API response format');
    }

    return content.text;
  }

  private parseItinerary(raw: string): GeneratedItinerary {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return parsed as GeneratedItinerary;
    } catch {
      throw new Error(`Failed to parse AI itinerary response: ${raw.slice(0, 200)}`);
    }
  }
}

// ── OpenAI provider (alternative) ───────────────────────────────────────────
class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.apiKey = key;
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o';
    this.baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com';
  }

  async generateItinerary(input: TripGenerationInput): Promise<GeneratedItinerary> {
    const userPrompt = this.buildItineraryPrompt(input);
    const raw = await this.callApi(SYSTEM_PROMPT_ITINERARY, userPrompt);
    return this.parseItinerary(raw);
  }

  async refineItinerary(refinement: ItineraryRefinement): Promise<GeneratedItinerary> {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT_ITINERARY },
      {
        role: 'user' as const,
        content: `Itinerario actual:\n${JSON.stringify(refinement.currentItinerary, null, 2)}`,
      },
      {
        role: 'assistant' as const,
        content: 'Entendido. Tengo el itinerario actual. ¿Qué cambios deseas?',
      },
      {
        role: 'user' as const,
        content: `Instrucción de cambio: ${refinement.instruction}\n\nDevuelve el itinerario completo actualizado en formato JSON.`,
      },
    ];

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    return this.parseItinerary(raw);
  }

  async generateDescription(input: DescriptionInput): Promise<string> {
    const { placeName, placeCategory, state, context, maxLength = 300 } = input;
    const prompt = `Escribe una descripción de máximo ${maxLength} caracteres para:\nLugar: ${placeName}\nCategoría: ${placeCategory}\nEstado: ${state}\n${context ? `Contexto: ${context}` : ''}\n\nDevuelve SOLO el texto.`;

    return (await this.callApi(SYSTEM_PROMPT_DESCRIPTION, prompt)).trim();
  }

  // ── Private ─────────────────────────────────────────────────────────────
  private buildItineraryPrompt(input: TripGenerationInput): string {
    const parts = [
      `Genera un itinerario de viaje por carretera en México.`,
      `Origen: ${input.origin.name} (${input.origin.lat}, ${input.origin.lng})`,
    ];

    if (input.destination) {
      parts.push(`Destino: ${input.destination.name} (${input.destination.lat}, ${input.destination.lng})`);
    }

    parts.push(
      `Duración: ${input.days} días`,
      `Presupuesto: ${input.budget}`,
      `Tipo de viajero: ${input.travelerType}`,
      `Intereses: ${input.interests.join(', ')}`,
    );

    if (input.avoidTolls) parts.push('Evitar casetas de peaje');
    if (input.vehicleType) parts.push(`Vehículo: ${input.vehicleType}`);
    if (input.specialRequirements) parts.push(`Requisitos especiales: ${input.specialRequirements}`);

    parts.push('\nResponde con JSON válido siguiendo el schema GeneratedItinerary.');

    return parts.join('\n');
  }

  private async callApi(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  private parseItinerary(raw: string): GeneratedItinerary {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      return JSON.parse(cleaned) as GeneratedItinerary;
    } catch {
      throw new Error(`Failed to parse AI itinerary response: ${raw.slice(0, 200)}`);
    }
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────
export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'claude';

  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'claude':
    default:
      return new ClaudeProvider();
  }
}

// ── Default singleton ───────────────────────────────────────────────────────
let _ai: AIProvider | null = null;

export function getAI(): AIProvider {
  if (!_ai) {
    _ai = createAIProvider();
  }
  return _ai;
}
