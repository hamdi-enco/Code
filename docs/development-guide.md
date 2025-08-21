# Development Guide

## Development Workflow

This guide covers the development processes, coding standards, and best practices for contributing to the Haramain bus booking platform.

## Getting Started

### 1. Development Environment Setup

#### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Latest version
- **VS Code**: Recommended IDE
- **PostgreSQL**: Database server

#### Repository Setup
```bash
# Clone the repository
git clone https://github.com/haramain/bus-booking.git
cd haramain-bus-booking

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### 2. Project Architecture Understanding

#### Technology Stack Overview
```
Frontend (client/)
├── React 18 with TypeScript
├── Vite for build and development
├── Tailwind CSS for styling
├── shadcn/ui for components
├── TanStack Query for state management
├── Wouter for routing
└── i18next for internationalization

Backend (server/)
├── Node.js with Express
├── TypeScript for type safety
├── Drizzle ORM for database operations
├── Replit Auth for authentication
├── Stripe for payment processing
└── WebSocket for real-time features

Database
├── PostgreSQL for data storage
├── Drizzle migrations
└── Type-safe queries
```

## Coding Standards

### 1. TypeScript Guidelines

#### Type Definitions
```typescript
// Use explicit types for function parameters and returns
function calculateTripDuration(
  departureTime: Date,
  arrivalTime: Date
): number {
  return arrivalTime.getTime() - departureTime.getTime();
}

// Use interfaces for object shapes
interface TripSearchParams {
  originCity: string;
  destinationCity: string;
  departureDate: Date;
  passengerCount: number;
}

// Use type unions for specific values
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';

// Use generics for reusable components
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

#### Type Safety Best Practices
```typescript
// Prefer type assertions over any
const user = response.data as User;

// Use optional chaining
const userName = user?.firstName ?? 'Guest';

// Use type guards for runtime type checking
function isValidEmail(email: string): email is string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Use const assertions for literal types
const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
type BookingStatus = typeof BOOKING_STATUSES[number];
```

### 2. React Component Guidelines

#### Component Structure
```typescript
// Component file structure
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { Trip } from '@shared/schema';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
  isSelected?: boolean;
}

export function TripCard({ trip, onSelect, isSelected = false }: TripCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`trip-card ${isSelected ? 'selected' : ''}`}>
      {/* Component JSX */}
    </div>
  );
}
```

#### Component Best Practices
```typescript
// Use functional components with hooks
function SearchForm() {
  const [searchParams, setSearchParams] = useState<SearchParams>(initialState);
  
  // Custom hooks for complex logic
  const { trips, isLoading, error } = useTripsSearch(searchParams);
  
  // Event handlers with proper typing
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form JSX */}
    </form>
  );
}

// Use memo for performance optimization when needed
export const TripCard = memo(function TripCard({ trip, onSelect }: TripCardProps) {
  // Component implementation
});
```

### 3. CSS and Styling Guidelines

#### Tailwind CSS Usage
```typescript
// Use Tailwind classes consistently
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Trip Details</h2>
  <span className="text-sm text-gray-500">2 hours ago</span>
</div>

// Use CSS variables for custom properties
// In index.css
:root {
  --haramain-green: 15 81 50;
  --haramain-gold: 218 165 32;
}

// In components
<button className="bg-haramain-green text-white hover:bg-green-700">
  Book Now
</button>
```

#### Component-Specific Styles
```typescript
// Use CSS modules for component-specific styles when needed
import styles from './TripCard.module.css';

function TripCard() {
  return (
    <div className={`${styles.tripCard} bg-white rounded-lg`}>
      {/* Component content */}
    </div>
  );
}
```

### 4. Backend Development Guidelines

#### API Endpoint Structure
```typescript
// Route definition with proper typing
app.get('/api/trips/search', async (req: Request, res: Response) => {
  try {
    // Input validation with Zod
    const searchParams = searchTripsSchema.parse(req.query);
    
    // Business logic
    const trips = await storage.searchTrips(searchParams);
    
    // Response formatting
    res.json(trips);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid search parameters',
        errors: error.errors
      });
    }
    
    res.status(500).json({
      message: 'Failed to search trips'
    });
  }
});
```

#### Database Operations
```typescript
// Use Drizzle ORM for type-safe queries
async function getTripsWithAvailability(routeId: string): Promise<TripWithAvailability[]> {
  const tripsWithDetails = await db
    .select({
      trip: trips,
      route: routes,
      bus: buses,
    })
    .from(trips)
    .innerJoin(routes, eq(trips.routeId, routes.id))
    .innerJoin(buses, eq(trips.busId, buses.id))
    .where(eq(trips.routeId, routeId));

  // Calculate availability for each trip
  return Promise.all(
    tripsWithDetails.map(async ({ trip, route, bus }) => {
      const [bookedSeatsCount] = await db
        .select({ count: count() })
        .from(bookedSeats)
        .where(eq(bookedSeats.tripId, trip.id));

      return {
        ...trip,
        route,
        bus,
        availableSeats: bus.capacity - (bookedSeatsCount?.count || 0)
      };
    })
  );
}
```

## Development Processes

### 1. Git Workflow

#### Branch Naming Convention
```bash
# Feature branches
feature/payment-integration
feature/seat-selection-ui
feature/admin-dashboard

# Bug fixes
bugfix/booking-confirmation-email
bugfix/payment-retry-logic

# Hotfixes
hotfix/critical-payment-issue

# Releases
release/v1.2.0
```

#### Commit Message Format
```bash
# Format: type(scope): description

# Examples
feat(payment): add stripe payment integration
fix(booking): resolve seat selection race condition
docs(api): update endpoint documentation
style(ui): improve mobile responsive design
refactor(database): optimize trip search queries
test(booking): add unit tests for booking flow
chore(deps): update dependencies to latest versions
```

#### Pull Request Process
```markdown
# Pull Request Template

## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] TypeScript errors resolved
```

### 2. Testing Strategy

#### Unit Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchForm } from '@/components/SearchForm';

describe('SearchForm', () => {
  it('should submit search with valid parameters', async () => {
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} />);
    
    // Fill form fields
    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: 'riyadh' }
    });
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: 'jeddah' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    // Assert function was called
    expect(onSearch).toHaveBeenCalledWith({
      from: 'riyadh',
      to: 'jeddah',
      // ... other parameters
    });
  });
});
```

#### API Testing
```typescript
// API endpoint testing
import request from 'supertest';
import { app } from '../server/index';

describe('GET /api/trips/search', () => {
  it('should return trips for valid search parameters', async () => {
    const response = await request(app)
      .get('/api/trips/search')
      .query({
        originCity: 'riyadh',
        destinationCity: 'jeddah',
        date: '2025-08-23'
      })
      .expect(200);
    
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('price');
  });
  
  it('should return 400 for missing parameters', async () => {
    await request(app)
      .get('/api/trips/search')
      .query({
        originCity: 'riyadh'
        // Missing destinationCity and date
      })
      .expect(400);
  });
});
```

#### Database Testing
```typescript
// Database testing with test database
describe('Storage Operations', () => {
  beforeEach(async () => {
    // Set up test database
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    // Clean up test data
    await cleanupTestDatabase();
  });
  
  it('should create booking with seats', async () => {
    const booking = await storage.createBooking(bookingData, selectedSeats);
    
    expect(booking).toHaveProperty('id');
    expect(booking.status).toBe('pending');
    
    // Verify seats were created
    const seats = await storage.getBookedSeats(booking.id);
    expect(seats).toHaveLength(selectedSeats.length);
  });
});
```

### 3. Code Review Guidelines

#### Review Checklist
```markdown
## Code Review Checklist

### Functionality
- [ ] Code meets requirements
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Performance considerations addressed

### Code Quality
- [ ] Code is readable and well-documented
- [ ] Functions are focused and not too long
- [ ] Variable names are descriptive
- [ ] No code duplication

### TypeScript
- [ ] Types are properly defined
- [ ] No `any` types without justification
- [ ] Interfaces used for object shapes
- [ ] Type safety maintained

### Testing
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] Edge cases tested
- [ ] No broken tests

### Security
- [ ] Input validation implemented
- [ ] No sensitive data exposed
- [ ] Authentication/authorization checked
- [ ] SQL injection prevention
```

#### Review Comments Examples
```typescript
// Good review comment
// Consider extracting this logic into a custom hook for reusability
const { trips, isLoading } = useTripsSearch(searchParams);

// Suggestion for improvement
// This could be simplified using optional chaining
const cityName = user && user.address && user.address.city;
// Better:
const cityName = user?.address?.city;

// Security concern
// This direct database query is vulnerable to SQL injection
const query = `SELECT * FROM users WHERE id = ${userId}`;
// Better: Use parameterized queries with Drizzle ORM
```

## Performance Optimization

### 1. Frontend Performance

#### React Optimization
```typescript
// Use memo for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use callback to prevent unnecessary re-renders
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Lazy load components
const AdminDashboard = lazy(() => import('@/pages/admin'));

// Code splitting by route
<Route
  path="/admin"
  component={() => (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  )}
/>
```

#### Bundle Optimization
```typescript
// Vite config for optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          utils: ['date-fns', 'clsx']
        }
      }
    }
  }
});
```

### 2. Backend Performance

#### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_trips_route_date 
ON trips(route_id, departure_time);

CREATE INDEX CONCURRENTLY idx_bookings_user_status 
ON bookings(user_id, status);

CREATE INDEX CONCURRENTLY idx_booked_seats_trip 
ON booked_seats(trip_id);
```

#### Query Optimization
```typescript
// Use batch queries instead of N+1 queries
async function getTripsWithBookingCounts(routeId: string) {
  // Bad: N+1 query problem
  const trips = await db.select().from(trips).where(eq(trips.routeId, routeId));
  for (const trip of trips) {
    trip.bookingCount = await getBookingCount(trip.id);
  }
  
  // Good: Single query with join
  return db
    .select({
      trip: trips,
      bookingCount: count(bookedSeats.id)
    })
    .from(trips)
    .leftJoin(bookedSeats, eq(trips.id, bookedSeats.tripId))
    .where(eq(trips.routeId, routeId))
    .groupBy(trips.id);
}
```

## Debugging and Troubleshooting

### 1. Frontend Debugging

#### React DevTools
```typescript
// Add display names for better debugging
const TripCard = memo(function TripCard({ trip }: TripCardProps) {
  // Component implementation
});

// Use React DevTools Profiler
function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Router />
    </Profiler>
  );
}
```

#### Console Debugging
```typescript
// Use structured logging
console.group('Trip Search');
console.log('Search params:', searchParams);
console.log('Results:', trips);
console.groupEnd();

// Use console.table for arrays
console.table(trips.map(trip => ({
  id: trip.id,
  route: `${trip.route.originCity} → ${trip.route.destinationCity}`,
  price: trip.price
})));
```

### 2. Backend Debugging

#### Logging Strategy
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Use in route handlers
app.post('/api/bookings', async (req, res) => {
  logger.info('Booking creation started', {
    userId: req.user?.id,
    tripId: req.body.tripId
  });
  
  try {
    const booking = await storage.createBooking(bookingData);
    logger.info('Booking created successfully', { bookingId: booking.id });
    res.json(booking);
  } catch (error) {
    logger.error('Booking creation failed', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Booking creation failed' });
  }
});
```

#### Database Debugging
```typescript
// Enable query logging in development
const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Add query timing
async function timedQuery<T>(queryFn: () => Promise<T>, queryName: string): Promise<T> {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    logger.info(`Query completed: ${queryName}`, { duration });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Query failed: ${queryName}`, { duration, error });
    throw error;
  }
}
```

## Deployment and CI/CD

### 1. Build Process

#### Production Build
```bash
# Build optimization
npm run build

# Build analysis
npm run build:analyze

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
```

#### Environment Configuration
```typescript
// Environment validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  SESSION_SECRET: z.string().min(32)
});

const env = envSchema.parse(process.env);
```

### 2. Monitoring and Alerts

#### Error Monitoring
```typescript
// Error boundary for React
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

#### Performance Monitoring
```typescript
// API response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
});
```

## Contributing Guidelines

### 1. Getting Involved

#### Types of Contributions
- **Bug Reports**: Submit detailed issue reports
- **Feature Requests**: Propose new functionality
- **Code Contributions**: Submit pull requests
- **Documentation**: Improve guides and documentation
- **Testing**: Add or improve test coverage

#### Contribution Process
1. **Fork Repository**: Create personal fork
2. **Create Branch**: Use descriptive branch names
3. **Make Changes**: Follow coding standards
4. **Test Changes**: Ensure all tests pass
5. **Submit PR**: Create detailed pull request
6. **Code Review**: Address review feedback
7. **Merge**: Maintainer merges approved PR

### 2. Issue Guidelines

#### Bug Report Template
```markdown
## Bug Description
Clear description of what the bug is

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Version: [e.g., 1.2.0]

## Additional Context
Any other context about the problem
```

#### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other context or screenshots
```