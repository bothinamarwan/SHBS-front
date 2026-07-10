import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { StudentService } from '../../../../core/services/student.service';
import { HousingUnit, GenderAllowed, genderLabel } from '../../../../core/models/housing.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-housing-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './housing-list.html'
})
export class HousingList implements OnInit {
  private fb             = inject(FormBuilder);
  private housingService = inject(HousingService);
  private wishlistService = inject(WishlistService);
  private studentService = inject(StudentService);

  filterForm: FormGroup;
  allHousings  = signal<HousingUnit[]>([]);
  housings     = signal<HousingUnit[]>([]);
  isLoading    = signal(true);
  errorMessage = signal<string | null>(null);
  isVerified = signal(false);
  showVerificationMessage = signal(false);

  // expose helper to template
  GenderAllowed = GenderAllowed;
  genderLabel   = genderLabel;

  // ── Pagination ─────────────────────────────────────────────────────────────
  readonly pageSize = 6;
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
      search:   [''],
      city:     [''],
      minPrice: [null],
      maxPrice: [null],
      gender:   [''],
      sortBy:   ['recommended']
    });
  }

  ngOnInit() {
    // Check if user is logged in and get verification status
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');
    
    if (currentUser && (currentUser.role === 'student' || currentUser.studentId)) {
      this.studentService.getMyVerificationStatus().subscribe({
        next: (verificationStatus) => {
          const isVerified = verificationStatus?.isVerified === true || verificationStatus?.status === 'Approved' || verificationStatus?.verificationStatus === 'Approved' || verificationStatus?.verificationStatus === 2;
          this.isVerified.set(isVerified);
          if (!isVerified) {
            this.showVerificationMessage.set(true);
          }
        },
        error: () => {
          const localVerificationStatus = currentUser?.universityVerificationStatus || studentData?.universityVerificationStatus;
          const isVerified = localVerificationStatus === 2 || localVerificationStatus === 'Approved' || localVerificationStatus === true;
          this.isVerified.set(isVerified);
          this.showVerificationMessage.set(!isVerified);
        }
      });
    }

    this.loadHousings();

    this.filterForm.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1);
      this.applyFilters();
    });
  }

  loadHousings() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.housingService.getAll().subscribe({
      next: (data) => {
        this.allHousings.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load housings', err);
        this.errorMessage.set('Failed to load housing units. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    const f = this.filterForm.value;
    let results = [...this.allHousings()];

    if (f.city) {
      results = results.filter(h => h.city?.toLowerCase().includes(f.city.toLowerCase()));
    }
    if (f.gender !== '' && f.gender !== null) {
      const genderNum = Number(f.gender);
      results = results.filter(h => h.genderAllowed === genderNum || h.genderAllowed === GenderAllowed.Mixed);
    }
    if (f.minPrice != null) {
      results = results.filter(h => h.baseMonthlyPrice >= f.minPrice);
    }
    if (f.maxPrice != null) {
      results = results.filter(h => h.baseMonthlyPrice <= f.maxPrice);
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      results = results.filter(h =>
        h.title?.toLowerCase().includes(q) ||
        h.area?.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q)
      );
    }

    switch (f.sortBy) {
      case 'price-asc':  results.sort((a, b) => a.baseMonthlyPrice - b.baseMonthlyPrice); break;
      case 'price-desc': results.sort((a, b) => b.baseMonthlyPrice - a.baseMonthlyPrice); break;
      default: break;
    }

    this.housings.set(results);
  }

  // ── Pagination helpers ──────────────────────────────────────────────────────
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }
  prevPage() { this.goToPage(this.currentPage() - 1); }
  nextPage() { this.goToPage(this.currentPage() + 1); }

  // ── Wishlist ────────────────────────────────────────────────────────────────
  toggleWishlist(item: HousingUnit, event: Event) {
    event.stopPropagation();
    // WishlistService expects a Housing-like object – pass minimal shape
    this.wishlistService.toggleWishlist({ id: item.housingUnitId, ...item } as any);
  }

  isInWishlist(id: string): boolean {
    return this.wishlistService.isInWishlist(id);
  }

  // ── Filter helpers ──────────────────────────────────────────────────────────
  setGender(gender: string) {
    this.filterForm.patchValue({ gender });
  }

  resetFilters() {
    this.filterForm.reset({
      search: '', city: '', minPrice: null, maxPrice: null, gender: '', sortBy: 'recommended'
    });
    this.currentPage.set(1);
  }
}
