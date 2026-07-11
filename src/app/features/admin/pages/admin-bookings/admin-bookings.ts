import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../../core/services/booking.service';
import { ContractService } from '../../../../core/services/contract.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminService } from '../../../../core/services/admin.service';
import { Booking } from '../../../../core/models/booking.model';
import { LandlordService } from '../../../../core/services/landlord.service';
import { StudentService } from '../../../../core/services/student.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-bookings.html'
})
export class AdminBookings implements OnInit {
  private bookingService = inject(BookingService);
  private landlordService = inject(LandlordService);
  private studentService = inject(StudentService);
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  
  isUploadModalOpen = signal(false);
  selectedBookingId = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // Approval modal state
  isApprovalModalOpen = signal(false);
  approvalAction = signal<'approve' | 'reject'>('approve');
  approvalBooking = signal<Booking | null>(null);
  adminNotes = signal('');
  isSubmitting = signal(false);
  toastMessage = signal<{ text: string; success: boolean } | null>(null);

  ngOnInit() {
    this.fetchBookings();
  }

  get adminUserId(): string {
    return this.authService.currentUserValue?.id || '';
  }

  fetchBookings() {
    this.isLoading.set(true);
    this.bookings.set([]);
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

        const enrichedBookings = await this.enrichBookingsWithNames(bookings);
        this.bookings.set(enrichedBookings);
      },
      error: (err) => console.error('Error fetching bookings', err)
    });
  }

  private async enrichBookingsWithNames(bookings: Booking[]): Promise<Booking[]> {
    const enriched = await Promise.all(bookings.map(async (booking) => {
      if (booking.landlordId && !booking.landlordName) {
        try {
          const landlord = await this.landlordService.getById(booking.landlordId).toPromise();
          if (landlord) {
            booking.landlordName = landlord.fullName;
          }
        } catch (e) {}
      }

      if (booking.studentId && !booking.studentName) {
        try {
          const student = await this.studentService.getStudentById(booking.studentId).toPromise();
          if (student) {
            booking.studentName = student.fullName;
          }
        } catch (e) {}
      }

      return booking;
    }));

    return enriched;
  }

  // --- Approval Modal ---
  openApprovalModal(booking: Booking, action: 'approve' | 'reject') {
    this.approvalBooking.set(booking);
    this.approvalAction.set(action);
    this.adminNotes.set('');
    this.isApprovalModalOpen.set(true);
  }

  closeApprovalModal() {
    this.isApprovalModalOpen.set(false);
    this.approvalBooking.set(null);
  }

  submitBookingApproval() {
    const booking = this.approvalBooking();
    if (!booking) return;

    this.isSubmitting.set(true);
    const isApproved = this.approvalAction() === 'approve';

    this.adminService.approveBooking(booking.bookingId, {
      contractId: booking.contractId || '',
      adminUserId: this.adminUserId,
      adminNotes: this.adminNotes(),
      isApproved: isApproved
    }).subscribe({
      next: () => {
        this.showToast(`Booking ${isApproved ? 'approved' : 'rejected'} successfully`, true);
        this.closeApprovalModal();
        this.fetchBookings();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Booking approval error:', err);
        this.showToast(`Failed to ${isApproved ? 'approve' : 'reject'} booking`, false);
        this.isSubmitting.set(false);
      }
    });
  }

  cancelBooking(id: string) {
    if (confirm('Are you sure you want to completely cancel this booking? This action cannot be undone.')) {
      this.bookingService.cancel(id).subscribe({
        next: () => this.fetchBookings(),
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
  }

  private showToast(text: string, success: boolean) {
    this.toastMessage.set({ text, success });
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
