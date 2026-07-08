import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractService } from '../../../../core/services/contract.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Contract, StudentSignatureRequest } from '../../../../core/models/contract.model';

@Component({
  selector: 'app-student-contract',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-contract.html'
})
export class StudentContract implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contractService = inject(ContractService);
  private bookingService = inject(BookingService);
  private fb = inject(FormBuilder);

  contract = signal<Contract | null>(null);
  isLoading = signal(true);
  isSigning = signal(false);
  contractSigned = signal(false);

  signatureForm: FormGroup;

  constructor() {
    this.signatureForm = this.fb.group({
      signedPdfUrl: ['', Validators.required]
    });
  }

  ngOnInit() {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(contractId);
    } else {
      this.isLoading.set(false);
      alert('Contract ID not provided');
      this.router.navigate(['/student/bookings']);
    }
  }

  loadContract(contractId: string) {
    this.contractService.getById(contractId).subscribe({
      next: (contract) => {
        this.contract.set(contract);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading contract:', err);
        this.isLoading.set(false);
        alert('Failed to load contract');
        this.router.navigate(['/student/bookings']);
      }
    });
  }

  signContract() {
    if (this.signatureForm.invalid) {
      this.signatureForm.markAllAsTouched();
      return;
    }

    const contractId = this.contract()?.contractId;
    const bookingId = this.contract()?.bookingId;
    if (!contractId || !bookingId) return;

    this.isSigning.set(true);

    const req: StudentSignatureRequest = {
      signedPdfUrl: this.signatureForm.value.signedPdfUrl
    };

    this.contractService.studentSign(contractId, req).subscribe({
      next: (updatedContract) => {
        this.isSigning.set(false);
        this.contractSigned.set(true);
        this.contract.set(updatedContract);

        // Update booking status based on contract status
        // If contract status is WAITING_LANDLORD_SIGNATURE (2) → booking status 8
        // If contract status is WAITING_ADMIN_REVIEW (3) → booking status 9
        let newBookingStatus = 8; // Default to WAITING_LANDLORD_SIGNATURE
        if (updatedContract.status === 3) {
          newBookingStatus = 9; // UNDER_REVIEW
        }

        // Update booking status via booking service
        this.bookingService.update({
          bookingId: bookingId,
          startDate: '', // Will be filled by backend
          endDate: '',   // Will be filled by backend
          bookingStatus: newBookingStatus
        }).subscribe({
          next: () => {
            alert('Contract signed successfully. Waiting for landlord signature.');
            setTimeout(() => {
              this.router.navigate(['/student/bookings']);
            }, 2000);
          },
          error: (err) => {
            console.error('Error updating booking status:', err);
            alert('Contract signed but failed to update booking status.');
            setTimeout(() => {
              this.router.navigate(['/student/bookings']);
            }, 2000);
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
    const pdfUrl = this.contract()?.contractPdfUrl;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  }
}
