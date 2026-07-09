import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LandlordService } from '../../../../core/services/landlord.service';
import { BookingService } from '../../../../core/services/booking.service';
import { ContractService } from '../../../../core/services/contract.service';
import { Booking } from '../../../../core/models/booking.model';
import { LandlordSignatureRequest } from '../../../../core/models/contract.model';

type BookingFilter = 'all' | number;

@Component({
  selector: 'app-landlord-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landlord-bookings.html'
})
export class LandlordBookings implements OnInit {
  private landlordService = inject(LandlordService);
  private bookingService = inject(BookingService);
  private contractService = inject(ContractService);

  activeFilter = signal<BookingFilter>('all');
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);

  // Bookings from API
  allBookings = signal<(Booking & { studentName?: string; propertyTitle?: string })[]>([]);

  filters: { label: string; value: BookingFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending Payment', value: 0 },
    { label: 'Waiting for Contract', value: 1 },
    { label: 'Waiting for Signatures', value: 2 },
    { label: 'Waiting for Landlord Signature', value: 4 },
    { label: 'Waiting for Admin Approval', value: 5 },
    { label: 'Approved', value: 6 },
    { label: 'Rejected', value: 7 },
    { label: 'Cancelled', value: 8 },
  ];

  filteredBookings = computed(() => {
    const f = this.activeFilter();
    const all = this.allBookings();
    return f === 'all' ? all : all.filter(b => b.bookingStatus === f);
  });

  pendingCount = computed(() => this.allBookings().filter(b => b.bookingStatus === 0).length);

  // Contract signing state
  selectedBooking = signal<(Booking & { studentName?: string; propertyTitle?: string }) | null>(null);
  isContractOpen = signal(false);
  landlordSignature = signal('');
  isSigning = signal(false);
  contractSigned = signal(false);

  // Detail drawer
  detailBooking = signal<(Booking & { studentName?: string; propertyTitle?: string }) | null>(null);
  isDetailOpen = signal(false);

  ngOnInit() {
    // Assuming landlordService.getMyBookings() returns Booking objects mapped to the new schema
    this.landlordService.getMyBookings().subscribe({
      next: (bookings: any[]) => {
        console.log('Landlord bookings from API:', bookings);
        this.allBookings.set(bookings);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching landlord bookings:', err);
        this.isLoading.set(false);
      }
    });
  }

  openDetail(booking: Booking & { studentName?: string; propertyTitle?: string }) {
    this.detailBooking.set(booking);
    this.isDetailOpen.set(true);
  }
  closeDetail() { this.isDetailOpen.set(false); }

  cancelBooking(id: string) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.actionLoading.set(id + '_cancel');
      this.bookingService.cancel(id).subscribe({
        next: () => {
          this.allBookings.update(prev =>
            prev.map(b => b.bookingId === id ? { ...b, bookingStatus: 8 } : b)
          );
          this.actionLoading.set(null);
        },
        error: (err) => {
          console.error('Error cancelling booking', err);
          this.actionLoading.set(null);
          alert('Failed to cancel booking');
        }
      });
    }
  }

  openContractModal(booking: Booking & { studentName?: string; propertyTitle?: string }) {
    this.selectedBooking.set(booking);
    this.landlordSignature.set('');
    this.contractSigned.set(false);
    this.isContractOpen.set(true);
  }

  closeContract() { this.isContractOpen.set(false); }

  signContract() {
    if (!this.landlordSignature().trim()) return;
    const contractId = this.selectedBooking()?.contractId;
    const bookingId = this.selectedBooking()?.bookingId;
    if (!contractId || !bookingId) {
      alert('Contract ID or Booking ID not found');
      return;
    }

    this.isSigning.set(true);

    const req: LandlordSignatureRequest = {
      signedPdfUrl: this.landlordSignature()
    };

    this.contractService.landlordSign(contractId, req).subscribe({
      next: (updatedContract) => {
        this.isSigning.set(false);
        this.contractSigned.set(true);

        // Update booking status based on contract status
        // If contract status is WAITING_STUDENT_SIGNATURE (2) → booking status 3
        // If contract status is WAITING_ADMIN_APPROVAL (4) → booking status 5
        let newBookingStatus = 3; // Default to WAITING_STUDENT_SIGNATURE
        if (updatedContract.status === 4) {
          newBookingStatus = 5; // WAITING_ADMIN_APPROVAL
        }

        // Update booking status via booking service
        this.bookingService.update({
          bookingId: bookingId,
          startDate: this.selectedBooking()?.startDate || '',
          endDate: this.selectedBooking()?.endDate || '',
          bookingStatus: newBookingStatus
        }).subscribe({
          next: () => {
            this.allBookings.update(prev =>
              prev.map(b => b.bookingId === bookingId ? { ...b, bookingStatus: newBookingStatus } : b)
            );
            alert('Contract signed successfully.');
            this.closeContract();
          },
          error: (err) => {
            console.error('Error updating booking status:', err);
            alert('Contract signed but failed to update booking status.');
            this.closeContract();
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

  getStatusClass(status: number): string {
    const map: Record<number, string> = {
      0: 'status-badge--pending',
      1: 'status-badge--pending',
      2: 'status-badge--under-review',
      3: 'status-badge--under-review',
      4: 'status-badge--under-review',
      5: 'status-badge--under-review',
      6: 'status-badge--approved',
      7: 'status-badge--rejected',
      8: 'status-badge--cancelled'
    };
    return map[status] || '';
  }

  getStatusLabel(status: number): string {
    const map: Record<number, string> = {
      0: 'Pending Payment',
      1: 'Waiting for Contract',
      2: 'Waiting for Signatures',
      3: 'Waiting for Student Signature',
      4: 'Waiting for Landlord Signature',
      5: 'Waiting for Admin Approval',
      6: 'Approved',
      7: 'Rejected',
      8: 'Cancelled'
    };
    return map[status] || 'Unknown';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  }

  isActionLoading(id: string, type: string): boolean {
    return this.actionLoading() === `${id}_${type}`;
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
