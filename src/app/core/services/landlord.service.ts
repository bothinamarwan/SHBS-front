import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Landlord } from '../models/landlord.model';

@Injectable({
  providedIn: 'root'
})
export class LandlordService {
  private baseUrl = '/api/v1/Landlord';

  constructor(private http: HttpClient) {}

  // --- Housing Management ---

  addHousing(housingData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/housing`, housingData);
  }

  editHousing(housingId: string | number, housingData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/housing/${housingId}`, housingData);
  }

  deleteHousing(housingId: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/housing/${housingId}`);
  }

  manageAvailability(housingId: string | number, availabilityData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/housing/${housingId}/availability`, availabilityData);
  }

  // --- Booking Management ---

  approveBooking(bookingId: string | number): Observable<any> {
    return this.http.post(`${this.baseUrl}/booking/${bookingId}/approve`, {});
  }

  rejectBooking(bookingId: string | number): Observable<any> {
    return this.http.post(`${this.baseUrl}/booking/${bookingId}/reject`, {});
  }
}
