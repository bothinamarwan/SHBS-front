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
    const map: Record<number, string> = {
      0: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      1: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      3: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      4: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      5: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
      6: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      7: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      8: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    };
    return map[status] || 'bg-slate-100 text-slate-700';
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
}
