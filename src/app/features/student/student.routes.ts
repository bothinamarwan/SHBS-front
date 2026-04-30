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
        loadComponent: () => import('../notifications/pages/notification-page/notification-page').then(m => m.NotificationPage)
      },
      {
        path: 'complaint',
        loadComponent: () => import('./pages/complaint-form/complaint-form').then(m => m.ComplaintForm)
      }
    ]
  }
];
