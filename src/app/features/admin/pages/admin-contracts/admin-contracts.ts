import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractService } from '../../../../core/services/contract.service';
import { BookingService } from '../../../../core/services/booking.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Contract, AdminApprovalRequest, AdminRejectionRequest, AdminContractUploadRequest, ContractStatus } from '../../../../core/models/contract.model';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-contracts.html'
})
export class AdminContracts implements OnInit {
  private contractService = inject(ContractService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  contracts = signal<Contract[]>([]);
  isLoading = signal(true);
  selectedContract = signal<Contract | null>(null);
  isModalOpen = signal(false);
  isUploadModalOpen = signal(false);
  selectedBookingId = signal<string | null>(null);

  approvalForm: FormGroup;
  rejectionForm: FormGroup;
  uploadForm: FormGroup;
  selectedFile = signal<File | null>(null);

  contractsWaitingForUpload = computed(() => this.contracts().filter(c => c.status === 0));
  contractsPendingReview = computed(() => this.contracts().filter(c => c.status === 4));

  constructor() {
    this.approvalForm = this.fb.group({
      notes: ['']
    });

    this.rejectionForm = this.fb.group({
      notes: ['', Validators.required]
    });

    this.uploadForm = this.fb.group({});
  }

  ngOnInit() {
    this.loadContracts();
  }

  loadContracts() {
    this.contractService.getAll().subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading contracts:', err);
        this.isLoading.set(false);
      }
    });
  }

  openReviewModal(contract: Contract) {
    this.selectedContract.set(contract);
    this.isModalOpen.set(true);
    this.approvalForm.reset();
    this.rejectionForm.reset();
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedContract.set(null);
  }

  openUploadModal(bookingId: string) {
    this.selectedBookingId.set(bookingId);
    this.isUploadModalOpen.set(true);
    this.uploadForm.reset();
    this.selectedFile.set(null);
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.selectedBookingId.set(null);
    this.selectedFile.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
      } else {
        alert('Please select a PDF file');
        this.selectedFile.set(null);
      }
    }
  }

  uploadContract() {
    if (!this.selectedFile()) {
      alert('Please select a PDF file');
      return;
    }

    const bookingId = this.selectedBookingId();
    if (!bookingId) return;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      alert('Admin user ID not found. Please log in again.');
      return;
    }

    const req: AdminContractUploadRequest = {
      bookingId: bookingId,
      contractPdf: this.selectedFile()!,
      adminUserId: currentUser.id
    };

    this.contractService.adminUploadContract(req).subscribe({
      next: (contract) => {
        alert('Contract uploaded successfully');
        this.closeUploadModal();
        this.loadContracts();
      },
      error: (err) => {
        console.error('Error uploading contract:', err);
        alert('Failed to upload contract. Please try again.');
      }
    });
  }

  approveContract() {
    if (this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    const contractId = this.selectedContract()?.contractId;
    const bookingId = this.selectedContract()?.bookingId;
    if (!contractId || !bookingId) return;

    const notes = this.approvalForm.value.notes || '';

    this.contractService.adminApprove(bookingId, notes).subscribe({
      next: () => {
        // Update booking status to APPROVED (6)
        this.bookingService.update({
          bookingId: bookingId,
          startDate: '', // Will be filled by backend
          endDate: '',   // Will be filled by backend
          bookingStatus: 6
        }).subscribe({
          next: () => {
            alert('Contract approved successfully. Amount transferred to landlord.');
            this.closeModal();
            this.loadContracts();
          },
          error: (err) => {
            console.error('Error updating booking status:', err);
            alert('Contract approved but failed to update booking status.');
            this.closeModal();
          }
        });
      },
      error: (err) => {
        console.error('Error approving contract:', err);
        alert('Failed to approve contract. Please try again.');
      }
    });
  }

  rejectContract() {
    if (this.rejectionForm.invalid) {
      this.rejectionForm.markAllAsTouched();
      return;
    }

    const contractId = this.selectedContract()?.contractId;
    const bookingId = this.selectedContract()?.bookingId;
    if (!contractId || !bookingId) return;

    const notes = this.rejectionForm.value.notes || '';

    this.contractService.adminReject(bookingId, notes).subscribe({
      next: () => {
        // Update booking status to REJECTED (7)
        this.bookingService.update({
          bookingId: bookingId,
          startDate: '', // Will be filled by backend
          endDate: '',   // Will be filled by backend
          bookingStatus: 7
        }).subscribe({
          next: () => {
            alert('Contract rejected. Amount transferred back to student.');
            this.closeModal();
            this.loadContracts();
          },
          error: (err) => {
            console.error('Error updating booking status:', err);
            alert('Contract rejected but failed to update booking status.');
            this.closeModal();
          }
        });
      },
      error: (err) => {
        console.error('Error rejecting contract:', err);
        alert('Failed to reject contract. Please try again.');
      }
    });
  }
}
