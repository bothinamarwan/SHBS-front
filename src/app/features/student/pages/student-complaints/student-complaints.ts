import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { HousingService } from '../../../../core/services/housing.service';
import { Complaint, ComplaintStatus } from '../../../../core/models/complaint.model';
import { HousingUnit } from '../../../../core/models/housing.model';
import { StudentVerifiedDirective } from '../../../../core/directives/student-verified.directive';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-student-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StudentVerifiedDirective],
  templateUrl: './student-complaints.html'
})
export class StudentComplaints implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private feedbackService = inject(FeedbackService);
  private housingService = inject(HousingService);
  private authService = inject(AuthService);

  complaintForm: FormGroup;
  housings = signal<HousingUnit[]>([]);
  complaints = signal<Complaint[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  ComplaintStatus = ComplaintStatus;

  isStudentVerified(): boolean {
    const user = this.authService.currentUserValue;
    return user?.role !== 'student' || user?.universityVerificationStatus !== 0;
  }

  constructor() {
    this.complaintForm = this.fb.group({
      housingUnitId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit() {
    this.loadHousings();
    this.loadComplaints();
  }

  loadHousings() {
    this.housingService.getAll().subscribe({
      next: (data) => {
        this.housings.set(data);
      },
      error: (err) => {
        console.error('Failed to load housings', err);
      }
    });
  }

  loadComplaints() {
    this.feedbackService.getComplaints().subscribe({
      next: (data) => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const studentId = user?.studentId || user?.id;
        this.complaints.set(data.filter(c => c.studentId === studentId));
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

    this.feedbackService.submitComplaint({
      title: formValue.title,
      housingUnitId: formValue.housingUnitId,
      description: formValue.description
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
