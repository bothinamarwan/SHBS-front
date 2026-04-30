import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Housing } from '../models/housing.model';

@Injectable({
  providedIn: 'root'
})
export class HousingService {
  private mockData: Housing[] = [
    {
      id: '1',
      title: 'Premium Student Studio',
      description: 'Fully furnished high-end studio in the heart of District 5. Perfect for students who value privacy and luxury.',
      price: 5500,
      type: 'single',
      gender: 'mixed',
      area: 'District 5',
      city: 'New Cairo',
      address: '90th North St, Villa 45',
      facilities: ['WiFi', 'AC', 'Kitchen', 'Laundry', 'Security'],
      rules: ['No smoking', 'No visitors after 11 PM', 'No pets'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
      ],
      rating: 4.8,
      reviewsCount: 24,
      isAvailable: true,
      rooms: [
        { id: 'r1', name: 'Master Studio', roomType: 'single', price: 5500, beds: 1, availableBeds: 1 }
      ],
      landlordId: 'L1'
    },
    {
      id: '2',
      title: 'Cozy Shared Suite',
      description: 'Friendly shared environment in Maadi. Only two students per room. Includes all utilities.',
      price: 3200,
      type: 'shared',
      gender: 'female',
      area: 'Maadi',
      city: 'Cairo',
      address: 'Street 9, Building 12',
      facilities: ['WiFi', 'Kitchen', 'Laundry', 'AC'],
      rules: ['Female students only', 'Quiet hours after 10 PM'],
      images: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
      ],
      rating: 4.5,
      reviewsCount: 12,
      isAvailable: true,
      rooms: [
        { id: 'r2', name: 'Twin Room', roomType: 'shared', price: 3200, beds: 2, availableBeds: 1 }
      ],
      landlordId: 'L2'
    },
    {
      id: '3',
      title: 'Modern Student Hub',
      description: 'Modern building with large common areas and study rooms. Close to major universities.',
      price: 4500,
      type: 'single',
      gender: 'male',
      area: 'Zamalek',
      city: 'Cairo',
      address: '22 Brazil St',
      facilities: ['WiFi', 'Gym', 'AC', 'Laundry'],
      rules: ['Male students only', 'No loud music'],
      images: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'
      ],
      rating: 4.7,
      reviewsCount: 45,
      isAvailable: true,
      rooms: [
        { id: 'r3', name: 'Standard Single', roomType: 'single', price: 4500, beds: 1, availableBeds: 0 },
        { id: 'r4', name: 'Deluxe Single', roomType: 'single', price: 5200, beds: 1, availableBeds: 1 }
      ],
      landlordId: 'L3'
    },
    // ── 5 new entries ──────────────────────────────────────────────────────────
    {
      id: '4',
      title: 'Sunny Rooftop Apartment',
      description: 'Bright and airy top-floor flat with a stunning city view. Minutes from the metro.',
      price: 2800,
      type: 'shared',
      gender: 'mixed',
      area: 'Heliopolis',
      city: 'Cairo',
      address: '14 Al Ahram St, Floor 8',
      facilities: ['WiFi', 'AC', 'Kitchen', 'Security'],
      rules: ['No smoking indoors', 'Guest hours until midnight'],
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'
      ],
      rating: 4.3,
      reviewsCount: 18,
      isAvailable: true,
      rooms: [
        { id: 'r5', name: 'Sunny Room A', roomType: 'shared', price: 2800, beds: 2, availableBeds: 2 }
      ],
      landlordId: 'L4'
    },
    {
      id: '5',
      title: 'Elite Campus Residence',
      description: 'Premium private rooms inside a gated compound next to the German University campus.',
      price: 6200,
      type: 'single',
      gender: 'mixed',
      area: 'South Academy',
      city: 'New Cairo',
      address: 'GUC Compound, Gate 3',
      facilities: ['WiFi', 'Gym', 'AC', 'Laundry', 'Kitchen', 'Security'],
      rules: ['No smoking', 'ID required for guests', 'No pets'],
      images: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
      ],
      rating: 4.9,
      reviewsCount: 67,
      isAvailable: true,
      rooms: [
        { id: 'r6', name: 'Elite Suite', roomType: 'single', price: 6200, beds: 1, availableBeds: 1 }
      ],
      landlordId: 'L5'
    },
    {
      id: '6',
      title: 'Budget-Friendly Dorm',
      description: 'Affordable shared rooms ideal for first-year students. Lively community atmosphere.',
      price: 1800,
      type: 'shared',
      gender: 'male',
      area: 'Agouza',
      city: 'Giza',
      address: '7 Sudan St, Apt 4',
      facilities: ['WiFi', 'Kitchen', 'Laundry'],
      rules: ['Male students only', 'Curfew at midnight'],
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        'https://images.unsplash.com/photo-1551361415-69c87624334f?w=800'
      ],
      rating: 4.1,
      reviewsCount: 31,
      isAvailable: true,
      rooms: [
        { id: 'r7', name: 'Quad Room', roomType: 'shared', price: 1800, beds: 4, availableBeds: 2 }
      ],
      landlordId: 'L6'
    },
    {
      id: '7',
      title: 'Luxury Girls\' Residence',
      description: 'Fully serviced boutique residence exclusively for female students with 24/7 security.',
      price: 5000,
      type: 'single',
      gender: 'female',
      area: 'Mohandessin',
      city: 'Giza',
      address: '33 Gamaet Al Dowal St',
      facilities: ['WiFi', 'AC', 'Gym', 'Kitchen', 'Laundry', 'Security'],
      rules: ['Female students only', 'No male visitors', 'No smoking'],
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
      ],
      rating: 4.6,
      reviewsCount: 53,
      isAvailable: true,
      rooms: [
        { id: 'r8', name: 'Private Suite', roomType: 'single', price: 5000, beds: 1, availableBeds: 1 }
      ],
      landlordId: 'L7'
    },
    {
      id: '8',
      title: 'Alexandria Beachside Flat',
      description: 'Sea-view shared apartment steps from Alexandria University. Refreshing and affordable.',
      price: 2500,
      type: 'shared',
      gender: 'mixed',
      area: 'Sidi Bishr',
      city: 'Alexandria',
      address: '5 Corniche Rd, Apt 201',
      facilities: ['WiFi', 'AC', 'Kitchen', 'Security'],
      rules: ['No smoking on balcony', 'Quiet after 11 PM'],
      images: [
        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      rating: 4.4,
      reviewsCount: 29,
      isAvailable: true,
      rooms: [
        { id: 'r9', name: 'Sea-View Room', roomType: 'shared', price: 2500, beds: 2, availableBeds: 1 }
      ],
      landlordId: 'L8'
    }
  ];

  constructor() {}

  getHousings(filters?: any): Observable<Housing[]> {
    let results = [...this.mockData];

    if (filters) {
      if (filters.city) results = results.filter(h => h.city === filters.city);
      if (filters.type) results = results.filter(h => h.type === filters.type);
      if (filters.gender && filters.gender !== 'mixed') {
        results = results.filter(h => h.gender === filters.gender || h.gender === 'mixed');
      }
      if (filters.minPrice) results = results.filter(h => h.price >= filters.minPrice);
      if (filters.maxPrice) results = results.filter(h => h.price <= filters.maxPrice);

      if (filters.facilities && filters.facilities.length > 0) {
        results = results.filter(h =>
          filters.facilities.every((f: string) => h.facilities.includes(f))
        );
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter(h =>
          h.title.toLowerCase().includes(query) ||
          h.area.toLowerCase().includes(query) ||
          h.city.toLowerCase().includes(query)
        );
      }

      // Sorting
      switch (filters.sortBy) {
        case 'price-asc':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'top-rated':
          results.sort((a, b) => b.rating - a.rating);
          break;
        default: // 'recommended' — keep original order
          break;
      }
    }

    return of(results).pipe(delay(700));
  }

  getHousingById(id: string): Observable<Housing | undefined> {
    const housing = this.mockData.find(h => h.id === id);
    return of(housing).pipe(delay(800));
  }
}
