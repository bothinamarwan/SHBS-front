import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LandlordService } from '../../../../core/services/landlord.service';
import { HousingService } from '../../../../core/services/housing.service';
import { Landlord } from '../../../../core/models/landlord.model';
import { HousingUnit, genderLabel, GenderAllowed } from '../../../../core/models/housing.model';

@Component({
  selector: 'app-landlord-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landlord-profile.html'
})
export class LandlordProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private landlordService = inject(LandlordService);
  private housingService = inject(HousingService);

  landlordId = signal<string | null>(null);
  properties = signal<HousingUnit[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  GenderAllowed = GenderAllowed;
  genderLabel = genderLabel;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.landlordId.set(id);
      this.loadProperties(id);
    } else {
      this.errorMessage.set('Invalid landlord ID');
      this.isLoading.set(false);
    }
  }

  private loadProperties(landlordId: string) {
    this.housingService.getAll().subscribe({
      next: (allHousing) => {
        // Filter properties by this landlord
        const landlordProps = allHousing.filter(h => h.landLordId === landlordId);
        this.properties.set(landlordProps);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load properties', err);
        this.isLoading.set(false);
      }
    });
  }
}
