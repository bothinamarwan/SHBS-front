export interface Contract {
  contractId: string;
  bookingId: string;
  contractNumber: string;
  originalContractPdfPath?: string;
  studentSignedContractPath?: string;
  landlordSignedContractPath?: string;
  isStudentSigned: boolean;
  isLandlordSigned: boolean;
  isAdminApproved: boolean;
  studentSignedAt?: string;
  landlordSignedAt?: string;
  adminApprovedAt?: string;
  adminNotes?: string;
  status: ContractStatus;
  createdAt: string;
}

export enum ContractStatus {
  WaitingForUpload = 0,          // payment completed, waiting for admin to upload contract
  WaitingForSignatures = 1,      // contract uploaded by admin, waiting for signatures
  WaitingForStudentSignature = 2, // landlord signed, waiting for student signature
  WaitingForLandlordSignature = 3, // student signed, waiting for landlord signature
  WaitingForAdminApproval = 4,   // both parties signed, waiting for admin final decision
  Approved = 5,                  // admin approved → escrow released to landlord
  Rejected = 6,                  // admin rejected → escrow refunded to student
  Archived = 7                   // booking completed or cancelled
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
