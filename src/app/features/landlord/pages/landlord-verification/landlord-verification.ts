import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { LandlordService } from '../../../../core/services/landlord.service';
import { Observable } from 'rxjs';

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
export class LandlordVerification implements OnInit {
  private authService = inject(AuthService);
  private landlordService = inject(LandlordService);
  user = this.authService.currentUser$;

  // Overall verification status
  verificationStatus = signal<'pending' | 'under_review' | 'verified' | 'rejected'>('pending');

  ngOnInit() {
    this.landlordService.getAccountStatus().subscribe({
      next: (res: any) => {
        if (res && res.status) {
          const statusMap: Record<string, 'pending' | 'under_review' | 'verified' | 'rejected'> = {
            'Pending': 'pending',
            'UnderReview': 'under_review',
            'Under_Review': 'under_review',
            'Verified': 'verified',
            'Approved': 'verified',
            'Rejected': 'rejected'
          };
          const mapped = statusMap[res.status] || res.status.toLowerCase();
          this.verificationStatus.set(mapped as any);
          if (mapped === 'under_review') {
            this.submittedForReview.set(true);
          }
        }
      },
      error: (err) => {
        console.error('Failed to get landlord verification status:', err);
      }
    });

    this.authService.currentUser$.subscribe(u => {
      const landlordId = u?.landlordId || (u as any)?.landLordId || u?.id;
      if (landlordId && u?.role === 'landlord') {
        this.landlordService.getById(landlordId).subscribe({
          next: (landlord: any) => {
            if (landlord) {
              this.documents.update(prev =>
                prev.map(d => {
                  const hasNationalId = landlord.nationalIdImageUrl || landlord.nationalID || landlord.nationalId;
                  const hasDeed = landlord.housingUnitDocumentationUrl || landlord.propertyOwnershipProof || landlord.propertyOwnerShipProof;
                  
                  if (d.key === 'national_id' && hasNationalId) {
                    return {
                      ...d,
                      status: 'uploaded',
                      fileName: (typeof hasNationalId === 'string' && hasNationalId.includes('/') ? hasNationalId.split('/').pop() : null) || 'National ID File'
                    };
                  }
                  if (d.key === 'property_deed' && hasDeed) {
                    return {
                      ...d,
                      status: 'uploaded',
                      fileName: (typeof hasDeed === 'string' && hasDeed.includes('/') ? hasDeed.split('/').pop() : null) || 'Ownership Document'
                    };
                  }
                  return d;
                })
              );
            }
          },
          error: (err) => {
            console.error('Failed to load landlord profile:', err);
          }
        });
      }
    });
  }

  documents = signal<VerificationDocument[]>([
    {
      key: 'national_id',
      label: 'National ID',
      description: 'Clear photo of both sides of your Egyptian National ID card',
      icon: 'fas fa-id-card',
      required: true,
      status: 'pending'
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

  triggerFileInput(docKey: string) {
    const fileInput = document.getElementById(`fileInput_${docKey}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any, doc: VerificationDocument) {
    const file: File = event.target.files[0];
    if (file) {
      this.isUploading.set(doc.key);

      let uploadObservable;
      if (doc.key === 'national_id') {
        uploadObservable = this.landlordService.uploadNationalId(file);
      } else if (doc.key === 'property_deed') {
        uploadObservable = this.landlordService.uploadUnitDocumentation(file);
      } else {
        // Fallback simulation for other optional documents not strictly mapped to endpoints
        uploadObservable = new Observable((observer: any) => {
          setTimeout(() => {
            observer.next({ message: 'Success' });
            observer.complete();
          }, 1500);
        });
      }

      uploadObservable.subscribe({
        next: () => {
          this.documents.update(prev =>
            prev.map(d => d.key === doc.key
              ? {
                ...d,
                status: 'uploaded' as const,
                fileName: file.name,
                uploadedAt: new Date().toISOString().split('T')[0]
              }
              : d
            )
          );
          this.isUploading.set(null);
        },
        error: (err: any) => {
          console.error('File upload failed:', err);
          alert(`Failed to upload ${doc.label}`);
          this.isUploading.set(null);
        }
      });
    }
  }

  // Fallback if needed
  simulateUpload(doc: VerificationDocument) {
    this.triggerFileInput(doc.key);
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
