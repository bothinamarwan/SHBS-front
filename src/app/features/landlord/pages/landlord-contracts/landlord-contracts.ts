import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentalContract } from '../../../../core/models/booking.model';

interface ContractView extends RentalContract {
  studentName: string;
  propertyTitle: string;
  roomName: string;
  moveInDate: string;
  duration: number;
  totalPrice: number;
  monthlyRent: number;
}

type ContractFilter = 'all' | 'signed' | 'draft' | 'expired';

@Component({
  selector: 'app-landlord-contracts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landlord-contracts.html'
})
export class LandlordContracts {
  activeFilter = signal<ContractFilter>('all');

  contracts = signal<ContractView[]>([
    {
      contractId: 'CT-001', bookingId: 'BK-003',
      terms: 'Standard 6-month residential lease with monthly payments. No smoking policy applies.',
      signedDate: '2026-05-21', status: 'signed',
      studentName: 'Nour Ibrahim', propertyTitle: 'Premium Student Studio',
      roomName: 'Master Studio', moveInDate: '2026-06-01', duration: 3,
      totalPrice: 16500, monthlyRent: 5500
    },
    {
      contractId: 'CT-002', bookingId: 'BK-005',
      terms: 'Standard 12-month residential lease. All utilities included in rent.',
      signedDate: undefined, status: 'draft',
      studentName: 'Layla Mostafa', propertyTitle: 'Premium Student Studio',
      roomName: 'Master Studio', moveInDate: '2026-08-01', duration: 12,
      totalPrice: 66000, monthlyRent: 5500
    },
    {
      contractId: 'CT-003', bookingId: 'BK-006',
      terms: 'Standard 3-month lease. Quiet hours policy after 10PM.',
      signedDate: '2026-02-15', status: 'expired',
      studentName: 'Omar Fathy', propertyTitle: 'Cozy Shared Suite',
      roomName: 'Twin Room', moveInDate: '2026-02-15', duration: 3,
      totalPrice: 9600, monthlyRent: 3200
    },
  ]);

  filters: { label: string; value: ContractFilter }[] = [
    { label: 'All Contracts', value: 'all' },
    { label: 'Signed', value: 'signed' },
    { label: 'Draft', value: 'draft' },
    { label: 'Expired', value: 'expired' },
  ];

  filteredContracts = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.contracts() : this.contracts().filter(c => c.status === f);
  });

  selectedContract = signal<ContractView | null>(null);
  isPreviewOpen = signal(false);

  openPreview(contract: ContractView) {
    this.selectedContract.set(contract);
    this.isPreviewOpen.set(true);
  }
  closePreview() { this.isPreviewOpen.set(false); }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      signed: 'status-badge--signed',
      draft: 'status-badge--draft',
      expired: 'status-badge--expired'
    };
    return map[status] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getEndDate(contract: ContractView): string {
    const d = new Date(contract.moveInDate);
    d.setMonth(d.getMonth() + contract.duration);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
