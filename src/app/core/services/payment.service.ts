import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  PaymentStatusResponse
} from '../models/payment.model';

/**
 * Payment service for handling Paymob payment gateway integration
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly API_TIMEOUT = 30000; // 30 seconds
  private readonly PAYMENT_POLLING_TIMEOUT = 90000; // 90 seconds
  private readonly PAYMENT_POLLING_INTERVAL = 3000; // 3 seconds

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with authentication token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Handle HTTP errors with user-friendly messages
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Server error, please try again';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'Unable to connect to server';
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server';
          break;
        case 401:
          errorMessage = 'Please login first';
          break;
        case 400:
          errorMessage = error.error?.message || 'Invalid data';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 408:
          errorMessage = 'Request timeout';
          break;
        case 500:
          errorMessage = 'Server error, please try again';
          break;
        default:
          errorMessage = error.error?.message || 'An unexpected error occurred';
      }
    }

    console.error('Payment service error:', error);
    return throwError(() => errorMessage);
  }

  /**
   * Initiate payment with Paymob
   * @param req Payment initiation request
   * @returns Observable with payment URL and client secret
   */
  initiatePayment(req: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.http.post<InitiatePaymentResponse>(
      `${environment.apiUrl}/api/payment/initiate`,
      req,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout({ each: this.API_TIMEOUT }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Verify payment status by transaction ID
   * @param transactionId Paymob transaction ID
   * @returns Observable with payment verification result
   */
  verifyPayment(transactionId: string): Observable<VerifyPaymentResponse> {
    return this.http.get<VerifyPaymentResponse>(
      `${environment.apiUrl}/api/payment/verify/${transactionId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout({ each: this.API_TIMEOUT }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get payment status by booking ID
   * @param bookingId Booking ID
   * @returns Observable with payment status
   */
  getPaymentStatus(bookingId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${environment.apiUrl}/api/payment/status/${bookingId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout({ each: this.API_TIMEOUT }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Cancel payment (if supported by backend)
   * @param transactionId Transaction ID to cancel
   * @returns Observable with cancellation result
   */
  cancelPayment(transactionId: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/payment/cancel/${transactionId}`,
      {},
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout({ each: this.API_TIMEOUT }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Poll payment status until completion or timeout
   * @param transactionId Transaction ID to poll
   * @param onProgress Callback for polling progress (attempt, maxAttempts)
   * @returns Observable with final payment status
   */
  pollPaymentStatus(
    transactionId: string,
    onProgress?: (attempt: number, maxAttempts: number) => void
  ): Observable<VerifyPaymentResponse> {
    const maxAttempts = this.PAYMENT_POLLING_TIMEOUT / this.PAYMENT_POLLING_INTERVAL;
    let attempts = 0;

    return new Observable<VerifyPaymentResponse>(subscriber => {
      const poll = () => {
        attempts++;
        if (onProgress) {
          onProgress(attempts, maxAttempts);
        }

        this.verifyPayment(transactionId).subscribe({
          next: (response) => {
            if (response.status === 'Completed' || response.status === 'Failed' || response.status === 'Cancelled') {
              subscriber.next(response);
              subscriber.complete();
            } else if (attempts >= maxAttempts) {
              subscriber.error('تجاوز وقت الانتظار، يرجى التحقق من حالة الدفع لاحقاً');
            } else {
              setTimeout(poll, this.PAYMENT_POLLING_INTERVAL);
            }
          },
          error: (error) => {
            if (attempts >= maxAttempts) {
              subscriber.error('تجاوز وقت الانتظار، يرجى التحقق من حالة الدفع لاحقاً');
            } else {
              setTimeout(poll, this.PAYMENT_POLLING_INTERVAL);
            }
          }
        });
      };

      poll();

      // Cleanup on unsubscribe
      return () => {
        // Any cleanup if needed
      };
    });
  }
}
