import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { BookingService } from '../../../../core/services/booking.service';
import { StudentService } from '../../../../core/services/student.service';
import { HousingUnitDetails, Room } from '../../../../core/models/housing.model';

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

  housing = signal<HousingUnitDetails | null>(null);
  selectedRooms = signal<Room[]>([]);
  currentStep = signal(1);
  isLoading = signal(false);
  bookingForm: FormGroup;
  selectedPaymentMethod = signal<'card' | 'wallet' | 'cash'>('card');

  constructor() {
    this.bookingForm = this.fb.group({
      moveInDate: ['', Validators.required],
      duration: [12, [Validators.required, Validators.min(1)]],
      paymentMethod: ['card']
    });
  }

  toggleRoom(room: Room) {
    const current = this.selectedRooms();
    const index = current.findIndex(r => r.id === room.id);
    if (index > -1) {
      this.selectedRooms.set(current.filter(r => r.id !== room.id));
    } else {
      this.selectedRooms.set([...current, room]);
    }
  }

  setPaymentMethod(method: 'card' | 'wallet' | 'cash') {
    this.selectedPaymentMethod.set(method);
    this.bookingForm.get('paymentMethod')?.setValue(method);
  }

  calcTotal(): number {
    const months = this.bookingForm.get('duration')?.value || 0;
    const roomsPrice = this.selectedRooms().reduce((sum, r) => sum + r.price, 0);
    return roomsPrice * months;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.housingService.getDetailsById(id).subscribe(data => {
        if (data) {
          this.housing.set(data);
          // Mock a room based on the housing unit details for the booking form
          const mockRoom: Room = {
            id: data.housingUnitId,
            name: data.title + ' - Entire Unit',
            roomType: 'single',
            beds: data.numberOfRooms,
            price: data.baseMonthlyPrice || data.price,
            availableBeds: data.numberOfRooms
          };
          this.selectedRooms.set([]); // Reset selection
        }
      });
    }
  }

  get roomsForHousing(): Room[] {
    const data = this.housing();
    if (!data) return [];
    return [{
      id: data.housingUnitId,
      name: data.title + ' - Unit',
      roomType: 'single',
      beds: data.numberOfRooms,
      price: data.baseMonthlyPrice || data.price,
      availableBeds: data.numberOfRooms
    }];
  }

  nextStep() {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  confirmBooking() {
    this.isLoading.set(true);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const sId = currentUser.studentId || currentUser.id || '3fa85f64-5717-4562-b3fc-2c963f66afa6';

    const moveIn = new Date(this.bookingForm.value.moveInDate);
    const months = this.bookingForm.value.duration || 12;
    const moveOut = new Date(moveIn);
    moveOut.setMonth(moveOut.getMonth() + months);

    const payload = {
      studentId: sId,
      roomIds: this.selectedRooms().map(r => r.id),
      startDate: moveIn.toISOString(),
      endDate: moveOut.toISOString()
    };

    // Use BookingService.multiRoom
    this.bookingService.multiRoom(payload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        // MultiRoom returns an array of bookings, so we can pass the first one's ID if we want, or just a success param
        const bookingId = (Array.isArray(res) && res.length > 0) ? res[0]?.bookingId : (res?.bookingId || 'new-booking');
        this.router.navigate(['/student/bookings'], { queryParams: { success: true, bookingId } });
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }
}
