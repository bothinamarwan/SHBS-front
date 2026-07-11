import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../../core/models/booking.model';
import { LandlordService } from '../../../../core/services/landlord.service';
import { ContractService } from '../../../../core/services/contract.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-student-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-bookings.html',
  styleUrl: './student-bookings.css',
})
export class StudentBookings implements OnInit {
  private bookingService = inject(BookingService);
  private landlordService = inject(LandlordService);
  private contractService = inject(ContractService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.fetchMyBookings();
  }

  fetchMyBookings() {
    this.isLoading.set(true);
    // Use getAll() instead of getBookings() to get consistent data with admin
    this.bookingService.getAll().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: async (res: any) => {
        console.log('Student bookings response:', res);
        let bookings: Booking[] = [];
        if (Array.isArray(res)) {
          bookings = res;
        } else if (res?.records) {
          bookings = res.records;
        }

        // Filter bookings for current student
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const studentId = user?.studentId || user?.id || user?.userId;
        console.log('Current user:', user, 'studentId:', studentId);
        console.log('All bookings before filter:', bookings);
        
        if (studentId) {
          bookings = bookings.filter(b => b.studentId === studentId || b.studentId === user?.userId || b.studentId === user?.id);
        }

        console.log('Filtered bookings for student:', bookings);
        bookings.forEach(b => {
          const statusNum = typeof b.bookingStatus === 'string' ? parseInt(b.bookingStatus) : b.bookingStatus;
          console.log(`Booking ${b.bookingId}: rawStatus=${b.bookingStatus} (${typeof b.bookingStatus}), parsedStatus=${statusNum}, label=${this.getStatusLabel(statusNum)}`);
        });

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

  getStatusLabel(status: number | string): string {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    console.log('getStatusLabel - input status:', status, 'parsed statusNum:', statusNum);
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
    const result = map[statusNum] || 'Unknown';
    console.log('getStatusLabel - result:', result);
    return result;
  }

  getStatusClass(status: number | string): string {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
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
    return map[statusNum] || 'bg-slate-100 text-slate-700';
  }

  getStatusIcon(status: number | string): string {
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    const map: Record<number, string> = {
      0: 'fa-clock',
      1: 'fa-file',
      2: 'fa-pen',
      3: 'fa-signature',
      4: 'fa-user-pen',
      5: 'fa-search',
      6: 'fa-check-double',
      7: 'fa-times-circle',
      8: 'fa-ban'
    };
    return map[statusNum] || 'fa-question-circle';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  downloadContractPdf(bookingId: string) {
    // First get contract by booking ID, then download PDF using contract ID
    this.contractService.getByBookingId(bookingId).subscribe({
      next: (contract) => {
        if (!contract) {
          alert('Contract not found for this booking.');
          return;
        }
        this.contractService.getPdf(contract.contractId).subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Contract_${contract.contractId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          },
          error: (err) => {
            console.error('Error downloading contract PDF:', err);
            alert('Failed to download contract PDF. Please try again.');
          }
        });
      },
      error: (err) => {
        console.error('Error fetching contract:', err);
        alert('Contract not found for this booking.');
      }
    });
  }

  canDownloadContract(status: number | string): boolean {
    // Temporarily always return true to test button visibility
    return true;
  }
}
