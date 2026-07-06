import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room, CreateRoomRequest, UpdateRoomRequest } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private baseUrl = '/api/Room';

  constructor(private http: HttpClient) {}

  getAllRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/GetAll`);
  }

  getRoomById(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.baseUrl}/GetById/${id}`);
  }

  getRoomsByHousingUnit(housingUnitId: string): Observable<Room[]> {
    const params = new HttpParams().set('housingUnitId', housingUnitId);
    return this.http.get<Room[]>(`${this.baseUrl}/GetAll`, { params });
  }

  createRoom(request: CreateRoomRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/Create`, request);
  }

  updateRoom(request: UpdateRoomRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/Update`, request);
  }

  deleteRoom(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Delete/${id}`);
  }
}
