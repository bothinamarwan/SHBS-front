import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LandlordService } from '../../../../core/services/landlord.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../core/models/booking.model';

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

  activeFilter = signal<BookingFilter>('all');
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);

  // Bookings from API
  allBookings = signal<(Booking & { studentName?: string; propertyTitle?: string })[]>([]);

  filters: { label: string; value: BookingFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 0 },
    { label: 'Approved', value: 1 },
    { label: 'Rejected', value: 2 },
    { label: 'Cancelled', value: 3 },
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
        this.allBookings.set(bookings);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openDetail(booking: Booking & { studentName?: string; propertyTitle?: string }) {
    this.detailBooking.set(booking);
    this.isDetailOpen.set(true);
  }
  closeDetail() { this.isDetailOpen.set(false); }

  approveBooking(booking: Booking & { studentName?: string; propertyTitle?: string }) {
    // Only allow approval if payment has been completed (status 4 = Paid)
    if (booking.bookingStatus !== 4) {
      alert('Cannot approve booking: Payment has not been completed yet.');
      return;
    }

    this.actionLoading.set(booking.bookingId + '_approve');
    this.bookingService.update({
      bookingId: booking.bookingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      bookingStatus: 1
    }).subscribe({
      complete: () => this.finalizeAction(booking.bookingId, 1),
      error: () => this.finalizeAction(booking.bookingId, 1) // optimistic
    });
  }

  rejectBooking(booking: Booking & { studentName?: string; propertyTitle?: string }) {
    this.actionLoading.set(booking.bookingId + '_reject');
    this.bookingService.update({
      bookingId: booking.bookingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      bookingStatus: 2
    }).subscribe({
      complete: () => this.finalizeAction(booking.bookingId, 2),
      error: () => this.finalizeAction(booking.bookingId, 2) // optimistic
    });
  }

  finalizeAction(id: string, newStatus: number) {
    this.allBookings.update(prev =>
      prev.map(b => b.bookingId === id ? { ...b, bookingStatus: newStatus } : b)
    );
    this.actionLoading.set(null);
    if (this.isDetailOpen() && this.detailBooking()?.bookingId === id) {
      this.detailBooking.update(b => b ? { ...b, bookingStatus: newStatus } : b);
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
    this.isSigning.set(true);
    setTimeout(() => {
      this.isSigning.set(false);
      this.contractSigned.set(true);
      // Mark booking as confirmed locally (status 4)
      const bId = this.selectedBooking()?.bookingId;
      if (bId) {
        this.allBookings.update(prev =>
          prev.map(b => b.bookingId === bId ? { ...b, bookingStatus: 4 } : b)
        );
      }
    }, 1500);
  }

  getStatusClass(status: number): string {
    const map: Record<number, string> = {
      0: 'status-badge--pending',
      1: 'status-badge--approved',
      2: 'status-badge--rejected',
      3: 'status-badge--cancelled',
      4: 'status-badge--signed'
    };
    return map[status] || '';
  }
  
  getStatusLabel(status: number): string {
    const map: Record<number, string> = {
      0: 'Pending',
      1: 'Approved',
      2: 'Rejected',
      3: 'Cancelled',
      4: 'Confirmed'
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
