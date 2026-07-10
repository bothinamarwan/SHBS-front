export interface AdminUserResponse {
  id?: string;
  userId?: string;
  applicationUserId?: string;
  Id?: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  roles: string[];
  studentId?: string;
  landLordId?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ReviewVerificationRequest {
  newStatus: number; // 0 = NotSubmitted, 1 = Pending, 2 = Approved, 3 = Rejected
}

export interface UpdateLandlordVerificationStatusRequest {
  status: string; // 'Verified', 'Rejected', 'Pending', 'NeedsMoreInfo'
}

export interface ComplaintUpdateRequest {
  complaintId: string;
  title: string;
  description: string;
  status: number; // ComplaintStatus enum: 0=Open, 1=InProgress, 2=Resolved
}

export interface AdminCommissionReport {
  totalCommissions: number;
  reportItems?: AdminCommissionItem[];
}

export interface AdminCommissionItem {
  id?: string;
  transactionId?: string;
  date?: string;
  createdAt?: string;
  amount?: number;
  commissionAmount?: number;
  status?: string;
}

export interface PendingStudentVerification {
  studentId: string;
  userEmail?: string;
  fullName?: string;
  universityName?: string;
  facultyName?: string;
  submittedAt?: string;
  status?: number;
}

export interface PendingLandlordVerification {
  landlordId: string;
  userId?: string;
  companyName?: string;
  nationalId?: string;
  userEmail?: string;
  fullName?: string;
  phoneNumber?: string;
  submittedAt?: string;
  status?: string;
}

export interface AdminComplaint {
  id: string;
  title?: string;
  description?: string;
  status: number;
  studentId?: string;
  housingUnitId?: string;
  createdDate?: string;
  updatedDate?: string;
}

// ─── Approvals Models ──────────────────────────────────────────────────

export interface AdminContractRequest {
  contractId: string;
  adminUserId: string;
  adminNotes: string;
  isApproved: boolean;
}

export interface AdminEscrowReleaseRequest {
  escrowId: string;
  adminUserId: string;
  releaseNotes: string;
}

export interface AdminEscrowRefundRequest {
  escrowId: string;
  adminUserId: string;
  refundReason: string;
}

// Minimal models for listing tables
export interface AdminContract {
  id?: string;
  contractId?: string;
  bookingId?: string;
  studentId?: string;
  studentUserId?: string;
  landlordId?: string;
  landLordId?: string;
  housingUnitId?: string;
  createdAt?: string;
  amount?: number;
  status?: string;
}

export interface AdminEscrow {
  id?: string;
  escrowId?: string;
  contractId?: string;
  bookingId?: string;
  amount?: number;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
}
