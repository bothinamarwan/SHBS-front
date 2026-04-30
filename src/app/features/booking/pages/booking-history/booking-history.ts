import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-history.html'
})
export class BookingHistory implements OnInit {
  private bookingService = inject(BookingService);
  private route = inject(ActivatedRoute);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  showSuccess = signal(false);
  latestBookingId = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.showSuccess.set(true);
        this.latestBookingId.set(params['bookingId']);
      }
    });
    this.loadBookings();
  }

  loadBookings() {
    this.isLoading.set(true);
    this.bookingService.getBookings().subscribe(data => {
      this.bookings.set(data);
      this.isLoading.set(false);
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'rejected': return 'bg-rose-50 text-rose-600';
      default: return 'bg-neutral-50 text-neutral-600';
    }
  }
}
