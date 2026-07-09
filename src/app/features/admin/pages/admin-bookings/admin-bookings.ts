import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { ContractService } from '../../../../core/services/contract.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  private contractService = inject(ContractService);
  private authService = inject(AuthService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  
  isUploadModalOpen = signal(false);
  selectedBookingId = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

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

        console.log('Bookings from API:', bookings);
        bookings.forEach(b => {
          console.log(`Booking ${b.bookingId}: status=${b.bookingStatus}, label=${this.getStatusLabel(b.bookingStatus)}`);
        });

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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openUploadModal(bookingId: string) {
    this.selectedBookingId.set(bookingId);
    this.isUploadModalOpen.set(true);
    this.selectedFile.set(null);
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.selectedBookingId.set(null);
    this.selectedFile.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
      } else {
        alert('Please select a PDF file');
        this.selectedFile.set(null);
      }
    }
  }

  uploadContract() {
    if (!this.selectedFile()) {
      alert('Please select a PDF file');
      return;
    }

    const bookingId = this.selectedBookingId();
    if (!bookingId) return;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      alert('Admin user ID not found. Please log in again.');
      return;
    }

    // First update booking status to Waiting for Contract (1)
    this.bookingService.update({
      bookingId: bookingId,
      startDate: '', // Will be filled by backend
      endDate: '',   // Will be filled by backend
      bookingStatus: 1
    }).subscribe({
      next: () => {
        // Then upload the contract
        this.contractService.adminUploadContract({
          bookingId: bookingId,
          contractPdf: this.selectedFile()!,
          adminUserId: currentUser.id
        }).subscribe({
          next: (contract) => {
            alert('Contract uploaded successfully and sent to landlord and student');
            this.closeUploadModal();
            this.fetchBookings();
          },
          error: (err) => {
            console.error('Error uploading contract:', err);
            alert('Failed to upload contract. Please try again.');
          }
        });
      },
      error: (err) => {
        console.error('Error updating booking status:', err);
        alert('Failed to update booking status. Please try again.');
      }
    });
  }
}
