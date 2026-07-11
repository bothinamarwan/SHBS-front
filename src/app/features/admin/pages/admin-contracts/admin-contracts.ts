import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractService } from '../../../../core/services/contract.service';
import { BookingService } from '../../../../core/services/booking.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminApprovalService } from '../../../../core/services/admin-approval.service';
import { Contract, AdminContractUploadRequest, ContractStatus, ContractApprovalRequest, ContractRejectionRequest, PendingContract } from '../../../../core/models/contract.model';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-contracts.html'
})
export class AdminContracts implements OnInit {
  private contractService = inject(ContractService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private adminApprovalService = inject(AdminApprovalService);
  private fb = inject(FormBuilder);

  pendingContracts = signal<PendingContract[]>([]);
  isLoading = signal(true);
  selectedContract = signal<PendingContract | null>(null);
  isModalOpen = signal(false);
  isUploadModalOpen = signal(false);
  selectedBookingId = signal<string | null>(null);

  approvalForm: FormGroup;
  rejectionForm: FormGroup;
  uploadForm: FormGroup;
  selectedFile = signal<File | null>(null);

  contractsWaitingForUpload = computed(() => this.pendingContracts().filter(c => c.contractStatus === 0));
  contractsPendingReview = computed(() => this.pendingContracts().filter(c => c.contractStatus === 1 && c.isStudentSigned && c.isLandlordSigned && !c.isAdminApproved));

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
    this.adminApprovalService.getPendingContracts().subscribe({
      next: (contracts) => {
        console.log('Pending contracts from API:', contracts);
        this.pendingContracts.set(contracts);
        console.log('Contracts waiting for upload:', this.contractsWaitingForUpload());
        console.log('Contracts pending review:', this.contractsPendingReview());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading contracts:', err);
        this.isLoading.set(false);
      }
    });
  }

  openReviewModal(contract: PendingContract) {
    this.selectedContract.set(contract);
    this.isModalOpen.set(true);
    this.approvalForm.reset();
    this.rejectionForm.reset();
  }

  viewPdf(url: string | undefined) {
    if (!url) return;

    // Download PDF via ContractService to handle authentication
    this.contractService.getPdfByUrl(url).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      },
      error: (err: any) => {
        console.error('Error downloading PDF:', err);
        alert('Failed to open PDF. Please try again.');
      }
    });
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
    const contractId = this.selectedContract()?.contractId;
    const bookingId = this.selectedContract()?.bookingId;
    if (!contractId || !bookingId) return;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      alert('Admin user ID not found. Please log in again.');
      return;
    }

    const notes = this.approvalForm.value.notes || '';

    const req: ContractApprovalRequest = {
      contractId: contractId,
      adminUserId: currentUser.id,
      adminNotes: notes,
      isApproved: true
    };

    this.adminApprovalService.approveContract(req).subscribe({
      next: () => {
        alert('Contract approved successfully.');
        this.closeModal();
        this.loadContracts();
      },
      error: (err) => {
        console.error('Error approving contract:', err);
        alert('Failed to approve contract. Please try again.');
      }
    });
  }

  rejectContract() {
    console.log('Reject button clicked');
    console.log('Rejection form valid:', this.rejectionForm.valid);
    console.log('Rejection form value:', this.rejectionForm.value);

    if (this.rejectionForm.invalid) {
      this.rejectionForm.markAllAsTouched();
      alert('Please provide rejection notes.');
      return;
    }

    const contractId = this.selectedContract()?.contractId;
    const bookingId = this.selectedContract()?.bookingId;
    console.log('Contract ID:', contractId, 'Booking ID:', bookingId);

    if (!contractId || !bookingId) return;

    const currentUser = this.authService.currentUserValue;
    console.log('Current user:', currentUser);

    if (!currentUser || !currentUser.id) {
      alert('Admin user ID not found. Please log in again.');
      return;
    }

    const notes = this.rejectionForm.value.notes || '';
    console.log('Rejection notes:', notes);

    const req: ContractRejectionRequest = {
      contractId: contractId,
      adminUserId: currentUser.id,
      adminNotes: notes,
      isApproved: false
    };

    console.log('Reject request:', req);

    this.adminApprovalService.rejectContract(req).subscribe({
      next: () => {
        alert('Contract rejected successfully.');
        this.closeModal();
        this.loadContracts();
      },
      error: (err) => {
        console.error('Error rejecting contract:', err);
        alert('Failed to reject contract. Please try again.');
      }
    });
  }
}
