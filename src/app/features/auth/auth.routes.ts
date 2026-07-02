import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
  // ── Google OAuth callback — must be outside guestGuard ──────────────────
  {
    path: 'google-callback',
    loadComponent: () =>
      import('./pages/google-callback/google-callback').then(m => m.GoogleCallback)
  },

  // ── 2FA Setup (post-registration) — outside guestGuard ─────────────────
  {
    path: 'setup-2fa',
    loadComponent: () =>
      import('./pages/setup-2fa/setup-2fa').then(m => m.SetupTwoFactor)
  },

  // ── 2FA Verify (login flow) — outside guestGuard ───────────────────────
  {
    path: 'two-factor',
    loadComponent: () =>
      import('./pages/two-factor/two-factor').then(m => m.TwoFactor)
  },

  // ── Email Confirmation — outside guestGuard ────────────────────────────
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./pages/confirm-email/confirm-email').then(m => m.ConfirmEmail)
  },

  {
    path: '',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];

