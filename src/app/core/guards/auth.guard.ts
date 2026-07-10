import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page with selection of return URL
  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect to home if already logged in
  return router.createUrlTree(['/']);
};

export const studentVerifiedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }

  const user = authService.currentUserValue;
  
  // Allow access if user is not a student (admin, landlord)
  if (user?.role !== 'student') {
    return true;
  }

  // Check if student is verified (universityVerificationStatus === 1)
  if (user?.universityVerificationStatus === 1) {
    return true;
  }

  // Redirect unverified students to verification page
  return router.createUrlTree(['/student/verification']);
};
