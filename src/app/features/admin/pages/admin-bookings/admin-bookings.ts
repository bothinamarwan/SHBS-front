import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../core/models/booking.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bookings.html'
})
export class AdminBookings implements OnInit {
  private bookingService = inject(BookingService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);

  ngOnInit() {
    this.fetchBookings();
  }

  fetchBookings() {
    this.isLoading.set(true);
    // Since we don't have paging parameters in the signature yet, we'll just call getAll() and handle response format
    this.bookingService.getAll().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        if (res && res.records) {
          this.bookings.set(res.records);
          this.totalRecords.set(res.totalRecords || res.records.length);
        } else if (Array.isArray(res)) {
          this.bookings.set(res);
          this.totalRecords.set(res.length);
        }
      },
      error: (err) => console.error('Error fetching bookings', err)
    });
  }

  updateStatus(booking: Booking, status: number) {
    if (confirm(`Are you sure you want to change this booking's status?`)) {
      this.bookingService.update({
        bookingId: booking.bookingId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        bookingStatus: status
      }).subscribe({
        next: () => {
          this.fetchBookings();
        },
        error: (err) => console.error('Error updating booking', err)
      });
    }
  }

  cancelBooking(id: string) {
    if (confirm('Are you sure you want to completely cancel this booking? This action cannot be undone.')) {
      this.bookingService.cancel(id).subscribe({
        next: () => {
          this.fetchBookings();
        },
        error: (err) => console.error('Error cancelling booking', err)
      });
    }
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

  getStatusClass(status: number): string {
    const map: Record<number, string> = {
      0: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      2: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      3: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      4: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
