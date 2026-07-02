import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InitiatePaymentRequest, PaymentCallbackRequest, InitiatePaymentResponse } from '../models/booking-payment.model';

@Injectable({
  providedIn: 'root'
})
export class BookingPaymentService {
  private baseUrl = '/api/BookingPayment';

  constructor(private http: HttpClient) {}

  initiate(req: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.http.post<InitiatePaymentResponse>(`${this.baseUrl}/initiate`, req);
  }

  callback(req: PaymentCallbackRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/callback`, req);
  }

  complete(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/complete/${paymentId}`, {});
  }
}
