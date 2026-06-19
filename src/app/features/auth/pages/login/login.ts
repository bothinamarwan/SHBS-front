import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      const payload = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      console.log('Sending Login Payload:', payload);

      this.authService.login(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          const user = this.authService.currentUserValue;
          const role = user?.role || 'student';
          const redirectMap: Record<string, string> = {
            landlord: '/landlord',
            admin: '/admin',
            student: '/student'
          };
          this.router.navigate([redirectMap[role] ?? '/student']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Invalid email or password');
          console.error('Login Error:', err);
          if (err.error && err.error.errors) {
            console.error('Validation Errors from Backend:', err.error.errors);
          } else if (err.error) {
             console.error('Backend Error Message:', err.error);
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
