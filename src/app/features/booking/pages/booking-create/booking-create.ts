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
    console.log('Calculating totalPrice - bookingType:', this.bookingType());
    console.log('Calculating totalPrice - housing:', this.housing());
    console.log('Calculating totalPrice - selectedRoom:', this.selectedRoom());
    console.log('Calculating totalPrice - selectedBed:', this.selectedBed());
    console.log('Calculating totalPrice - months:', months);

    if (this.bookingType() === BookingType.FullUnit && this.housing()) {
      basePrice = this.housing()!.baseMonthlyPrice || this.housing()!.price || (this.housing() as any).Price || 0;
      console.log('FullUnit basePrice:', basePrice);
    } else if (this.bookingType() === BookingType.FullRoom && this.selectedRoom()) {
      basePrice = this.selectedRoom()!.price || (this.selectedRoom() as any).Price || 0;
      console.log('FullRoom basePrice:', basePrice);
    } else if (this.bookingType() === BookingType.SingleBed && this.selectedBed()) {
      // Try to get calculated price from bed, or calculate from room price / number of beds
      let bedPrice = this.selectedBed()!.calculatedPrice || (this.selectedBed() as any).CalculatedPrice || 0;
      console.log('Bed calculatedPrice from API:', bedPrice);
      
      // If bed price is 0, calculate from room price
      if (bedPrice === 0 && this.selectedRoom()) {
        const roomPrice = this.selectedRoom()!.price || (this.selectedRoom() as any).Price || 0;
        const numberOfBeds = this.selectedRoom()!.numberOfBeds || 1;
        console.log('Room price:', roomPrice, 'Number of beds:', numberOfBeds);
        bedPrice = roomPrice / numberOfBeds;
        console.log('Calculated bed price from room:', roomPrice, '/', numberOfBeds, '=', bedPrice);
      }
      
      basePrice = bedPrice;
      console.log('SingleBed basePrice:', basePrice);
    }
    const total = basePrice * months;
    console.log('Final totalPrice:', total);
    return total;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.housingService.getDetailsById(id).subscribe((data: any) => {
        if (data) {
          this.housing.set(data);
          console.log('Housing data loaded:', data);
          console.log('Housing rooms field:', data.rooms);
          console.log('Is rooms an array?', Array.isArray(data.rooms));
          // Use rooms from housing response if available, otherwise fetch separately
          if (data.rooms && Array.isArray(data.rooms)) {
            console.log('Using rooms from housing response:', data.rooms);
            // Log each room's full structure
            data.rooms.forEach((room: any, index: number) => {
              console.log(`Room ${index} full object:`, room);
              console.log(`Room ${index} keys:`, Object.keys(room));
            });
            this.rooms.set(data.rooms);
            console.log('Rooms signal set to:', this.rooms());
          } else {
            console.log('Rooms not in housing response, fetching separately');
            this.roomService.getRoomsByHousingUnit(id).subscribe((rooms: any) => {
              console.log('Rooms response:', rooms);
              this.rooms.set(Array.isArray(rooms) ? rooms : (rooms?.records || []));
              console.log('Rooms signal set to:', this.rooms());
            });
          }
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
    console.log('selectRoom called with room:', room);
    console.log('Room properties:', Object.keys(room));
    console.log('Current selectedRoom:', this.selectedRoom());
    
    // Check if room is already selected using multiple possible ID properties
    const currentRoomId = this.selectedRoom()?.id || this.selectedRoom()?.roomId || (this.selectedRoom() as any)?.Id;
    const newRoomId = room.id || room.roomId || (room as any)?.Id;
    
    console.log('Current room ID:', currentRoomId);
    console.log('New room ID:', newRoomId);
    
    if (currentRoomId === newRoomId) {
      console.log('Deselecting room');
      this.selectedRoom.set(null);
      this.beds.set([]);
    } else {
      console.log('Selecting room:', room);
      this.selectedRoom.set(room);
      const roomId = newRoomId;
      console.log('Fetching beds for roomId:', roomId);
      this.bedService.getBedsByRoom(roomId).subscribe((beds: any) => {
        console.log('Beds response:', beds);
        this.beds.set(Array.isArray(beds) ? beds : (beds?.records || []));
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

    // Check verification status before allowing booking
    this.studentService.getMyVerificationStatus().subscribe({
      next: (verificationStatus) => {
        console.log('Verification status:', verificationStatus);

        // Check if student is verified and approved
        const isVerified = verificationStatus?.isVerified === true || verificationStatus?.status === 'Approved' || verificationStatus?.verificationStatus === 'Approved';

        if (!isVerified) {
          this.isLoading.set(false);
          alert('You must complete your verification and receive admin approval before booking a property. Please complete your university verification and wait for admin approval.');
          this.router.navigate(['/student/profile']);
          return;
        }

        // Proceed with booking if verified
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const sId = currentUser.studentId || currentUser.id || (currentUser as any)?.studentId || '3fa85f64-5717-4562-b3fc-2c963f66afa6';

        console.log('Current user from localStorage:', currentUser);
        console.log('Student ID being used:', sId);

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

        console.log('Booking payload:', payload);

        this.bookingService.create(payload).subscribe({
          next: (res) => {
            this.isLoading.set(false);
            const bookingId = res.bookingId || (res as any).BookingId || (res as any).id || (res as any).Id;
            if (bookingId) {
              // Redirect to payment page which will generate receipt after payment
              this.router.navigate(['/student/booking/pay/', bookingId]);
            } else {
              // If no payment needed, redirect to receipts to view the generated receipt
              this.router.navigate(['/student/receipts']);
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error fetching verification status:', err);
        alert('Unable to verify your account status. Please try again or contact support.');
      }
    });
  }
}
