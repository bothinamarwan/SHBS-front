export enum BookingType {
  FullUnit = 0,
  FullRoom = 1,
  SingleBed = 2
}

export enum BookingStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Cancelled = 3,
  Paid = 4
}

export interface BookingCreateRequest {
  studentId: string;
  bookingType: BookingType;
  bedId?: string;
  roomId?: string;
  housingUnitId?: string;
  startDate: string;
  endDate: string;
}

export interface Booking {
  bookingId: string;
  studentId: string;
  bookingType: BookingType;
  bedId?: string;
  roomId?: string;
  housingUnitId?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingStatus: BookingStatus;
  isDeleted: boolean;
  commissionAmount?: number;
  contractId?: string;
  contractPdfUrl?: string;
  createdAt: string;
  updatedAt?: string;

  // Optional UI-specific fields that might be populated later
  housingTitle?: string;
  roomName?: string;
  landlordId?: string;
  landlordName?: string;
  studentName?: string;
}

export interface PaginatedBookings {
  pageSize: number;
  pageIndex: number;
  totalRecords: number;
  records: Booking[];
}

export interface RentalContract {
  contractId: string;
  bookingId: string;
  terms: string;
  signedDate?: string;
  status: 'draft' | 'signed' | 'expired';
}
