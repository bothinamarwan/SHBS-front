import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HousingService } from '../../../../core/services/housing.service';
import { LandlordService } from '../../../../core/services/landlord.service';
import { HousingUnit } from '../../../../core/models/housing.model';

interface BookingActivity {
  id: string;
  studentName: string;
  property: string;
  room: string;
  date: string;
  bookingStatus: number;
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
  private landlordService = inject(LandlordService);

  user = this.authService.currentUser$;
  isLoading = signal(true);

  myListings = signal<HousingUnit[]>([]);

  // Aggregate metrics derived from listings
  totalListings = computed(() => this.myListings().length);
  totalRooms = computed(() => this.myListings().reduce((acc, h) => acc + h.numberOfRooms, 0));
  occupiedRooms = computed(() => 0); // Need an API for this
  occupancyRate = computed(() =>
    this.totalRooms() > 0
      ? Math.round((this.occupiedRooms() / this.totalRooms()) * 100)
      : 0
  );
  monthlyEarnings = computed(() =>
    this.myListings().reduce((acc, h) => acc + (h.baseMonthlyPrice || h.price), 0) * 0.85
  );
  pendingBookings = signal(0);
  activeComplaints = signal(0);

  // Recent booking activity from API
  recentActivity = signal<any[]>([]);

  // No chart data — will be empty
  chartData: { month: string; value: number }[] = [];
  chartMax = 1;

  getBarHeight(value: number): number {
    return this.chartMax > 0 ? Math.round((value / this.chartMax) * 100) : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  }

  getStatusClass(status: number): string {
    const map: Record<number, string> = {
      0: 'status-badge--pending',
      1: 'status-badge--approved',
      2: 'status-badge--rejected',
      3: 'status-badge--cancelled'
    };
    return map[status] || 'status-badge--pending';
  }

  currentLandlordId = computed(() => {
    const user = this.authService.currentUserValue;
    return user?.landlordId || user?.id || 'L1';
  });

  ngOnInit() {
    const user = this.authService.currentUserValue;
    const landlordId = user?.landlordId || user?.id;

    if (landlordId) {
      // Load real bookings
      this.landlordService.getMyBookings().subscribe({
        next: (bookings: any[]) => {
          this.recentActivity.set(bookings.slice(0, 5));
          this.pendingBookings.set(bookings.filter((b: any) => b.bookingStatus === 0).length);
        },
        error: () => {}
      });
    }

    // Load landlord's own properties
    this.housingService.getAll().subscribe({
      next: (housings) => {
        this.myListings.set(housings);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // Load account status
    this.landlordService.getAccountStatus().subscribe({
      next: (statusData: any) => {
        // Assume statusData contains a status property
        if (statusData && statusData.status) {
          const statusMap: Record<string, 'pending' | 'verified' | 'rejected'> = {
            'verified': 'verified',
            'approved': 'verified',
            'pending': 'pending',
            'rejected': 'rejected'
          };
          this.verificationStatus.set(statusMap[statusData.status.toLowerCase()] || 'pending');
        } else if (statusData && statusData.isVerified) {
          this.verificationStatus.set('verified');
        }
      },
      error: (err) => console.error('Failed to get account status', err)
    });
  }

  // Verification status from landlord profile
  verificationStatus = signal<'pending' | 'verified' | 'rejected'>('pending');
}
