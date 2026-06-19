import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LandlordService } from '../../../../core/services/landlord.service';
import { Booking, RentalContract } from '../../../../core/models/booking.model';

type BookingFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

@Component({
  selector: 'app-landlord-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landlord-bookings.html'
})
export class LandlordBookings {
  private landlordService = inject(LandlordService);

  activeFilter = signal<BookingFilter>('all');
  isLoading = signal(false);
  actionLoading = signal<string | null>(null);

  // Mock bookings — in production would come from API
  allBookings = signal<(Booking & { studentName: string; propertyTitle: string })[]>([
    {
      id: 'BK-001', studentId: 'S1', housingId: '1',
      housingTitle: 'Premium Student Studio', roomId: 'r1', roomName: 'Master Studio',
      moveInDate: '2026-07-01', duration: 6, totalPrice: 33000,
      status: 'pending', bookingDate: '2026-06-17', createdAt: '2026-06-17',
      studentName: 'Ahmed Hassan', propertyTitle: 'Premium Student Studio'
    },
    {
      id: 'BK-002', studentId: 'S2', housingId: '2',
      housingTitle: 'Cozy Shared Suite', roomId: 'r2', roomName: 'Twin Room',
      moveInDate: '2026-07-15', duration: 4, totalPrice: 12800,
      status: 'pending', bookingDate: '2026-06-16', createdAt: '2026-06-16',
      studentName: 'Sara Ali', propertyTitle: 'Cozy Shared Suite'
    },
    {
      id: 'BK-003', studentId: 'S3', housingId: '1',
      housingTitle: 'Premium Student Studio', roomId: 'r1', roomName: 'Master Studio',
      moveInDate: '2026-06-01', duration: 3, totalPrice: 16500,
      status: 'approved', bookingDate: '2026-05-20', createdAt: '2026-05-20',
      studentName: 'Nour Ibrahim', propertyTitle: 'Premium Student Studio'
    },
    {
      id: 'BK-004', studentId: 'S4', housingId: '2',
      housingTitle: 'Cozy Shared Suite', roomId: 'r2', roomName: 'Twin Room',
      moveInDate: '2026-05-01', duration: 3, totalPrice: 9600,
      status: 'rejected', bookingDate: '2026-04-25', createdAt: '2026-04-25',
      studentName: 'Mohamed Khaled', propertyTitle: 'Cozy Shared Suite'
    },
    {
      id: 'BK-005', studentId: 'S5', housingId: '1',
      housingTitle: 'Premium Student Studio', roomId: 'r1', roomName: 'Master Studio',
      moveInDate: '2026-08-01', duration: 12, totalPrice: 66000,
      status: 'cancelled', bookingDate: '2026-06-10', createdAt: '2026-06-10',
      studentName: 'Layla Mostafa', propertyTitle: 'Premium Student Studio'
    },
  ]);

  filters: { label: string; value: BookingFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  filteredBookings = computed(() => {
    const f = this.activeFilter();
    const all = this.allBookings();
    return f === 'all' ? all : all.filter(b => b.status === f);
  });

  pendingCount = computed(() => this.allBookings().filter(b => b.status === 'pending').length);

  // Contract signing state
  selectedBooking = signal<(Booking & { studentName: string; propertyTitle: string }) | null>(null);
  isContractOpen = signal(false);
  landlordSignature = signal('');
  isSigning = signal(false);
  contractSigned = signal(false);

  // Detail drawer
  detailBooking = signal<(Booking & { studentName: string; propertyTitle: string }) | null>(null);
  isDetailOpen = signal(false);

  openDetail(booking: Booking & { studentName: string; propertyTitle: string }) {
    this.detailBooking.set(booking);
    this.isDetailOpen.set(true);
  }
  closeDetail() { this.isDetailOpen.set(false); }

  approveBooking(booking: Booking & { studentName: string; propertyTitle: string }) {
    this.actionLoading.set(booking.id + '_approve');
    this.landlordService.approveBooking(booking.id).subscribe({
      complete: () => this.finalizeAction(booking.id, 'approved'),
      error: () => this.finalizeAction(booking.id, 'approved') // optimistic
    });
  }

  rejectBooking(booking: Booking & { studentName: string; propertyTitle: string }) {
    this.actionLoading.set(booking.id + '_reject');
    this.landlordService.rejectBooking(booking.id).subscribe({
      complete: () => this.finalizeAction(booking.id, 'rejected'),
      error: () => this.finalizeAction(booking.id, 'rejected') // optimistic
    });
  }

  finalizeAction(id: string, newStatus: Booking['status']) {
    this.allBookings.update(prev =>
      prev.map(b => b.id === id ? { ...b, status: newStatus } : b)
    );
    this.actionLoading.set(null);
    if (this.isDetailOpen() && this.detailBooking()?.id === id) {
      this.detailBooking.update(b => b ? { ...b, status: newStatus } : b);
    }
  }

  openContractModal(booking: Booking & { studentName: string; propertyTitle: string }) {
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
      // Mark booking as confirmed locally
      const bId = this.selectedBooking()?.id;
      if (bId) {
        this.allBookings.update(prev =>
          prev.map(b => b.id === bId ? { ...b, status: 'confirmed' as any } : b)
        );
      }
    }, 1500);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-badge--pending',
      approved: 'status-badge--approved',
      rejected: 'status-badge--rejected',
      cancelled: 'status-badge--cancelled',
      confirmed: 'status-badge--signed'
    };
    return map[status] || '';
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
