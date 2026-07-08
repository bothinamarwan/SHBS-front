import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingPaymentService } from '../../../../core/services/booking-payment.service';

@Component({
  selector: 'app-booking-payment-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-payment-callback.html'
})
export class BookingPaymentCallbackPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingPaymentService = inject(BookingPaymentService);

  status = signal<'processing' | 'success' | 'error'>('processing');
  orderId = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      const transactionId = params['transactionId'];
      const isSuccess = params['success'] === 'true' || params['isSuccess'] === 'true';

      console.log('Payment callback params:', params);
      console.log('Parsed - orderId:', orderId, 'transactionId:', transactionId, 'isSuccess:', isSuccess);

      if (orderId && transactionId) {
        this.orderId.set(orderId);
        this.processCallback({ orderId, transactionId, isSuccess });
      } else {
        this.status.set('error');
        this.errorMessage.set('Invalid payment parameters received.');
      }
    });
  }

  processCallback(req: { orderId: string, transactionId: string, isSuccess: boolean }) {
    console.log('Processing payment callback:', req);
    this.bookingPaymentService.callback(req).subscribe({
      next: (res) => {
        console.log('Payment callback response:', res);
        if (req.isSuccess) {
          this.status.set('success');
          // Redirect to contract page after successful payment
          // Backend should return contractId in response
          const contractId = res?.contractId || res?.data?.contractId;
          if (contractId) {
            setTimeout(() => {
              this.router.navigate(['/student/contract', contractId]);
            }, 2000);
          } else {
            // Fallback to bookings page if no contract ID
            setTimeout(() => {
              this.router.navigate(['/student/bookings']);
            }, 2000);
          }
        } else {
          this.status.set('error');
          this.errorMessage.set('The payment was declined or failed.');
        }
      },
      error: (err) => {
        console.error('Payment callback error:', err);
        this.status.set('error');
        this.errorMessage.set(err?.error?.message || 'Failed to verify payment with the server.');
      }
    });
  }
}
