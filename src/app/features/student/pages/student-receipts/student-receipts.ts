import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../../core/services/receipt.service';
import { Receipt } from '../../../../core/models/receipt.model';

@Component({
  selector: 'app-student-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-receipts.html',
})
export class StudentReceipts implements OnInit {
  receipts = signal<Receipt[]>([]);
  isLoading = signal<boolean>(false);
  selectedReceipt = signal<Receipt | null>(null);

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
  }

  closeModal() {
    this.selectedReceipt.set(null);
  }

  downloadReceipt(receiptId: string, receiptNumber: string) {
    this.receiptService.downloadReceipt(receiptId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${receiptNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('Error downloading receipt', err);
      }
    });
  }
}
