import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BedService } from '../../../../core/services/bed.service';
import { RoomService } from '../../../../core/services/room.service';
import { HousingService } from '../../../../core/services/housing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Bed, CreateBedRequest, UpdateBedRequest } from '../../../../core/models/bed.model';
import { Room } from '../../../../core/models/room.model';
import { HousingUnit } from '../../../../core/models/housing.model';

@Component({
  selector: 'app-landlord-beds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landlord-beds.html'
})
export class LandlordBeds implements OnInit {
  private bedService = inject(BedService);
  private roomService = inject(RoomService);
  private housingService = inject(HousingService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  beds = signal<Bed[]>([]);
  rooms = signal<Room[]>([]);
  housingUnits = signal<HousingUnit[]>([]);
  selectedRoomId = signal<string | null>(null);

  isModalOpen = signal(false);
  editingBed = signal<Bed | null>(null);
  isSaving = signal(false);
  deleteConfirmId = signal<string | null>(null);
  saveError = signal<string | null>(null);

  bedForm: FormGroup = this.fb.group({
    roomId: ['', Validators.required],
    bedNumber: ['', Validators.required],
    isAvailable: [true]
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    let housingLoaded = false;
    let roomsLoaded = false;
    let bedsLoaded = false;

    const checkDone = () => {
      if (housingLoaded && roomsLoaded && bedsLoaded) {
        this.isLoading.set(false);
      }
    };

    const user = this.authService.currentUserValue;
    const landlordId = user?.landlordId || (user as any)?.landLordId || user?.id || '';

    this.housingService.getAll().subscribe({
      next: (units) => {
        this.housingUnits.set(units.filter(u => !landlordId || u.landLordId === landlordId));
        housingLoaded = true;
        checkDone();
      },
      error: () => { housingLoaded = true; checkDone(); }
    });

    this.roomService.getAllRooms().subscribe({
      next: (rms) => {
        const landlordRoomIds = this.housingUnits().map(u => u.housingUnitId);
        this.rooms.set(rms.filter(r => landlordRoomIds.includes(r.housingUnitId)));
        roomsLoaded = true;
        checkDone();
      },
      error: () => { roomsLoaded = true; checkDone(); }
    });

    this.bedService.getAllBeds(0, 1000).subscribe({
      next: (res) => {
        const landlordRoomIds = this.rooms().map(r => r.id || r.roomId!).filter(id => id);
        this.beds.set(res.records.filter(b => landlordRoomIds.includes(b.roomId)));
        bedsLoaded = true;
        checkDone();
      },
      error: () => { bedsLoaded = true; checkDone(); }
    });
  }

  getRoomInfo(roomId: string): Room | null {
    return this.rooms().find(r => (r.id === roomId || r.roomId === roomId)) || null;
  }

  getHousingUnitTitle(housingUnitId: string): string {
    const unit = this.housingUnits().find(u => u.housingUnitId === housingUnitId);
    return unit ? unit.title : 'Unknown Property';
  }

  filterBedsByRoom(): Bed[] {
    const roomId = this.selectedRoomId();
    if (!roomId) return this.beds();
    return this.beds().filter(b => b.roomId === roomId);
  }

  openAddModal() {
    this.editingBed.set(null);
    this.bedForm.reset({
      roomId: this.rooms().length > 0 ? (this.rooms()[0].id || this.rooms()[0].roomId!) : '',
      bedNumber: '',
      isAvailable: true
    });
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(bed: Bed) {
    this.editingBed.set(bed);
    this.bedForm.patchValue({
      roomId: bed.roomId,
      bedNumber: bed.bedNumber,
      isAvailable: bed.isAvailable
    });
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  saveBed() {
    if (this.bedForm.invalid) {
      this.bedForm.markAllAsTouched();
      this.saveError.set('Please fill out all required fields correctly.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    const fv = this.bedForm.value;
    const editing = this.editingBed();

    if (editing) {
      const req: UpdateBedRequest = {
        bedId: editing.bedId,
        bedNumber: fv.bedNumber,
        isAvailable: fv.isAvailable,
        isOccupied: false
      };

      this.bedService.updateBed(req).subscribe({
        next: () => {
          this.loadData();
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.saveError.set('Failed to update bed. ' + (err?.error?.message || ''));
          this.isSaving.set(false);
        }
      });
    } else {
      const req: CreateBedRequest = {
        roomId: fv.roomId,
        bedNumber: fv.bedNumber
      };

      this.bedService.createBed(req).subscribe({
        next: () => {
          this.loadData();
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.saveError.set('Failed to create bed. ' + (err?.error?.message || ''));
          this.isSaving.set(false);
        }
      });
    }
  }

  confirmDelete(bedId: string) { this.deleteConfirmId.set(bedId); }
  cancelDelete() { this.deleteConfirmId.set(null); }

  deleteBed(bedId: string) {
    this.bedService.deleteBed(bedId).subscribe({
      next: () => { this.loadData(); },
      error: () => { this.loadData(); }
    });
    this.deleteConfirmId.set(null);
  }
}
