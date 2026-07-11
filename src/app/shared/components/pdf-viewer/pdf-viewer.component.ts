import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

  pdfUrl = signal<SafeResourceUrl | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  private objectUrl: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadPdf();
  }

  private loadPdf() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Validate blob type
      if (!this.pdfBlob || this.pdfBlob.size === 0) {
        throw new Error('PDF blob is empty or invalid');
      }

      if (this.pdfBlob.type !== 'application/pdf') {
        throw new Error('Invalid file type. Expected PDF.');
      }

      // Create object URL
      this.objectUrl = URL.createObjectURL(this.pdfBlob);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
      this.isLoading.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load PDF');
      this.isLoading.set(false);
      console.error('PDF loading error:', err);
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  retryLoad() {
    this.cleanup();
    this.loadPdf();
  }
}
