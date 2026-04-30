import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
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
