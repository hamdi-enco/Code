# API Documentation

## Overview

The Haramain API provides RESTful endpoints for all platform operations including authentication, trip search, booking management, payments, and administrative functions.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.replit.app/api
```

## Authentication

### Authentication Method
The API uses **Replit Auth** (OAuth 2.0) for user authentication. Most endpoints require authentication via session-based authentication.

### Authentication Flow
1. **Login**: `GET /api/login` - Redirects to OAuth provider
2. **Callback**: `GET /api/callback` - Handles OAuth callback
3. **Logout**: `GET /api/logout` - Terminates session
4. **User Info**: `GET /api/auth/user` - Returns current user

### Protected Endpoints
Protected endpoints require valid authentication and return `401 Unauthorized` if not authenticated.

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": [ ... ] // Validation errors (optional)
}
```

## Authentication Endpoints

### Get Current User
```http
GET /api/auth/user
Authorization: Required
```

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profileImageUrl": "https://...",
  "createdAt": "2025-08-21T18:00:00Z"
}
```

**Status Codes:**
- `200`: User data returned
- `401`: Not authenticated

## Trip Endpoints

### Search Trips
```http
GET /api/trips/search?originCity={origin}&destinationCity={destination}&date={date}
Authorization: Not required
```

**Parameters:**
- `originCity` (required): Origin city code (e.g., "riyadh")
- `destinationCity` (required): Destination city code (e.g., "jeddah")
- `date` (required): Travel date in YYYY-MM-DD format

**Response:**
```json
[
  {
    "id": "trip-uuid",
    "departureTime": "2025-08-23T08:00:00Z",
    "arrivalTime": "2025-08-23T16:00:00Z",
    "price": "120.00",
    "status": "scheduled",
    "route": {
      "originCity": "riyadh",
      "destinationCity": "jeddah",
      "estimatedDurationMinutes": 480
    },
    "bus": {
      "busNumber": "HR-001",
      "capacity": 45,
      "model": "Mercedes-Benz Travego",
      "amenities": ["wifi", "ac", "reclining_seats"]
    },
    "availableSeats": 32
  }
]
```

**Status Codes:**
- `200`: Trips found
- `400`: Missing required parameters
- `500`: Server error

### Get Trip Seats
```http
GET /api/trips/{tripId}/seats
Authorization: Not required
```

**Response:**
```json
{
  "tripId": "trip-uuid",
  "capacity": 45,
  "bookedSeats": 13,
  "availableSeats": 32,
  "seatLayout": {
    "A": ["A1", "A2", "A3", "A4"],
    "B": ["B1", "B2", "B3", "B4"],
    // ... seat arrangement
  },
  "bookedSeatNumbers": ["A1", "A2", "B5", "C3"]
}
```

### Create Trip (Admin)
```http
POST /api/trips
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "routeId": "route-uuid",
  "busId": "bus-uuid",
  "departureTime": "2025-08-23T08:00:00Z",
  "arrivalTime": "2025-08-23T16:00:00Z",
  "price": "120.00",
  "status": "scheduled"
}
```

## Booking Endpoints

### Get User Bookings
```http
GET /api/bookings
Authorization: Required
```

**Response:**
```json
[
  {
    "id": "booking-uuid",
    "bookingReference": "HR123456",
    "passengerCount": 2,
    "finalAmount": "240.00",
    "status": "confirmed",
    "createdAt": "2025-08-21T18:00:00Z",
    "trip": {
      "departureTime": "2025-08-23T08:00:00Z",
      "route": {
        "originCity": "riyadh",
        "destinationCity": "jeddah"
      },
      "bus": {
        "busNumber": "HR-001"
      }
    },
    "bookedSeats": [
      {
        "seatNumber": "A1",
        "passengerName": "John Doe"
      },
      {
        "seatNumber": "A2",
        "passengerName": "Jane Doe"
      }
    ]
  }
]
```

### Create Booking
```http
POST /api/bookings
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "tripId": "trip-uuid",
  "passengerCount": 2,
  "totalAmount": "240.00",
  "promoCode": "SAVE20",
  "selectedSeats": [
    {
      "seatNumber": "A1",
      "passengerName": "John Doe"
    },
    {
      "seatNumber": "A2",
      "passengerName": "Jane Doe"
    }
  ]
}
```

**Response:**
```json
{
  "id": "booking-uuid",
  "bookingReference": "HR123456",
  "totalAmount": "240.00",
  "discountAmount": "48.00",
  "finalAmount": "192.00",
  "status": "pending"
}
```

### Get Booking Details
```http
GET /api/bookings/{bookingId}
Authorization: Required
```

**Response:**
```json
{
  "id": "booking-uuid",
  "bookingReference": "HR123456",
  "finalAmount": "192.00",
  "status": "confirmed",
  "trip": {
    "departureTime": "2025-08-23T08:00:00Z",
    "arrivalTime": "2025-08-23T16:00:00Z",
    "route": {
      "originCity": "riyadh",
      "destinationCity": "jeddah"
    },
    "bus": {
      "busNumber": "HR-001",
      "capacity": 45
    }
  },
  "bookedSeats": [
    {
      "seatNumber": "A1",
      "passengerName": "John Doe"
    }
  ]
}
```

## Payment Endpoints

### Create Payment Intent
```http
POST /api/create-payment-intent
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 192.00,
  "bookingId": "booking-uuid"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxxxxxxxxxxxx"
}
```

### Confirm Payment
```http
POST /api/confirm-payment
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxxxxxxxxxxxx",
  "bookingId": "booking-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "booking-uuid",
    "status": "confirmed",
    "paymentGatewayId": "pi_xxxxxxxxxxxxx"
  }
}
```

## Promotion Endpoints

### Validate Promo Code
```http
POST /api/promotions/validate
Authorization: Not required
Content-Type: application/json
```

**Request Body:**
```json
{
  "promoCode": "SAVE20"
}
```

**Response:**
```json
{
  "id": "promo-uuid",
  "promoCode": "SAVE20",
  "discountType": "percentage",
  "discountValue": "20.00",
  "isActive": true
}
```

**Status Codes:**
- `200`: Valid promo code
- `404`: Invalid promo code
- `400`: Missing promo code

### Create Promotion (Admin)
```http
POST /api/promotions
Authorization: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "promoCode": "SUMMER25",
  "discountType": "percentage",
  "discountValue": "25.00",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z",
  "usageLimit": 1000,
  "isActive": true
}
```

## Admin Endpoints

### Get Admin Statistics
```http
GET /api/admin/stats
Authorization: Required
```

**Response:**
```json
{
  "totalBookings": 1250,
  "revenueToday": "15840.00",
  "activeRoutes": 12,
  "fleetSize": 25
}
```

### Get All Bookings (Admin)
```http
GET /api/admin/bookings
Authorization: Required
```

**Response:**
```json
[
  {
    "id": "booking-uuid",
    "bookingReference": "HR123456",
    "route": {
      "originCity": "riyadh",
      "destinationCity": "jeddah"
    },
    "passengerName": "John Doe",
    "amount": "192.00",
    "status": "confirmed"
  }
]
```

## Social Links Endpoints

### Get Social Links
```http
GET /api/social-links
Authorization: Not required
```

**Response:**
```json
[
  {
    "id": "social-uuid",
    "platform": "twitter",
    "url": "https://twitter.com/haramain_sa",
    "isVisible": true
  },
  {
    "id": "social-uuid-2",
    "platform": "instagram",
    "url": "https://instagram.com/haramain_sa",
    "isVisible": true
  }
]
```

## Error Handling

### Common Error Codes

#### 400 Bad Request
```json
{
  "message": "Invalid request data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

### Validation Errors

When request validation fails, the API returns detailed error information:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["tripId"],
      "message": "Expected string, received number"
    }
  ]
}
```

## Rate Limiting

- **General endpoints**: 100 requests per minute per IP
- **Search endpoints**: 60 requests per minute per IP
- **Payment endpoints**: 10 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin user

## API Versioning

Currently using implicit v1. Future versions will be specified in the URL:
- `v1`: `/api/...` (current)
- `v2`: `/api/v2/...` (future)

## SDKs and Libraries

### JavaScript/TypeScript
```typescript
// Using fetch with TypeScript types
import type { Trip, Booking } from '@shared/schema';

const searchTrips = async (params: SearchParams): Promise<Trip[]> => {
  const response = await fetch(`/api/trips/search?${new URLSearchParams(params)}`);
  return response.json();
};
```

### React Query Integration
```typescript
// Using TanStack Query
const { data: trips } = useQuery({
  queryKey: ['/api/trips/search', searchParams],
  queryFn: () => searchTrips(searchParams)
});
```

## Testing

### Example curl Commands

#### Search Trips
```bash
curl "http://localhost:5000/api/trips/search?originCity=riyadh&destinationCity=jeddah&date=2025-08-23"
```

#### Create Booking
```bash
curl -X POST "http://localhost:5000/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=xxx" \
  -d '{
    "tripId": "trip-uuid",
    "passengerCount": 1,
    "totalAmount": "120.00",
    "selectedSeats": [{"seatNumber": "A1", "passengerName": "John Doe"}]
  }'
```