import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractService } from '../../../../core/services/contract.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Contract, AdminApprovalRequest, AdminRejectionRequest } from '../../../../core/models/contract.model';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-contracts.html'
})
export class AdminContracts implements OnInit {
  private contractService = inject(ContractService);
  private bookingService = inject(BookingService);
  private fb = inject(FormBuilder);

  contracts = signal<Contract[]>([]);
  isLoading = signal(true);
  selectedContract = signal<Contract | null>(null);
  isModalOpen = signal(false);

  approvalForm: FormGroup;
  rejectionForm: FormGroup;

  constructor() {
    this.approvalForm = this.fb.group({
      adminUserId: ['', Validators.required],
      notes: ['']
    });

    this.rejectionForm = this.fb.group({
      adminUserId: ['', Validators.required],
      notes: ['', Validators.required]
    });
  }

  ngOnInit() {
    // TODO: Fetch contracts that need admin review
    // For now, we'll need a getAllContracts endpoint or filter by status
    this.isLoading.set(false);
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

  approveContract() {
    if (this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    const contractId = this.selectedContract()?.contractId;
    const bookingId = this.selectedContract()?.bookingId;
    if (!contractId || !bookingId) return;

    const req: AdminApprovalRequest = {
      adminUserId: this.approvalForm.value.adminUserId,
      notes: this.approvalForm.value.notes
    };

    this.contractService.adminApprove(contractId, req).subscribe({
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
            // TODO: Refresh contracts list
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

    const req: AdminRejectionRequest = {
      adminUserId: this.rejectionForm.value.adminUserId,
      notes: this.rejectionForm.value.notes
    };

    this.contractService.adminReject(contractId, req).subscribe({
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
            // TODO: Refresh contracts list
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
