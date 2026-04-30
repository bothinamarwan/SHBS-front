import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { BookingService } from '../../../../core/services/booking.service';
import { Housing, Room } from '../../../../core/models/housing.model';

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

  housing = signal<Housing | null>(null);
  selectedRoom = signal<Room | null>(null);
  currentStep = signal(1);
  isLoading = signal(false);
  bookingForm: FormGroup;
  selectedPaymentMethod = signal<'card' | 'wallet' | 'cash'>('card');

  constructor() {
    this.bookingForm = this.fb.group({
      selectedRoomId: ['', Validators.required],
      moveInDate: ['', Validators.required],
      duration: [12, [Validators.required, Validators.min(1)]],
      paymentMethod: ['card']
    });
  }

  selectRoom(room: Room) {
    this.selectedRoom.set(room);
    this.bookingForm.get('selectedRoomId')?.setValue(room.id);
  }

  setPaymentMethod(method: 'card' | 'wallet' | 'cash') {
    this.selectedPaymentMethod.set(method);
    this.bookingForm.get('paymentMethod')?.setValue(method);
  }

  calcTotal(): number {
    const months = this.bookingForm.get('duration')?.value || 0;
    const price = this.selectedRoom()?.price || 0;
    return price * months;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.housingService.getHousingById(id).subscribe(data => {
        if (data) this.housing.set(data);
      });
    }
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
    const data = {
      housingId: this.housing()?.id,
      housingTitle: this.housing()?.title,
      roomId: this.selectedRoom()?.id,
      roomName: this.selectedRoom()?.name,
      ...this.bookingForm.value,
      totalPrice: (this.selectedRoom()?.price || 0) * 2 + 250 // Simplified calc
    };

    this.bookingService.createBooking(data).subscribe({
      next: (b) => {
        this.isLoading.set(false);
        this.router.navigate(['/student/bookings'], { queryParams: { success: true, bookingId: b.id } });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }
}
