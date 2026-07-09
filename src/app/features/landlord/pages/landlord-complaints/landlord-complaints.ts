import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { HousingService } from '../../../../core/services/housing.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Complaint, ComplaintStatus } from '../../../../core/models/complaint.model';
import { HousingUnit } from '../../../../core/models/housing.model';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-landlord-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './landlord-complaints.html'
})
export class LandlordComplaints implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private feedbackService = inject(FeedbackService);
  private housingService = inject(HousingService);
  private bookingService = inject(BookingService);

  complaintForm: FormGroup;
  housings = signal<HousingUnit[]>([]);
  bookings = signal<Booking[]>([]);
  complaints = signal<Complaint[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  ComplaintStatus = ComplaintStatus;

  constructor() {
    this.complaintForm = this.fb.group({
      housingUnitId: ['', Validators.required],
      studentId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit() {
    this.loadHousings();
    this.loadBookings();
    this.loadComplaints();
  }

  loadHousings() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const landlordId = user?.landlordId || user?.id;

    this.housingService.getAll().subscribe({
      next: (data) => {
        // Filter housings belonging to this landlord
        this.housings.set(data.filter(h => h.landLordId === landlordId));
      },
      error: (err) => {
        console.error('Failed to load housings', err);
      }
    });
  }

  loadBookings() {
    this.bookingService.getAll().subscribe({
      next: (data) => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const landlordId = user?.landlordId || user?.id;
        
        // Filter bookings for landlord's properties
        const landlordHousingIds = this.housings().map(h => h.housingUnitId);
        this.bookings.set(data.filter((b: Booking) => b.housingUnitId && landlordHousingIds.includes(b.housingUnitId)));
      },
      error: (err) => {
        console.error('Failed to load bookings', err);
      }
    });
  }

  loadComplaints() {
    this.feedbackService.getComplaints().subscribe({
      next: (data) => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const landlordId = user?.landlordId || user?.id;
        
        // Filter complaints for landlord's properties
        const landlordHousingIds = this.housings().map(h => h.housingUnitId);
        this.complaints.set(data.filter(c => landlordHousingIds.includes(c.housingUnitId)));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load complaints', err);
        this.errorMessage.set('Failed to load complaints. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  submitComplaint() {
    if (this.complaintForm.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.complaintForm.value;

    // Pass the selected studentId for landlord complaints
    this.feedbackService.submitComplaint({
      title: formValue.title,
      housingUnitId: formValue.housingUnitId,
      description: formValue.description,
      studentId: formValue.studentId
    }).subscribe({
      next: (complaint) => {
        this.complaints.update(prev => [complaint, ...prev]);
        this.complaintForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Failed to submit complaint', err);
        this.errorMessage.set('Failed to submit complaint. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  onHousingChange(housingUnitId: string) {
    // When housing changes, reset student selection
    this.complaintForm.patchValue({ studentId: '' });
  }

  getStudentsForHousing(housingUnitId: string): Booking[] {
    return this.bookings().filter(b => b.housingUnitId === housingUnitId);
  }

  getStudentName(studentId: string): string {
    const booking = this.bookings().find(b => b.studentId === studentId);
    return booking?.studentName || 'Unknown Student';
  }

  getStatusLabel(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.Open: return 'Open';
      case ComplaintStatus.InInvestigation: return 'In Investigation';
      case ComplaintStatus.Resolved: return 'Resolved';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.Open: return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case ComplaintStatus.InInvestigation: return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case ComplaintStatus.Resolved: return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-neutral-50 text-neutral-700 dark:bg-neutral-900/20 dark:text-neutral-400';
    }
  }

  getHousingTitle(housingUnitId: string): string {
    const housing = this.housings().find(h => h.housingUnitId === housingUnitId);
    return housing?.title || 'Unknown Property';
  }
}
