import { Component, signal, computed } from '@angular/core';
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
export class LandlordMaintenance {

  activeFilter = signal<ComplaintFilter>('all');

  complaints = signal<LandlordComplaint[]>([
    {
      complaintId: 'CP-001', studentId: 'S3', studentName: 'Nour Ibrahim',
      landlordId: 'L1', propertyTitle: 'Premium Student Studio', roomName: 'Master Studio',
      description: 'The AC unit stopped working last week. The room is extremely hot and uninhabitable during the day.',
      complaintStatus: 'open', createdDate: '2026-06-14', priority: 'high'
    },
    {
      complaintId: 'CP-002', studentId: 'S5', studentName: 'Layla Mostafa',
      landlordId: 'L1', propertyTitle: 'Premium Student Studio', roomName: 'Master Studio',
      description: 'There is a water leak in the bathroom ceiling. Water is dripping onto the floor.',
      complaintStatus: 'in-progress', createdDate: '2026-06-10', priority: 'high',
      resolution: 'Plumber scheduled for June 20th. Water temporarily stopped.'
    },
    {
      complaintId: 'CP-003', studentId: 'S2', studentName: 'Sara Ali',
      landlordId: 'L1', propertyTitle: 'Cozy Shared Suite', roomName: 'Twin Room',
      description: 'The WiFi router is not working properly. Connection drops every 30 minutes.',
      complaintStatus: 'in-progress', createdDate: '2026-06-08', priority: 'medium'
    },
    {
      complaintId: 'CP-004', studentId: 'S1', studentName: 'Ahmed Hassan',
      landlordId: 'L1', propertyTitle: 'Premium Student Studio', roomName: 'Master Studio',
      description: 'The front door lock is loose and sometimes doesn\'t lock properly from outside.',
      complaintStatus: 'resolved', createdDate: '2026-05-28',
      resolution: 'Lock replaced on June 2nd. Issue fully resolved.',
      priority: 'medium'
    },
  ]);

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
