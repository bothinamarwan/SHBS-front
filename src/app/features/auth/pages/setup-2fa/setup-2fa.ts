import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TwoFactorSetupResponse, AuthResponse } from '../../../../core/models/user.model';

@Component({
  selector: 'app-setup-2fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setup-2fa.html',
  styleUrl: './setup-2fa.css'
})
export class SetupTwoFactor implements OnInit {
  codeForm: FormGroup;
  email = '';
  isLoading = signal(false);
  isSetupLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  qrCodeUri = signal<string | null>(null);

  qrImageUrl = computed(() => {
    const uri = this.qrCodeUri();
    if (!uri) return null;
    if (uri.startsWith('http')) return uri;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  });

  secret = signal<string | null>(null);
  setupComplete = signal(false);

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
      this.router.navigate(['/auth/register']);
      return;
    }
    this.loadSetup();
  }

  loadSetup() {
    this.isSetupLoading.set(true);
    this.errorMessage.set(null);

    this.authService.setup2FA(this.email).subscribe({
      next: (res: TwoFactorSetupResponse) => {
        this.isSetupLoading.set(false);
        if (res.success) {
          this.qrCodeUri.set(res.qrCodeUri);
          this.secret.set(res.secret);
        } else {
          this.errorMessage.set(res.message || 'Failed to setup 2FA.');
        }
      },
      error: (err) => {
        this.isSetupLoading.set(false);
        const msg = err?.error?.message || err?.error?.title || 'Failed to setup 2FA. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  onSubmit() {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const code = this.codeForm.value.code as string;

    this.authService.enable2FA({ email: this.email, code }).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading.set(false);
        if (res.success) {
          this.setupComplete.set(true);
          this.successMessage.set('Two-factor authentication enabled successfully!');

          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            const role = this.authService.currentUserValue?.role ?? 'student';
            const redirectMap: Record<string, string> = {
              landlord: '/landlord',
              admin: '/admin',
              student: '/student'
            };
            this.router.navigate([redirectMap[role] ?? '/student']);
          }, 1500);
        } else {
          this.errorMessage.set(res.message || 'Invalid verification code.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || err?.error?.title || 'Invalid code. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  copySecret() {
    const s = this.secret();
    if (s) {
      navigator.clipboard.writeText(s);
      this.successMessage.set('Secret key copied to clipboard!');
      setTimeout(() => this.successMessage.set(null), 2000);
    }
  }

  get code() { return this.codeForm.get('code'); }
}
