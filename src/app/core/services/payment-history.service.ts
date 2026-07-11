import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentHistory } from '../models/payment-history.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentHistoryService {
  private baseUrl = '/api/PaymentHistory';

  constructor(private http: HttpClient) {}

  getMyHistory(): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/my-history`);
  }

  getPaymentById(paymentId: string): Observable<PaymentHistory> {
    return this.http.get<PaymentHistory>(`${this.baseUrl}/payment/${paymentId}`);
  }

  getHistoryByRange(startDate: string, endDate: string): Observable<PaymentHistory[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/range`, { params });
  }

  downloadReceipt(paymentId: string): Observable<Blob> {
    return this.http.get(`/api/Receipt/payment/${paymentId}`, { responseType: 'blob' });
  }
}
