import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const landlordRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landlord-dashboard/landlord-dashboard').then(m => m.LandlordDashboard)
      },
      {
        path: 'listings',
        loadComponent: () =>
          import('./pages/landlord-listings/landlord-listings').then(m => m.LandlordListings)
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/landlord-bookings/landlord-bookings').then(m => m.LandlordBookings)
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./pages/landlord-contracts/landlord-contracts').then(m => m.LandlordContracts)
      },
      {
        path: 'maintenance',
        loadComponent: () =>
          import('./pages/landlord-maintenance/landlord-maintenance').then(m => m.LandlordMaintenance)
      },
      {
        path: 'verification',
        loadComponent: () =>
          import('./pages/landlord-verification/landlord-verification').then(m => m.LandlordVerification)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/pages/profile-manage/profile-manage').then(m => m.ProfileManage)
      }
    ]
  }
];
