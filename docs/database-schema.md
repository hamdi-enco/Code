# Database Schema

## Overview

The Haramain platform uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema is designed to handle complex booking scenarios, user management, and operational data efficiently.

## Entity Relationship Diagram

```
Users ──┐
        │
        ├── Sessions
        │
        └── Bookings ──┐
                       │
                       ├── BookedSeats ──┐
                       │                 │
                       └── Trips ────────┼── Buses
                                         │
                                         └── Routes
```

## Table Definitions

### 1. Users Table

```typescript
users: {
  id: varchar (Primary Key, UUID)
  email: varchar (Unique, nullable)
  firstName: varchar (nullable)
  lastName: varchar (nullable)
  profileImageUrl: varchar (nullable)
  createdAt: timestamp (default: now())
  updatedAt: timestamp (default: now())
}
```

**Purpose**: Stores user profile information from OAuth providers.

**Key Features**:
- UUID primary keys for security
- Nullable fields for flexible OAuth providers
- Automatic timestamp management

### 2. Sessions Table

```typescript
sessions: {
  sid: varchar (Primary Key)
  sess: jsonb (Session data)
  expire: timestamp (Session expiration)
}
```

**Purpose**: Persistent session storage for user authentication.

**Key Features**:
- JSONB for flexible session data
- Automatic expiration handling
- Index on expire column for cleanup

### 3. Routes Table

```typescript
routes: {
  id: uuid (Primary Key)
  originCity: varchar (Origin city code)
  destinationCity: varchar (Destination city code)
  estimatedDurationMinutes: integer (Journey duration)
  isActive: boolean (Route availability)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Defines available travel routes between cities.

**Sample Data**:
- riyadh → jeddah (480 minutes)
- jeddah → makkah (90 minutes)
- riyadh → madinah (360 minutes)

### 4. Buses Table

```typescript
buses: {
  id: uuid (Primary Key)
  busNumber: varchar (Bus identifier)
  capacity: integer (Total seat count)
  model: varchar (Bus model/type)
  amenities: jsonb (Available amenities)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Fleet management and bus specifications.

**Amenities Examples**:
```json
["wifi", "ac", "reclining_seats", "refreshments", "entertainment"]
```

### 5. Trips Table

```typescript
trips: {
  id: uuid (Primary Key)
  routeId: uuid (Foreign Key → routes.id)
  busId: uuid (Foreign Key → buses.id)
  departureTime: timestamp (Trip departure)
  arrivalTime: timestamp (Trip arrival)
  price: decimal (Base ticket price)
  status: varchar (Trip status)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Scheduled trips with specific routes, buses, and timing.

**Status Values**:
- `scheduled`: Trip available for booking
- `boarding`: Trip currently boarding
- `departed`: Trip in progress
- `arrived`: Trip completed
- `cancelled`: Trip cancelled

### 6. Bookings Table

```typescript
bookings: {
  id: uuid (Primary Key)
  userId: varchar (Foreign Key → users.id)
  tripId: uuid (Foreign Key → trips.id)
  bookingReference: varchar (Unique booking code)
  passengerCount: integer (Number of passengers)
  totalAmount: decimal (Subtotal before discounts)
  discountAmount: decimal (Discount applied)
  finalAmount: decimal (Final amount paid)
  promoCode: varchar (nullable, Applied promo code)
  paymentGatewayId: varchar (nullable, Payment ID)
  paymentMethod: varchar (nullable, Payment method)
  status: varchar (Booking status)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Individual booking records with payment information.

**Status Values**:
- `pending`: Booking created, payment pending
- `confirmed`: Payment successful, booking confirmed
- `cancelled`: Booking cancelled by user/system
- `refunded`: Refund processed

### 7. BookedSeats Table

```typescript
bookedSeats: {
  id: uuid (Primary Key)
  bookingId: uuid (Foreign Key → bookings.id)
  tripId: uuid (Foreign Key → trips.id)
  seatNumber: varchar (Seat identifier)
  passengerName: varchar (Passenger name)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Tracks individual seat assignments for each booking.

**Features**:
- One record per seat per booking
- Supports multiple passengers per booking
- Seat numbers like "A1", "B12", "C5"

### 8. Promotions Table

```typescript
promotions: {
  id: uuid (Primary Key)
  promoCode: varchar (Unique promo code)
  discountType: varchar (Discount type)
  discountValue: decimal (Discount value)
  startDate: timestamp (Promotion start)
  endDate: timestamp (Promotion end)
  usageLimit: integer (nullable, Max uses)
  usageCount: integer (Current usage count)
  isActive: boolean (Promotion status)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Promotional campaigns and discount codes.

**Discount Types**:
- `percentage`: Percentage off (e.g., 20%)
- `fixed`: Fixed amount off (e.g., 50 SAR)

### 9. SocialLinks Table

```typescript
socialLinks: {
  id: uuid (Primary Key)
  platform: varchar (Social platform name)
  url: varchar (Social profile URL)
  isVisible: boolean (Display status)
  createdAt: timestamp (default: now())
}
```

**Purpose**: Manage social media links in footer/contact sections.

## Database Relations

### 1. User Relations
```typescript
// One user can have many bookings
users → bookings (1:many)

// One user can have many sessions
users → sessions (1:many)
```

### 2. Trip Relations
```typescript
// One route can have many trips
routes → trips (1:many)

// One bus can have many trips
buses → trips (1:many)

// One trip can have many bookings
trips → bookings (1:many)

// One trip can have many booked seats
trips → bookedSeats (1:many)
```

### 3. Booking Relations
```typescript
// One booking can have many booked seats
bookings → bookedSeats (1:many)

// Many bookings can use one promotion
promotions → bookings (1:many)
```

## Indexes and Performance

### Primary Indexes
- All tables have UUID primary keys
- Unique constraints on email, bookingReference, promoCode

### Performance Indexes
```sql
-- Session cleanup index
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Trip search indexes
CREATE INDEX idx_trips_route_date ON trips(route_id, departure_time);
CREATE INDEX idx_trips_status ON trips(status);

-- Booking lookup indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);

-- Seat availability index
CREATE INDEX idx_booked_seats_trip ON booked_seats(trip_id);
```

## Data Integrity Constraints

### Foreign Key Constraints
```sql
-- Ensure data integrity across relations
bookings.user_id → users.id
bookings.trip_id → trips.id
trips.route_id → routes.id
trips.bus_id → buses.id
booked_seats.booking_id → bookings.id
booked_seats.trip_id → trips.id
```

### Check Constraints
```sql
-- Business rule constraints
CHECK (capacity > 0)                    -- Buses must have seats
CHECK (passenger_count > 0)             -- Bookings must have passengers
CHECK (final_amount >= 0)               -- No negative amounts
CHECK (departure_time < arrival_time)   -- Logical time order
```

## Sample Data Queries

### 1. Search Available Trips
```sql
SELECT 
  t.id,
  t.departure_time,
  t.arrival_time,
  t.price,
  r.origin_city,
  r.destination_city,
  b.bus_number,
  b.capacity,
  (b.capacity - COALESCE(bs.booked_count, 0)) as available_seats
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN buses b ON t.bus_id = b.id
LEFT JOIN (
  SELECT trip_id, COUNT(*) as booked_count
  FROM booked_seats
  GROUP BY trip_id
) bs ON t.id = bs.trip_id
WHERE r.origin_city = 'riyadh'
  AND r.destination_city = 'jeddah'
  AND DATE(t.departure_time) = '2025-08-23'
  AND t.status = 'scheduled'
ORDER BY t.departure_time;
```

### 2. User Booking History
```sql
SELECT 
  b.booking_reference,
  b.final_amount,
  b.status,
  b.created_at,
  r.origin_city,
  r.destination_city,
  t.departure_time,
  COUNT(bs.id) as seat_count
FROM bookings b
JOIN trips t ON b.trip_id = t.id
JOIN routes r ON t.route_id = r.id
LEFT JOIN booked_seats bs ON b.id = bs.booking_id
WHERE b.user_id = $1
GROUP BY b.id, r.id, t.id
ORDER BY b.created_at DESC;
```

### 3. Trip Seat Availability
```sql
SELECT 
  b.capacity,
  COALESCE(bs.booked_count, 0) as booked_seats,
  (b.capacity - COALESCE(bs.booked_count, 0)) as available_seats,
  array_agg(bs.seat_number) as booked_seat_numbers
FROM trips t
JOIN buses b ON t.bus_id = b.id
LEFT JOIN (
  SELECT 
    trip_id, 
    COUNT(*) as booked_count,
    array_agg(seat_number) as seat_number
  FROM booked_seats
  WHERE trip_id = $1
  GROUP BY trip_id
) bs ON t.id = bs.trip_id
WHERE t.id = $1
GROUP BY b.capacity, bs.booked_count;
```

## Migration Strategy

### Development Workflow
```bash
# Push schema changes
npm run db:push

# Generate migrations (if needed)
drizzle-kit generate

# View database in browser
npm run db:studio
```

### Production Considerations
- **Backup before migrations**: Automatic Replit backups
- **Zero-downtime**: Backward-compatible changes only
- **Rollback plan**: Previous schema version ready
- **Data validation**: Post-migration integrity checks

## Security Considerations

### Data Protection
- **Sensitive Data**: Payment info handled by Stripe
- **User Privacy**: Minimal personal data storage
- **Access Control**: Row-level security planned
- **Audit Trail**: Booking status change logging

### Performance Optimization
- **Connection Pooling**: Neon serverless handles automatically
- **Query Optimization**: Efficient joins and indexes
- **Caching Strategy**: TanStack Query for frontend caching
- **Monitoring**: Slow query identification and optimization