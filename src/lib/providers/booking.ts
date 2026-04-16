// ── Types ───────────────────────────────────────────────────────────────────
export interface BookingStay {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  pricePerNightCents: number;
  currency: string;
  thumbnailUrl: string;
  photoUrls: string[];
  amenities: string[];
  propertyType: string;
  url: string;
}

export interface BookingAvailability {
  stayId: string;
  available: boolean;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  rooms: BookingRoom[];
  totalPriceCents: number;
  currency: string;
}

export interface BookingRoom {
  id: string;
  name: string;
  maxOccupancy: number;
  priceCents: number;
  refundable: boolean;
  breakfastIncluded: boolean;
}

export interface StaySearchParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  adults?: number;
  children?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];
  limit?: number;
  offset?: number;
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity';
}

// ── Interface ───────────────────────────────────────────────────────────────
export interface BookingProvider {
  searchStays(params: StaySearchParams): Promise<{ stays: BookingStay[]; total: number }>;
  getStayDetails(stayId: string): Promise<BookingStay | null>;
  getAvailability(stayId: string, checkIn: string, checkOut: string, adults?: number): Promise<BookingAvailability | null>;
}

// ── Booking.com Rapid API adapter ───────────────────────────────────────────
const BOOKING_API_BASE = 'https://booking-com15.p.rapidapi.com/api/v1';

function getBookingApiKey(): string | null {
  return process.env.BOOKING_RAPID_API_KEY ?? null;
}

function getBookingApiHost(): string {
  return process.env.BOOKING_RAPID_API_HOST ?? 'booking-com15.p.rapidapi.com';
}

class BookingAdapter implements BookingProvider {
  private useMock: boolean;

  constructor() {
    this.useMock = !getBookingApiKey();
    if (this.useMock && process.env.NODE_ENV === 'development') {
      console.warn('[BookingAdapter] No BOOKING_RAPID_API_KEY set -- using mock data');
    }
  }

  async searchStays(params: StaySearchParams): Promise<{ stays: BookingStay[]; total: number }> {
    if (this.useMock) {
      return this.mockSearchStays(params);
    }

    const {
      lat,
      lng,
      checkIn,
      checkOut,
      adults = 2,
      rooms = 1,
      limit = 20,
      offset = 0,
      sortBy = 'popularity',
    } = params;

    const queryParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      arrival_date: checkIn,
      departure_date: checkOut,
      adults: String(adults),
      room_qty: String(rooms),
      page_number: String(Math.floor(offset / limit) + 1),
      units: 'metric',
      temperature_unit: 'c',
      languagecode: 'es',
      currency_code: 'MXN',
      sort_by: sortBy,
    });

    if (params.children) queryParams.set('children_qty', String(params.children));
    if (params.minPrice) queryParams.set('price_min', String(params.minPrice));
    if (params.maxPrice) queryParams.set('price_max', String(params.maxPrice));

    const response = await fetch(
      `${BOOKING_API_BASE}/hotels/searchHotels?${queryParams}`,
      {
        headers: {
          'X-RapidAPI-Key': getBookingApiKey()!,
          'X-RapidAPI-Host': getBookingApiHost(),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Booking API search failed: ${response.status}`);
    }

    const data = await response.json();
    const hotels = data.data?.hotels ?? [];

    const stays: BookingStay[] = hotels.map((h: Record<string, unknown>) =>
      this.mapHotelToStay(h),
    );

    return {
      stays,
      total: (data.data?.meta?.total as number) ?? stays.length,
    };
  }

  async getStayDetails(stayId: string): Promise<BookingStay | null> {
    if (this.useMock) {
      return this.mockStayDetails(stayId);
    }

    const params = new URLSearchParams({
      hotel_id: stayId,
      languagecode: 'es',
      currency_code: 'MXN',
    });

    const response = await fetch(
      `${BOOKING_API_BASE}/hotels/getHotelDetails?${params}`,
      {
        headers: {
          'X-RapidAPI-Key': getBookingApiKey()!,
          'X-RapidAPI-Host': getBookingApiHost(),
        },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data) return null;

    return this.mapHotelToStay(data.data);
  }

  async getAvailability(
    stayId: string,
    checkIn: string,
    checkOut: string,
    adults = 2,
  ): Promise<BookingAvailability | null> {
    if (this.useMock) {
      return this.mockAvailability(stayId, checkIn, checkOut);
    }

    const params = new URLSearchParams({
      hotel_id: stayId,
      arrival_date: checkIn,
      departure_date: checkOut,
      adults: String(adults),
      languagecode: 'es',
      currency_code: 'MXN',
    });

    const response = await fetch(
      `${BOOKING_API_BASE}/hotels/getAvailability?${params}`,
      {
        headers: {
          'X-RapidAPI-Key': getBookingApiKey()!,
          'X-RapidAPI-Host': getBookingApiHost(),
        },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const rooms: BookingRoom[] = (data.data?.rooms ?? []).map(
      (r: Record<string, unknown>) => ({
        id: String(r.id ?? ''),
        name: (r.name as string) ?? '',
        maxOccupancy: Number(r.max_occupancy ?? adults),
        priceCents: Math.round(Number(r.price ?? 0) * 100),
        refundable: Boolean(r.is_refundable ?? false),
        breakfastIncluded: Boolean(r.breakfast_included ?? false),
      }),
    );

    return {
      stayId,
      available: rooms.length > 0,
      checkIn,
      checkOut,
      rooms,
      totalPriceCents: rooms.reduce((sum, r) => sum + r.priceCents, 0),
      currency: 'MXN',
    };
  }

  // ── Mapping helpers ─────────────────────────────────────────────────────
  private mapHotelToStay(h: Record<string, unknown>): BookingStay {
    const prop = h.property as Record<string, unknown> | undefined;
    const target = prop ?? h;

    return {
      id: String(target.id ?? h.hotel_id ?? ''),
      name: (target.name as string) ?? '',
      slug: ((target.name as string) ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      address: (target.address as string) ?? '',
      city: (target.city as string) ?? '',
      state: (target.state as string) ?? '',
      lat: Number(target.latitude ?? target.lat ?? 0),
      lng: Number(target.longitude ?? target.lng ?? 0),
      starRating: Number(target.star_rating ?? target.class ?? 0),
      reviewScore: Number(target.review_score ?? (target.reviewScore as number) ?? 0),
      reviewCount: Number(target.review_count ?? (target.reviewCount as number) ?? 0),
      pricePerNightCents: Math.round(Number(target.price ?? target.min_price ?? 0) * 100),
      currency: (target.currency as string) ?? 'MXN',
      thumbnailUrl: (target.main_photo ?? target.photo_url ?? '') as string,
      photoUrls: (target.photos as string[]) ?? [],
      amenities: (target.amenities as string[]) ?? [],
      propertyType: (target.property_type ?? target.accommodation_type ?? 'hotel') as string,
      url: (target.url as string) ?? '',
    };
  }

  // ── Mock data for development ─────────────────────────────────────────
  private mockSearchStays(params: StaySearchParams): { stays: BookingStay[]; total: number } {
    const mockStay: BookingStay = {
      id: 'mock-1',
      name: 'Hotel Mock Centro Histórico',
      slug: 'hotel-mock-centro-historico',
      address: 'Calle 5 de Mayo 42, Centro',
      city: 'Ciudad de México',
      state: 'CDMX',
      lat: params.lat + 0.002,
      lng: params.lng - 0.001,
      starRating: 4,
      reviewScore: 8.7,
      reviewCount: 342,
      pricePerNightCents: 185000,
      currency: 'MXN',
      thumbnailUrl: '/images/placeholder-hotel.jpg',
      photoUrls: [],
      amenities: ['wifi', 'estacionamiento', 'restaurante', 'bar'],
      propertyType: 'hotel',
      url: '#',
    };

    return { stays: [mockStay], total: 1 };
  }

  private mockStayDetails(stayId: string): BookingStay {
    return {
      id: stayId,
      name: 'Hotel Mock (detalles)',
      slug: 'hotel-mock-detalles',
      address: 'Av. Reforma 500',
      city: 'Ciudad de México',
      state: 'CDMX',
      lat: 19.4326,
      lng: -99.1332,
      starRating: 4,
      reviewScore: 8.5,
      reviewCount: 200,
      pricePerNightCents: 200000,
      currency: 'MXN',
      thumbnailUrl: '/images/placeholder-hotel.jpg',
      photoUrls: [],
      amenities: ['wifi', 'alberca', 'gimnasio'],
      propertyType: 'hotel',
      url: '#',
    };
  }

  private mockAvailability(
    stayId: string,
    checkIn: string,
    checkOut: string,
  ): BookingAvailability {
    return {
      stayId,
      available: true,
      checkIn,
      checkOut,
      rooms: [
        {
          id: 'room-1',
          name: 'Habitación Doble Estándar',
          maxOccupancy: 2,
          priceCents: 185000,
          refundable: true,
          breakfastIncluded: true,
        },
      ],
      totalPriceCents: 185000,
      currency: 'MXN',
    };
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────
export const booking: BookingProvider = new BookingAdapter();
