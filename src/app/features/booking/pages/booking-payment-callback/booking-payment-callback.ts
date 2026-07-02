import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingPaymentService } from '../../../../core/services/booking-payment.service';

@Component({
  selector: 'app-booking-payment-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-payment-callback.html'
})
export class BookingPaymentCallbackPage implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingPaymentService = inject(BookingPaymentService);

  status = signal<'processing' | 'success' | 'error'>('processing');
  orderId = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      const transactionId = params['transactionId'];
      const isSuccess = params['success'] === 'true' || params['isSuccess'] === 'true';

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
    this.bookingPaymentService.callback(req).subscribe({
      next: () => {
        this.status.set(req.isSuccess ? 'success' : 'error');
        if (!req.isSuccess) {
          this.errorMessage.set('The payment was declined or failed.');
        }
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(err?.error?.message || 'Failed to verify payment with the server.');
      }
    });
  }
}
