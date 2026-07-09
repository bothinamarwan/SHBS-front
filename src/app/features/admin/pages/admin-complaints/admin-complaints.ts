import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintService } from '../../../../core/services/complaint.service';
import { HousingService } from '../../../../core/services/housing.service';
import { FormsModule } from '@angular/forms';
import { Complaint, ComplaintStatus, UpdateComplaintRequest } from '../../../../core/models/complaint.model';
import { HousingUnit } from '../../../../core/models/housing.model';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-complaints.html'
})
export class AdminComplaints implements OnInit {
  private complaintService = inject(ComplaintService);
  private housingService = inject(HousingService);

  complaints   = signal<Complaint[]>([]);
  housings     = signal<HousingUnit[]>([]);
  totalCount   = signal<number>(0);
  pageNumber   = signal<number>(1);
  pageSize     = signal<number>(10);
  totalPages   = signal<number>(1);
  isLoading    = signal<boolean>(true);

  // Status filter
  statusFilter = signal<ComplaintStatus | undefined>(undefined);

  // Edit modal
  editModal    = signal<Complaint | null>(null);
  editTitle    = signal<string>('');
  editDesc     = signal<string>('');
  editStatus   = signal<ComplaintStatus>(ComplaintStatus.Open);
  isSaving     = signal<boolean>(false);
  saveError    = signal<string | null>(null);

  // Toast
  toastMessage = signal<{ text: string; success: boolean } | null>(null);

  ComplaintStatus = ComplaintStatus;

  ngOnInit() { 
    this.fetchComplaints();
    this.loadHousings();
  }

  loadHousings() {
    this.housingService.getAll().subscribe({
      next: (data) => {
        this.housings.set(data);
      },
      error: (err) => {
        console.error('Failed to load housings', err);
      }
    });
  }

  onStatusFilterChange(event: any) {
    const val = event.target.value;
    this.statusFilter.set(val === '' ? undefined : Number(val) as ComplaintStatus);
    this.pageNumber.set(1);
    this.fetchComplaints();
  }

  fetchComplaints() {
    this.isLoading.set(true);
    this.complaintService.getAll().subscribe({
      next: (res) => {
        let items = res || [];
        
        // Apply status filter
        if (this.statusFilter() !== undefined) {
          items = items.filter(c => c.status === this.statusFilter());
        }
        
        this.complaints.set(items);
        this.totalCount.set(items.length);
        this.totalPages.set(Math.ceil(items.length / this.pageSize()) || 1);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Quick status change (no modal)
  quickUpdateStatus(complaintId: string, newStatus: ComplaintStatus) {
    const complaint = this.complaints().find(c => c.complaintId === complaintId);
    if (!complaint) return;
    
    const req: UpdateComplaintRequest = {
      complaintId,
      status: newStatus
    };
    
    this.complaintService.update(req).subscribe({
      next: () => {
        this.showToast('Status updated successfully.', true);
        this.fetchComplaints();
      },
      error: () => this.showToast('Failed to update status.', false)
    });
  }

  // Open full edit modal
  openEditModal(complaint: Complaint) {
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
    const req: UpdateComplaintRequest = {
      complaintId: complaint.complaintId,
      status: this.editStatus()
    };
    this.complaintService.update(req).subscribe({
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

  getStatusBadgeClass(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.Open: return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case ComplaintStatus.InInvestigation: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case ComplaintStatus.Resolved: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  }

  getStatusLabel(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.Open: return 'Open';
      case ComplaintStatus.InInvestigation: return 'In Investigation';
      case ComplaintStatus.Resolved: return 'Resolved';
      default: return 'Unknown';
    }
  }

  getStatusIcon(status: ComplaintStatus): string {
    switch (status) {
      case ComplaintStatus.Open: return 'fa-exclamation-circle';
      case ComplaintStatus.InInvestigation: return 'fa-spinner';
      case ComplaintStatus.Resolved: return 'fa-check-circle';
      default: return 'fa-question-circle';
    }
  }

  getHousingTitle(housingUnitId: string): string {
    const housing = this.housings().find(h => h.housingUnitId === housingUnitId);
    return housing?.title || 'Unknown Property';
  }
}
