export interface Receipt {
  id: string;
  receiptNumber: string;
  userId: string;
  paymentId: string;
  amount: number;
  date: string;
  type: string; // e.g. "Rent", "Deposit", "Commission"
  status: string; // e.g. "Paid", "Pending"
  description?: string;
  paymentMethod?: string;
  studentName?: string;
  landlordName?: string;
  bookingId?: string;
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
