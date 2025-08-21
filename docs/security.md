# Security Guide

## Security Overview

The Haramain platform implements comprehensive security measures to protect user data, financial transactions, and system integrity. This guide covers all security aspects from authentication to data protection.

## Authentication and Authorization

### 1. OAuth 2.0 Implementation

#### Replit Auth Integration
```typescript
// server/replitAuth.ts - Secure OAuth implementation
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";

// Secure OAuth configuration
const getOidcConfig = memoize(
  async () => {
    if (!process.env.ISSUER_URL || !process.env.REPL_ID) {
      throw new Error("Missing required OAuth environment variables");
    }
    
    return await client.discovery(
      new URL(process.env.ISSUER_URL),
      process.env.REPL_ID,
      {
        // Security-focused client configuration
        id_token_signed_response_alg: 'RS256',
        userinfo_signed_response_alg: 'RS256',
        token_endpoint_auth_method: 'client_secret_basic'
      }
    );
  },
  { maxAge: 3600 * 1000 } // Cache for 1 hour
);

// Secure token verification
const verify: VerifyFunction = async (
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
  verified: passport.AuthenticateCallback
) => {
  try {
    // Validate token signature and claims
    const claims = tokens.claims();
    
    // Verify required claims
    if (!claims.sub || !claims.email) {
      return verified(new Error("Invalid token claims"), false);
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      return verified(new Error("Token expired"), false);
    }
    
    // Verify issuer
    if (claims.iss !== process.env.ISSUER_URL) {
      return verified(new Error("Invalid token issuer"), false);
    }
    
    // Create user session
    const user = {
      claims,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims.exp
    };
    
    // Upsert user in database
    await storage.upsertUser({
      id: claims.sub,
      email: claims.email,
      firstName: claims.first_name,
      lastName: claims.last_name,
      profileImageUrl: claims.profile_image_url
    });
    
    verified(null, user);
  } catch (error) {
    console.error("OAuth verification error:", error);
    verified(error, false);
  }
};
```

#### Session Security
```typescript
// Secure session configuration
import connectPg from "connect-pg-simple";
import session from "express-session";

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required");
  }
  
  // Validate session secret strength
  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'haramain.sid', // Custom session name
    cookie: {
      httpOnly: true,        // Prevent XSS
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      maxAge: sessionTtl,
      sameSite: 'strict'     // CSRF protection
    },
    // Session regeneration for security
    genid: () => {
      return crypto.randomBytes(32).toString('hex');
    }
  });
}
```

### 2. Access Control

#### Route Protection Middleware
```typescript
// Enhanced authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as any;
    
    // Check if user is authenticated
    if (!req.isAuthenticated() || !user) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }
    
    // Check token expiration
    if (!user.expires_at) {
      return res.status(401).json({ 
        message: "Invalid session",
        code: "INVALID_SESSION"
      });
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Token is still valid
    if (user.expires_at > now) {
      return next();
    }
    
    // Attempt token refresh
    if (user.refresh_token) {
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, user.refresh_token);
        
        // Update user session with new tokens
        updateUserSession(user, tokenResponse);
        
        return next();
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
    
    // Authentication failed
    return res.status(401).json({ 
      message: "Session expired",
      code: "SESSION_EXPIRED"
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ 
      message: "Authentication error",
      code: "AUTH_ERROR"
    });
  }
};

// Role-based access control
export const requireRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    if (!user || !user.claims) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check user role (implement according to your role system)
    const userRoles = user.claims.roles || [];
    
    if (!userRoles.includes(role)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required_role: role
      });
    }
    
    next();
  };
};

// Usage
app.get('/api/admin/stats', isAuthenticated, requireRole('admin'), (req, res) => {
  // Admin-only endpoint
});
```

## Data Protection

### 1. Input Validation and Sanitization

#### Comprehensive Input Validation
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Input validation schemas
const createBookingSchema = z.object({
  tripId: z.string().uuid("Invalid trip ID format"),
  passengerCount: z.number().int().min(1).max(10),
  totalAmount: z.number().positive().max(100000),
  promoCode: z.string().regex(/^[A-Z0-9]{3,20}$/).optional(),
  selectedSeats: z.array(z.object({
    seatNumber: z.string().regex(/^[A-Z]\d{1,2}$/),
    passengerName: z.string().min(2).max(100)
  })).min(1).max(10)
});

const searchTripsSchema = z.object({
  originCity: z.enum(['riyadh', 'jeddah', 'makkah', 'madinah', 'dammam']),
  destinationCity: z.enum(['riyadh', 'jeddah', 'makkah', 'madinah', 'dammam']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).refine(data => data.originCity !== data.destinationCity, {
  message: "Origin and destination cannot be the same"
});

// Input sanitization middleware
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove HTML tags and scripts
      return DOMPurify.sanitize(value, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      }).trim();
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    
    return value;
  };
  
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  
  next();
};

// Validation middleware factory
const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid input data",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(400).json({
        message: "Input validation failed"
      });
    }
  };
};

// Usage
app.post('/api/bookings', 
  sanitizeInput,
  validateInput(createBookingSchema),
  isAuthenticated,
  async (req, res) => {
    // Process validated and sanitized booking data
  }
);
```

### 2. SQL Injection Prevention

#### Drizzle ORM Security
```typescript
// Safe database queries with Drizzle ORM
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// ✅ SAFE: Parameterized queries with Drizzle
export class DatabaseStorage implements IStorage {
  async searchTrips(params: SearchParams): Promise<Trip[]> {
    // Safe parameterized query
    return await db
      .select()
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .where(
        and(
          eq(routes.originCity, params.originCity),      // Parameterized
          eq(routes.destinationCity, params.destinationCity), // Parameterized
          gte(trips.departureTime, params.startDate),   // Parameterized
          lte(trips.departureTime, params.endDate)      // Parameterized
        )
      );
  }
  
  async getBookingById(bookingId: string, userId: string): Promise<Booking | undefined> {
    // Safe with UUID validation
    if (!z.string().uuid().safeParse(bookingId).success) {
      throw new Error("Invalid booking ID format");
    }
    
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.id, bookingId),  // Parameterized
          eq(bookings.userId, userId) // Parameterized
        )
      );
    
    return booking;
  }
  
  // ❌ DANGEROUS: Never do this (for reference only)
  async dangerousQuery(userInput: string) {
    // This would be vulnerable to SQL injection
    // const query = `SELECT * FROM users WHERE name = '${userInput}'`;
    // return await db.execute(sql`${query}`);
    
    // ✅ SAFE: Use parameterized queries instead
    return await db
      .select()
      .from(users)
      .where(eq(users.firstName, userInput)); // Properly parameterized
  }
}

// Additional query security
const sanitizeSqlInput = (input: string): string => {
  // Remove potential SQL injection characters
  return input.replace(/[';--]/g, '');
};

// Validate all database inputs
const validateDatabaseInput = (input: any, type: 'uuid' | 'string' | 'number' | 'date') => {
  switch (type) {
    case 'uuid':
      if (!z.string().uuid().safeParse(input).success) {
        throw new Error(`Invalid UUID: ${input}`);
      }
      break;
    case 'string':
      if (typeof input !== 'string' || input.length > 255) {
        throw new Error(`Invalid string input: ${input}`);
      }
      break;
    case 'number':
      if (!z.number().safeParse(Number(input)).success) {
        throw new Error(`Invalid number: ${input}`);
      }
      break;
    case 'date':
      if (!z.date().safeParse(new Date(input)).success) {
        throw new Error(`Invalid date: ${input}`);
      }
      break;
  }
  
  return input;
};
```

### 3. XSS Protection

#### Content Security Policy (CSP)
```typescript
import helmet from 'helmet';

// Comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline scripts (minimize usage)
        "js.stripe.com",   // Stripe payments
        "https://cdn.jsdelivr.net" // CDN scripts (if needed)
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        "fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "api.stripe.com",
        process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] // Database host
      ],
      frameSrc: [
        "js.stripe.com" // Stripe iframes
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
    reportOnly: process.env.NODE_ENV === 'development'
  },
  
  // Additional security headers
  crossOriginEmbedderPolicy: false, // Required for some payment providers
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// XSS protection for user-generated content
import createDOMPurify from 'isomorphic-dompurify';

const DOMPurify = createDOMPurify();

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  });
};

// Output encoding for dynamic content
export const escapeHtml = (text: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
};

// Safe HTML rendering in React
export const SafeHtml = ({ content }: { content: string }) => {
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: sanitizedContent 
      }} 
    />
  );
};
```

## Network Security

### 1. HTTPS and TLS Configuration

#### SSL/TLS Enforcement
```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is secure
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
  
  // Strict Transport Security
  app.use((req, res, next) => {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    next();
  });
}

// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

### 2. Rate Limiting and DDoS Protection

#### Comprehensive Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to static files
  skip: (req) => {
    return req.url.startsWith('/static/') && req.method === 'GET';
  }
});

// Strict rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use IP + user agent for more specific limiting
    return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  }
});

// Payment endpoint protection
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each user to 3 payment attempts per minute
  keyGenerator: (req) => {
    const user = req.user as any;
    return user?.claims?.sub || req.ip;
  },
  message: {
    error: 'Payment rate limit exceeded. Please wait before trying again.',
    retryAfter: '1 minute'
  }
});

// Search endpoint throttling (slow down rather than block)
const searchSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 20, // allow 20 requests per 15 minutes at full speed
  delayMs: 500, // slow down subsequent requests by 500ms per request
  maxDelayMs: 5000 // maximum delay of 5 seconds
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/create-payment-intent', paymentLimiter);
app.use('/api/confirm-payment', paymentLimiter);
app.use('/api/trips/search', searchSlowDown);

// Additional DDoS protection
const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // very high limit for detection of abnormal traffic
  onLimitReached: (req) => {
    // Log potential DDoS attack
    console.warn(`Potential DDoS from IP: ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      timestamp: new Date()
    });
  }
});

app.use(ddosProtection);
```

### 3. CORS Configuration

#### Secure CORS Setup
```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://haramain.sa',
      'https://www.haramain.sa',
      process.env.REPLIT_DOMAIN,
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];
    
    // Development origins
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000'
      );
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true, // Allow cookies
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ],
  
  exposedHeaders: ['X-Total-Count'], // Headers exposed to client
  
  maxAge: 86400, // Cache preflight response for 24 hours
  
  optionsSuccessStatus: 200 // Support legacy browsers
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
```

## Payment Security

### 1. PCI DSS Compliance

#### Stripe Security Implementation
```typescript
// Secure Stripe configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
  
  // Security configurations
  maxNetworkRetries: 3,
  timeout: 30000, // 30 seconds
  
  // Webhook endpoint security
  webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET
});

// Validate Stripe environment
const validateStripeConfig = () => {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'VITE_STRIPE_PUBLIC_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Stripe configuration: ${missing.join(', ')}`);
  }
  
  // Validate key formats
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }
  
  if (!process.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_')) {
    throw new Error('Invalid Stripe public key format');
  }
  
  // Ensure test keys in development
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.STRIPE_SECRET_KEY.includes('_test_')) {
      console.warn('WARNING: Using live Stripe keys in development');
    }
  }
  
  // Ensure live keys in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.STRIPE_SECRET_KEY.includes('_test_')) {
      throw new Error('Cannot use test Stripe keys in production');
    }
  }
};

// Secure payment processing
export const createPaymentIntent = async (
  amount: number,
  bookingId: string,
  userId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    // Validate input
    if (amount <= 0 || amount > 100000) {
      throw new Error('Invalid payment amount');
    }
    
    if (!z.string().uuid().safeParse(bookingId).success) {
      throw new Error('Invalid booking ID');
    }
    
    // Create payment intent with security measures
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'sar',
      
      // Security metadata
      metadata: {
        bookingId,
        userId,
        timestamp: Date.now().toString(),
        source: 'haramain-web'
      },
      
      // Enhanced fraud detection
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
          statement_descriptor_suffix: 'HARAMAIN'
        }
      },
      
      // Automatic payment methods with security
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never' // Prevent redirect-based attacks
      },
      
      // Receipt configuration
      receipt_email: undefined, // Don't auto-send receipts
      description: `Haramain Bus Booking ${bookingId}`,
      
      // Capture method
      capture_method: 'automatic',
      confirmation_method: 'automatic'
    });
    
    // Log payment creation (without sensitive data)
    console.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount: amount,
      bookingId: bookingId,
      userId: userId
    });
    
    return paymentIntent;
  } catch (error: any) {
    console.error('Payment intent creation failed', {
      error: error.message,
      bookingId,
      userId,
      amount
    });
    
    throw new Error('Payment processing unavailable');
  }
};
```

### 2. Webhook Security

#### Secure Webhook Processing
```typescript
import crypto from 'crypto';

// Webhook signature verification
const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean => {
  try {
    const elements = signature.split(',');
    
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !signatureHash) {
      return false;
    }
    
    // Check timestamp (prevent replay attacks)
    const webhookTimestamp = parseInt(timestamp, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = currentTimestamp - webhookTimestamp;
    
    // Reject webhooks older than 5 minutes
    if (timeDifference > 300) {
      console.warn('Webhook timestamp too old', { timeDifference });
      return false;
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

// Secure webhook endpoint
app.post('/api/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!sig || !endpointSecret) {
      console.error('Missing webhook signature or secret');
      return res.status(400).send('Missing webhook signature or secret');
    }
    
    let event: Stripe.Event;
    
    try {
      // Verify webhook signature
      if (!verifyWebhookSignature(req.body, sig, endpointSecret)) {
        console.error('Webhook signature verification failed');
        return res.status(400).send('Invalid signature');
      }
      
      // Construct event
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook construction error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Process webhook securely
    try {
      await processWebhookEvent(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// Idempotent webhook processing
const processedWebhooks = new Set<string>();

const processWebhookEvent = async (event: Stripe.Event) => {
  // Prevent duplicate processing
  if (processedWebhooks.has(event.id)) {
    console.info('Webhook already processed:', event.id);
    return;
  }
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.info(`Unhandled webhook event: ${event.type}`);
    }
    
    // Mark as processed
    processedWebhooks.add(event.id);
    
    // Clean up old webhook IDs (prevent memory leak)
    if (processedWebhooks.size > 10000) {
      const oldestIds = Array.from(processedWebhooks).slice(0, 1000);
      oldestIds.forEach(id => processedWebhooks.delete(id));
    }
  } catch (error) {
    console.error('Webhook event processing failed:', error);
    throw error;
  }
};
```

## Monitoring and Incident Response

### 1. Security Monitoring

#### Comprehensive Logging
```typescript
import winston from 'winston';

// Security-focused logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'security.log',
      level: 'warn'
    })
  ]
});

// Security event logging
interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'payment_fraud' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export const logSecurityEvent = (event: SecurityEvent) => {
  securityLogger.warn('Security event detected', {
    ...event,
    timestamp: new Date().toISOString()
  });
  
  // Alert on critical events
  if (event.severity === 'critical') {
    alertSecurityTeam(event);
  }
};

// Usage in authentication
app.post('/api/auth/login', (req, res) => {
  try {
    // ... authentication logic
  } catch (error) {
    logSecurityEvent({
      type: 'auth_failure',
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: {
        error: error.message,
        path: req.path
      },
      timestamp: new Date()
    });
  }
});

// Suspicious activity detection
const detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\b(union|select|insert|delete|drop|create|alter|exec|script)\b)/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /eval\s*\(/gi
  ];
  
  const checkForPatterns = (input: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(input));
  };
  
  // Check URL parameters
  const queryString = req.url.split('?')[1] || '';
  if (checkForPatterns(queryString)) {
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: {
        suspicious_query: queryString,
        path: req.path
      },
      timestamp: new Date()
    });
    
    return res.status(400).json({ message: 'Invalid request' });
  }
  
  next();
};

app.use(detectSuspiciousActivity);
```

### 2. Incident Response

#### Automated Response System
```typescript
// Security incident response
interface SecurityIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  description: string;
  affectedSystems: string[];
  responseActions: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

class SecurityIncidentManager {
  private incidents: Map<string, SecurityIncident> = new Map();
  
  async createIncident(
    type: string,
    severity: SecurityIncident['severity'],
    description: string,
    affectedSystems: string[]
  ): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: crypto.randomUUID(),
      type,
      severity,
      status: 'open',
      description,
      affectedSystems,
      responseActions: [],
      createdAt: new Date()
    };
    
    this.incidents.set(incident.id, incident);
    
    // Automatic response based on severity
    await this.automatedResponse(incident);
    
    return incident;
  }
  
  private async automatedResponse(incident: SecurityIncident) {
    switch (incident.severity) {
      case 'critical':
        // Immediate lockdown procedures
        await this.enableMaintenanceMode();
        await this.notifySecurityTeam(incident);
        await this.blockSuspiciousIPs();
        break;
        
      case 'high':
        // Enhanced monitoring and alerting
        await this.increaseSecurityLevel();
        await this.notifySecurityTeam(incident);
        break;
        
      case 'medium':
        // Standard monitoring
        await this.logIncident(incident);
        break;
        
      case 'low':
        // Just log for review
        await this.logIncident(incident);
        break;
    }
  }
  
  private async enableMaintenanceMode() {
    console.warn('SECURITY: Enabling maintenance mode');
    // Implement maintenance mode logic
  }
  
  private async notifySecurityTeam(incident: SecurityIncident) {
    console.error(`SECURITY ALERT: ${incident.type}`, {
      severity: incident.severity,
      description: incident.description,
      incidentId: incident.id
    });
    
    // In production, send actual notifications
    // - Email alerts
    // - Slack notifications
    // - SMS for critical incidents
  }
  
  private async blockSuspiciousIPs() {
    // Implement IP blocking logic
    console.warn('SECURITY: Blocking suspicious IP addresses');
  }
  
  private async increaseSecurityLevel() {
    // Implement enhanced security measures
    console.warn('SECURITY: Increasing security level');
  }
  
  private async logIncident(incident: SecurityIncident) {
    securityLogger.error('Security incident', incident);
  }
}

export const securityIncidentManager = new SecurityIncidentManager();

// Usage in security middleware
const handleSecurityBreach = async (req: Request, type: string, severity: SecurityIncident['severity']) => {
  await securityIncidentManager.createIncident(
    type,
    severity,
    `Security breach detected from IP ${req.ip}`,
    ['web-application', 'user-data']
  );
};
```

## Data Privacy and Compliance

### 1. GDPR Compliance

#### Data Protection Implementation
```typescript
// GDPR compliance utilities
interface PersonalData {
  userId: string;
  dataType: 'profile' | 'booking' | 'payment' | 'communication';
  data: any;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest';
  retentionPeriod: number; // days
  createdAt: Date;
}

class DataProtectionManager {
  // Data subject rights implementation
  async exportUserData(userId: string): Promise<any> {
    try {
      // Collect all user data
      const userData = await this.collectUserData(userId);
      
      // Anonymize sensitive data
      const exportData = this.anonymizeSensitiveData(userData);
      
      return {
        userId,
        exportDate: new Date().toISOString(),
        data: exportData
      };
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error('Data export unavailable');
    }
  }
  
  async deleteUserData(userId: string, requestId: string): Promise<void> {
    try {
      // Log deletion request
      securityLogger.info('User data deletion requested', {
        userId,
        requestId,
        timestamp: new Date()
      });
      
      // Delete user data (with some exceptions for legal compliance)
      await db.transaction(async (tx) => {
        // Anonymize bookings instead of deleting (for financial records)
        await tx
          .update(bookings)
          .set({ 
            userId: 'deleted-user',
            // Keep financial data for accounting
          })
          .where(eq(bookings.userId, userId));
        
        // Delete user profile
        await tx
          .delete(users)
          .where(eq(users.id, userId));
        
        // Delete sessions
        await tx
          .delete(sessions)
          .where(sql`sess->>'userId' = ${userId}`);
      });
      
      securityLogger.info('User data deleted successfully', {
        userId,
        requestId
      });
    } catch (error) {
      console.error('Data deletion failed:', error);
      throw new Error('Data deletion failed');
    }
  }
  
  private async collectUserData(userId: string): Promise<any> {
    // Collect user profile data
    const userProfile = await storage.getUser(userId);
    
    // Collect booking data
    const userBookings = await storage.getUserBookings(userId);
    
    // Collect session data (if needed)
    // Note: Sessions are typically excluded from exports
    
    return {
      profile: userProfile,
      bookings: userBookings,
      // Add other data types as needed
    };
  }
  
  private anonymizeSensitiveData(data: any): any {
    // Remove or hash sensitive information
    const anonymized = { ...data };
    
    // Remove payment information
    if (anonymized.bookings) {
      anonymized.bookings = anonymized.bookings.map((booking: any) => ({
        ...booking,
        paymentGatewayId: undefined,
        // Keep booking reference and trip info
      }));
    }
    
    return anonymized;
  }
  
  // Data retention management
  async cleanupExpiredData(): Promise<void> {
    const retentionPeriods = {
      sessions: 30, // days
      logs: 365,    // days
      bookings: 2555, // 7 years for financial records
    };
    
    const cutoffDates = {
      sessions: new Date(Date.now() - retentionPeriods.sessions * 24 * 60 * 60 * 1000),
      logs: new Date(Date.now() - retentionPeriods.logs * 24 * 60 * 60 * 1000),
    };
    
    // Clean up expired sessions
    await db
      .delete(sessions)
      .where(sql`expire < ${cutoffDates.sessions}`);
    
    // Archive old bookings instead of deleting
    const oldBookings = await db
      .select()
      .from(bookings)
      .where(sql`created_at < ${new Date(Date.now() - retentionPeriods.bookings * 24 * 60 * 60 * 1000)}`);
    
    if (oldBookings.length > 0) {
      // Move to archive table or export to cold storage
      console.info(`Archiving ${oldBookings.length} old bookings`);
    }
  }
}

export const dataProtectionManager = new DataProtectionManager();

// GDPR API endpoints
app.get('/api/data/export', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const exportData = await dataProtectionManager.exportUserData(userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Data export failed' });
  }
});

app.post('/api/data/delete', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const requestId = crypto.randomUUID();
    
    await dataProtectionManager.deleteUserData(userId, requestId);
    
    res.json({ 
      message: 'Account deletion completed',
      requestId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Account deletion failed' });
  }
});
```

This comprehensive security guide ensures that the Haramain platform maintains the highest security standards while providing a seamless user experience. Regular security audits and updates should be performed to address emerging threats and maintain compliance with evolving regulations.