import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

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
        loadComponent: () => import('../housing/pages/housing-list/housing-list').then(m => m.HousingList)
      },
      {
        path: 'housing/:id',
        loadComponent: () => import('../housing/pages/housing-details/housing-details').then(m => m.HousingDetails)
      },
      {
        path: 'bookings',
        loadComponent: () => import('../booking/pages/booking-history/booking-history').then(m => m.BookingHistory)
      },
      {
        path: 'booking/create/:id',
        loadComponent: () => import('../booking/pages/booking-create/booking-create').then(m => m.BookingCreate)
      },
      {
        path: 'booking/pay/:id',
        loadComponent: () => import('../booking/pages/booking-payment/booking-payment').then(m => m.BookingPaymentPage)
      },
      {
        path: 'booking/payment-callback',
        loadComponent: () => import('../booking/pages/booking-payment-callback/booking-payment-callback').then(m => m.BookingPaymentCallbackPage)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('../wishlist/pages/wishlist-list/wishlist-list').then(m => m.WishlistList)
      },
      {
        path: 'chat',
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
        loadComponent: () => import('./pages/student-complaints/student-complaints').then(m => m.StudentComplaints)
      },
      {
        path: 'verification',
        loadComponent: () => import('./pages/student-verification/student-verification').then(m => m.StudentVerification)
      },
      {
        path: 'receipts',
        loadComponent: () => import('./pages/student-receipts/student-receipts').then(m => m.StudentReceipts)
      },
      {
        path: 'payments',
        loadComponent: () => import('../payments/pages/payment-history/payment-history').then(m => m.PaymentHistoryPage)
      },
      {
        path: 'landlord-profile/:id',
        loadComponent: () => import('./pages/landlord-profile/landlord-profile').then(m => m.LandlordProfile)
      }
    ]
  }
];
