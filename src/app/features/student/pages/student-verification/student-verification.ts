import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudentService } from '../../../../core/services/student.service';

@Component({
  selector: 'app-student-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-verification.html'
})
export class StudentVerification {
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);

  verificationForm: FormGroup;
  selectedFile = signal<File | null>(null);
  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.verificationForm = this.fb.group({
      facultyName: ['', Validators.required],
      universityName: ['', Validators.required],
      universityEmail: ['', [Validators.required, Validators.email]]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  onSubmit() {
    if (this.verificationForm.invalid || !this.selectedFile()) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    formData.append('FacultyName', this.verificationForm.value.facultyName);
    formData.append('UniversityName', this.verificationForm.value.universityName);
    formData.append('UniversityEmail', this.verificationForm.value.universityEmail);
    formData.append('universityIdCard', this.selectedFile() as File);

    this.studentService.submitUniversityVerification(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to submit verification. Please try again.');
        console.error(err);
      }
    });
  }
}
