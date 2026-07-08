export enum BookingType {
  FullUnit = 0,
  FullRoom = 1,
  SingleBed = 2
}

export enum BookingStatus {
  Pending = 0,                    // legacy / initial state (unused in new flow)
  PendingPayment = 1,              // booking created, awaiting payment
  PaymentProcessing = 2,          // Paymob payment link opened
  Paid = 3,                       // payment confirmed, contract being generated (legacy)
  PendingContract = 4,             // (reserved)
  ContractGenerated = 5,           // (reserved)
  WaitingBothSignatures = 6,      // contract generated, neither party has signed yet
  WaitingStudentSignature = 7,     // landlord signed, waiting for student
  WaitingLandlordSignature = 8,    // student signed, waiting for landlord
  UnderReview = 9,                // both signed, awaiting admin decision
  Approved = 10,                   // admin approved → escrow released to landlord
  Active = 11,                     // (reserved)
  Completed = 12,                  // tenancy completed
  Rejected = 13,                   // admin rejected → escrow refunded to student
  Cancelled = 14,                  // cancelled by student or landlord before approval
  Expired = 15,                    // signatures not completed within 7 days
  SuccessfullyConfirmed = 16      // (reserved)
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
