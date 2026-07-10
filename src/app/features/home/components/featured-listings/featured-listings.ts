import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HousingService } from '../../../../core/services/housing.service';
import { HousingUnit } from '../../../../core/models/housing.model';
import { StudentVerifiedDirective } from '../../../../core/directives/student-verified.directive';

@Component({
  selector: 'app-featured-listings',
  standalone: true,
  imports: [CommonModule, RouterLink, StudentVerifiedDirective],
  templateUrl: './featured-listings.html',
  styleUrl: './featured-listings.css',
})
export class FeaturedListings implements OnInit {
  private housingService = inject(HousingService);

  listings = signal<HousingUnit[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.housingService.getAll().subscribe({
      next: (data) => {
        this.listings.set(data.slice(0, 3));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
