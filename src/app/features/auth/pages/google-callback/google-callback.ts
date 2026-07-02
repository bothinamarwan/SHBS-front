import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-wrapper">
      <div class="callback-card">
        @if (error) {
          <span class="material-symbols-outlined error-icon">error</span>
          <h2>Authentication Failed</h2>
          <p class="error-text">{{ error }}</p>
          <button class="btn-back" (click)="goToLogin()">Back to Login</button>
        } @else {
          <div class="spinner-large"></div>
          <h2>Signing you in…</h2>
          <p>Please wait while we complete your Google login.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-secondary, #f5f5ff);
    }
    .callback-card {
      background: white;
      border-radius: 1.5rem;
      padding: 3rem 2.5rem;
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,.1);
      max-width: 400px;
      width: 100%;
    }
    .spinner-large {
      width: 48px; height: 48px;
      border: 4px solid #e6e6ff;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin .8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 .5rem; font-size: 1.4rem; color: #1a1a2e; }
    p  { color: #6b6b8a; margin: 0; }
    .error-icon { font-size: 3rem; color: #dc2626; }
    .error-text { color: #dc2626; margin-top: .25rem; }
    .btn-back {
      margin-top: 1.5rem;
      padding: .6rem 1.5rem;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: .75rem;
      cursor: pointer;
      font-size: 1rem;
    }
  `]
})
export class GoogleCallback implements OnInit {
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    // ── Server-side redirect flow ─────────────────────────────────────────
    // Backend sends: /auth/google-callback?token=<accessToken>&refreshToken=<rt>
    const accessToken  = params.get('token') || params.get('accessToken');
    const refreshToken = params.get('refreshToken') || '';

    if (accessToken) {
      this.authService.handleGoogleCallback(accessToken, refreshToken);
      const role = this.authService.currentUserValue?.role ?? 'student';
      const redirectMap: Record<string, string> = {
        landlord: '/landlord',
        admin:    '/admin',
        student:  '/student'
      };
      this.router.navigate([redirectMap[role] ?? '/student']);
      return;
    }

    // ── Client-side idToken flow ──────────────────────────────────────────
    // If the backend instead returns an idToken in the URL
    const idToken = params.get('idToken');
    if (idToken) {
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const req = {
          provider: 'Google',
          providerKey: payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0]
        };
        this.authService.googleLogin(req).subscribe({
          next: (res) => {
            if (res.requiresTwoFactor) {
              const email = this.authService.currentUserValue?.email ?? '';
              this.router.navigate(['/auth/two-factor'], { queryParams: { email } });
              return;
            }
            const role = this.authService.currentUserValue?.role ?? 'student';
            const redirectMap: Record<string, string> = {
              landlord: '/landlord',
              admin:    '/admin',
              student:  '/student'
            };
            this.router.navigate([redirectMap[role] ?? '/student']);
          },
          error: (err) => {
            this.error = err?.error?.message ?? 'Google authentication failed.';
          }
        });
      } catch (err) {
        this.error = 'Failed to parse Google credentials.';
        console.error('JWT Parse Error:', err);
      }
      return;
    }

    // No token at all
    this.error = 'No authentication token received from Google. Please try again.';
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
