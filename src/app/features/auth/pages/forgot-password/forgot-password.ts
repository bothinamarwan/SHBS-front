import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html'
})
export class ForgotPassword {
  forgotForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading.set(true);
      // Mock API call
      setTimeout(() => {
        this.isLoading.set(false);
        this.successMessage.set('Reset link sent to your email.');
      }, 2000);
    }
  }

  get email() { return this.forgotForm.get('email'); }
}
