# Payment Integration Guide

## Overview

The Haramain platform integrates with Stripe for secure payment processing, providing a comprehensive payment solution that handles card payments, digital wallets, and ensures PCI DSS compliance for all transactions.

## Stripe Integration Architecture

### 1. Payment Flow Overview

```
Customer Payment Journey:
1. Customer selects trip and seats
2. Booking created with "pending" status
3. Stripe Payment Intent created
4. Customer enters payment details
5. Payment processed securely by Stripe
6. Webhook confirms payment success
7. Booking status updated to "confirmed"
8. Digital ticket generated and delivered
```

### 2. Technical Architecture

#### Frontend Payment Implementation
```typescript
// client/src/pages/payment.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  booking: Booking;
  onSuccess: () => void;
}

const PaymentForm = ({ booking, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/booking-confirmation',
        },
        redirect: 'if_required'
      });

      if (error) {
        // Handle payment error
        showErrorToast(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await confirmPaymentOnBackend(paymentIntent.id, booking.id);
        onSuccess();
      }
    } catch (error) {
      showErrorToast('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-haramain-green text-white py-3 rounded-md"
      >
        {isProcessing ? 'Processing...' : `Pay ${booking.finalAmount} SAR`}
      </button>
    </form>
  );
};

// Main payment page component
export default function Payment() {
  const [clientSecret, setClientSecret] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Get booking from localStorage or URL params
    const bookingData = localStorage.getItem('pendingBooking');
    if (bookingData) {
      const parsedBooking = JSON.parse(bookingData);
      setBooking(parsedBooking);
      createPaymentIntent(parsedBooking);
    }
  }, []);

  const createPaymentIntent = async (bookingData: Booking) => {
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: parseFloat(bookingData.finalAmount),
        bookingId: bookingData.id
      });
      
      setClientSecret(response.clientSecret);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    }
  };

  if (!clientSecret || !booking) {
    return <div>Loading payment...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm booking={booking} onSuccess={handlePaymentSuccess} />
    </Elements>
  );
}
```

#### Backend Payment Implementation
```typescript
// server/routes.ts - Payment endpoints
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
  try {
    const { amount, bookingId } = req.body;
    const userId = req.user.claims.sub;

    // Validate booking ownership
    const booking = await storage.getBookingById(bookingId, userId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'sar',
      metadata: {
        bookingId: bookingId,
        userId: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create payment intent',
      error: error.message 
    });
  }
});

// Confirm Payment
app.post('/api/confirm-payment', isAuthenticated, async (req: any, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.user.claims.sub;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Verify booking ownership
    if (paymentIntent.metadata.bookingId !== bookingId || 
        paymentIntent.metadata.userId !== userId) {
      return res.status(403).json({ message: 'Payment verification failed' });
    }

    // Update booking status
    const updatedBooking = await storage.confirmBookingPayment(
      bookingId, 
      userId, 
      paymentIntentId
    );

    res.json({
      success: true,
      booking: updatedBooking
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      message: 'Failed to confirm payment',
      error: error.message 
    });
  }
});
```

## Payment Security

### 1. PCI DSS Compliance

#### Stripe Security Benefits
- **PCI DSS Level 1**: Highest level of compliance
- **Tokenization**: Card data never touches our servers
- **Encryption**: End-to-end encryption of sensitive data
- **3D Secure**: Enhanced authentication for online transactions

#### Implementation Security
```typescript
// Secure environment variable handling
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('VITE_STRIPE_PUBLIC_KEY is required');
}

// Validate Stripe keys format
const validateStripeKeys = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  
  if (!secretKey?.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }
  
  if (!publicKey?.startsWith('pk_')) {
    throw new Error('Invalid Stripe public key format');
  }
  
  // Ensure test keys in development
  if (process.env.NODE_ENV === 'development') {
    if (!secretKey.includes('_test_')) {
      console.warn('Warning: Using live Stripe keys in development');
    }
  }
};
```

### 2. Payment Data Protection

#### Data Handling Best Practices
```typescript
// Never log sensitive payment data
const logPaymentEvent = (event: string, metadata: any) => {
  // Remove sensitive fields before logging
  const safeMetadata = {
    ...metadata,
    // Remove card details, CVV, etc.
    paymentMethod: undefined,
    cardDetails: undefined
  };
  
  logger.info(`Payment event: ${event}`, safeMetadata);
};

// Secure payment method storage (if needed)
interface SecurePaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  // Never store: full card number, CVV, PIN
}
```

#### Input Validation and Sanitization
```typescript
import { z } from 'zod';

// Payment request validation
const paymentIntentSchema = z.object({
  amount: z.number().min(1).max(100000), // 1 SAR to 100,000 SAR
  bookingId: z.string().uuid(),
  currency: z.literal('sar').optional(),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().startsWith('pi_'),
  bookingId: z.string().uuid(),
});

// Validate requests
app.post('/api/create-payment-intent', (req, res, next) => {
  try {
    req.body = paymentIntentSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid payment data' });
  }
});
```

## Error Handling and Recovery

### 1. Payment Error Types

#### Common Payment Errors
```typescript
// Payment error handling
interface PaymentError {
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  code: string;
  message: string;
  decline_code?: string;
}

const handlePaymentError = (error: any): PaymentError => {
  if (error.type === 'StripeCardError') {
    return {
      type: 'card_error',
      code: error.code,
      message: getLocalizedErrorMessage(error.code),
      decline_code: error.decline_code
    };
  }
  
  if (error.type === 'StripeInvalidRequestError') {
    return {
      type: 'validation_error',
      code: 'invalid_request',
      message: 'Payment information is invalid'
    };
  }
  
  // Default error
  return {
    type: 'api_error',
    code: 'unknown_error',
    message: 'An unexpected error occurred'
  };
};

// Localized error messages
const getLocalizedErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'card_declined': 'Your card was declined. Please try a different payment method.',
    'insufficient_funds': 'Your card has insufficient funds.',
    'invalid_expiry_month': 'Your card\'s expiration month is invalid.',
    'invalid_expiry_year': 'Your card\'s expiration year is invalid.',
    'invalid_cvc': 'Your card\'s security code is invalid.',
    'expired_card': 'Your card has expired.',
    'incorrect_cvc': 'Your card\'s security code is incorrect.',
    'processing_error': 'An error occurred processing your card.',
    'incorrect_number': 'Your card number is incorrect.',
  };
  
  return errorMessages[errorCode] || 'Your payment could not be processed.';
};
```

### 2. Payment Recovery Mechanisms

#### Automatic Retry Logic
```typescript
// Payment retry with exponential backoff
const retryPayment = async (
  paymentFunction: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await paymentFunction();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry certain error types
      if (error.type === 'StripeCardError' && 
          ['card_declined', 'insufficient_funds'].includes(error.code)) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

// Usage in payment processing
const processPayment = async (paymentData: PaymentData) => {
  return retryPayment(async () => {
    return await stripe.paymentIntents.create(paymentData);
  });
};
```

#### Payment Recovery UI
```typescript
// Frontend payment recovery component
function PaymentRecovery({ error, onRetry }: { 
  error: PaymentError; 
  onRetry: () => void; 
}) {
  const getRecoveryAction = (error: PaymentError) => {
    switch (error.code) {
      case 'card_declined':
        return 'Try a different card or payment method';
      case 'insufficient_funds':
        return 'Add funds to your account or use a different card';
      case 'expired_card':
        return 'Update your card information with current expiry date';
      default:
        return 'Please try again or contact support';
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <h3 className="text-red-800 font-medium">Payment Failed</h3>
      <p className="text-red-700 mt-1">{error.message}</p>
      <p className="text-red-600 text-sm mt-2">{getRecoveryAction(error)}</p>
      
      <div className="mt-4 flex space-x-3">
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/support'}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}
```

## Webhook Implementation

### 1. Stripe Webhook Setup

#### Webhook Endpoint
```typescript
// server/routes.ts - Webhook handling
import { buffer } from 'micro';

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  handleStripeWebhook(event)
    .then(() => {
      res.json({ received: true });
    })
    .catch((error) => {
      console.error('Webhook handling error:', error);
      res.status(500).json({ error: 'Webhook handling failed' });
    });
});

// Webhook event handler
const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'payment_intent.canceled':
      await handlePaymentCancellation(event.data.object as Stripe.PaymentIntent);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

// Payment success handler
const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  const { bookingId, userId } = paymentIntent.metadata;
  
  try {
    // Update booking status
    await storage.confirmBookingPayment(bookingId, userId, paymentIntent.id);
    
    // Send confirmation email
    await sendBookingConfirmationEmail(bookingId);
    
    // Log success
    logger.info('Payment processed successfully', {
      paymentIntentId: paymentIntent.id,
      bookingId,
      amount: paymentIntent.amount
    });
  } catch (error) {
    logger.error('Failed to process payment success', {
      paymentIntentId: paymentIntent.id,
      error: error.message
    });
  }
};
```

### 2. Webhook Security

#### Signature Verification
```typescript
// Enhanced webhook security
const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean => {
  try {
    const elements = signature.split(',');
    const signatureHash = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    
    if (!signatureHash) {
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
};

// Webhook rate limiting
const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/webhooks', webhookRateLimit);
```

## Payment Methods and Localization

### 1. Supported Payment Methods

#### Current Implementation
```typescript
// Stripe payment methods configuration
const paymentMethodsConfig = {
  // Credit and debit cards
  card: {
    enabled: true,
    brands: ['visa', 'mastercard', 'amex'],
    country: 'SA' // Saudi Arabia
  },
  
  // Digital wallets
  wallets: {
    apple_pay: {
      enabled: true,
      domains: [process.env.DOMAIN_NAME]
    },
    google_pay: {
      enabled: true
    }
  }
};

// Create payment intent with Saudi-specific configuration
const createPaymentIntent = async (amount: number, bookingId: string) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'sar',
    payment_method_types: ['card'],
    metadata: { bookingId },
    
    // Saudi Arabia specific settings
    receipt_email: userEmail,
    description: `Haramain Bus Booking - ${bookingId}`,
    
    // Enable automatic payment methods
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never' // Keep user on our site
    }
  });
};
```

#### Future Payment Methods (Planned)
```typescript
// Planned Saudi payment methods integration
interface FuturePaymentMethods {
  mada: {
    // Saudi national payment network
    enabled: boolean;
    provider: 'HyperPay' | 'PayTabs' | 'Moyasar';
  };
  
  stcPay: {
    // STC Pay digital wallet
    enabled: boolean;
    apiKey: string;
  };
  
  bankTransfer: {
    // Direct bank transfer
    enabled: boolean;
    supportedBanks: string[];
  };
  
  installments: {
    // Installment payments
    enabled: boolean;
    providers: ('Tabby' | 'Tamara')[];
  };
}
```

### 2. Currency and Pricing

#### Saudi Riyal (SAR) Configuration
```typescript
// Currency handling utilities
export const currencyConfig = {
  code: 'SAR',
  symbol: 'ر.س',
  decimals: 2,
  symbolPosition: 'after', // SAR symbol comes after amount
};

// Format currency for display
export const formatSAR = (amount: number, locale: string = 'ar-SA'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Stripe amount conversion (SAR to cents)
export const toStripeAmount = (sarAmount: number): number => {
  return Math.round(sarAmount * 100);
};

// Stripe amount conversion (cents to SAR)
export const fromStripeAmount = (stripeAmount: number): number => {
  return stripeAmount / 100;
};

// Usage in components
function PriceDisplay({ amount }: { amount: number }) {
  const { language } = useLanguage();
  
  return (
    <span className="font-semibold text-haramain-green">
      {formatSAR(amount, language === 'ar' ? 'ar-SA' : 'en-US')}
    </span>
  );
}
```

## Testing Payment Integration

### 1. Test Cards and Scenarios

#### Stripe Test Cards
```typescript
// Test card numbers for development
export const testCards = {
  // Successful payments
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  
  // Failed payments
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
  incorrectCVC: '4000000000000127',
  
  // 3D Secure
  authenticate: '4000002500003155',
  authenticateRequired: '4000002760003184',
  
  // Saudi-specific testing
  madaTest: '5297410000000000' // Mada test card (when available)
};

// Test scenarios
export const testScenarios = [
  {
    name: 'Successful Payment',
    card: testCards.visa,
    expectedResult: 'succeeded'
  },
  {
    name: 'Declined Payment',
    card: testCards.declined,
    expectedResult: 'declined'
  },
  {
    name: '3D Secure Authentication',
    card: testCards.authenticate,
    expectedResult: 'requires_action'
  }
];
```

### 2. Automated Payment Testing

#### Payment Flow Testing
```typescript
// Payment integration tests
describe('Payment Integration', () => {
  beforeEach(async () => {
    // Set up test environment
    await setupTestDatabase();
    await createTestBooking();
  });
  
  test('successful payment creates confirmed booking', async () => {
    // Create payment intent
    const response = await request(app)
      .post('/api/create-payment-intent')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        amount: 120.00,
        bookingId: testBookingId
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('clientSecret');
    expect(response.body).toHaveProperty('paymentIntentId');
    
    // Simulate successful payment
    const paymentIntent = await stripe.paymentIntents.confirm(
      response.body.paymentIntentId,
      {
        payment_method: {
          type: 'card',
          card: {
            token: 'tok_visa' // Stripe test token
          }
        }
      }
    );
    
    expect(paymentIntent.status).toBe('succeeded');
    
    // Verify booking is confirmed
    const booking = await storage.getBookingById(testBookingId, testUserId);
    expect(booking.status).toBe('confirmed');
  });
  
  test('failed payment keeps booking as pending', async () => {
    // Test with declined card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 12000, // 120.00 SAR
      currency: 'sar',
      payment_method_data: {
        type: 'card',
        card: {
          number: testCards.declined,
          exp_month: 12,
          exp_year: 2025,
          cvc: '123'
        }
      },
      confirm: true
    });
    
    expect(paymentIntent.status).toBe('requires_payment_method');
    
    // Verify booking remains pending
    const booking = await storage.getBookingById(testBookingId, testUserId);
    expect(booking.status).toBe('pending');
  });
});
```

## Payment Analytics and Monitoring

### 1. Payment Metrics Tracking

#### Key Payment Metrics
```typescript
// Payment analytics interface
interface PaymentMetrics {
  // Success metrics
  successRate: number;
  averageTransactionAmount: number;
  totalRevenue: number;
  
  // Failure metrics
  declineRate: number;
  commonDeclineReasons: Record<string, number>;
  
  // Performance metrics
  averageProcessingTime: number;
  peakTransactionTimes: Date[];
  
  // Method metrics
  paymentMethodUsage: Record<string, number>;
  mobileVsDesktop: Record<string, number>;
}

// Track payment events
const trackPaymentEvent = async (
  event: 'payment_started' | 'payment_succeeded' | 'payment_failed',
  data: {
    amount: number;
    paymentMethod: string;
    processingTime?: number;
    errorCode?: string;
    userAgent?: string;
  }
) => {
  await analytics.track(event, {
    ...data,
    timestamp: new Date(),
    currency: 'SAR'
  });
};

// Usage in payment processing
app.post('/api/create-payment-intent', async (req, res) => {
  const startTime = Date.now();
  
  try {
    await trackPaymentEvent('payment_started', {
      amount: req.body.amount,
      paymentMethod: 'card',
      userAgent: req.headers['user-agent']
    });
    
    const paymentIntent = await stripe.paymentIntents.create(paymentData);
    
    await trackPaymentEvent('payment_succeeded', {
      amount: req.body.amount,
      paymentMethod: 'card',
      processingTime: Date.now() - startTime
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    await trackPaymentEvent('payment_failed', {
      amount: req.body.amount,
      paymentMethod: 'card',
      errorCode: error.code,
      processingTime: Date.now() - startTime
    });
    
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Revenue Tracking

#### Financial Reporting
```typescript
// Revenue analytics
interface RevenueReport {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  
  byRoute: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  refunds: number;
  netRevenue: number;
}

const generateRevenueReport = async (
  startDate: Date,
  endDate: Date
): Promise<RevenueReport> => {
  const [revenueData] = await db
    .select({
      totalRevenue: sql<number>`SUM(CAST(${bookings.finalAmount} as DECIMAL))`,
      refundAmount: sql<number>`SUM(CASE WHEN ${bookings.status} = 'refunded' THEN CAST(${bookings.finalAmount} as DECIMAL) ELSE 0 END)`,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.createdAt, startDate),
        lte(bookings.createdAt, endDate),
        eq(bookings.status, 'confirmed')
      )
    );
  
  // Additional queries for detailed breakdown
  const routeRevenue = await getRevenueByRoute(startDate, endDate);
  const paymentMethodRevenue = await getRevenueByPaymentMethod(startDate, endDate);
  
  return {
    daily: calculateDailyAverage(revenueData.totalRevenue, startDate, endDate),
    weekly: calculateWeeklyAverage(revenueData.totalRevenue, startDate, endDate),
    monthly: calculateMonthlyAverage(revenueData.totalRevenue, startDate, endDate),
    yearly: revenueData.totalRevenue,
    byRoute: routeRevenue,
    byPaymentMethod: paymentMethodRevenue,
    refunds: revenueData.refundAmount,
    netRevenue: revenueData.totalRevenue - revenueData.refundAmount
  };
};
```

This comprehensive payment integration guide ensures secure, reliable payment processing while providing excellent user experience and detailed analytics for business insights.