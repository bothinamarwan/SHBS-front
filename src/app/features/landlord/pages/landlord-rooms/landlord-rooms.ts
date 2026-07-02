import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../../../../core/services/room.service';
import { HousingService } from '../../../../core/services/housing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Room, RoomType, CreateRoomRequest, UpdateRoomRequest } from '../../../../core/models/room.model';
import { HousingUnit } from '../../../../core/models/housing.model';

@Component({
  selector: 'app-landlord-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landlord-rooms.html'
})
export class LandlordRooms implements OnInit {
  private roomService = inject(RoomService);
  private housingService = inject(HousingService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  RoomType = RoomType;

  isLoading = signal<boolean>(true);
  rooms = signal<Room[]>([]);
  housingUnits = signal<HousingUnit[]>([]);
  
  isModalOpen = signal<boolean>(false);
  editingRoom = signal<Room | null>(null);
  isSaving = signal<boolean>(false);
  deleteConfirmId = signal<string | null>(null);
  saveError = signal<string | null>(null);

  roomForm: FormGroup = this.fb.group({
    housingUnitId: ['', Validators.required],
    roomType: [RoomType.Single, Validators.required],
    numberOfBeds: [1, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    capacity: [1, [Validators.required, Validators.min(1)]],
    roomImageUrl: [''],
    isAvailable: [true]
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    let housingLoaded = false;
    let roomsLoaded = false;

    const checkDone = () => {
      if (housingLoaded && roomsLoaded) {
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
      error: () => {
        housingLoaded = true; checkDone();
      }
    });

    this.roomService.getAllRooms().subscribe({
      next: (rms) => {
        this.rooms.set(rms);
        roomsLoaded = true;
        checkDone();
      },
      error: () => {
        roomsLoaded = true; checkDone();
      }
    });
  }

  getHousingUnitTitle(id: string): string {
    const unit = this.housingUnits().find(u => u.housingUnitId === id);
    return unit ? unit.title : 'Unknown Property';
  }

  openAddModal() {
    this.editingRoom.set(null);
    this.roomForm.reset({
      housingUnitId: this.housingUnits().length > 0 ? this.housingUnits()[0].housingUnitId : '',
      roomType: RoomType.Single,
      numberOfBeds: 1,
      price: 0,
      capacity: 1,
      roomImageUrl: '',
      isAvailable: true
    });
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(room: Room) {
    this.editingRoom.set(room);
    this.roomForm.patchValue({
      housingUnitId: room.housingUnitId,
      roomType: room.roomType,
      numberOfBeds: room.numberOfBeds,
      price: room.price,
      capacity: room.capacity,
      roomImageUrl: room.roomImageUrl,
      isAvailable: room.isAvailable
    });
    this.saveError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveRoom() {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      this.saveError.set('Please fill out all required fields correctly.');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    const fv = this.roomForm.value;
    const editing = this.editingRoom();

    if (editing) {
      const req: UpdateRoomRequest = {
        roomId: editing.id || editing.roomId!,
        roomType: Number(fv.roomType),
        roomImageUrl: fv.roomImageUrl || '',
        numberOfBeds: fv.numberOfBeds,
        price: fv.price,
        capacity: fv.capacity,
        isAvailable: fv.isAvailable
      };

      this.roomService.updateRoom(req).subscribe({
        next: () => {
          this.loadData(); // Just reload to get correct format
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.saveError.set('Failed to update room. ' + (err?.error?.message || ''));
          this.isSaving.set(false);
        }
      });
    } else {
      const req: CreateRoomRequest = {
        housingUnitId: fv.housingUnitId,
        roomType: Number(fv.roomType),
        roomImageUrl: fv.roomImageUrl || '',
        numberOfBeds: fv.numberOfBeds,
        price: fv.price,
        capacity: fv.capacity,
        isAvailable: fv.isAvailable
      };

      this.roomService.createRoom(req).subscribe({
        next: () => {
          this.loadData();
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.saveError.set('Failed to create room. ' + (err?.error?.message || ''));
          this.isSaving.set(false);
        }
      });
    }
  }

  confirmDelete(id: string) {
    this.deleteConfirmId.set(id);
  }

  cancelDelete() {
    this.deleteConfirmId.set(null);
  }

  deleteRoom(id: string) {
    this.roomService.deleteRoom(id).subscribe({
      next: () => {
        this.rooms.update(prev => prev.filter(r => r.id !== id && r.roomId !== id));
        this.deleteConfirmId.set(null);
      },
      error: () => {
        this.rooms.update(prev => prev.filter(r => r.id !== id && r.roomId !== id));
        this.deleteConfirmId.set(null);
      }
    });
  }
}
