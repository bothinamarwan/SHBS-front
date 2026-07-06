import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../core/models/booking.model';
import { LandlordService } from '../../../../core/services/landlord.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-student-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-bookings.html',
  styleUrl: './student-bookings.css',
})
export class StudentBookings implements OnInit {
  private bookingService = inject(BookingService);
  private landlordService = inject(LandlordService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.fetchMyBookings();
  }

  fetchMyBookings() {
    this.isLoading.set(true);
    this.bookingService.getBookings().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: async (res: any) => {
        let bookings: Booking[] = [];
        if (Array.isArray(res)) {
          bookings = res;
        } else if (res?.records) {
          bookings = res.records;
        }

        // Enrich bookings with landlord names
        const enrichedBookings = await this.enrichBookingsWithLandlordNames(bookings);
        this.bookings.set(enrichedBookings);
      },
      error: (err: any) => console.error('Error fetching bookings', err)
    });
  }

  private async enrichBookingsWithLandlordNames(bookings: Booking[]): Promise<Booking[]> {
    console.log('Enriching bookings with landlord names. Bookings:', bookings);
    const enriched = await Promise.all(bookings.map(async (booking) => {
      console.log('Processing booking:', booking.bookingId, 'landlordId:', booking.landlordId);

      // Fetch landlord name if landlordId exists
      if (booking.landlordId && !booking.landlordName) {
        try {
          console.log('Fetching landlord for ID:', booking.landlordId);
          const landlord = await this.landlordService.getById(booking.landlordId).toPromise();
          console.log('Landlord response:', landlord);
          if (landlord) {
            booking.landlordName = landlord.fullName;
            console.log('Set landlord name:', booking.landlordName);
          } else {
            console.log('Landlord response was null/undefined');
          }
        } catch (e) {
          console.error('Failed to fetch landlord name for booking:', booking.bookingId, e);
        }
      } else {
        console.log('No landlordId or landlordName already set for booking:', booking.bookingId);
      }

      return booking;
    }));

    console.log('Enriched bookings:', enriched);
    return enriched;
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
