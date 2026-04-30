import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FeedbackService } from '../../../../core/services/feedback.service';

@Component({
  selector: 'app-complaint-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './complaint-form.html'
})
export class ComplaintForm {
  private fb = inject(FormBuilder);
  private feedbackService = inject(FeedbackService);
  private router = inject(Router);

  complaintForm: FormGroup;
  isLoading = signal(false);
  isSuccess = signal(false);

  constructor() {
    this.complaintForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['housing', Validators.required]
    });
  }

  onSubmit() {
    if (this.complaintForm.valid) {
      this.isLoading.set(true);
      this.feedbackService.submitComplaint(this.complaintForm.value).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
          setTimeout(() => {
            this.router.navigate(['/student']);
          }, 3000);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }
}
