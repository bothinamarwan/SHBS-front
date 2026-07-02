// ──────────────────────────────────────────────────────────────────────────────
// API Response Models  (match /api/HousingUnit/* shape)
// ──────────────────────────────────────────────────────────────────────────────

/** Gender enum values returned / sent by the API */
export enum GenderAllowed {
  Mixed = 0,
  Male = 1,
  Female = 2
}

/** Lightweight list item returned by GET /api/HousingUnit/GetAll */
export interface HousingUnit {
  housingUnitId: string;
  landLordId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  area: string;
  price: number;
  baseMonthlyPrice: number;
  unitImageUrl: string;
  videoUrl: string;
  genderAllowed: GenderAllowed;
  rules: string;
  location: string;
  latitude: number;
  longitude: number;
  numberOfRooms: number;
  isAvailable: boolean;
}

/** Detailed item returned by GET /api/HousingUnit/GetDetailsById/{id} */
export type HousingUnitDetails = HousingUnit;

/** Map pin returned by GET /api/HousingUnit/map-pins */
export interface MapPin {
  housingUnitId: string;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  baseMonthlyPrice: number;
  isAvailable: boolean;
  unitImageUrl: string;
  city: string;
  area: string;
}

/** POST /api/HousingUnit/Create request body */
export interface CreateHousingUnitRequest {
  landLordId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  area: string;
  price: number;
  baseMonthlyPrice: number;
  unitImageUrl: string;
  videoUrl: string;
  genderAllowed: GenderAllowed;
  rules: string;
  location: string;
  latitude: number;
  longitude: number;
  numberOfRooms: number;
  isAvailable: boolean;
}

/** PUT /api/HousingUnit/Update request body */
export interface UpdateHousingUnitRequest {
  housingUnitId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  area: string;
  price: number;
  baseMonthlyPrice: number;
  unitImageUrl: string;
  videoUrl: string;
  genderAllowed: GenderAllowed;
  rules: string;
  location: string;
  latitude: number;
  longitude: number;
  numberOfRooms: number;
  isAvailable: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Legacy / internal models (kept for backward compatibility with other pages)
// ──────────────────────────────────────────────────────────────────────────────

export interface Housing {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'single' | 'shared';
  gender: 'male' | 'female' | 'mixed';
  area: string;
  city: string;
  address?: string;
  facilities: string[];
  rules?: string[];
  images: string[];
  rating: number;
  reviewsCount: number;
  isAvailable: boolean;
  rooms: Room[];
  landlordId?: string;
}

export interface Room {
  id: string;
  name: string;
  roomType: 'single' | 'shared';
  price: number;
  beds: number;
  capacity?: number;
  availableBeds: number;
  availabilityStatus?: 'available' | 'full' | 'maintenance';
}

/** Helper: convert API GenderAllowed enum to display string */
export function genderLabel(g: GenderAllowed): string {
  switch (g) {
    case GenderAllowed.Male:   return 'male';
    case GenderAllowed.Female: return 'female';
    default:                   return 'mixed';
  }
}
