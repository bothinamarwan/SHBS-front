import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentHistoryService } from '../../../../core/services/payment-history.service';
import { PaymentHistory, PaymentStatus } from '../../../../core/models/payment-history.model';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-history.html'
})
export class PaymentHistoryPage implements OnInit {
  private paymentService = inject(PaymentHistoryService);

  isLoading = signal(true);
  payments = signal<PaymentHistory[]>([]);
  
  // Modal State
  selectedPayment = signal<PaymentHistory | null>(null);

  // Filter State
  startDate = signal<string>('');
  endDate = signal<string>('');

  PaymentStatus = PaymentStatus;

  ngOnInit() {
    this.loadMyHistory();
  }

  loadMyHistory() {
    this.isLoading.set(true);
    this.paymentService.getMyHistory().subscribe({
      next: (response: any) => {
        const data: PaymentHistory[] = Array.isArray(response) ? response : (response?.data || response?.items || response?.$values || []);
        this.payments.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filterByRange() {
    if (!this.startDate() || !this.endDate()) return;
    this.isLoading.set(true);
    this.paymentService.getHistoryByRange(this.startDate(), this.endDate()).subscribe({
      next: (response: any) => {
        const data: PaymentHistory[] = Array.isArray(response) ? response : (response?.data || response?.items || response?.$values || []);
        this.payments.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  clearFilter() {
    this.startDate.set('');
    this.endDate.set('');
    this.loadMyHistory();
  }

  viewDetails(paymentId: string) {
    // Find the payment in the current list first
    const payment = this.payments().find(p => p.paymentId === paymentId || (p as any).id === paymentId);
    if (payment) {
      this.selectedPayment.set(payment);
    } else {
      // Fallback to API call
      this.paymentService.getPaymentById(paymentId).subscribe({
        next: (data) => this.selectedPayment.set(data),
        error: () => {}
      });
    }
  }

  closeModal() {
    this.selectedPayment.set(null);
  }

  downloadReceipt(payment: PaymentHistory) {
    const paymentId = payment.paymentId || (payment as any).paymentId || (payment as any).id;
    console.log('Download receipt called with payment:', payment);
    console.log('Extracted paymentId:', paymentId);

    if (!paymentId) {
      alert('Payment ID not found. Cannot download receipt.');
      return;
    }

    // Open PDF in new tab using the API endpoint
    window.open(`/api/Receipt/payment/${paymentId}`, '_blank');
  }

  getStatusColor(status: PaymentStatus): string {
    switch (Number(status)) {
      case PaymentStatus.Completed: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case PaymentStatus.Pending: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case PaymentStatus.Failed: return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case PaymentStatus.Refunded: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  }

  getStatusLabel(status: PaymentStatus): string {
    switch (Number(status)) {
      case PaymentStatus.Completed: return 'Completed';
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Failed: return 'Failed';
      case PaymentStatus.Refunded: return 'Refunded';
      default: return 'Unknown';
    }
  }
}
