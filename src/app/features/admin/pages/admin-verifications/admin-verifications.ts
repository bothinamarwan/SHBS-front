import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { PaginatedResponse, PendingStudentVerification, PendingLandlordVerification } from '../../../../core/models/admin.model';

@Component({
  selector: 'app-admin-verifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-verifications.html'
})
export class AdminVerifications implements OnInit {
  private adminService = inject(AdminService);

  activeTab = signal<'students' | 'landlords'>('students');

  items        = signal<any[]>([]);
  totalCount   = signal<number>(0);
  pageNumber   = signal<number>(1);
  pageSize     = signal<number>(10);
  totalPages   = signal<number>(1);
  isLoading    = signal<boolean>(true);

  // Track which landlord cards have expanded doc previews
  expandedDocs = signal<Record<string, 'national-id' | 'unit-doc' | null>>({});
  // Track action in-progress per item
  actionInProgress = signal<string | null>(null);
  // Toast message
  toastMessage = signal<{ text: string; success: boolean } | null>(null);

  ngOnInit() {
    this.fetchData();
  }

  setTab(tab: 'students' | 'landlords') {
    this.activeTab.set(tab);
    this.pageNumber.set(1);
    this.expandedDocs.set({});
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    if (this.activeTab() === 'students') {
      this.adminService.getPendingStudentVerifications(this.pageNumber(), this.pageSize()).subscribe({
        next: (res: any) => this.handleResponse(res),
        error: () => this.isLoading.set(false)
      });
    } else {
      this.adminService.getPendingLandlordVerifications(this.pageNumber(), this.pageSize()).subscribe({
        next: (res: any) => this.handleResponse(res),
        error: () => this.isLoading.set(false)
      });
    }
  }

  private handleResponse(res: any) {
    let extractedItems: any[] = [];
    let total = 0;
    if (Array.isArray(res)) {
      extractedItems = res;
      total = res.length;
    } else if (res) {
      extractedItems = res.items || res.records || res.data || res.Items || res.Records || res.Data || [];
      total = res.totalCount || res.totalRecords || res.TotalCount || res.TotalRecords || extractedItems.length;
    }
    this.items.set(extractedItems);
    this.totalCount.set(total);
    this.totalPages.set(res?.totalPages || res?.TotalPages || Math.ceil(total / this.pageSize()) || 1);
    this.isLoading.set(false);
  }

  private showToast(text: string, success: boolean) {
    this.toastMessage.set({ text, success });
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  // ── Student Actions ──
  reviewStudent(studentId: string, statusEnum: number) {
    this.actionInProgress.set(studentId + '_' + statusEnum);
    this.adminService.reviewStudentVerification(studentId, { newStatus: statusEnum }).subscribe({
      next: () => {
        const labels: Record<number, string> = { 1: 'Approved', 2: 'Rejected' };
        this.showToast(labels[statusEnum] + ' successfully.', statusEnum === 1);
        this.actionInProgress.set(null);
        this.fetchData();
      },
      error: (err) => {
        console.error('Review student error:', err);
        const errorMsg = err?.error?.message || (err?.error?.errors && Object.values(err.error.errors).join(', ')) || 'Action failed. Please try again.';
        this.showToast(errorMsg, false);
        this.actionInProgress.set(null);
      }
    });
  }

  viewStudentIdCard(studentId: string) {
    this.actionInProgress.set(`view_student_${studentId}`);
    this.adminService.getStudentIdCardBlob(studentId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.actionInProgress.set(null);
      },
      error: () => {
        this.showToast('Failed to load student ID card. Make sure the backend endpoint exists.', false);
        this.actionInProgress.set(null);
      }
    });
  }

  // ── Landlord Actions ──
  reviewLandlord(landlordId: string, statusString: string) {
    this.actionInProgress.set(landlordId + '_' + statusString);
    this.adminService.updateLandlordVerificationStatus(landlordId, { status: statusString }).subscribe({
      next: () => {
        const label = statusString === 'Approved' ? 'Approved' : statusString === 'Rejected' ? 'Rejected' : 'Status updated';
        this.showToast(label + ' successfully.', statusString === 'Approved');
        this.actionInProgress.set(null);
        this.fetchData();
      },
      error: () => {
        this.showToast('Action failed. Please try again.', false);
        this.actionInProgress.set(null);
      }
    });
  }

  toggleDocPreview(landlordId: string, docType: 'national-id' | 'unit-doc') {
    const current = this.expandedDocs();
    const existing = current[landlordId];
    if (existing === docType) {
      this.expandedDocs.set({ ...current, [landlordId]: null });
    } else {
      this.expandedDocs.set({ ...current, [landlordId]: docType });
    }
  }

  openDocument(landlordId: string, docType: 'national-id' | 'unit-doc') {
    this.actionInProgress.set(`open_doc_${landlordId}_${docType}`);
    const req = docType === 'national-id' 
      ? this.adminService.getLandlordNationalIdBlob(landlordId)
      : this.adminService.getLandlordUnitDocBlob(landlordId);
      
    req.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.actionInProgress.set(null);
      },
      error: () => {
        this.showToast('Failed to load document. Make sure the backend endpoint exists.', false);
        this.actionInProgress.set(null);
      }
    });
  }

  getExpandedDoc(landlordId: string): 'national-id' | 'unit-doc' | null {
    return this.expandedDocs()[landlordId] ?? null;
  }

  isActionLoading(key: string): boolean {
    return this.actionInProgress() === key;
  }

  // ── Pagination ──
  prevPage() {
    if (this.pageNumber() > 1) { this.pageNumber.update(p => p - 1); this.fetchData(); }
  }
  nextPage() {
    if (this.pageNumber() < this.totalPages()) { this.pageNumber.update(p => p + 1); this.fetchData(); }
  }
}
