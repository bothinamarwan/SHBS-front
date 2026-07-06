import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html'
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  
  email: string = '';
  token: string = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';
      // Ensure any spaces are converted back to '+' if the token was incorrectly decoded by the browser
      if (this.token && this.token.includes(' ')) {
         this.token = this.token.replace(/ /g, '+');
      }
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      
      const newPassword = this.password?.value;
      const confirmPassword = this.confirmPassword?.value;
      
      const payload = {
        email: this.email,
        token: this.token,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };
      console.log('Reset Password Payload:', payload);
      
      this.authService.resetPassword(payload).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.successMessage.set(res.message || 'Password reset successfully! Redirecting...');
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: (err: any) => {
          console.error('Reset Password Error Response:', err);
          this.isLoading.set(false);
          
          let errorMsg = 'Failed to reset password. Please try again.';
          if (err.error) {
             if (typeof err.error === 'string') {
               errorMsg = err.error;
             } else if (err.error.message) {
               errorMsg = err.error.message;
             } else if (err.error.errors) {
               errorMsg = Object.values(err.error.errors).flat().join(' ');
             }
          }
          this.errorMessage.set(errorMsg);
        }
      });
    }
  }

  get password() { return this.resetForm.get('password'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }
}
