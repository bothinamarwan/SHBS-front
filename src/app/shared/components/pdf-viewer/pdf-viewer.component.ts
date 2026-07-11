import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  @Input() pdfBlob!: Blob;
  @Input() fileName: string = 'document.pdf';

  blobUrl = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadPdf();
  }

  private loadPdf() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      if (!this.pdfBlob || this.pdfBlob.size === 0) {
        throw new Error('PDF blob is empty or invalid');
      }

      if (this.pdfBlob.type !== 'application/pdf') {
        throw new Error('Invalid file type. Expected PDF.');
      }

      const url = URL.createObjectURL(this.pdfBlob);
      this.blobUrl.set(url);
      this.isLoading.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load PDF');
      this.isLoading.set(false);
      console.error('PDF loading error:', err);
    }
  }

  openInNewTab() {
    const url = this.blobUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    const url = this.blobUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.blobUrl.set(null);
    }
  }

  retryLoad() {
    this.cleanup();
    this.loadPdf();
  }
}
