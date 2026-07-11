import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminContract, AdminEscrow } from '../../../../core/models/admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PendingEscrowReleasesResponse, CommissionRecord } from '../../../../core/models/escrow.model';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-approvals.html'
})
export class AdminApprovals implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService); // Assuming there's an AuthService for adminUserId

  activeTab = signal<'contracts' | 'escrows'>('contracts');

  contracts = signal<AdminContract[]>([]);
  escrows = signal<AdminEscrow[]>([]);
  
  // Pending escrow releases summary
  escrowSummary = signal<PendingEscrowReleasesResponse | null>(null);
  commissionRecords = signal<CommissionRecord[]>([]);
  
  isLoading = signal<boolean>(true);
  toastMessage = signal<{ text: string; success: boolean } | null>(null);

  // Modals state
  contractModalOpen = signal<boolean>(false);
  contractAction = signal<'approve' | 'reject'>('approve');
  selectedContractId = signal<string>('');
  adminNotes = signal<string>('');
  isSubmitting = signal<boolean>(false);

  escrowModalOpen = signal<boolean>(false);
  escrowAction = signal<'release' | 'refund'>('release');
  selectedEscrowId = signal<string>('');
  escrowNotes = signal<string>(''); // releaseNotes or refundReason

  // Get current admin user ID (fallback to empty if auth service is not fully hooked up)
  get adminUserId(): string {
    let currentUser: any = null;
    this.authService.currentUser$.subscribe(u => currentUser = u).unsubscribe();
    return currentUser?.id || 'admin-user-id'; 
  }

  ngOnInit() {
    this.fetchData();
  }

  setTab(tab: 'contracts' | 'escrows') {
    this.activeTab.set(tab);
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);
    if (this.activeTab() === 'contracts') {
      this.adminService.getPendingContracts().subscribe({
        next: (res: any) => {
          this.contracts.set(res?.items || res || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.adminService.getPendingEscrowReleases().subscribe({
        next: (res: any) => {
          // Handle the new API response format with summary stats
          this.escrowSummary.set(res);
          this.commissionRecords.set(res?.records || []);
          this.escrows.set(res?.records || res?.items || res || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  // --- Contracts Modals ---
  openContractModal(contractId: string, action: 'approve' | 'reject') {
    this.selectedContractId.set(contractId);
    this.contractAction.set(action);
    this.adminNotes.set('');
    this.contractModalOpen.set(true);
  }

  closeContractModal() {
    this.contractModalOpen.set(false);
  }

  submitContractAction() {
    this.isSubmitting.set(true);
    const req = {
      contractId: this.selectedContractId(),
      adminUserId: this.adminUserId,
      adminNotes: this.adminNotes(),
      isApproved: this.contractAction() === 'approve'
    };

    const apiCall = req.isApproved ? 
      this.adminService.approveContract(req) : 
      this.adminService.rejectContract(req);

    apiCall.subscribe({
      next: () => {
        this.showToast(`Contract ${req.isApproved ? 'approved' : 'rejected'} successfully`, true);
        this.closeContractModal();
        this.fetchData();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.showToast(`Failed to ${req.isApproved ? 'approve' : 'reject'} contract`, false);
        this.isSubmitting.set(false);
      }
    });
  }

  // --- Escrow Modals ---
  openEscrowModal(escrowId: string, action: 'release' | 'refund') {
    this.selectedEscrowId.set(escrowId);
    this.escrowAction.set(action);
    this.escrowNotes.set('');
    this.escrowModalOpen.set(true);
  }

  closeEscrowModal() {
    this.escrowModalOpen.set(false);
  }

  submitEscrowAction() {
    this.isSubmitting.set(true);
    const action = this.escrowAction();

    if (action === 'release') {
      this.adminService.releaseEscrow({
        escrowId: this.selectedEscrowId(),
        adminUserId: this.adminUserId,
        releaseNotes: this.escrowNotes()
      }).subscribe({
        next: () => {
          this.showToast('Escrow released to landlord successfully', true);
          this.closeEscrowModal();
          this.fetchData();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.showToast('Failed to release escrow', false);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.adminService.refundEscrow({
        escrowId: this.selectedEscrowId(),
        adminUserId: this.adminUserId,
        refundReason: this.escrowNotes()
      }).subscribe({
        next: () => {
          this.showToast('Escrow refunded to student successfully', true);
          this.closeEscrowModal();
          this.fetchData();
          this.isSubmitting.set(false);
        },
        error: () => {
          this.showToast('Failed to refund escrow', false);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  private showToast(text: string, success: boolean) {
    this.toastMessage.set({ text, success });
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
