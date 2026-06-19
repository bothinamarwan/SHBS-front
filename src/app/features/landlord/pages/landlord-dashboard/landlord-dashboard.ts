import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HousingService } from '../../../../core/services/housing.service';
import { Housing } from '../../../../core/models/housing.model';

interface BookingActivity {
  id: string;
  studentName: string;
  property: string;
  room: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

@Component({
  selector: 'app-landlord-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landlord-dashboard.html'
})
export class LandlordDashboard implements OnInit {
  private authService = inject(AuthService);
  private housingService = inject(HousingService);

  user = this.authService.currentUser$;
  isLoading = signal(true);

  myListings = signal<Housing[]>([]);

  // Aggregate metrics derived from listings
  totalListings = computed(() => this.myListings().length);
  totalRooms = computed(() => this.myListings().reduce((acc, h) => acc + h.rooms.length, 0));
  occupiedRooms = computed(() =>
    this.myListings().reduce((acc, h) =>
      acc + h.rooms.filter(r => r.availableBeds === 0).length, 0)
  );
  occupancyRate = computed(() =>
    this.totalRooms() > 0
      ? Math.round((this.occupiedRooms() / this.totalRooms()) * 100)
      : 0
  );
  monthlyEarnings = computed(() =>
    this.myListings().reduce((acc, h) => acc + h.price, 0) * 0.85
  );
  pendingBookings = signal(3);
  activeComplaints = signal(1);

  // Mock recent booking activity
  recentActivity = signal<BookingActivity[]>([
    { id: 'BK-001', studentName: 'Ahmed Hassan', property: 'Premium Student Studio', room: 'Master Studio', date: '2026-06-17', status: 'pending' },
    { id: 'BK-002', studentName: 'Sara Ali', property: 'Cozy Shared Suite', room: 'Twin Room', date: '2026-06-15', status: 'approved' },
    { id: 'BK-003', studentName: 'Mohamed Khaled', property: 'Modern Student Hub', room: 'Deluxe Single', date: '2026-06-14', status: 'rejected' },
    { id: 'BK-004', studentName: 'Nour Ibrahim', property: 'Premium Student Studio', room: 'Master Studio', date: '2026-06-12', status: 'approved' },
  ]);

  // Monthly earnings chart data (last 6 months)
  chartData = [
    { month: 'Jan', value: 12400 },
    { month: 'Feb', value: 15800 },
    { month: 'Mar', value: 14200 },
    { month: 'Apr', value: 18900 },
    { month: 'May', value: 17300 },
    { month: 'Jun', value: 21600 },
  ];

  chartMax = Math.max(...this.chartData.map(d => d.value));

  getBarHeight(value: number): number {
    return Math.round((value / this.chartMax) * 100);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-badge--pending',
      approved: 'status-badge--approved',
      rejected: 'status-badge--rejected',
      cancelled: 'status-badge--cancelled'
    };
    return map[status] || '';
  }

  currentLandlordId = computed(() => {
    const user = this.authService.currentUserValue;
    return user?.landlordId || user?.id || 'L1';
  });

  ngOnInit() {
    // Load landlord's properties (filter by landlordId in a real app)
    this.housingService.getHousings().subscribe({
      next: (housings) => {
        // Use first 3 as "this landlord's" in mock scenario
        this.myListings.set(housings.slice(0, 3));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Verification status (mocked — would come from landlord profile)
  verificationStatus = signal<'pending' | 'verified' | 'rejected'>('pending');
}
