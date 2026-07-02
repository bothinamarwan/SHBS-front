import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../../core/services/receipt.service';
import { Receipt, FinancialSummary } from '../../../../core/models/receipt.model';

@Component({
  selector: 'app-admin-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-receipts.html',
})
export class AdminReceipts implements OnInit {
  summary = signal<FinancialSummary | null>(null);
  receipts = signal<Receipt[]>([]);
  isLoading = signal<boolean>(false);
  activeTab = signal<'recent' | 'byType'>('recent');
  selectedType = signal<string>('Rent');

  exportUserId = signal<string>('');
  isExporting = signal<boolean>(false);

  constructor(private receiptService: ReceiptService) {}

  ngOnInit() {
    this.loadSummary();
    this.loadRecentReceipts();
  }

  loadSummary() {
    this.receiptService.getFinancialSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
      },
      error: (err) => console.error('Failed to load financial summary', err)
    });
  }

  loadRecentReceipts() {
    this.isLoading.set(true);
    this.activeTab.set('recent');
    this.receiptService.getRecentReceipts().subscribe({
      next: (data) => {
        this.receipts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent receipts', err);
        this.isLoading.set(false);
      }
    });
  }

  loadReceiptsByType() {
    if (!this.selectedType()) return;
    this.isLoading.set(true);
    this.activeTab.set('byType');
    this.receiptService.getAdminReceiptsByType(this.selectedType()).subscribe({
      next: (data) => {
        this.receipts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load receipts by type', err);
        this.isLoading.set(false);
      }
    });
  }

  onTypeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedType.set(selectElement.value);
    this.loadReceiptsByType();
  }

  exportUserReceipts() {
    if (!this.exportUserId()) return;
    this.isExporting.set(true);
    this.receiptService.exportUserReceipts(this.exportUserId()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `User_${this.exportUserId()}_Receipts.csv`; // Defaulting to CSV export format, adjust if PDF
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.isExporting.set(false);
        this.exportUserId.set('');
      },
      error: (err) => {
        console.error('Failed to export user receipts', err);
        this.isExporting.set(false);
      }
    });
  }
}
