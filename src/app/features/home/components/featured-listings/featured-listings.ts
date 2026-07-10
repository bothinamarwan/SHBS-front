import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HousingService } from '../../../../core/services/housing.service';
import { StudentService } from '../../../../core/services/student.service';
import { HousingUnit } from '../../../../core/models/housing.model';

@Component({
  selector: 'app-featured-listings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './featured-listings.html',
  styleUrl: './featured-listings.css',
})
export class FeaturedListings implements OnInit {
  private housingService = inject(HousingService);
  private studentService = inject(StudentService);

  listings = signal<HousingUnit[]>([]);
  isLoading = signal(true);
  isVerified = signal(false);
  showVerificationMessage = signal(false);

  ngOnInit() {
    // Check if user is logged in and get verification status
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser && (currentUser.role === 'student' || currentUser.studentId)) {
      this.studentService.getMyVerificationStatus().subscribe({
        next: (verificationStatus) => {
          const isVerified = verificationStatus?.isVerified === true || verificationStatus?.status === 'Approved' || verificationStatus?.verificationStatus === 'Approved';
          this.isVerified.set(isVerified);
          if (!isVerified) {
            this.showVerificationMessage.set(true);
          }
        },
        error: () => {
          // If error fetching verification, assume not verified
          this.isVerified.set(false);
          this.showVerificationMessage.set(true);
        }
      });
    }

    this.housingService.getAll().subscribe({
      next: (data) => {
        this.listings.set(data.slice(0, 3));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
