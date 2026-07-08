import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../core/models/booking.model';
import { LandlordService } from '../../../../core/services/landlord.service';
import { StudentService } from '../../../../core/services/student.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bookings.html'
})
export class AdminBookings implements OnInit {
  private bookingService = inject(BookingService);
  private landlordService = inject(LandlordService);
  private studentService = inject(StudentService);

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
      next: async (res) => {
        let bookings: Booking[] = [];
        if (res && res.records) {
          bookings = res.records;
          this.totalRecords.set(res.totalRecords || res.records.length);
        } else if (Array.isArray(res)) {
          bookings = res;
          this.totalRecords.set(res.length);
        }

        // Enrich bookings with landlord and student names
        const enrichedBookings = await this.enrichBookingsWithNames(bookings);
        this.bookings.set(enrichedBookings);
      },
      error: (err) => console.error('Error fetching bookings', err)
    });
  }

  private async enrichBookingsWithNames(bookings: Booking[]): Promise<Booking[]> {
    const enriched = await Promise.all(bookings.map(async (booking) => {
      // Fetch landlord name if landlordId exists
      if (booking.landlordId && !booking.landlordName) {
        try {
          const landlord = await this.landlordService.getById(booking.landlordId).toPromise();
          if (landlord) {
            booking.landlordName = landlord.fullName;
          }
        } catch (e) {
          console.error('Failed to fetch landlord name for booking:', booking.bookingId, e);
        }
      }

      // Fetch student name if studentId exists
      if (booking.studentId && !booking.studentName) {
        try {
          const student = await this.studentService.getStudentById(booking.studentId).toPromise();
          if (student) {
            booking.studentName = student.fullName;
          }
        } catch (e) {
          console.error('Failed to fetch student name for booking:', booking.bookingId, e);
        }
      }

      return booking;
    }));

    return enriched;
  }

  updateStatus(booking: Booking, status: number) {
    // Prevent approval (status 1) unless payment is completed (status 4)
    if (status === 1 && booking.bookingStatus !== 4) {
      alert('Cannot approve booking: Payment has not been completed yet.');
      return;
    }

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
