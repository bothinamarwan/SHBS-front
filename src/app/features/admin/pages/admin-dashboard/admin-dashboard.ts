import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);

  totalUsers        = signal<number>(0);
  pendingStudents   = signal<number>(0);
  pendingLandlords  = signal<number>(0);
  openComplaints    = signal<number>(0);
  monthlyRevenue    = signal<number>(0);
  isLoading         = signal<boolean>(true);

  ngOnInit() {
    this.fetchStats();
  }

  fetchStats() {
    this.isLoading.set(true);
    let done = 0;
    const checkDone = () => { if (++done === 5) this.isLoading.set(false); };

    const extractCount = (res: any): number => {
      if (!res) return 0;
      if (typeof res === 'number') return res;
      if (Array.isArray(res)) return res.length;
      return res.totalCount || res.totalRecords || res.TotalCount || res.TotalRecords ||
        (res.items || res.records || res.data || res.Items || res.Records || res.Data || []).length;
    };

    this.adminService.getUsers({ pageSize: 1 }).pipe(finalize(checkDone)).subscribe({
      next: (res) => this.totalUsers.set(extractCount(res)), error: () => {}
    });

    this.adminService.getPendingStudentVerifications(1, 1).pipe(finalize(checkDone)).subscribe({
      next: (res) => this.pendingStudents.set(extractCount(res)), error: () => {}
    });

    this.adminService.getPendingLandlordVerifications(1, 1).pipe(finalize(checkDone)).subscribe({
      next: (res) => this.pendingLandlords.set(extractCount(res)), error: () => {}
    });

    this.adminService.getComplaints({ pageSize: 1, status: 0 }).pipe(finalize(checkDone)).subscribe({
      next: (res) => this.openComplaints.set(extractCount(res)), error: () => {}
    });

    // Fetch current-month commission total
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    this.adminService.getCommissionReport(firstOfMonth, today.toISOString()).pipe(finalize(checkDone)).subscribe({
      next: (res: any) => {
        const total = typeof res === 'number' ? res : (res?.totalCommissions || res?.totalAmount || 0);
        this.monthlyRevenue.set(total);
      },
      error: () => {}
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value);
  }
}
