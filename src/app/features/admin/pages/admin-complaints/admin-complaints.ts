import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { FormsModule } from '@angular/forms';
import { AdminComplaint, ComplaintUpdateRequest } from '../../../../core/models/admin.model';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-complaints.html'
})
export class AdminComplaints implements OnInit {
  private adminService = inject(AdminService);

  complaints   = signal<AdminComplaint[]>([]);
  totalCount   = signal<number>(0);
  pageNumber   = signal<number>(1);
  pageSize     = signal<number>(10);
  totalPages   = signal<number>(1);
  isLoading    = signal<boolean>(true);

  // Status filter
  statusFilter = signal<number | undefined>(undefined);

  // Edit modal
  editModal    = signal<AdminComplaint | null>(null);
  editTitle    = signal<string>('');
  editDesc     = signal<string>('');
  editStatus   = signal<number>(0);
  isSaving     = signal<boolean>(false);
  saveError    = signal<string | null>(null);

  // Toast
  toastMessage = signal<{ text: string; success: boolean } | null>(null);

  ngOnInit() { this.fetchComplaints(); }

  onStatusFilterChange(event: any) {
    const val = event.target.value;
    this.statusFilter.set(val === '' ? undefined : Number(val));
    this.pageNumber.set(1);
    this.fetchComplaints();
  }

  fetchComplaints() {
    this.isLoading.set(true);
    this.adminService.getComplaints({
      status: this.statusFilter(),
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    }).subscribe({
      next: (res: any) => {
        let items: AdminComplaint[] = [];
        let total = 0;
        if (Array.isArray(res)) { items = res; total = res.length; }
        else if (res) {
          items = res.items || res.records || res.data || res.Items || res.Records || res.Data || [];
          total = res.totalCount || res.totalRecords || res.TotalCount || res.TotalRecords || items.length;
        }
        this.complaints.set(items);
        this.totalCount.set(total);
        this.totalPages.set(res?.totalPages || res?.TotalPages || Math.ceil(total / this.pageSize()) || 1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Quick status change (no modal)
  quickUpdateStatus(complaintId: string, newStatus: number) {
    const complaint = this.complaints().find(c => c.id === complaintId);
    if (!complaint) return;
    this.adminService.updateComplaintStatus(complaintId, {
      complaintId,
      title: complaint.title || 'Complaint',
      description: complaint.description || 'Status updated',
      status: newStatus
    }).subscribe({
      next: () => {
        this.showToast('Status updated successfully.', true);
        this.fetchComplaints();
      },
      error: () => this.showToast('Failed to update status.', false)
    });
  }

  // Open full edit modal
  openEditModal(complaint: AdminComplaint) {
    this.editModal.set(complaint);
    this.editTitle.set(complaint.title || '');
    this.editDesc.set(complaint.description || '');
    this.editStatus.set(complaint.status);
    this.saveError.set(null);
  }

  closeEditModal() {
    this.editModal.set(null);
    this.saveError.set(null);
  }

  saveEdit() {
    const complaint = this.editModal();
    if (!complaint) return;
    if (!this.editTitle().trim()) { this.saveError.set('Title is required.'); return; }
    this.isSaving.set(true);
    this.saveError.set(null);
    const req: ComplaintUpdateRequest = {
      complaintId: complaint.id,
      title: this.editTitle().trim(),
      description: this.editDesc().trim(),
      status: this.editStatus()
    };
    this.adminService.updateComplaintStatus(complaint.id, req).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeEditModal();
        this.showToast('Complaint updated successfully.', true);
        this.fetchComplaints();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message || 'Failed to update. Please try again.');
      }
    });
  }

  private showToast(text: string, success: boolean) {
    this.toastMessage.set({ text, success });
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  prevPage() {
    if (this.pageNumber() > 1) { this.pageNumber.update(p => p - 1); this.fetchComplaints(); }
  }
  nextPage() {
    if (this.pageNumber() < this.totalPages()) { this.pageNumber.update(p => p + 1); this.fetchComplaints(); }
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 0: return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 1: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 2: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Open';
      case 1: return 'In Progress';
      case 2: return 'Resolved';
      default: return 'Unknown';
    }
  }

  getStatusIcon(status: number): string {
    switch (status) {
      case 0: return 'fa-exclamation-circle';
      case 1: return 'fa-spinner';
      case 2: return 'fa-check-circle';
      default: return 'fa-question-circle';
    }
  }
}
