import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  HousingUnit,
  GenderAllowed,
  CreateHousingUnitRequest,
  UpdateHousingUnitRequest
} from '../../../../core/models/housing.model';
import { HousingService } from '../../../../core/services/housing.service';
import { AuthService } from '../../../../core/services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-landlord-listings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './landlord-listings.html'
})
export class LandlordListings implements OnInit {
  private housingService = inject(HousingService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  listings = signal<HousingUnit[]>([]);
  isModalOpen = signal(false);
  editingHousing = signal<HousingUnit | null>(null);
  activeTab = signal(0);
  isSaving = signal(false);
  deleteConfirmId = signal<string | null>(null);
  saveError = signal<string | null>(null);

  // expose enum to template
  GenderAllowed = GenderAllowed;

  // Tabs
  tabs = ['General Info', 'Location & Media', 'Rules & Pricing'];

  // ── Media state ──
  uploadedImages = signal<{ url: string; name: string; size: string }[]>([]);
  uploadedVideo = signal<{ url: string; name: string; size: string } | null>(null);
  isDragOver = signal(false);
  mediaError = signal<string | null>(null);

  readonly MAX_IMAGES = 8;
  readonly ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  readonly ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
  readonly MAX_FILE_SIZE_MB = 20;

  formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onImageFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.processImageFiles(Array.from(input.files));
    input.value = ''; // reset so same file can be re-selected
  }

  onVideoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processVideoFile(input.files[0]);
    input.value = '';
  }

  processImageFiles(files: File[]) {
    this.mediaError.set(null);
    const current = this.uploadedImages();
    const remaining = this.MAX_IMAGES - current.length;
    if (remaining <= 0) {
      this.mediaError.set(`Maximum ${this.MAX_IMAGES} images allowed.`);
      return;
    }
    const toProcess = files.slice(0, remaining);
    toProcess.forEach(file => {
      if (!this.ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        this.mediaError.set('Only JPG, PNG, and WebP images are supported.');
        return;
      }
      if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
        this.mediaError.set(`File "${file.name}" exceeds ${this.MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        this.uploadedImages.update(prev => [
          ...prev,
          { url, name: file.name, size: this.formatBytes(file.size) }
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  processVideoFile(file: File) {
    this.mediaError.set(null);
    if (!this.ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      this.mediaError.set('Only MP4, WebM, and OGG videos are supported.');
      return;
    }
    if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024 * 3) { // 60MB for video
      this.mediaError.set('Video file must be under 60MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    this.uploadedVideo.set({ url, name: file.name, size: this.formatBytes(file.size) });
  }

  removeImage(index: number) {
    this.uploadedImages.update(prev => prev.filter((_, i) => i !== index));
  }

  removeVideo() {
    const v = this.uploadedVideo();
    if (v) URL.revokeObjectURL(v.url);
    this.uploadedVideo.set(null);
  }

  moveImage(from: number, to: number) {
    if (to < 0 || to >= this.uploadedImages().length) return;
    this.uploadedImages.update(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() { this.isDragOver.set(false); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      const images = files.filter(f => this.ACCEPTED_IMAGE_TYPES.includes(f.type));
      const video = files.find(f => this.ACCEPTED_VIDEO_TYPES.includes(f.type));
      if (images.length) this.processImageFiles(images);
      if (video) this.processVideoFile(video);
    }
  }

  housingForm: FormGroup = this.fb.group({
    title:            ['', [Validators.required, Validators.minLength(5)]],
    description:      ['', [Validators.required, Validators.minLength(20)]],
    address:          ['', Validators.required],
    city:             ['', Validators.required],
    area:             ['', Validators.required],
    price:            [null, [Validators.required, Validators.min(0)]],
    baseMonthlyPrice: [null, [Validators.required, Validators.min(0)]],
    unitImageUrl:     [''],
    videoUrl:         [''],
    genderAllowed:    [GenderAllowed.Mixed, Validators.required],
    rules:            [''],
    location:         [''],
    latitude:         [null],
    longitude:        [null],
    numberOfRooms:    [1, [Validators.required, Validators.min(1)]],
    isAvailable:      [true]
  });

  ngOnInit() {
    const user = this.authService.currentUserValue;
    this.landlordId = user?.landlordId || (user as any)?.landLordId || user?.id || '';

    this.housingService.getAll().subscribe({
      next: (all) => {
        // Only show units that belong to this landlord
        this.listings.set(all.filter(u => !this.landlordId || u.landLordId === this.landlordId));
        this.isLoading.set(false);
      },
      error: () => {
        this.housingService.getAll().subscribe({
          next: (all) => { this.listings.set(all); this.isLoading.set(false); },
          error: () => this.isLoading.set(false)
        });
        this.isLoading.set(false);
      }
    });

    // Sync input fields with map pin if changed manually
    this.housingForm.get('latitude')?.valueChanges.subscribe(lat => {
      if (this.locationMarker && lat) {
        const lng = this.housingForm.get('longitude')?.value;
        if (lng) this.locationMarker.setLatLng([lat, lng]);
      }
    });
    this.housingForm.get('longitude')?.valueChanges.subscribe(lng => {
      if (this.locationMarker && lng) {
        const lat = this.housingForm.get('latitude')?.value;
        if (lat) this.locationMarker.setLatLng([lat, lng]);
      }
    });
  }

  private landlordId = '';

  openAddModal() {
    console.log('openAddModal called');
    this.editingHousing.set(null);
    this.housingForm.reset({
      genderAllowed: GenderAllowed.Mixed,
      isAvailable: true,
      numberOfRooms: 1,
      price: null,
      baseMonthlyPrice: null,
      latitude: null,
      longitude: null
    });
    this.activeTab.set(0);
    this.uploadedImages.set([]);
    this.uploadedVideo.set(null);
    this.mediaError.set(null);
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  private locationMap: L.Map | null = null;
  private locationMarker: L.Marker | null = null;

  switchTab(index: number) {
    this.activeTab.set(index);
    if (index === 1) {
      // Small timeout to allow *ngIf to render the DOM elements first
      setTimeout(() => this.initLocationMap(), 50);
    }
  }

  initLocationMap() {
    if (this.locationMap) {
      this.locationMap.remove();
      this.locationMap = null;
    }
    const mapEl = document.getElementById('locationPickerMap');
    if (!mapEl) return;

    // Use existing coords or default to Cairo
    const lat = this.housingForm.get('latitude')?.value || 30.0444;
    const lng = this.housingForm.get('longitude')?.value || 31.2357;

    this.locationMap = L.map(mapEl).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.locationMap);

    const iconRetinaUrl  = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl        = 'assets/leaflet/marker-icon.png';
    const shadowUrl      = 'assets/leaflet/marker-shadow.png';
    const DefaultIcon = L.icon({ iconRetinaUrl, iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

    this.locationMarker = L.marker([lat, lng], { draggable: true, icon: DefaultIcon }).addTo(this.locationMap);

    this.locationMarker.on('dragend', () => {
      const pos = this.locationMarker!.getLatLng();
      this.housingForm.patchValue({ latitude: pos.lat, longitude: pos.lng }, { emitEvent: false });
    });

    this.locationMap.on('click', (e: L.LeafletMouseEvent) => {
      this.locationMarker!.setLatLng(e.latlng);
      this.housingForm.patchValue({ latitude: e.latlng.lat, longitude: e.latlng.lng }, { emitEvent: false });
    });

    setTimeout(() => {
      this.locationMap?.invalidateSize();
    }, 100);
  }

  openEditModal(unit: HousingUnit) {
    this.editingHousing.set(unit);
    this.housingForm.patchValue({
      title:            unit.title,
      description:      unit.description,
      address:          unit.address,
      city:             unit.city,
      area:             unit.area,
      price:            unit.price,
      baseMonthlyPrice: unit.baseMonthlyPrice,
      unitImageUrl:     unit.unitImageUrl,
      videoUrl:         unit.videoUrl,
      genderAllowed:    unit.genderAllowed,
      rules:            unit.rules,
      location:         unit.location,
      latitude:         unit.latitude,
      longitude:        unit.longitude,
      numberOfRooms:    unit.numberOfRooms,
      isAvailable:      unit.isAvailable
    });
    this.activeTab.set(0);
    this.uploadedImages.set(
      unit.unitImageUrl ? [{ url: unit.unitImageUrl, name: 'image', size: '' }] : []
    );
    this.uploadedVideo.set(
      unit.videoUrl ? { url: unit.videoUrl, name: 'video', size: '' } : null
    );
    this.mediaError.set(null);
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() { 
    this.isModalOpen.set(false); 
    if (this.locationMap) {
      this.locationMap.remove();
      this.locationMap = null;
    }
  }

  saveHousing() {
    if (this.housingForm.invalid) {
      this.housingForm.markAllAsTouched();
      this.saveError.set('Please fill out all required fields correctly. Check previous tabs for errors.');
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);
    const fv = this.housingForm.value;

    // Use uploaded image URL if provided via file, else keep the URL field value
    const imageUrl = this.uploadedImages().length > 0 && this.uploadedImages()[0].url.startsWith('data:')
      ? '' // In a real app you'd upload to CDN first; for now skip data URIs
      : (this.uploadedImages()[0]?.url || fv.unitImageUrl || '');
    const videoUrl = this.uploadedVideo()?.url.startsWith('blob:')
      ? ''
      : (this.uploadedVideo()?.url || fv.videoUrl || '');

    const editing = this.editingHousing();

    if (editing) {
      const req: UpdateHousingUnitRequest = {
        housingUnitId:    editing.housingUnitId,
        title:            fv.title,
        description:      fv.description,
        address:          fv.address,
        city:             fv.city,
        area:             fv.area,
        price:            fv.price,
        baseMonthlyPrice: fv.baseMonthlyPrice,
        unitImageUrl:     imageUrl,
        videoUrl:         videoUrl,
        genderAllowed:    Number(fv.genderAllowed),
        rules:            fv.rules || '',
        location:         fv.location || '',
        latitude:         fv.latitude || 0,
        longitude:        fv.longitude || 0,
        numberOfRooms:    fv.numberOfRooms,
        isAvailable:      fv.isAvailable
      };
      this.housingService.update(req).subscribe({
        next: (updated) => {
          this.listings.update(prev =>
            prev.map(h => h.housingUnitId === editing.housingUnitId ? updated : h)
          );
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.saveError.set(err?.error?.message || 'Failed to update. Please try again.');
          this.isSaving.set(false);
        }
      });
    } else {
      const req: CreateHousingUnitRequest = {
        landLordId:       this.landlordId,
        title:            fv.title,
        description:      fv.description,
        address:          fv.address,
        city:             fv.city,
        area:             fv.area,
        price:            fv.price,
        baseMonthlyPrice: fv.baseMonthlyPrice,
        unitImageUrl:     imageUrl,
        videoUrl:         videoUrl,
        genderAllowed:    Number(fv.genderAllowed),
        rules:            fv.rules || '',
        location:         fv.location || '',
        latitude:         fv.latitude || 0,
        longitude:        fv.longitude || 0,
        numberOfRooms:    fv.numberOfRooms,
        isAvailable:      fv.isAvailable
      };
      this.housingService.create(req).subscribe({
        next: (created) => {
          this.listings.update(prev => [created, ...prev]);
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.saveError.set(err?.error?.message || 'Failed to create. Please try again.');
          this.isSaving.set(false);
        }
      });
    }
  }

  confirmDelete(id: string) { this.deleteConfirmId.set(id); }
  cancelDelete()             { this.deleteConfirmId.set(null); }

  deleteHousing(id: string) {
    this.housingService.delete(id).subscribe({
      next: () => {
        this.listings.update(prev => prev.filter(h => h.housingUnitId !== id));
      },
      error: () => {
        // Optimistic: remove locally even if server fails
        this.listings.update(prev => prev.filter(h => h.housingUnitId !== id));
      }
    });
    this.deleteConfirmId.set(null);
  }

  toggleAvailability(unit: HousingUnit) {
    const req: UpdateHousingUnitRequest = {
      ...unit,
      housingUnitId: unit.housingUnitId,
      isAvailable: !unit.isAvailable
    };
    this.housingService.update(req).subscribe();
    this.listings.update(prev =>
      prev.map(h => h.housingUnitId === unit.housingUnitId ? { ...h, isAvailable: !h.isAvailable } : h)
    );
  }
}
