import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-actions.component.html',
  styleUrls: ['./pdf-actions.component.css']
})
export class PdfActionsComponent {
  @Input() pdfBlob!: Blob;
  @Input() fileName: string = 'document.pdf';
  @Input() showView: boolean = true;
  @Input() showDownload: boolean = true;
  @Input() showOpenTab: boolean = true;
  @Input() showPrint: boolean = true;

  isDownloading = signal<boolean>(false);
  isPrinting = signal<boolean>(false);
  private objectUrl: string | null = null;

  downloadPdf() {
    if (!this.pdfBlob) return;

    try {
      this.isDownloading.set(true);

      // Create object URL if not already created
      if (!this.objectUrl) {
        this.objectUrl = URL.createObjectURL(this.pdfBlob);
      }

      // Create download link
      const a = document.createElement('a');
      a.href = this.objectUrl;
      a.download = this.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Reset loading state after a short delay
      setTimeout(() => {
        this.isDownloading.set(false);
      }, 500);
    } catch (err) {
      console.error('Download error:', err);
      this.isDownloading.set(false);
    }
  }

  openInNewTab() {
    if (!this.pdfBlob) return;

    try {
      // Create object URL if not already created
      if (!this.objectUrl) {
        this.objectUrl = URL.createObjectURL(this.pdfBlob);
      }

      // Open in new tab
      window.open(this.objectUrl, '_blank');
    } catch (err) {
      console.error('Open in new tab error:', err);
    }
  }

  printPdf() {
    if (!this.pdfBlob) return;

    try {
      this.isPrinting.set(true);

      // Create object URL if not already created
      if (!this.objectUrl) {
        this.objectUrl = URL.createObjectURL(this.pdfBlob);
      }

      // Open in new window for printing
      const printWindow = window.open(this.objectUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          this.isPrinting.set(false);
        };
      } else {
        this.isPrinting.set(false);
      }
    } catch (err) {
      console.error('Print error:', err);
      this.isPrinting.set(false);
    }
  }

  ngOnDestroy() {
    // Cleanup object URL
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
