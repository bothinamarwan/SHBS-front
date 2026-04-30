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
