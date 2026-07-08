export interface Contract {
  contractId: string;
  bookingId: string;
  contractPdfUrl?: string;
  studentSignedPdfUrl?: string;
  landlordSignedPdfUrl?: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export enum ContractStatus {
  GENERATED = 0,              // Contract generated after payment
  WAITING_STUDENT_SIGNATURE = 1,
  WAITING_LANDLORD_SIGNATURE = 2,
  WAITING_ADMIN_REVIEW = 3,  // Both signed, waiting for admin
  APPROVED = 4,              // Admin approved
  REJECTED = 5,              // Admin rejected
  EXPIRED = 6                // Not signed within 7 days
}

export interface StudentSignatureRequest {
  signedPdfUrl: string;
}

export interface LandlordSignatureRequest {
  signedPdfUrl: string;
}

export interface AdminApprovalRequest {
  adminUserId: string;
  notes: string;
}

export interface AdminRejectionRequest {
  adminUserId: string;
  notes: string;
}
