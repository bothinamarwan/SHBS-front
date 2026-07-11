import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PaymobReturnParams } from '../models/payment.model';

/**
 * Helper service for Paymob payment gateway operations
 */
@Injectable({
  providedIn: 'root'
})
export class PaymobHelperService {
  private readonly CLIENT_SECRET_KEY = 'paymob_client_secret';
  private readonly PAYMENT_RETURN_KEY = 'paymob_return_params';

  constructor(private router: Router) {}

  /**
   * Redirect user to Paymob checkout page
   * @param paymentUrl Paymob payment URL
   * @param clientSecret Client secret for payment verification
   */
  redirectToPaymob(paymentUrl: string, clientSecret: string): void {
    // Store client secret temporarily for verification after return
    sessionStorage.setItem(this.CLIENT_SECRET_KEY, clientSecret);
    
    // Redirect to Paymob checkout
    window.location.href = paymentUrl;
  }

  /**
   * Open Paymob checkout in a popup window
   * @param paymentUrl Paymob payment URL
   * @param clientSecret Client secret for payment verification
   * @returns Promise that resolves when popup is closed
   */
  openPaymobInPopup(paymentUrl: string, clientSecret: string): Promise<PaymobReturnParams> {
    return new Promise((resolve, reject) => {
      // Store client secret temporarily
      sessionStorage.setItem(this.CLIENT_SECRET_KEY, clientSecret);

      // Calculate popup dimensions
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      // Open popup
      const popup = window.open(
        paymentUrl,
        'paymob_checkout',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        reject(new Error('Failed to open payment window, please allow popups'));
        return;
      }

      // Poll for popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check if we have return params from URL
          const returnParams = this.handlePaymobReturn();
          if (returnParams) {
            resolve(returnParams);
          } else {
            reject(new Error('Payment window closed without completion'));
          }
        }
      }, 500);

      // Set timeout for popup (10 minutes)
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
          reject(new Error('Payment timeout'));
        }
      }, 600000);
    });
  }

  /**
   * Parse return parameters from URL query string
   * @returns Parsed Paymob return parameters or null
   */
  handlePaymobReturn(): PaymobReturnParams | null {
    const params = new URLSearchParams(window.location.search);
    
    const returnParams: PaymobReturnParams = {
      transaction_id: params.get('transaction_id') || undefined,
      success: params.get('success') || undefined,
      order: params.get('order') || undefined,
      id: params.get('id') || undefined
    };

    // Check if any Paymob-specific parameters are present
    const hasPaymobParams = Object.values(returnParams).some(param => param !== undefined);

    if (hasPaymobParams) {
      // Store return params for later use
      sessionStorage.setItem(this.PAYMENT_RETURN_KEY, JSON.stringify(returnParams));
      return returnParams;
    }

    return null;
  }

  /**
   * Check if current page is a return from Paymob
   * @returns True if returning from Paymob
   */
  isPaymobReturn(): boolean {
    return this.handlePaymobReturn() !== null;
  }

  /**
   * Get stored client secret
   * @returns Client secret or null
   */
  getClientSecret(): string | null {
    return sessionStorage.getItem(this.CLIENT_SECRET_KEY);
  }

  /**
   * Get stored return parameters
   * @returns Return parameters or null
   */
  getReturnParams(): PaymobReturnParams | null {
    const stored = sessionStorage.getItem(this.PAYMENT_RETURN_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Clear all Paymob-related session data
   */
  clearPaymentData(): void {
    sessionStorage.removeItem(this.CLIENT_SECRET_KEY);
    sessionStorage.removeItem(this.PAYMENT_RETURN_KEY);
  }

  /**
   * Format amount in EGP currency
   * @param amount Amount in EGP
   * @returns Formatted string (e.g., "1,000.00 EGP")
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  }

  /**
   * Validate client secret format
   * @param clientSecret Client secret to validate
   * @returns True if valid
   */
  isValidClientSecret(clientSecret: string): boolean {
    // Basic validation - adjust based on Paymob's actual format
    return Boolean(clientSecret) && clientSecret.length > 10;
  }
}
