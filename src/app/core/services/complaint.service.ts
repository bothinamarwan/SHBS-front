import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Complaint, CreateComplaintRequest, UpdateComplaintRequest } from '../models/complaint.model';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private baseUrl = '/api/Complaint';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Complaint[]> {
    return this.http.get<{ success: boolean; data: Complaint[] }>(`${this.baseUrl}`).pipe(
      map(response => response.data)
    );
  }

  getById(complaintId: string): Observable<Complaint> {
    return this.http.get<{ success: boolean; data: Complaint }>(`${this.baseUrl}/${complaintId}`).pipe(
      map(response => response.data)
    );
  }

  getByHousingUnit(housingUnitId: string): Observable<Complaint[]> {
    return this.http.get<{ success: boolean; data: Complaint[] }>(`${this.baseUrl}/housing-unit/${housingUnitId}`).pipe(
      map(response => response.data)
    );
  }

  create(request: CreateComplaintRequest): Observable<Complaint> {
    return this.http.post<{ success: boolean; data: Complaint }>(`${this.baseUrl}`, request).pipe(
      map(response => response.data)
    );
  }

  update(request: UpdateComplaintRequest): Observable<Complaint> {
    return this.http.put<{ success: boolean; data: Complaint }>(`${this.baseUrl}/${request.complaintId}`, request).pipe(
      map(response => response.data)
    );
  }

  delete(complaintId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${complaintId}`);
  }

  // Admin methods
  getAdminComplaints(params?: {
    studentId?: string;
    housingUnitId?: string;
    status?: number;
    createdDateFrom?: string;
    createdDateTo?: string;
    pageIndex?: number;
    pageSize?: number;
  }): Observable<{ pageSize: number; pageIndex: number; totalRecords: number; records: Complaint[] }> {
    return this.http.get<{ pageSize: number; pageIndex: number; totalRecords: number; records: Complaint[] }>('/api/Admin/complaints', { params });
  }
}
