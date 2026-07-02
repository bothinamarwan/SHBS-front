import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Landlord, CreateLandlordRequest, UpdateLandlordRequest, ChangePasswordRequest } from '../models/landlord.model';

@Injectable({
  providedIn: 'root'
})
export class LandlordService {
  // Base URL matching the provided endpoints
  private baseUrl = '/api/LandLord';
  // Keep original base URL for any existing endpoints if needed, but we'll use the new one for the new endpoints
  private legacyBaseUrl = '/api/v1/Landlord';

  constructor(private http: HttpClient) {}

  // --- Profile & Account Management ---

  getById(id: string): Observable<Landlord> {
    return this.http.get<Landlord>(`${this.baseUrl}/GetById/${id}`);
  }

  getByUserId(userId: string): Observable<Landlord> {
    return this.http.get<Landlord>(`${this.baseUrl}/GetByUserId/${userId}`);
  }

  getAll(): Observable<Landlord[]> {
    return this.http.get<Landlord[]>(`${this.baseUrl}/GetAll`);
  }

  create(data: CreateLandlordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/Create`, data);
  }

  update(data: UpdateLandlordRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/Update`, data); // Assuming PUT for update
  }

  changePassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/ChangePassword`, data);
  }

  uploadNationalId(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/UploadNationalId`, formData);
  }

  uploadUnitDocumentation(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/UploadUnitDocumentation`, formData);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Delete/${id}`);
  }

  deactivate(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/Deactivate/${id}`, {});
  }

  reactivate(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/Reactivate/${id}`, {});
  }

  getAccountStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/account-status`);
  }

  // --- Bookings & Housing Management ---

  getMyBookings(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/MyBookings`).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        return res?.records || [];
      })
    );
  }

  // (Legacy / Existing Endpoints)
  addHousing(housingData: any): Observable<any> {
    return this.http.post(`${this.legacyBaseUrl}/housing`, housingData);
  }

  editHousing(housingId: string | number, housingData: any): Observable<any> {
    return this.http.put(`${this.legacyBaseUrl}/housing/${housingId}`, housingData);
  }

  deleteHousing(housingId: string | number): Observable<any> {
    return this.http.delete(`${this.legacyBaseUrl}/housing/${housingId}`);
  }

  manageAvailability(housingId: string | number, availabilityData: any): Observable<any> {
    return this.http.post(`${this.legacyBaseUrl}/housing/${housingId}/availability`, availabilityData);
  }

  approveBooking(bookingId: string | number): Observable<any> {
    return this.http.post(`${this.legacyBaseUrl}/booking/${bookingId}/approve`, {});
  }

  rejectBooking(bookingId: string | number): Observable<any> {
    return this.http.post(`${this.legacyBaseUrl}/booking/${bookingId}/reject`, {});
  }
}
