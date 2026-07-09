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
        path: 'listings/:id/manage',
        loadComponent: () =>
          import('./pages/landlord-property-manager/landlord-property-manager').then(m => m.LandlordPropertyManager)
      },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./pages/landlord-rooms/landlord-rooms').then(m => m.LandlordRooms)
      },
      {
        path: 'beds',
        loadComponent: () =>
          import('./pages/landlord-beds/landlord-beds').then(m => m.LandlordBeds)
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
      },
      {
        path: 'notifications',
        loadComponent: () => 
          import('../notifications/pages/notification-page/notification-page').then(m => m.NotificationPage)
      },
      {
        path: 'complaints',
        loadComponent: () =>
          import('./pages/landlord-complaints/landlord-complaints').then(m => m.LandlordComplaints)
      }
    ]
  }
];
