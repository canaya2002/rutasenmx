// ── Types ───────────────────────────────────────────────────────────────────
export interface INEGIToken {
  token: string;
  expiresAt: number;
}

export interface INEGIDestination {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  type: string;
}

export interface INEGIRouteSegment {
  distance: number; // km
  duration: number; // minutes
  toll: number; // cents MXN
  fuelCost: number; // cents MXN
  geometry?: GeoJSON.LineString;
}

export interface INEGIRoute {
  origin: string;
  destination: string;
  totalDistance: number; // km
  totalDuration: number; // minutes
  totalToll: number; // cents MXN
  totalFuelCost: number; // cents MXN
  segments: INEGIRouteSegment[];
  geometry?: GeoJSON.LineString;
}

export interface FuelCostParams {
  distanceKm: number;
  vehicleType: 'car' | 'motorcycle' | 'campervan' | 'rv';
  fuelType: 'regular' | 'premium' | 'diesel';
  kmPerLiter?: number;
}

export interface FuelCostResult {
  liters: number;
  costCents: number; // cents MXN
  pricePerLiter: number; // MXN
}

// ── Interface ───────────────────────────────────────────────────────────────
export interface RouteProvider {
  getToken(): Promise<string>;
  searchDestination(query: string, options?: { state?: string; limit?: number }): Promise<INEGIDestination[]>;
  getOptimalRoute(origin: [number, number], destination: [number, number], waypoints?: [number, number][]): Promise<INEGIRoute>;
  getTollRoute(origin: [number, number], destination: [number, number], waypoints?: [number, number][]): Promise<INEGIRoute>;
  getFreeRoute(origin: [number, number], destination: [number, number], waypoints?: [number, number][]): Promise<INEGIRoute>;
  getFuelCost(params: FuelCostParams): Promise<FuelCostResult>;
}

// ── Default fuel assumptions ────────────────────────────────────────────────
const DEFAULT_KM_PER_LITER: Record<string, number> = {
  car: 12,
  motorcycle: 25,
  campervan: 8,
  rv: 5,
};

const APPROXIMATE_FUEL_PRICES: Record<string, number> = {
  regular: 22.5,
  premium: 24.8,
  diesel: 23.9,
};

// ── INEGI provider ──────────────────────────────────────────────────────────
const INEGI_BASE = 'https://gaia.inegi.org.mx/sakbe_v3.1';

function getApiKey(): string {
  const key = process.env.INEGI_API_KEY;
  if (!key) {
    throw new Error('INEGI_API_KEY environment variable is not set');
  }
  return key;
}

class INEGIProvider implements RouteProvider {
  private cachedToken: INEGIToken | null = null;

  async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const key = getApiKey();

    const response = await fetch(`${INEGI_BASE}/token?key=${key}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`INEGI token request failed: ${response.status}`);
    }

    const data = await response.json();
    const token = data.token ?? data.Token ?? key;

    this.cachedToken = {
      token,
      expiresAt: Date.now() + 55 * 60 * 1000, // 55 minutes
    };

    return token;
  }

  async searchDestination(
    query: string,
    options: { state?: string; limit?: number } = {},
  ): Promise<INEGIDestination[]> {
    const { limit = 10 } = options;
    const token = await this.getToken();

    const params = new URLSearchParams({
      buscar: query,
      type: 'json',
      key: token,
      num: String(limit),
    });

    if (options.state) {
      params.set('edo', options.state);
    }

    const response = await fetch(`${INEGI_BASE}/destino?${params}`);

    if (!response.ok) {
      throw new Error(`INEGI destination search failed: ${response.status}`);
    }

    const data = await response.json();
    const results = data.resultados ?? data.results ?? [];

    return results.map((r: Record<string, unknown>) => ({
      id: String(r.id_dest ?? r.id ?? ''),
      name: (r.nombre ?? r.name ?? '') as string,
      state: (r.estado ?? r.state ?? '') as string,
      lat: Number(r.lat ?? r.latitud ?? 0),
      lng: Number(r.lng ?? r.lon ?? r.longitud ?? 0),
      type: (r.tipo ?? r.type ?? 'locality') as string,
    }));
  }

  async getOptimalRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][],
  ): Promise<INEGIRoute> {
    return this.fetchRoute('optima', origin, destination, waypoints);
  }

  async getTollRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][],
  ): Promise<INEGIRoute> {
    return this.fetchRoute('cuota', origin, destination, waypoints);
  }

  async getFreeRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][],
  ): Promise<INEGIRoute> {
    return this.fetchRoute('libre', origin, destination, waypoints);
  }

  async getFuelCost(params: FuelCostParams): Promise<FuelCostResult> {
    const { distanceKm, vehicleType, fuelType, kmPerLiter } = params;

    const efficiency = kmPerLiter ?? DEFAULT_KM_PER_LITER[vehicleType] ?? 12;
    const pricePerLiter = APPROXIMATE_FUEL_PRICES[fuelType] ?? 22.5;
    const liters = distanceKm / efficiency;
    const costMxn = liters * pricePerLiter;

    return {
      liters: Math.round(liters * 100) / 100,
      costCents: Math.round(costMxn * 100),
      pricePerLiter,
    };
  }

  // ── Private ─────────────────────────────────────────────────────────────
  private async fetchRoute(
    type: 'optima' | 'cuota' | 'libre',
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][],
  ): Promise<INEGIRoute> {
    const token = await this.getToken();

    const params = new URLSearchParams({
      type: 'json',
      key: token,
      v: type,
      ori: `${origin[1]},${origin[0]}`, // INEGI expects lng,lat
      dest: `${destination[1]},${destination[0]}`,
    });

    if (waypoints && waypoints.length > 0) {
      const wpStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
      params.set('via', wpStr);
    }

    const response = await fetch(`${INEGI_BASE}/ruta?${params}`);

    if (!response.ok) {
      throw new Error(`INEGI route request failed: ${response.status}`);
    }

    const data = await response.json();
    const route = data.ruta ?? data.route ?? data;

    const segments: INEGIRouteSegment[] = (route.tramos ?? route.segments ?? []).map(
      (seg: Record<string, unknown>) => ({
        distance: Number(seg.distancia ?? seg.distance ?? 0),
        duration: Number(seg.tiempo ?? seg.duration ?? 0),
        toll: Math.round(Number(seg.peaje ?? seg.toll ?? 0) * 100),
        fuelCost: Math.round(Number(seg.combustible ?? seg.fuel ?? 0) * 100),
        geometry: seg.geometria ?? seg.geometry ?? undefined,
      }),
    );

    return {
      origin: (route.origen ?? route.origin ?? '') as string,
      destination: (route.destino ?? route.destination ?? '') as string,
      totalDistance: Number(route.distancia_total ?? route.totalDistance ?? 0),
      totalDuration: Number(route.tiempo_total ?? route.totalDuration ?? 0),
      totalToll: Math.round(Number(route.peaje_total ?? route.totalToll ?? 0) * 100),
      totalFuelCost: Math.round(Number(route.combustible_total ?? route.totalFuelCost ?? 0) * 100),
      segments,
      geometry: route.geometria ?? route.geometry ?? undefined,
    };
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────
export const inegi: RouteProvider = new INEGIProvider();
