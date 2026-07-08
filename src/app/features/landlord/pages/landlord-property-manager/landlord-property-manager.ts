import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { RoomService } from '../../../../core/services/room.service';
import { BedService } from '../../../../core/services/bed.service';
import { HousingUnit } from '../../../../core/models/housing.model';
import { Room, RoomType, CreateRoomRequest, UpdateRoomRequest } from '../../../../core/models/room.model';
import { Bed, CreateBedRequest, UpdateBedRequest } from '../../../../core/models/bed.model';

@Component({
  selector: 'app-landlord-property-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './landlord-property-manager.html'
})
export class LandlordPropertyManager implements OnInit {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private fb       = inject(FormBuilder);
  private housingService = inject(HousingService);
  private roomService    = inject(RoomService);
  private bedService     = inject(BedService);

  RoomType = RoomType;

  // ── State ──────────────────────────────────────────────────────────────────
  isLoading        = signal(true);
  property         = signal<HousingUnit | null>(null);
  rooms            = signal<Room[]>([]);
  bedsByRoom       = signal<Record<string, Bed[]>>({});
  expandedRoomId   = signal<string | null>(null);
  togglingId       = signal<string | null>(null);   // room or bed id currently toggling
  successMessage   = signal<string | null>(null);
  errorMessage     = signal<string | null>(null);

  // ── Room Modal ─────────────────────────────────────────────────────────────
  roomModalOpen    = signal(false);
  editingRoom      = signal<Room | null>(null);
  isSavingRoom     = signal(false);
  roomSaveError    = signal<string | null>(null);

  roomForm: FormGroup = this.fb.group({
    roomType:     [RoomType.Single, Validators.required],
    numberOfBeds: [1, [Validators.required, Validators.min(1)]],
    price:        [0, [Validators.required, Validators.min(0)]],
    capacity:     [1, [Validators.required, Validators.min(1)]],
    roomImageUrl: [''],
    isAvailable:  [true]
  });

  // ── Bed Modal ──────────────────────────────────────────────────────────────
  bedModalOpen     = signal(false);
  editingBed       = signal<Bed | null>(null);
  bedModalRoomId   = signal<string>('');
  isSavingBed      = signal(false);
  bedSaveError     = signal<string | null>(null);

  bedForm: FormGroup = this.fb.group({
    bedNumber:   ['', Validators.required],
    isAvailable: [true]
  });

  // ── Delete confirm ─────────────────────────────────────────────────────────
  deleteRoomId = signal<string | null>(null);
  deleteBedId  = signal<string | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/landlord/listings']); return; }
    this.loadProperty(id);
  }

  loadProperty(id: string) {
    this.isLoading.set(true);
    this.housingService.getById(id).subscribe({
      next: (p) => {
        this.property.set(p);
        this.loadRooms(id);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  loadRooms(housingUnitId: string) {
    this.roomService.getRoomsByHousingUnit(housingUnitId).subscribe((rooms: any) => {
      console.log('Rooms response:', rooms);
      // Handle paginated response or plain array
      const roomsArray = Array.isArray(rooms) ? rooms : (rooms?.records || []);
      // Sort rooms by type then price
      this.rooms.set(roomsArray);
      this.isLoading.set(false);
    }, (error) => { this.isLoading.set(false); });
  }

  loadBedsForRoom(roomId: string) {
    this.bedService.getBedsByRoom(roomId).subscribe({
      next: (beds) => {
        this.bedsByRoom.update(prev => ({ ...prev, [roomId]: beds }));
      }
    });
  }

  toggleRoomExpand(room: Room) {
    const id = room.id || room.roomId!;
    if (this.expandedRoomId() === id) {
      this.expandedRoomId.set(null);
    } else {
      this.expandedRoomId.set(id);
      if (!this.bedsByRoom()[id]) {
        this.loadBedsForRoom(id);
      }
    }
  }

  // ── Availability toggles ───────────────────────────────────────────────────

  toggleRoomAvailability(room: Room) {
    const id = room.id || room.roomId!;
    this.togglingId.set(id);
    const req: UpdateRoomRequest = {
      roomId:       id,
      roomType:     room.roomType,
      roomImageUrl: room.roomImageUrl,
      numberOfBeds: room.numberOfBeds,
      price:        room.price,
      capacity:     room.capacity,
      isAvailable:  !room.isAvailable
    };
    this.roomService.updateRoom(req).subscribe({
      next: () => {
        this.rooms.update(prev =>
          prev.map(r => (r.id === id || r.roomId === id) ? { ...r, isAvailable: !r.isAvailable } : r)
        );
        this.togglingId.set(null);
        this.showSuccess(room.isAvailable ? 'Room marked as unavailable.' : 'Room marked as available.');
      },
      error: () => { this.togglingId.set(null); this.showError('Failed to update room.'); }
    });
  }

  toggleBedAvailability(bed: Bed) {
    this.togglingId.set(bed.bedId);
    const req: UpdateBedRequest = {
      bedId:       bed.bedId,
      bedNumber:   bed.bedNumber,
      isAvailable: !bed.isAvailable,
      isOccupied:  bed.isOccupied
    };
    this.bedService.updateBed(req).subscribe({
      next: () => {
        const roomId = bed.roomId;
        this.bedsByRoom.update(prev => ({
          ...prev,
          [roomId]: (prev[roomId] || []).map(b =>
            b.bedId === bed.bedId ? { ...b, isAvailable: !b.isAvailable } : b
          )
        }));
        this.togglingId.set(null);
        this.showSuccess(bed.isAvailable ? 'Bed marked as unavailable.' : 'Bed marked as available.');
      },
      error: () => { this.togglingId.set(null); this.showError('Failed to update bed.'); }
    });
  }

  // ── Room CRUD ──────────────────────────────────────────────────────────────

  openAddRoomModal() {
    this.editingRoom.set(null);
    this.roomForm.reset({ roomType: RoomType.Single, numberOfBeds: 1, price: 0, capacity: 1, roomImageUrl: '', isAvailable: true });
    this.roomSaveError.set(null);
    this.roomModalOpen.set(true);
  }

  openEditRoomModal(room: Room) {
    this.editingRoom.set(room);
    this.roomForm.patchValue({
      roomType:     room.roomType,
      numberOfBeds: room.numberOfBeds,
      price:        room.price,
      capacity:     room.capacity,
      roomImageUrl: room.roomImageUrl,
      isAvailable:  room.isAvailable
    });
    this.roomSaveError.set(null);
    this.roomModalOpen.set(true);
  }

  closeRoomModal() { this.roomModalOpen.set(false); }

  saveRoom() {
    if (this.roomForm.invalid) { this.roomForm.markAllAsTouched(); return; }
    this.isSavingRoom.set(true);
    this.roomSaveError.set(null);
    const fv = this.roomForm.value;
    const editing = this.editingRoom();
    const housingUnitId = this.property()?.housingUnitId || '';

    if (editing) {
      const req: UpdateRoomRequest = {
        roomId:       editing.id || editing.roomId!,
        roomType:     Number(fv.roomType),
        roomImageUrl: fv.roomImageUrl || '',
        numberOfBeds: fv.numberOfBeds,
        price:        fv.price,
        capacity:     fv.capacity,
        isAvailable:  fv.isAvailable
      };
      this.roomService.updateRoom(req).subscribe({
        next: () => {
          this.rooms.update(prev => prev.map(r =>
            (r.id === req.roomId || r.roomId === req.roomId) ? { ...r, ...req, id: r.id, roomId: r.roomId } : r
          ));
          this.isSavingRoom.set(false);
          this.closeRoomModal();
          this.showSuccess('Room updated successfully.');
        },
        error: (err) => { this.roomSaveError.set(err?.error?.message || 'Failed to save room.'); this.isSavingRoom.set(false); }
      });
    } else {
      const req: CreateRoomRequest = {
        housingUnitId,
        roomType:     Number(fv.roomType),
        roomImageUrl: fv.roomImageUrl || '',
        numberOfBeds: fv.numberOfBeds,
        price:        fv.price,
        capacity:     fv.capacity,
        isAvailable:  fv.isAvailable
      };
      this.roomService.createRoom(req).subscribe({
        next: (created: any) => {
          this.rooms.update(prev => Array.isArray(prev) ? [...prev, created] : [created]);
          this.isSavingRoom.set(false);
          this.closeRoomModal();
          this.showSuccess('Room added successfully.');
        },
        error: (err) => { this.roomSaveError.set(err?.error?.message || 'Failed to create room.'); this.isSavingRoom.set(false); }
      });
    }
  }

  confirmDeleteRoom(id: string) { this.deleteRoomId.set(id); }
  cancelDeleteRoom()             { this.deleteRoomId.set(null); }

  deleteRoom(id: string) {
    this.roomService.deleteRoom(id).subscribe({
      next: () => {
        this.rooms.update(prev => prev.filter(r => r.id !== id && r.roomId !== id));
        this.showSuccess('Room deleted.');
      },
      error: () => this.showError('Failed to delete room.')
    });
    this.deleteRoomId.set(null);
  }

  // ── Bed CRUD ───────────────────────────────────────────────────────────────

  openAddBedModal(roomId: string) {
    this.editingBed.set(null);
    this.bedModalRoomId.set(roomId);
    this.bedForm.reset({ bedNumber: '', isAvailable: true });
    this.bedSaveError.set(null);
    this.bedModalOpen.set(true);
  }

  openEditBedModal(bed: Bed) {
    this.editingBed.set(bed);
    this.bedModalRoomId.set(bed.roomId);
    this.bedForm.patchValue({ bedNumber: bed.bedNumber, isAvailable: bed.isAvailable });
    this.bedSaveError.set(null);
    this.bedModalOpen.set(true);
  }

  closeBedModal() { this.bedModalOpen.set(false); }

  saveBed() {
    if (this.bedForm.invalid) { this.bedForm.markAllAsTouched(); return; }
    this.isSavingBed.set(true);
    this.bedSaveError.set(null);
    const fv = this.bedForm.value;
    const editing = this.editingBed();

    if (editing) {
      const req: UpdateBedRequest = {
        bedId:       editing.bedId,
        bedNumber:   fv.bedNumber,
        isAvailable: fv.isAvailable,
        isOccupied:  editing.isOccupied
      };
      this.bedService.updateBed(req).subscribe({
        next: (updated) => {
          const roomId = editing.roomId;
          this.bedsByRoom.update(prev => ({
            ...prev,
            [roomId]: (prev[roomId] || []).map(b => b.bedId === editing.bedId ? { ...b, ...req } : b)
          }));
          this.isSavingBed.set(false);
          this.closeBedModal();
          this.showSuccess('Bed updated.');
        },
        error: (err) => { this.bedSaveError.set(err?.error?.message || 'Failed to save bed.'); this.isSavingBed.set(false); }
      });
    } else {
      const req: CreateBedRequest = {
        roomId:    this.bedModalRoomId(),
        bedNumber: fv.bedNumber
      };
      this.bedService.createBed(req).subscribe({
        next: (created) => {
          const roomId = req.roomId;
          this.bedsByRoom.update(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), created]
          }));
          this.isSavingBed.set(false);
          this.closeBedModal();
          this.showSuccess('Bed added.');
        },
        error: (err) => { this.bedSaveError.set(err?.error?.message || 'Failed to create bed.'); this.isSavingBed.set(false); }
      });
    }
  }

  confirmDeleteBed(bedId: string) { this.deleteBedId.set(bedId); }
  cancelDeleteBed()                { this.deleteBedId.set(null); }

  deleteBed(bedId: string) {
    const roomId = Object.keys(this.bedsByRoom()).find(rid =>
      (this.bedsByRoom()[rid] || []).some(b => b.bedId === bedId)
    ) || '';
    this.bedService.deleteBed(bedId).subscribe({
      next: () => {
        if (roomId) {
          this.bedsByRoom.update(prev => ({
            ...prev,
            [roomId]: (prev[roomId] || []).filter(b => b.bedId !== bedId)
          }));
        }
        this.showSuccess('Bed deleted.');
      },
      error: () => this.showError('Failed to delete bed.')
    });
    this.deleteBedId.set(null);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getRoomId(room: Room): string { return room.id || room.roomId || ''; }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  showError(msg: string) {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 4000);
  }

  goBack() { this.router.navigate(['/landlord/listings']); }
}
