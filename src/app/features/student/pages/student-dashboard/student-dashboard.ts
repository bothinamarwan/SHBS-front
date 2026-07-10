import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HousingService } from '../../../../core/services/housing.service';
import { BookingService } from '../../../../core/services/booking.service';
import { StudentService } from '../../../../core/services/student.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { HousingUnit } from '../../../../core/models/housing.model';
import { map } from 'rxjs/operators';
import { StudentVerifiedDirective } from '../../../../core/directives/student-verified.directive';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StudentVerifiedDirective],
  templateUrl: './student-dashboard.html'
})
export class StudentDashboard implements OnInit {
  private authService = inject(AuthService);
  private housingService = inject(HousingService);
  private bookingService = inject(BookingService);
  private studentService = inject(StudentService);
  private wishlistService = inject(WishlistService);

  user = this.authService.currentUser$;

  featuredListings: HousingUnit[] = [];
  isLoadingListings = true;

  // Real stats from services
  activeBookingsCount$ = this.studentService.getMyBookings().pipe(
    map(res => {
      const bookings = res || [];
      return bookings.filter((b: any) => b.bookingStatus === 1).length;
    })
  );
  pendingCount$ = this.studentService.getMyBookings().pipe(
    map(res => {
      const bookings = res || [];
      return bookings.filter((b: any) => b.bookingStatus === 0).length;
    })
  );
  savedCount$ = this.wishlistService.getWishlist().pipe(
    map(wishlist => wishlist.length)
  );

  ngOnInit() {
    this.housingService.getAll().subscribe({
      next: (housings) => {
        this.featuredListings = housings.slice(0, 4);
        this.isLoadingListings = false;
      },
      error: () => {
        this.isLoadingListings = false;
      }
    });
  }
}
