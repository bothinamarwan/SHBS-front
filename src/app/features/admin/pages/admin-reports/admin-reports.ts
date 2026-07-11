import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reports.html'
})
export class AdminReports implements OnInit {
  private adminService = inject(AdminService);

  reportData = signal<any>(null);
  isLoading = signal<boolean>(false);

  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  ngOnInit() {
    // Optionally load initial report for the current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const futureDate = new Date(2028, 11, 31); // December 31, 2028
    
    this.dateFrom.set(firstDay.toISOString().split('T')[0]);
    this.dateTo.set(futureDate.toISOString().split('T')[0]);
    
    this.fetchReport();
  }

  fetchReport() {
    this.isLoading.set(true);
    
    // Ensure ISO formats for backend if full datetime is needed, or just YYYY-MM-DD
    const from = this.dateFrom() ? new Date(this.dateFrom()).toISOString() : undefined;
    const to = this.dateTo() ? new Date(this.dateTo()).toISOString() : undefined;

    this.adminService.getCommissionReport(from, to).subscribe({
      next: (res) => {
        this.reportData.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // Helper assuming the backend returns a flat number or an object like { totalRevenue: number, records: [] }
  getTotal(): number {
    const data = this.reportData();
    if (!data) return 0;
    if (typeof data === 'number') return data;
    return data.totalRevenue || data.totalCommissions || data.totalAmount || 0;
  }

  getItems(): any[] {
    const data = this.reportData();
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.records || data.reportItems || data.items || data.commissions || [];
  }

  getTotalBookings(): number {
    const data = this.reportData();
    if (!data) return 0;
    return data.totalBookings || 0;
  }

  getAverageCommission(): number {
    const data = this.reportData();
    if (!data) return 0;
    return data.averageCommission || 0;
  }
}
