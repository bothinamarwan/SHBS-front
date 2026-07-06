import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingPaymentService } from '../../../../core/services/booking-payment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BookingPaymentResponse } from '../../../../core/models/booking-payment.model';

@Component({
  selector: 'app-booking-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-payment.html'
})
export class BookingPaymentPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingPaymentService = inject(BookingPaymentService);
  private authService = inject(AuthService);

  bookingId = signal<string>('');
  isProcessing = signal(false);
  errorMessage = signal<string | null>(null);

  paymentForm: FormGroup = this.fb.group({
    customerName: ['', Validators.required],
    customerEmail: ['', [Validators.required, Validators.email]],
    customerPhone: ['', Validators.required],
    description: ['Payment for Accommodation']
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bookingId.set(id);
      } else {
        this.router.navigate(['/student/bookings']);
      }
    });

    const user = this.authService.currentUserValue;
    if (user) {
      this.paymentForm.patchValue({
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || ''
      });
    }
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    const req = {
      bookingId: this.bookingId(),
      ...this.paymentForm.value
    };

    this.bookingPaymentService.initiate(req).subscribe({
      next: (response: BookingPaymentResponse) => {
        if (response.success && response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          this.errorMessage.set(response.message || 'Failed to initiate payment. Please try again.');
          this.isProcessing.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to initiate payment. Please try again.');
        this.isProcessing.set(false);
      }
    });
  }
}
