import { Component, inject, Input, Output, EventEmitter, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymobHelperService } from '../../../core/services/paymob-helper.service';
import { PaymentState, PaymentStatus, VerifyPaymentResponse } from '../../../core/models/payment.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private paymobHelper = inject(PaymobHelperService);

  // Inputs
  @Input() bookingId!: string;
  @Input() amount!: number;
  @Input() returnUrl = '/bookings';
  @Input() buttonText = 'Pay Now';
  @Input() usePopup = false;

  // Outputs
  @Output() paymentSuccess = new EventEmitter<VerifyPaymentResponse>();
  @Output() paymentFailed = new EventEmitter<string>();

  // State
  state = signal<PaymentState>(PaymentState.IDLE);
  errorMessage = signal<string>('');
  transactionId = signal<string>('');
  completedAt = signal<Date | null>(null);
  pollingProgress = signal({ attempt: 0, maxAttempts: 30 });

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Check if returning from Paymob
    if (this.paymobHelper.isPaymobReturn()) {
      this.handlePaymobReturn();
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.paymobHelper.clearPaymentData();
  }

  /**
   * Initiate payment process
   */
  initiatePayment(): void {
    if (!this.bookingId || !this.amount) {
      this.errorMessage.set('Incomplete booking data');
      return;
    }

    this.state.set(PaymentState.LOADING);
    this.errorMessage.set('');

    this.paymentService.initiatePayment({
      bookingId: this.bookingId,
      amount: this.amount,
      returnUrl: this.returnUrl
    }).subscribe({
      next: (response) => {
        if (response.success && response.paymentUrl && response.clientSecret) {
          if (this.usePopup) {
            this.openPaymobPopup(response.paymentUrl, response.clientSecret);
          } else {
            this.paymobHelper.redirectToPaymob(response.paymentUrl, response.clientSecret);
          }
        } else {
          this.state.set(PaymentState.FAILED);
          this.errorMessage.set('Payment processing error, please try again');
        }
      },
      error: (error) => {
        this.state.set(PaymentState.FAILED);
        this.errorMessage.set(error);
      }
    });
  }

  /**
   * Open Paymob in popup window
   */
  private openPaymobPopup(paymentUrl: string, clientSecret: string): void {
    this.state.set(PaymentState.PROCESSING);
    this.pollingProgress.set({ attempt: 0, maxAttempts: 30 });

    this.paymobHelper.openPaymobInPopup(paymentUrl, clientSecret).then(
      (returnParams: any) => {
        if (returnParams.transaction_id) {
          this.verifyPayment(returnParams.transaction_id);
        } else {
          this.state.set(PaymentState.FAILED);
          this.errorMessage.set('Failed to get transaction ID');
        }
      },
      (error: any) => {
        this.state.set(PaymentState.FAILED);
        this.errorMessage.set(error.message || 'Payment cancelled');
      }
    );
  }

  /**
   * Handle return from Paymob redirect
   */
  private handlePaymobReturn(): void {
    const returnParams = this.paymobHelper.getReturnParams();
    if (returnParams?.transaction_id) {
      this.state.set(PaymentState.PROCESSING);
      this.pollingProgress.set({ attempt: 0, maxAttempts: 30 });
      this.verifyPayment(returnParams.transaction_id);
    }
  }

  /**
   * Verify payment status with polling
   */
  private verifyPayment(transactionId: string): void {
    this.transactionId.set(transactionId);

    const subscription = this.paymentService.pollPaymentStatus(
      transactionId,
      (attempt, maxAttempts) => {
        this.pollingProgress.set({ attempt, maxAttempts });
      }
    ).subscribe({
      next: (response) => {
        if (response.success && response.status === PaymentStatus.COMPLETED) {
          this.state.set(PaymentState.SUCCESS);
          this.completedAt.set(response.completedAt || new Date());
          this.paymentSuccess.emit(response);
        } else if (response.status === PaymentStatus.FAILED || response.status === PaymentStatus.CANCELLED) {
          this.state.set(PaymentState.FAILED);
          this.errorMessage.set('Payment failed');
          this.paymentFailed.emit('Payment failed');
        }
      },
      error: (error) => {
        this.state.set(PaymentState.FAILED);
        this.errorMessage.set(error);
        this.paymentFailed.emit(error);
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Retry payment
   */
  retryPayment(): void {
    this.state.set(PaymentState.IDLE);
    this.errorMessage.set('');
    this.transactionId.set('');
    this.completedAt.set(null);
    this.pollingProgress.set({ attempt: 0, maxAttempts: 30 });
    this.initiatePayment();
  }

  /**
   * Cancel payment and return
   */
  cancelPayment(): void {
    this.paymobHelper.clearPaymentData();
    this.state.set(PaymentState.IDLE);
    window.location.href = this.returnUrl;
  }

  /**
   * Get formatted amount
   */
  getFormattedAmount(): string {
    return this.paymobHelper.formatAmount(this.amount);
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    const { attempt, maxAttempts } = this.pollingProgress();
    return Math.min((attempt / maxAttempts) * 100, 100);
  }

  /**
   * Check if state matches
   */
  isState(state: PaymentState | string): boolean {
    return this.state() === state;
  }
}
