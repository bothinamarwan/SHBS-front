import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { BookingService } from '../../../../core/services/booking.service';
import { StudentService } from '../../../../core/services/student.service';
import { RoomService } from '../../../../core/services/room.service';
import { BedService } from '../../../../core/services/bed.service';
import { HousingUnitDetails } from '../../../../core/models/housing.model';
import { Room as RoomModel } from '../../../../core/models/room.model';
import { Bed as BedModel } from '../../../../core/models/bed.model';
import { BookingType, BookingCreateRequest } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-booking-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-create.html'
})
export class BookingCreate implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private housingService = inject(HousingService);
  private bookingService = inject(BookingService);
  private studentService = inject(StudentService);
  private roomService = inject(RoomService);
  private bedService = inject(BedService);

  housing = signal<HousingUnitDetails | null>(null);
  rooms = signal<RoomModel[]>([]);
  selectedRoom = signal<RoomModel | null>(null);
  beds = signal<BedModel[]>([]);
  selectedBed = signal<BedModel | null>(null);

  bookingType = signal<BookingType>(BookingType.FullUnit);
  isLoading = signal(false);
  bookingForm: FormGroup;

  readonly BookingType = BookingType;

  constructor() {
    this.bookingForm = this.fb.group({
      moveInDate: ['', Validators.required],
      duration: [12, [Validators.required, Validators.min(1)]]
    });
  }

  get totalPrice(): number {
    const months = this.bookingForm.get('duration')?.value || 0;
    let basePrice = 0;
    if (this.bookingType() === BookingType.FullUnit && this.housing()) {
      basePrice = this.housing()!.baseMonthlyPrice || this.housing()!.price || (this.housing() as any).Price || 0;
    } else if (this.bookingType() === BookingType.FullRoom && this.selectedRoom()) {
      basePrice = this.selectedRoom()!.price || (this.selectedRoom() as any).Price || 0;
    } else if (this.bookingType() === BookingType.SingleBed && this.selectedBed()) {
      basePrice = this.selectedBed()!.calculatedPrice || (this.selectedBed() as any).CalculatedPrice || 0;
    }
    return basePrice * months;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.housingService.getDetailsById(id).subscribe(data => {
        if (data) {
          this.housing.set(data);
          this.roomService.getRoomsByHousingUnit(id).subscribe(rooms => {
            this.rooms.set(rooms || []);
          });
        }
      });
    }
  }

  setBookingType(type: BookingType) {
    this.bookingType.set(type);
    if (type === BookingType.FullUnit) {
      this.selectedRoom.set(null);
      this.selectedBed.set(null);
      this.beds.set([]);
    } else if (type === BookingType.FullRoom) {
      this.selectedBed.set(null);
      this.beds.set([]);
    }
  }

  selectRoom(room: RoomModel) {
    if (this.selectedRoom()?.id === room.id || this.selectedRoom()?.roomId === room.roomId) {
      this.selectedRoom.set(null);
      this.beds.set([]);
    } else {
      this.selectedRoom.set(room);
      this.bedService.getBedsByRoom(room.id || room.roomId || '').subscribe(beds => {
        this.beds.set(beds || []);
      });
    }
  }

  selectBed(bed: BedModel) {
    if (this.selectedBed()?.bedId === bed.bedId) {
      this.selectedBed.set(null);
    } else {
      this.selectedBed.set(bed);
    }
  }

  confirmBooking() {
    this.isLoading.set(true);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const sId = currentUser.studentId || currentUser.id || (currentUser as any)?.studentId || '3fa85f64-5717-4562-b3fc-2c963f66afa6';

    const moveIn = new Date(this.bookingForm.value.moveInDate);
    const months = this.bookingForm.value.duration || 12;
    const moveOut = new Date(moveIn);
    moveOut.setMonth(moveOut.getMonth() + months);

    let payload: BookingCreateRequest = {
      studentId: sId,
      bookingType: this.bookingType(),
      startDate: moveIn.toISOString(),
      endDate: moveOut.toISOString()
    };

    if (this.bookingType() === BookingType.FullUnit) {
      payload.housingUnitId = this.housing()!.housingUnitId;
    } else if (this.bookingType() === BookingType.FullRoom && this.selectedRoom()) {
      payload.roomId = this.selectedRoom()!.id || this.selectedRoom()!.roomId;
    } else if (this.bookingType() === BookingType.SingleBed && this.selectedBed()) {
      payload.bedId = this.selectedBed()!.bedId;
    }

    this.bookingService.create(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const bookingId = res.bookingId || (res as any).BookingId || (res as any).id || (res as any).Id;
        if (bookingId) {
          this.router.navigate(['/student/booking/pay/', bookingId]);
        } else {
          this.router.navigate(['/student/bookings'], { queryParams: { success: true } });
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }
}
