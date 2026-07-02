import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthResponse } from '../../../../core/models/user.model';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './two-factor.html',
  styleUrl: './two-factor.css'
})
export class TwoFactor implements OnInit {
  codeForm: FormGroup;
  email = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!this.email) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  onSubmit() {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const code = this.codeForm.value.code as string;

    this.authService.verifyTwoFactor({ email: this.email, code }).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading.set(false);

        // Redirect by role
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
        const msg = err?.error?.message || err?.error?.title || 'Invalid verification code. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  get code() { return this.codeForm.get('code'); }
}
