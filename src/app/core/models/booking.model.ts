export interface Booking {
  bookingId: string;
  studentId: string;
  bookingType: number;
  bedId?: string;
  roomId?: string;
  housingUnitId?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingStatus: number; // 0=Pending, 1=Approved, 2=Rejected, 3=Cancelled, etc.
  isDeleted: boolean;
  commissionAmount: number;
  contractId?: string;
  contractPdfUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Optional UI-specific fields that might be populated later
  housingTitle?: string;
  roomName?: string;
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
