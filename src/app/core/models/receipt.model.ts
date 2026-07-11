export enum ReceiptType {
  BookingPayment = 0,
  Deposit = 1,
  Commission = 2,
  Refund = 3
}

export interface Receipt {
  receiptId: string;
  paymentId: string;
  bookingId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  type: ReceiptType;
  typeLabel: string;
  issuedToUserId: string;
  issuedToName: string;
  issuedToRole: string;
  transactionReference: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate?: string;
  receiptPdfUrl: string;
  createdAt: string;
  
  // Legacy field mappings for backward compatibility
  id?: string;
  userId?: string;
  date?: string;
  status?: string;
  description?: string;
  studentName?: string;
  landlordName?: string;
  housingUnitId?: string;
  escrowTransaction?: EscrowTransaction;
}

export interface EscrowTransaction {
  transactionId: string;
  fromBalance: string; // Student balance ID
  toBalance: string; // Admin balance ID
  amount: number;
  status: string; // "Completed", "Pending", "Failed"
  transactionDate: string;
  description: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  revenueByMonth: { [month: string]: number };
  revenueByType: { [type: string]: number };
  recentTransactionsCount: number;
}
