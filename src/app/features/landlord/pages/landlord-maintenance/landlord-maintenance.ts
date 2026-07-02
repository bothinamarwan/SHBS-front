import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ComplaintStatus = 'open' | 'in-progress' | 'resolved';


export interface LandlordComplaint {
  complaintId: string;
  studentId: string;
  studentName: string;
  landlordId: string;
  propertyTitle: string;
  roomName: string;
  description: string;
  complaintStatus: ComplaintStatus;
  createdDate: string;
  resolution?: string;
  priority: 'high' | 'medium' | 'low';
}

type ComplaintFilter = 'all' | ComplaintStatus;

@Component({
  selector: 'app-landlord-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landlord-maintenance.html'
})
export class LandlordMaintenance implements OnInit {

  activeFilter = signal<ComplaintFilter>('all');

  // Complaints loaded from API
  complaints = signal<LandlordComplaint[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    // Complaints come from the feedback/support API
    // TODO: wire to your feedback service when endpoint is ready
    this.isLoading.set(false);
  }

  filters: { label: string; value: ComplaintFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  filteredComplaints = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.complaints() : this.complaints().filter(c => c.complaintStatus === f);
  });

  openCount = computed(() => this.complaints().filter(c => c.complaintStatus === 'open').length);
  inProgressCount = computed(() => this.complaints().filter(c => c.complaintStatus === 'in-progress').length);

  // Modal state
  selectedComplaint = signal<LandlordComplaint | null>(null);
  isModalOpen = signal(false);
  resolutionText = signal('');
  isSaving = signal(false);
  newStatus = signal<ComplaintStatus>('in-progress');

  openModal(complaint: LandlordComplaint) {
    this.selectedComplaint.set({ ...complaint });
    this.resolutionText.set(complaint.resolution || '');
    this.newStatus.set(complaint.complaintStatus);
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  updateComplaintStatus() {
    const complaint = this.selectedComplaint();
    if (!complaint) return;
    this.isSaving.set(true);
    setTimeout(() => {
      this.complaints.update(prev =>
        prev.map(c => c.complaintId === complaint.complaintId
          ? {
              ...c,
              complaintStatus: this.newStatus(),
              resolution: this.resolutionText() || c.resolution
            }
          : c
        )
      );
      this.isSaving.set(false);
      this.closeModal();
    }, 800);
  }

  resolveComplaint(complaint: LandlordComplaint) {
    this.complaints.update(prev =>
      prev.map(c => c.complaintId === complaint.complaintId
        ? { ...c, complaintStatus: 'resolved' }
        : c
      )
    );
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'open': 'status-badge--open',
      'in-progress': 'status-badge--in-progress',
      'resolved': 'status-badge--resolved'
    };
    return map[status] || '';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      high: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
      medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
      low: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
    };
    return map[priority] || '';
  }
}
