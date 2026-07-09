export enum BookingType {
  FullUnit = 0,
  FullRoom = 1,
  SingleBed = 2
}

export enum BookingStatus {
  PendingPayment = 0,              // booking created, awaiting payment
  WaitingForContract = 1,          // payment completed, waiting for admin to upload contract
  WaitingForSignatures = 2,        // contract uploaded by admin, waiting for signatures
  WaitingForStudentSignature = 3,  // landlord signed, waiting for student signature
  WaitingForLandlordSignature = 4, // student signed, waiting for landlord signature
  WaitingForAdminApproval = 5,     // both parties signed, waiting for admin final decision
  Approved = 6,                    // admin approved → escrow released to landlord
  Rejected = 7,                    // admin rejected → escrow refunded to student
  Cancelled = 8                    // cancelled by student or landlord before approval
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
  originalContractPdfPath?: string;
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
