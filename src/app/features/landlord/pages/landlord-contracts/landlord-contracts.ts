import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../../../../core/services/contract.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Contract, LandlordSignatureRequest, ContractStatus } from '../../../../core/models/contract.model';

@Component({
  selector: 'app-landlord-contracts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landlord-contracts.html'
})
export class LandlordContracts implements OnInit {
  private contractService = inject(ContractService);
  private bookingService = inject(BookingService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  contracts = signal<Contract[]>([]);
  isLoading = signal(true);
  selectedContract = signal<Contract | null>(null);
  isModalOpen = signal(false);
  isSigning = signal(false);
  contractSigned = signal(false);

  signatureForm: FormGroup;

  constructor() {
    this.signatureForm = this.fb.group({
      signedPdfUrl: ['', Validators.required]
    });
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

  openSignModal(contract: Contract) {
    this.selectedContract.set(contract);
    this.isModalOpen.set(true);
    this.signatureForm.reset();
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedContract.set(null);
  }

  signContract() {
    if (this.signatureForm.invalid) {
      this.signatureForm.markAllAsTouched();
      return;
    }

    const contractId = this.selectedContract()?.contractId;
    const bookingId = this.selectedContract()?.bookingId;
    if (!contractId || !bookingId) return;

    this.isSigning.set(true);

    const req: LandlordSignatureRequest = {
      signedPdfUrl: this.signatureForm.value.signedPdfUrl
    };

    this.contractService.landlordSign(contractId, req).subscribe({
      next: (updatedContract) => {
        this.isSigning.set(false);
        this.contractSigned.set(true);
        this.contracts.set(this.contracts().map(c => c.contractId === updatedContract.contractId ? updatedContract : c));

        // Update booking status based on contract status
        // If contract status is WAITING_STUDENT_SIGNATURE (2) → booking status 4
        // If contract status is WAITING_ADMIN_APPROVAL (4) → booking status 5
        let newBookingStatus = 4; // Default to WAITING_STUDENT_SIGNATURE
        if (updatedContract.status === ContractStatus.WaitingForAdminApproval) {
          newBookingStatus = 5; // WAITING_ADMIN_APPROVAL
        }

        // Update booking status via booking service
        this.bookingService.update({
          bookingId: bookingId,
          startDate: '', // Will be filled by backend
          endDate: '',   // Will be filled by backend
          bookingStatus: newBookingStatus
        }).subscribe({
          next: () => {
            alert('Contract signed successfully. Waiting for student signature.');
            this.closeModal();
            this.loadContracts();
          },
          error: (err) => {
            console.error('Error updating booking status:', err);
            alert('Contract signed but failed to update booking status.');
            this.closeModal();
            this.loadContracts();
          }
        });
      },
      error: (err) => {
        this.isSigning.set(false);
        console.error('Error signing contract:', err);
        alert('Failed to sign contract. Please try again.');
      }
    });
  }

  downloadContract() {
    const pdfUrl = this.selectedContract()?.originalContractPdfPath;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  }

  getContractStatusLabel(status: ContractStatus): string {
    const labels: Record<ContractStatus, string> = {
      [ContractStatus.WaitingForUpload]: 'Waiting for Upload',
      [ContractStatus.WaitingForSignatures]: 'Waiting for Signatures',
      [ContractStatus.WaitingForStudentSignature]: 'Waiting for Student',
      [ContractStatus.WaitingForLandlordSignature]: 'Waiting for Your Signature',
      [ContractStatus.WaitingForAdminApproval]: 'Waiting for Admin Approval',
      [ContractStatus.Approved]: 'Approved',
      [ContractStatus.Rejected]: 'Rejected',
      [ContractStatus.Archived]: 'Archived'
    };
    return labels[status] || 'Unknown';
  }

  getStatusClass(status: ContractStatus): string {
    const map: Record<ContractStatus, string> = {
      [ContractStatus.WaitingForUpload]: 'status-badge--draft',
      [ContractStatus.WaitingForSignatures]: 'status-badge--draft',
      [ContractStatus.WaitingForStudentSignature]: 'status-badge--draft',
      [ContractStatus.WaitingForLandlordSignature]: 'status-badge--signed',
      [ContractStatus.WaitingForAdminApproval]: 'status-badge--signed',
      [ContractStatus.Approved]: 'status-badge--signed',
      [ContractStatus.Rejected]: 'status-badge--expired',
      [ContractStatus.Archived]: 'status-badge--expired'
    };
    return map[status] || '';
  }

  canSign(contract: Contract): boolean {
    return contract.status === ContractStatus.WaitingForLandlordSignature && !contract.isLandlordSigned;
  }
}
