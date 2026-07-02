import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentService } from '../../../../core/services/student.service';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-history.html'
})
export class BookingHistory implements OnInit {
  private studentService = inject(StudentService);
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
    this.studentService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1:
      case 4: return 'bg-emerald-50 text-emerald-600';
      case 0: return 'bg-amber-50 text-amber-600';
      case 2:
      case 3: return 'bg-rose-50 text-rose-600';
      default: return 'bg-neutral-50 text-neutral-600';
    }
  }

  getStatusLabel(status: number): string {
    const map: Record<number, string> = { 0: 'Pending', 1: 'Approved', 2: 'Rejected', 3: 'Cancelled', 4: 'Confirmed' };
    return map[status] || 'Unknown';
  }
}
