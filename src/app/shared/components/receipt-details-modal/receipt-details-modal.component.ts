import { Component, Input, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Receipt } from '../../../core/models/receipt.model';
import { ReceiptService } from '../../../core/services/receipt.service';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { PdfActionsComponent } from '../pdf-actions/pdf-actions.component';

@Component({
  selector: 'app-receipt-details-modal',
  standalone: true,
  imports: [CommonModule, PdfViewerComponent, PdfActionsComponent],
  templateUrl: './receipt-details-modal.component.html',
  styleUrls: ['./receipt-details-modal.component.css']
})
export class ReceiptDetailsModalComponent implements OnDestroy {
  @Input() receipt!: Receipt;
  @Input() isOpen = signal<boolean>(false);

  isLoadingPdf = signal<boolean>(false);
  pdfBlob = signal<Blob | null>(null);
  pdfError = signal<string | null>(null);
  showPdfViewer = signal<boolean>(false);
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
    this.showPdfViewer.set(false);
    this.pdfBlob.set(null);
    this.pdfError.set(null);
    this.isOpen.set(false);
  }

  viewPdf() {
    this.loadPdf();
    this.showPdfViewer.set(true);
  }

  private loadPdf() {
    if (!this.receipt) return;

    this.isLoadingPdf.set(true);
    this.pdfError.set(null);

    const receiptId = this.receipt.receiptId;
    if (!receiptId) {
      this.pdfError.set('Receipt ID not found');
      this.isLoadingPdf.set(false);
      return;
    }

    // Always use the API endpoint to avoid file:// URL issues
    this.loadFromApi(receiptId);
  }

  private loadFromApi(receiptId: string) {
    this.receiptService.downloadReceipt(receiptId).subscribe({
      next: (blob) => this.handlePdfSuccess(blob),
      error: (err) => {
        console.error('Error downloading receipt', err);
        this.pdfError.set('Failed to load PDF. Please try again.');
        this.isLoadingPdf.set(false);
      }
    });
  }

  private handlePdfSuccess(blob: Blob) {
    this.pdfBlob.set(blob);
    this.isLoadingPdf.set(false);
  }

  getFileName(): string {
    const receiptNumber = this.receipt?.receiptNumber || 'receipt';
    return `Receipt-${receiptNumber}.pdf`;
  }

  backToDetails() {
    this.showPdfViewer.set(false);
  }

  downloadPdf() {
    if (!this.pdfBlob()) return;

    try {
      const blob = this.pdfBlob()!;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.getFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  }
}
