import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      
      const email = this.email?.value;

      this.authService.forgotPassword({ email }).subscribe({
        next: (res: any) => {
          console.log('Forgot Password Success Response:', res);
          this.isLoading.set(false);
          this.successMessage.set(res.message || 'Token received. Redirecting to reset password...');
          let token = '';
          if (typeof res.token === 'string') {
            token = res.token;
          } else if (res.token && typeof res.token.accessToken === 'string') {
            token = res.token.accessToken;
          } else if (res.data && typeof res.data.token === 'string') {
            token = res.data.token;
          } else if (typeof res.data === 'string') {
            token = res.data;
          } else if (res.token && typeof res.token.value === 'string') {
            token = res.token.value;
          } else {
            token = res.message; // last resort fallback
          }
          console.log('Extracted Token to send to reset-password:', token);
          
          setTimeout(() => {
             this.router.navigate(['/auth/reset-password'], { queryParams: { email: email, token: token } });
          }, 1000);
        },
        error: (err: any) => {
          console.error('Forgot Password Error Response:', err);
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'An error occurred. Please try again.');
        }
      });
    }
  }

  get email() { return this.forgotForm.get('email'); }
}
