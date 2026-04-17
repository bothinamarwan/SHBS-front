import { Routes } from '@angular/router';
import { PublicLayout } from './core/layouts/public-layout/public-layout';
import { DashboardLayout } from './core/layouts/dashboard-layout/dashboard-layout';
import { Home } from './features/home/home';

export const routes: Routes = [
  // ── Auth pages (no header / footer) ──────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // ── Public pages (with header + footer) ──────────────────────────────
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      {
        path: 'listings',
        loadChildren: () =>
          import('./features/listings/listings.routes').then(m => m.listingsRoutes)
      }
    ]
  },

  // ── Authenticated dashboards ──────────────────────────────────────────
  {
    path: '',
    component: DashboardLayout,
    children: [
      {
        path: 'student',
        loadChildren: () =>
          import('./features/student/student.routes').then(m => m.studentRoutes)
      },
      {
        path: 'landlord',
        loadChildren: () =>
          import('./features/landlord/landlord.routes').then(m => m.landlordRoutes)
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then(m => m.adminRoutes)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
