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

export interface InitiatePaymentResponse {
  paymentUrl: string; // URL to redirect the user to
  paymentId?: string; // Internal tracking ID if applicable
}
