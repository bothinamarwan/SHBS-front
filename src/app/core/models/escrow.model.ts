export enum EscrowStatus {
  Held = 0,
  Released = 1,
  Refunded = 2,
  Failed = 3
}

export enum TransactionType {
  Payment = 0,
  Release = 1,
  Refund = 2
}

export interface EscrowTransaction {
  escrowId: string;
  paymentId: string;
  contractId: string;
  bookingId: string;
  studentId: string;
  landlordId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  platformFee: number;
  transactionType: TransactionType;
  paymentReference?: string;
  landlordPayoutTransactionId?: string;
  landlordPayoutAmount?: number;
  createdAt: string;
  releasedAt?: string;
}

export interface EscrowResponse {
  escrowId: string;
  paymentId: string;
  contractId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  platformFee: number;
  createdAt: string;
  releasedAt?: string;
  releaseTransactionId?: string;
}

export interface CommissionRecord {
  commissionRecordId: string;
  bookingId: string;
  rate: number;
  amount: number;
  createdAt: string;
}

export interface PendingEscrowReleasesResponse {
  totalRevenue: number;
  totalBookings: number;
  averageCommission: number;
  fromDate: string;
  toDate: string;
  records: CommissionRecord[];
}

export interface ReleaseEscrowRequest {
  escrowId: string;
  adminUserId: string;
  releaseNotes: string;
}

export interface RefundEscrowRequest {
  escrowId: string;
  adminUserId: string;
  refundReason: string;
}
