import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

export interface VerificationDocument {
  key: string;
  label: string;
  description: string;
  icon: string;
  required: boolean;
  fileName?: string;
  uploadedAt?: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
}

export type VerificationStep = 'documents' | 'review' | 'complete';

@Component({
  selector: 'app-landlord-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landlord-verification.html'
})
export class LandlordVerification {
  private authService = inject(AuthService);
  user = this.authService.currentUser$;

  // Overall verification status
  verificationStatus = signal<'pending' | 'under_review' | 'verified' | 'rejected'>('pending');

  documents = signal<VerificationDocument[]>([
    {
      key: 'national_id',
      label: 'National ID',
      description: 'Clear photo of both sides of your Egyptian National ID card',
      icon: 'fas fa-id-card',
      required: true,
      status: 'uploaded',
      fileName: 'national_id_front_back.jpg',
      uploadedAt: '2026-06-10'
    },
    {
      key: 'property_deed',
      label: 'Property Ownership Proof',
      description: 'Official deed or title document proving you own the property',
      icon: 'fas fa-home',
      required: true,
      status: 'pending'
    },
    {
      key: 'tax_registration',
      label: 'Tax Registration Card',
      description: 'Your business or personal tax registration certificate',
      icon: 'fas fa-receipt',
      required: true,
      status: 'pending'
    },
    {
      key: 'utility_bill',
      label: 'Utility Bill',
      description: 'Recent electricity or water bill for the property (last 3 months)',
      icon: 'fas fa-bolt',
      required: false,
      status: 'pending'
    },
    {
      key: 'bank_statement',
      label: 'Bank Statement',
      description: 'Last 3 months bank statement for payment verification',
      icon: 'fas fa-university',
      required: false,
      status: 'pending'
    },
  ]);

  uploadedCount = computed(() => this.documents().filter(d => d.status !== 'pending').length);
  requiredCount = computed(() => this.documents().filter(d => d.required).length);
  requiredUploadedCount = computed(() => this.documents().filter(d => d.required && d.status !== 'pending').length);
  progressPercent = computed(() => Math.round((this.uploadedCount() / this.documents().length) * 100));
  allRequiredDone = computed(() => this.requiredUploadedCount() === this.requiredCount());

  isUploading = signal<string | null>(null);

  // Simulate file upload
  simulateUpload(doc: VerificationDocument) {
    if (doc.status !== 'pending') return;
    this.isUploading.set(doc.key);
    setTimeout(() => {
      this.documents.update(prev =>
        prev.map(d => d.key === doc.key
          ? {
              ...d,
              status: 'uploaded' as const,
              fileName: `${doc.key}_document.pdf`,
              uploadedAt: new Date().toISOString().split('T')[0]
            }
          : d
        )
      );
      this.isUploading.set(null);
    }, 1800);
  }

  removeDocument(doc: VerificationDocument) {
    this.documents.update(prev =>
      prev.map(d => d.key === doc.key
        ? { ...d, status: 'pending' as const, fileName: undefined, uploadedAt: undefined }
        : d
      )
    );
  }

  isSubmitting = signal(false);
  submittedForReview = signal(false);

  submitForReview() {
    if (!this.allRequiredDone()) return;
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.submittedForReview.set(true);
      this.verificationStatus.set('under_review');
    }, 2000);
  }

  getDocStatusClass(status: string): string {
    const map: Record<string, string> = {
      uploaded: 'status-badge--approved',
      approved: 'status-badge--verified',
      rejected: 'status-badge--rejected',
      pending: 'status-badge--pending'
    };
    return map[status] || '';
  }

  getDocStatusLabel(status: string): string {
    const map: Record<string, string> = {
      uploaded: 'Uploaded',
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Required'
    };
    return map[status] || status;
  }

  steps = [
    { label: 'Upload Documents', icon: 'fas fa-upload' },
    { label: 'Under Review', icon: 'fas fa-search' },
    { label: 'Verified', icon: 'fas fa-shield-alt' },
  ];

  currentStep = computed(() => {
    const s = this.verificationStatus();
    if (s === 'verified') return 2;
    if (s === 'under_review') return 1;
    return 0;
  });
}
