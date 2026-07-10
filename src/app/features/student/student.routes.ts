import { Routes } from '@angular/router';
import { authGuard, studentVerifiedGuard } from '../../core/guards/auth.guard';

export const studentRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/student-dashboard/student-dashboard').then(m => m.StudentDashboard)
      },
      {
        path: 'search',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../housing/pages/housing-list/housing-list').then(m => m.HousingList)
      },
      {
        path: 'housing/:id',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../housing/pages/housing-details/housing-details').then(m => m.HousingDetails)
      },
      {
        path: 'bookings',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../booking/pages/booking-history/booking-history').then(m => m.BookingHistory)
      },
      {
        path: 'booking/create/:id',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../booking/pages/booking-create/booking-create').then(m => m.BookingCreate)
      },
      {
        path: 'booking/pay/:id',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../booking/pages/booking-payment/booking-payment').then(m => m.BookingPaymentPage)
      },
      {
        path: 'booking/payment-callback',
        loadComponent: () => import('../booking/pages/booking-payment-callback/booking-payment-callback').then(m => m.BookingPaymentCallbackPage)
      },
      {
        path: 'wishlist',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../wishlist/pages/wishlist-list/wishlist-list').then(m => m.WishlistList)
      },
      {
        path: 'chat',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../chat/pages/chat-interface/chat-interface').then(m => m.ChatInterface)
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/pages/profile-manage/profile-manage').then(m => m.ProfileManage)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/student-notifications/student-notifications').then(m => m.StudentNotifications)
      },
      {
        path: 'complaint',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('./pages/student-complaints/student-complaints').then(m => m.StudentComplaints)
      },
      {
        path: 'verification',
        loadComponent: () => import('./pages/student-verification/student-verification').then(m => m.StudentVerification)
      },
      {
        path: 'contract',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('./pages/student-contract/student-contract').then(m => m.StudentContract)
      },
      {
        path: 'receipts',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('./pages/student-receipts/student-receipts').then(m => m.StudentReceipts)
      },
      {
        path: 'payments',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('../payments/pages/payment-history/payment-history').then(m => m.PaymentHistoryPage)
      },
      {
        path: 'landlord-profile/:id',
        canActivate: [studentVerifiedGuard],
        loadComponent: () => import('./pages/landlord-profile/landlord-profile').then(m => m.LandlordProfile)
      }
    ]
  }
];
