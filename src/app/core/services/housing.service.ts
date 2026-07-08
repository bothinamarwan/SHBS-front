import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  HousingUnit,
  HousingUnitDetails,
  MapPin,
  CreateHousingUnitRequest,
  UpdateHousingUnitRequest,
} from '../models/housing.model';

@Injectable({
  providedIn: 'root'
})
export class HousingService {
  private baseUrl = '/api/HousingUnit';

  constructor(private http: HttpClient) {}

  /** GET /api/HousingUnit/GetAll */
  getAll(): Observable<HousingUnit[]> {
    return this.http.get<any>(`${this.baseUrl}/GetAll`, {
      params: { pageSize: 1000, pageIndex: 0 }
    }).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        return res?.records || [];
      })
    );
  }

  /** GET /api/HousingUnit/GetById/{id} */
  getById(id: string): Observable<HousingUnit> {
    return this.http.get<HousingUnit>(`${this.baseUrl}/GetById/${id}`);
  }

  /** GET /api/HousingUnit/GetDetailsById/{id} */
  getDetailsById(id: string): Observable<HousingUnitDetails> {
    return this.http.get<HousingUnitDetails>(`${this.baseUrl}/GetDetailsById/${id}`);
  }

  /** GET /api/HousingUnit/map-pins */
  getMapPins(): Observable<MapPin[]> {
    return this.http.get<MapPin[]>(`${this.baseUrl}/map-pins`);
  }

  /** POST /api/HousingUnit/Create */
  create(request: CreateHousingUnitRequest): Observable<HousingUnit> {
    return this.http.post<HousingUnit>(`${this.baseUrl}/Create`, request);
  }

  /** PUT /api/HousingUnit/Update */
  update(request: UpdateHousingUnitRequest): Observable<HousingUnit> {
    return this.http.put<HousingUnit>(`${this.baseUrl}/Update`, request);
  }

  /** DELETE /api/HousingUnit/Delete/{id} */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }

  // ── Legacy shims (kept so existing callers that haven't been updated yet
  //   don't break at compile time) ────────────────────────────────────────────

  /** @deprecated Use getAll() */
  getHousings(filters?: any): Observable<HousingUnit[]> {
    return this.getAll();
  }

  /** @deprecated Use getById() */
  getHousingById(id: string): Observable<HousingUnit> {
    return this.getById(id);
  }
}
