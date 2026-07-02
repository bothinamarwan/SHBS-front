import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../../../../core/models/user.model';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      email: this.loginForm.value.email as string,
      password: this.loginForm.value.password as string
    };

    this.authService.login(payload).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading.set(false);

        // Backend requires 2FA before granting access
        if (res.requiresTwoFactor) {
          this.router.navigate(['/auth/two-factor'], {
            queryParams: { email: payload.email }
          });
          return;
        }

        // Normal login — redirect by role
        const role = this.authService.currentUserValue?.role ?? 'student';
        const redirectMap: Record<string, string> = {
          landlord: '/landlord',
          admin: '/admin',
          student: '/student'
        };
        this.router.navigate([redirectMap[role] ?? '/student']);
      },
      error: (err) => {
        this.isLoading.set(false);

        // Use backend message when available, fall back to generic message
        const backendMsg =
          err?.error?.message ||
          err?.error?.title ||
          (typeof err?.error === 'string' ? err.error : null);

        this.errorMessage.set(backendMsg ?? 'Invalid email or password. Please try again.');
        console.error('Login error:', err);
      }
    });
  }

  // We are currently using the backend redirect challenge for Google Login 
  // since a client ID is not provided.
  onGoogleLogin(): void {
    this.authService.initiateGoogleLogin();
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
