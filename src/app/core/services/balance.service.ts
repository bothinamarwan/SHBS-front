import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Balance, UserBalanceResponse } from '../models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private baseUrl = '/api/Balance';

  constructor(private http: HttpClient) {}

  getMyBalance(): Observable<UserBalanceResponse> {
    return this.http.get<UserBalanceResponse>(`${this.baseUrl}/me`);
  }

  getUserBalance(userId: string): Observable<UserBalanceResponse> {
    return this.http.get<UserBalanceResponse>(`${this.baseUrl}/user/${userId}`);
  }
}
