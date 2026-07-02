export enum PaymentStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Refunded = 3
}

export interface PaymentHistory {
  paymentId: string;
  userId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentDate: string;
  reference?: string;
  description?: string;
}
