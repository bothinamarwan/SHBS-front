/**
 * Payment model interfaces for Paymob integration
 */

/**
 * Request payload for initiating a payment
 */
export interface InitiatePaymentRequest {
  bookingId: string;
  amount: number;
  returnUrl?: string;
}

/**
 * Response from payment initiation endpoint
 */
export interface InitiatePaymentResponse {
  success: boolean;
  clientSecret: string;
  paymentUrl: string;
  intentionId: string;
}

/**
 * Response from payment verification endpoint
 */
export interface VerifyPaymentResponse {
  success: boolean;
  status: PaymentStatus;
  completedAt?: Date;
  amount?: number;
}

/**
 * Response from payment status endpoint
 */
export interface PaymentStatusResponse {
  transactionId: string;
  paymentStatus: string;
  amount: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  CANCELLED = 'Cancelled'
}

/**
 * Payment component state enum
 */
export enum PaymentState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

/**
 * Paymob return parameters from query string
 */
export interface PaymobReturnParams {
  transaction_id?: string;
  success?: string | boolean;
  order?: string;
  id?: string;
}
