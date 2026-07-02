import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bed, PaginatedBedResponse, CreateBedRequest, UpdateBedRequest } from '../models/bed.model';

@Injectable({
  providedIn: 'root'
})
export class BedService {
  private http = inject(HttpClient);
  private baseUrl = '/api/Bed';

  getBedById(bedId: string): Observable<Bed> {
    return this.http.get<Bed>(`${this.baseUrl}/GetById/${bedId}`);
  }

  getAllBeds(pageIndex: number = 0, pageSize: number = 10): Observable<PaginatedBedResponse> {
    const params = new HttpParams()
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedBedResponse>(`${this.baseUrl}/GetAll`, { params });
  }

  getBedsByRoom(roomId: string): Observable<Bed[]> {
    return this.http.get<Bed[]>(`${this.baseUrl}/GetByRoom/${roomId}`);
  }

  createBed(data: CreateBedRequest): Observable<Bed> {
    return this.http.post<Bed>(`${this.baseUrl}/Create`, data);
  }

  updateBed(data: UpdateBedRequest): Observable<Bed> {
    return this.http.put<Bed>(`${this.baseUrl}/Update`, data);
  }

  deleteBed(bedId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${bedId}`);
  }
}
