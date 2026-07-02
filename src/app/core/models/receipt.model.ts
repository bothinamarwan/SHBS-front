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
}

export interface FinancialSummary {
  totalRevenue: number;
  revenueByMonth: { [month: string]: number };
  revenueByType: { [type: string]: number };
  recentTransactionsCount: number;
}
