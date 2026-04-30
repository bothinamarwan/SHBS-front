import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { Housing } from '../../../../core/models/housing.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './search.html'
})
export class Search implements OnInit {
  private fb = inject(FormBuilder);
  private housingService = inject(HousingService);

  filterForm: FormGroup;
  housings = signal<Housing[]>([]);
  isLoading = signal(true);

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
    this.filterForm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage.set(1);
      this.loadHousings();
    });
  }

  loadHousings() {
    this.isLoading.set(true);
    this.housingService.getHousings(this.filterForm.value).subscribe({
      next: (data) => { this.housings.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p);
  }
  prevPage() { this.goToPage(this.currentPage() - 1); }
  nextPage() { this.goToPage(this.currentPage() + 1); }

  setGender(g: string) { this.filterForm.patchValue({ gender: g }); }

  toggleFacility(f: string) {
    const cur: string[] = this.filterForm.get('facilities')?.value || [];
    const idx = cur.indexOf(f);
    idx > -1 ? cur.splice(idx, 1) : cur.push(f);
    this.filterForm.get('facilities')?.setValue([...cur]);
  }

  isFacilitySelected(f: string): boolean {
    return (this.filterForm.get('facilities')?.value || []).includes(f);
  }

  resetFilters() {
    this.filterForm.reset({ search: '', city: '', minPrice: null, maxPrice: null, type: '', gender: '', facilities: [], sortBy: 'recommended' });
    this.currentPage.set(1);
  }
}
