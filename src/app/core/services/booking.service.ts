import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl = '/api/Booking';

  constructor(private http: HttpClient) {}

  getBookings(): Observable<Booking[]> {
    // Attempting MyBookings. If the API doesn't have it, it might need to be switched to GetAll with filters later.
    return this.http.get<Booking[]>(`${this.baseUrl}/MyBookings`);
  }

  getById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/GetById/${id}`);
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll`);
  }

  create(bookingData: any): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/Create`, bookingData);
  }

  multiRoom(bookingData: any): Observable<Booking[]> {
    return this.http.post<Booking[]>(`${this.baseUrl}/MultiRoom`, bookingData);
  }

  update(bookingData: any): Observable<Booking> {
    return this.http.put<Booking>(`${this.baseUrl}/Update`, bookingData);
  }

  cancel(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Cancel/${id}`);
  }
}
