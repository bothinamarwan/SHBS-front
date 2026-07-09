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

      // Call confirm endpoint with Paymob query params
      const order = params['order'] || params['id'];
      const txnId = params['id'];
      const success = params['success'] === 'true';

      if (order) {
        console.log('Calling payment confirmation with Paymob params:', { order, txnId, success });
        this.bookingPaymentService.confirm(order, txnId || '', success).subscribe({
          next: (res) => {
            console.log('Payment confirmation response:', res);
          },
          error: (err) => {
            console.error('Payment confirmation error:', err);
          }
        });
      }

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
          // Redirect to receipts page after successful payment to view the receipt
          setTimeout(() => {
            this.router.navigate(['/student/receipts']);
          }, 2000);
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
