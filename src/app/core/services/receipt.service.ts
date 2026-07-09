import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Receipt, FinancialSummary } from '../models/receipt.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private baseUrl = '/api/Receipt';

  constructor(private http: HttpClient) {}

  getMyReceipts(): Observable<Receipt[]> {
    return this.http.get<{ success: boolean; data: Receipt[]; count: number }>(`${this.baseUrl}/my-receipts`).pipe(
      map(response => response.data || [])
    );
  }

  getReceiptById(receiptId: string): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.baseUrl}/${receiptId}`);
  }

  downloadReceipt(receiptId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${receiptId}/download`, { responseType: 'blob' });
  }

  getReceiptByPayment(paymentId: string): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.baseUrl}/payment/${paymentId}`);
  }

  getAdminReceiptsByType(type: string): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`${this.baseUrl}/admin/by-type/${type}`);
  }

  getFinancialSummary(): Observable<FinancialSummary> {
    return this.http.get<FinancialSummary>(`${this.baseUrl}/summary/financial`);
  }

  getRecentReceipts(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`${this.baseUrl}/recent`);
  }

  exportUserReceipts(userId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/admin/export/${userId}`, { responseType: 'blob' });
  }
}
