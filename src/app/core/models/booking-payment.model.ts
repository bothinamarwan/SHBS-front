export interface InitiatePaymentRequest {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
}

export interface PaymentCallbackRequest {
  orderId: string;
  transactionId: string;
  isSuccess: boolean;
}

export interface BookingPaymentResponse {
  success: boolean;
  message?: string;
  paymentId?: string;
  contractId?: string;
  paymentUrl?: string;
  contractPdfUrl?: string;
}
