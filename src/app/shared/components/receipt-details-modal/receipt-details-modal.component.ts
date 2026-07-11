import { Component, Input, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Receipt } from '../../../core/models/receipt.model';
import { ReceiptService } from '../../../core/services/receipt.service';

@Component({
  selector: 'app-receipt-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-details-modal.component.html',
  styleUrls: ['./receipt-details-modal.component.css']
})
export class ReceiptDetailsModalComponent implements OnDestroy {
  @Input() receipt!: Receipt;
  @Input() isOpen = signal<boolean>(false);

  private objectUrl: string | null = null;

  constructor(private receiptService: ReceiptService) {}

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  close() {
    this.isOpen.set(false);
  }

  viewPdf() {
    const receiptId = this.receipt.receiptId;
    if (!receiptId) {
      alert('Receipt ID not found.');
      return;
    }

    this.receiptService.downloadReceipt(receiptId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: (err) => {
        console.error('Error opening receipt PDF', err);
        alert('Failed to open receipt PDF. Please try again.');
      }
    });
  }

  getFileName(): string {
    const receiptNumber = this.receipt?.receiptNumber || 'receipt';
    return `Receipt-${receiptNumber}.pdf`;
  }

  downloadPdf() {
    const receiptId = this.receipt.receiptId;
    if (!receiptId) {
      alert('Receipt ID not found. Cannot download receipt.');
      return;
    }

    this.receiptService.downloadReceipt(receiptId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getFileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download error:', err);
        alert('Failed to download receipt. Please try again.');
      }
    });
  }
}
