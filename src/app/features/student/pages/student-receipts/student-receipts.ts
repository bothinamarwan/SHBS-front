import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../../core/services/receipt.service';
import { Receipt } from '../../../../core/models/receipt.model';
import { ReceiptDetailsModalComponent } from '../../../../shared/components/receipt-details-modal/receipt-details-modal.component';

@Component({
  selector: 'app-student-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReceiptDetailsModalComponent],
  templateUrl: './student-receipts.html',
})
export class StudentReceipts implements OnInit {
  receipts = signal<Receipt[]>([]);
  isLoading = signal<boolean>(false);
  selectedReceipt = signal<Receipt | null>(null);
  isModalOpen = signal<boolean>(false);

  constructor(private receiptService: ReceiptService) {}

  ngOnInit() {
    this.loadReceipts();
  }

  loadReceipts() {
    this.isLoading.set(true);
    this.receiptService.getMyReceipts().subscribe({
      next: (data) => {
        this.receipts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching receipts', err);
        this.isLoading.set(false);
      }
    });
  }

  viewReceipt(receipt: Receipt) {
    this.selectedReceipt.set(receipt);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedReceipt.set(null);
  }

  downloadReceipt(receipt: Receipt) {
    // Try to download from receiptPdfUrl first, fallback to API endpoint
    if (receipt.receiptPdfUrl) {
      this.receiptService.downloadReceiptByUrl(receipt.receiptPdfUrl).subscribe({
        next: (blob) => this.downloadBlob(blob, receipt.receiptNumber),
        error: (err) => {
          console.error('Error downloading from URL, trying API endpoint', err);
          this.downloadFromApi(receipt);
        }
      });
    } else {
      this.downloadFromApi(receipt);
    }
  }

  private downloadFromApi(receipt: Receipt) {
    const receiptId = receipt.receiptId || receipt.id;
    if (!receiptId) {
      console.error('Missing receipt ID');
      return;
    }

    this.receiptService.downloadReceipt(receiptId).subscribe({
      next: (blob) => this.downloadBlob(blob, receipt.receiptNumber),
      error: (err) => {
        console.error('Error downloading receipt', err);
      }
    });
  }

  private downloadBlob(blob: Blob, receiptNumber: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${receiptNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
}
