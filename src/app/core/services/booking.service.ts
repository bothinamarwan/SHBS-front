import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookings = signal<Booking[]>([]);

  constructor() {
    this.loadBookings();
  }

  private loadBookings() {
    // Mock data
    const mock: Booking[] = [
      {
        id: 'B1001',
        studentId: 'S555',
        housingId: '2',
        housingTitle: 'Cozy Shared Suite',
        roomId: 'r2',
        roomName: 'Twin Room',
        moveInDate: '2026-05-15',
        duration: 3,
        totalPrice: 9600,
        status: 'confirmed',
        bookingDate: '2026-04-10',
        createdAt: '2026-04-10'
      }
    ];
    this.bookings.set(mock);
  }

  getBookings(): Observable<Booking[]> {
    return of(this.bookings()).pipe(delay(1000));
  }

  createBooking(bookingData: any): Observable<Booking> {
    const newBooking: Booking = {
      id: 'B' + Math.floor(Math.random() * 10000),
      ...bookingData,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    return of(newBooking).pipe(
      delay(2000),
      tap(b => this.bookings.update(prev => [b, ...prev]))
    );
  }
}
