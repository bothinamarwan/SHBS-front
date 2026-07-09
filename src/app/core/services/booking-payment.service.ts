import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InitiatePaymentRequest, PaymentCallbackRequest, BookingPaymentResponse } from '../models/booking-payment.model';

@Injectable({
  providedIn: 'root'
})
export class BookingPaymentService {
  private baseUrl = '/api/BookingPayment';

  constructor(private http: HttpClient) {}

  initiate(req: InitiatePaymentRequest): Observable<BookingPaymentResponse> {
    return this.http.post<BookingPaymentResponse>(`${this.baseUrl}/initiate`, req);
  }

  callback(req: PaymentCallbackRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/callback`, req);
  }

  getCallback(): Observable<any> {
    return this.http.get(`${this.baseUrl}/callback`);
  }

  complete(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/complete/${paymentId}`, {});
  }

  confirm(order: string, id: string, success: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/confirm?order=${order}&id=${id}&success=${success}`, {});
  }

  getCallbackInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/callback-info`);
  }

  generateContract(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/generate-contract/${paymentId}`, {});
  }

  retryContract(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/retry-contract/${paymentId}`, {});
  }
}
