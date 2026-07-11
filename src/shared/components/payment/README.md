# Payment Component Usage Guide

This component provides a complete Paymob payment integration for Angular applications.

## Installation

The component is already integrated into the application. Ensure all services are properly configured:

1. **Payment Service** - Handles API calls to backend
2. **Paymob Helper Service** - Manages Paymob-specific operations
3. **Payment Component** - UI component for payment flow

## Usage Example

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { PaymentComponent } from '../../../shared/components/payment/payment.component';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [PaymentComponent],
  template: `
    <div class="booking-details">
      <h1>Booking Details</h1>

      <!-- Booking information -->
      <div class="booking-info">
        <p>Booking ID: {{ bookingId }}</p>
        <p>Amount: {{ amount }} EGP</p>
      </div>

      <!-- Payment Component -->
      <app-payment
        [bookingId]="bookingId"
        [amount]="amount"
        [returnUrl]="'/bookings'"
        [buttonText]="'Pay Now'"
        [usePopup]="false"
        (paymentSuccess)="onPaymentSuccess($event)"
        (paymentFailed)="onPaymentFailed($event)">
      </app-payment>
    </div>
  `
})
export class BookingDetailsComponent {
  bookingId = '123e4567-e89b-12d3-a456-426614174000';
  amount = 1500;

  onPaymentSuccess(response: any) {
    console.log('Payment successful:', response);
    // Navigate to receipts or show success message
    // this.router.navigate(['/student/receipts']);
  }

  onPaymentFailed(error: string) {
    console.error('Payment failed:', error);
    // Show error message or retry option
  }
}
```

### Advanced Usage with Popup Mode

```typescript
@Component({
  template: `
    <app-payment
      [bookingId]="bookingId"
      [amount]="amount"
      [returnUrl]="'/bookings'"
      [buttonText]="'Pay Now'"
      [usePopup]="true"
      (paymentSuccess)="onPaymentSuccess($event)"
      (paymentFailed)="onPaymentFailed($event)">
    </app-payment>
  `
})
export class BookingDetailsComponent {
  // ... component code
}
```

## Component Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `bookingId` | `string` | Yes | - | The booking ID for payment |
| `amount` | `number` | Yes | - | Payment amount in EGP |
| `returnUrl` | `string` | No | `'/bookings'` | URL to return after payment |
| `buttonText` | `string` | No | `'Pay Now'` | Custom button text |
| `usePopup` | `boolean` | No | `false` | Open Paymob in popup window |

## Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `paymentSuccess` | `EventEmitter<VerifyPaymentResponse>` | Emitted when payment succeeds |
| `paymentFailed` | `EventEmitter<string>` | Emitted when payment fails with error message |

## Payment Flow

1. **IDLE State**: Shows payment summary with booking ID and amount
2. **LOADING State**: Shows loading spinner while initiating payment
3. **PROCESSING State**: Shows progress bar while polling payment status
4. **SUCCESS State**: Shows success message with transaction details
5. **FAILED State**: Shows error message with retry option

## Environment Configuration

Update `src/environments/environment.ts` and `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-api-url.com',
  paymob: {
    publicKey: 'your-paymob-public-key'
  }
};
```

## Testing with Paymob Test Cards

Use these test cards for development:

- **Visa Success**: `4111111111111111` (exp: `12/25`, CVV: `111`)
- **Visa Failed**: `4000000000000002` (exp: `12/25`, CVV: `111`)
- **Mastercard Success**: `5555555555554444` (exp: `12/25`, CVV: `111`)

## Security Notes

- Never expose API keys in frontend code
- Use HTTPS for all API calls
- Authentication token is automatically included in request headers
- Client secret is stored temporarily in sessionStorage only
- Sensitive data is cleared after payment completion

## Error Handling

The component handles these errors automatically:

- Network errors: "Unable to connect to server"
- Authentication errors: "Please login first"
- Validation errors: "Invalid data"
- Server errors: "Server error, please try again"
- Timeout errors: "Request timeout"
- Payment timeout: "Waiting time exceeded, please check payment status later"

## Styling

The component includes:
- Mobile-first responsive design
- RTL support for Arabic language
- Smooth animations (spin, scaleIn, shake)
- Modern card-based design with gradients
- Custom color scheme matching the application theme

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Payment not initiating
- Check that `bookingId` and `amount` are provided
- Verify backend API is accessible
- Check browser console for errors

### Popup not opening
- Ensure popup blocker is disabled for your domain
- Check browser console for popup-related errors

### Payment verification failing
- Verify backend `/api/payment/verify` endpoint is working
- Check transaction ID is returned from Paymob
- Ensure polling timeout is sufficient (default: 90 seconds)

## Support

For issues or questions, refer to the backend API documentation or contact the development team.
