import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Housing, Room } from '../../../../core/models/housing.model';
import { HousingService } from '../../../../core/services/housing.service';
import { LandlordService } from '../../../../core/services/landlord.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-landlord-listings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landlord-listings.html'
})
export class LandlordListings implements OnInit {
  private housingService = inject(HousingService);
  private landlordService = inject(LandlordService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  listings = signal<Housing[]>([]);
  isModalOpen = signal(false);
  editingHousing = signal<Housing | null>(null);
  activeTab = signal(0);
  isSaving = signal(false);
  deleteConfirmId = signal<string | null>(null);

  // Facilities options
  facilityOptions = ['WiFi', 'AC', 'Kitchen', 'Laundry', 'Gym', 'Security', 'Parking', 'Elevator', 'Balcony'];

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
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [null, [Validators.required, Validators.min(100)]],
    type: ['single', Validators.required],
    gender: ['mixed', Validators.required],
    area: ['', Validators.required],
    city: ['', Validators.required],
    address: [''],
    facilities: [[]],
    rules: [''],
    rooms: this.fb.array([this.createRoomGroup()])
  });

  get roomsArray(): FormArray { return this.housingForm.get('rooms') as FormArray; }

  createRoomGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      roomType: ['single'],
      numberOfBeds: [1, [Validators.required, Validators.min(1)]],
      capacity: [1, [Validators.min(1)]],
      price: [null, [Validators.required, Validators.min(50)]],
      availabilityStatus: ['available']
    });
  }

  addRoom() { this.roomsArray.push(this.createRoomGroup()); }

  removeRoom(index: number) {
    if (this.roomsArray.length > 1) this.roomsArray.removeAt(index);
  }

  toggleFacility(facility: string) {
    const current: string[] = this.housingForm.get('facilities')!.value || [];
    const updated = current.includes(facility)
      ? current.filter(f => f !== facility)
      : [...current, facility];
    this.housingForm.get('facilities')!.setValue(updated);
  }

  isFacilitySelected(facility: string): boolean {
    return (this.housingForm.get('facilities')?.value || []).includes(facility);
  }

  tabs = ['General Info', 'Rooms', 'Rules & Facilities', 'Media'];

  ngOnInit() {
    this.housingService.getHousings().subscribe({
      next: (all) => {
        this.listings.set(all.slice(0, 3)); // mock: first 3 belong to this landlord
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openAddModal() {
    this.editingHousing.set(null);
    this.housingForm.reset({
      type: 'single', gender: 'mixed',
      facilities: [], rooms: []
    });
    // Reset rooms array to one empty room
    while (this.roomsArray.length) this.roomsArray.removeAt(0);
    this.roomsArray.push(this.createRoomGroup());
    this.activeTab.set(0);
    this.uploadedImages.set([]);
    this.uploadedVideo.set(null);
    this.mediaError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(housing: Housing) {
    this.editingHousing.set(housing);
    // Clear rooms array
    while (this.roomsArray.length) this.roomsArray.removeAt(0);
    housing.rooms.forEach(room => {
      this.roomsArray.push(this.fb.group({
        name: [room.name, Validators.required],
        roomType: [room.roomType],
        numberOfBeds: [room.beds, [Validators.required, Validators.min(1)]],
        capacity: [room.capacity || room.beds, [Validators.min(1)]],
        price: [room.price, [Validators.required, Validators.min(50)]],
        availabilityStatus: [room.availabilityStatus || 'available']
      }));
    });
    this.housingForm.patchValue({
      title: housing.title,
      description: housing.description,
      price: housing.price,
      type: housing.type,
      gender: housing.gender,
      area: housing.area,
      city: housing.city,
      address: housing.address,
      facilities: [...housing.facilities],
      rules: housing.rules?.join(', ') || ''
    });
    this.activeTab.set(0);
    this.uploadedImages.set(
      (housing.images || []).map(url => ({ url, name: 'existing.jpg', size: '' }))
    );
    this.uploadedVideo.set(null);
    this.mediaError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  saveHousing() {
    if (this.housingForm.invalid) {
      this.housingForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const formVal = this.housingForm.value;
    const payload = {
      ...formVal,
      rules: formVal.rules ? formVal.rules.split(',').map((r: string) => r.trim()) : [],
      isAvailable: true,
      rating: 0,
      reviewsCount: 0,
      images: this.uploadedImages().length > 0
        ? this.uploadedImages().map(i => i.url)
        : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    };

    const editing = this.editingHousing();
    const obs$ = editing
      ? this.landlordService.editHousing(editing.id, payload)
      : this.landlordService.addHousing(payload);

    obs$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        // Update local state
        if (editing) {
          this.listings.update(prev =>
            prev.map(h => h.id === editing.id ? { ...h, ...payload } : h)
          );
        } else {
          const newListing: Housing = {
            id: 'L' + Date.now(),
            ...payload,
            rooms: formVal.rooms.map((r: any, i: number) => ({
              id: 'r' + Date.now() + i,
              name: r.name,
              roomType: r.roomType,
              beds: r.numberOfBeds,
              capacity: r.capacity,
              price: r.price,
              availableBeds: r.numberOfBeds,
              availabilityStatus: r.availabilityStatus
            }))
          };
          this.listings.update(prev => [newListing, ...prev]);
        }
      },
      error: () => {
        // Optimistic local update on API failure (mock)
        this.isSaving.set(false);
        this.closeModal();
      }
    });
  }

  confirmDelete(id: string) { this.deleteConfirmId.set(id); }
  cancelDelete() { this.deleteConfirmId.set(null); }

  deleteHousing(id: string) {
    this.landlordService.deleteHousing(id).subscribe({
      complete: () => {},
      error: () => {}
    });
    // Always update local state
    this.listings.update(prev => prev.filter(h => h.id !== id));
    this.deleteConfirmId.set(null);
  }

  toggleAvailability(housing: Housing) {
    this.landlordService.manageAvailability(housing.id, { isAvailable: !housing.isAvailable }).subscribe();
    this.listings.update(prev =>
      prev.map(h => h.id === housing.id ? { ...h, isAvailable: !h.isAvailable } : h)
    );
  }

  getAvailableBeds(housing: Housing): number {
    return housing.rooms.reduce((acc, r) => acc + r.availableBeds, 0);
  }
}
