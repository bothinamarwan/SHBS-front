import { Routes } from '@angular/router';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { AdminUsers } from './pages/admin-users/admin-users';
import { AdminVerifications } from './pages/admin-verifications/admin-verifications';
import { AdminComplaints } from './pages/admin-complaints/admin-complaints';
import { AdminReports } from './pages/admin-reports/admin-reports';
import { AdminApprovals } from './pages/admin-approvals/admin-approvals';
import { AdminBookings } from './pages/admin-bookings/admin-bookings';
import { AdminReceipts } from './pages/admin-receipts/admin-receipts';
import { AdminNotifications } from './pages/admin-notifications/admin-notifications';
import { AdminContracts } from './pages/admin-contracts/admin-contracts';
import { Balance } from '../payments/pages/balance/balance';

export const adminRoutes: Routes = [
  { path: '', component: AdminDashboard },
  { path: 'users', component: AdminUsers },
  { path: 'verifications', component: AdminVerifications },
  { path: 'approvals', component: AdminApprovals },
  { path: 'complaints', component: AdminComplaints },
  { path: 'reports', component: AdminReports },
  { path: 'bookings', component: AdminBookings },
  { path: 'receipts', component: AdminReceipts },
  { path: 'notifications', component: AdminNotifications },
  { path: 'contracts', component: AdminContracts },
  { path: 'balance', component: Balance },
];
