import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { Housing } from '../../../../core/models/housing.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-housing-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './housing-list.html'
})
export class HousingList implements OnInit {
  private fb = inject(FormBuilder);
  private housingService = inject(HousingService);
  private wishlistService = inject(WishlistService);

  filterForm: FormGroup;
  housings = signal<Housing[]>([]);
  isLoading = signal(true);

  // ── Pagination ──────────────────────────────────────────────────────────────
  readonly pageSize = 4;
  currentPage = signal(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.housings().length / this.pageSize)));

  paginatedHousings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.housings().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      city: [''],
      minPrice: [null],
      maxPrice: [null],
      type: [''],
      gender: [''],
      facilities: [[]],
      sortBy: ['recommended']
    });
  }

  ngOnInit() {
    this.loadHousings();

    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1); // reset to first page on filter/sort change
      this.loadHousings();
    });
  }

  loadHousings() {
    this.isLoading.set(true);
    this.housingService.getHousings(this.filterForm.value).subscribe({
      next: (data) => {
        this.housings.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  // ── Pagination helpers ──────────────────────────────────────────────────────
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage() { this.goToPage(this.currentPage() - 1); }
  nextPage() { this.goToPage(this.currentPage() + 1); }

  // ── Filter helpers ──────────────────────────────────────────────────────────
  toggleWishlist(item: Housing, event: Event) {
    event.stopPropagation();
    this.wishlistService.toggleWishlist(item);
  }

  isInWishlist(id: string): boolean {
    return this.wishlistService.isInWishlist(id);
  }

  setGender(gender: string) {
    this.filterForm.patchValue({ gender });
  }

  toggleFacility(facility: string) {
    const current: string[] = this.filterForm.get('facilities')?.value || [];
    const index = current.indexOf(facility);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(facility);
    }
    this.filterForm.get('facilities')?.setValue([...current]);
  }

  isFacilitySelected(facility: string): boolean {
    return (this.filterForm.get('facilities')?.value || []).includes(facility);
  }

  resetFilters() {
    this.filterForm.reset({
      search: '',
      city: '',
      minPrice: null,
      maxPrice: null,
      type: '',
      gender: '',
      facilities: [],
      sortBy: 'recommended'
    });
    this.currentPage.set(1);
  }
}
