# Admin Guide

## Overview

The Haramain Admin Dashboard provides comprehensive tools for managing the bus booking platform, including bookings, routes, buses, promotions, and analytics.

## Admin Access

### 1. Admin Authentication

#### Access Requirements
- **Admin Account**: Special privileges required
- **Authentication**: Standard OAuth login
- **Role Verification**: Backend role checking
- **Secure Access**: Admin routes are protected

#### Accessing Admin Panel
1. **Login**: Sign in with admin credentials
2. **Navigate**: Go to `/admin` route
3. **Dashboard**: Access admin features
4. **Verification**: System verifies admin status

### 2. Admin Permissions

#### Access Levels
- **Super Admin**: Full system access
- **Operations Admin**: Booking and trip management
- **Content Admin**: Routes and bus management
- **Analytics Admin**: Reports and statistics only

#### Security Features
- **Session Management**: Secure admin sessions
- **Activity Logging**: All admin actions tracked
- **IP Restrictions**: Optional IP whitelisting
- **Two-Factor Auth**: Enhanced security (planned)

## Dashboard Overview

### 1. Main Dashboard

#### Key Metrics Display
- **Total Bookings**: All-time booking count
- **Revenue Today**: Daily revenue tracking
- **Active Routes**: Currently operational routes
- **Fleet Size**: Total number of buses

#### Real-time Updates
- **Live Data**: Metrics update automatically
- **Status Indicators**: System health monitoring
- **Alert System**: Critical issue notifications
- **Performance Charts**: Visual data representation

### 2. Navigation Structure

#### Main Sections
```
Admin Dashboard/
├── Overview (Main metrics)
├── Bookings (Booking management)
├── Trips (Trip scheduling)
├── Routes (Route management)
├── Buses (Fleet management)
├── Promotions (Discount codes)
├── Users (User management)
├── Analytics (Reports)
└── Settings (System configuration)
```

## Booking Management

### 1. Booking Overview

#### Booking List Features
- **Search & Filter**: Find specific bookings
- **Status Tracking**: Monitor booking statuses
- **Bulk Actions**: Handle multiple bookings
- **Export Data**: Download booking reports

#### Booking Information Display
```
Booking Details:
├── Booking Reference (HR123456)
├── Passenger Information
├── Trip Details (Route, Date, Time)
├── Payment Status
├── Seat Assignments
└── Special Requirements
```

### 2. Booking Operations

#### Status Management
- **Confirmed**: Successfully paid bookings
- **Pending**: Awaiting payment
- **Cancelled**: User or system cancellation
- **Refunded**: Processed refunds
- **No-show**: Passenger didn't board

#### Booking Actions
```typescript
// Available booking operations
const bookingActions = {
  view: 'View full booking details',
  modify: 'Change booking details',
  cancel: 'Cancel booking and process refund',
  refund: 'Process manual refund',
  notify: 'Send notification to passenger',
  print: 'Generate boarding pass'
};
```

### 3. Refund Management

#### Refund Policies
- **Full Refund**: 24+ hours before departure
- **Partial Refund**: 12-24 hours before departure
- **No Refund**: Less than 12 hours or no-show
- **Emergency Refund**: Case-by-case basis

#### Processing Refunds
1. **Select Booking**: Find the booking to refund
2. **Choose Refund Type**: Full, partial, or custom amount
3. **Add Reason**: Document refund justification
4. **Process Payment**: Initiate refund through Stripe
5. **Notify Customer**: Send refund confirmation email

## Trip and Schedule Management

### 1. Trip Creation

#### Adding New Trips
```typescript
// Trip creation form
interface TripCreation {
  routeId: string;           // Select from existing routes
  busId: string;             // Assign available bus
  departureTime: DateTime;   // Schedule departure
  arrivalTime: DateTime;     // Expected arrival
  price: number;            // Ticket price in SAR
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}
```

#### Trip Scheduling Best Practices
- **Peak Hours**: Schedule more trips during busy times
- **Route Popularity**: Frequent service on popular routes
- **Bus Maintenance**: Account for maintenance schedules
- **Seasonal Demand**: Adjust for Hajj, Ramadan, holidays

### 2. Trip Monitoring

#### Real-time Trip Status
- **Scheduled**: Trip planned and bookable
- **Boarding**: Currently accepting passengers
- **Departed**: Trip in progress
- **Arrived**: Trip completed successfully
- **Delayed**: Behind schedule
- **Cancelled**: Trip cancelled

#### Trip Management Actions
```typescript
const tripActions = {
  edit: 'Modify trip details',
  cancel: 'Cancel trip and notify passengers',
  delay: 'Update departure time',
  changePrice: 'Adjust ticket pricing',
  assignBus: 'Change assigned bus',
  viewBookings: 'See all passengers'
};
```

### 3. Schedule Optimization

#### Automated Scheduling Tools
- **Demand Analysis**: Historical booking patterns
- **Revenue Optimization**: Price and schedule optimization
- **Resource Allocation**: Efficient bus utilization
- **Maintenance Planning**: Scheduled downtime integration

#### Performance Metrics
- **Occupancy Rate**: Average seats filled per trip
- **On-time Performance**: Punctuality tracking
- **Customer Satisfaction**: Rating and feedback analysis
- **Revenue per Trip**: Financial performance monitoring

## Route Management

### 1. Route Configuration

#### Creating New Routes
```typescript
interface RouteCreation {
  originCity: string;              // Starting city
  destinationCity: string;         // Destination city
  estimatedDurationMinutes: number; // Journey time
  intermediateStops: string[];     // Optional stops
  isActive: boolean;              // Route availability
  operatingDays: string[];        // Days of operation
}
```

#### Route Parameters
- **Distance**: Total kilometers
- **Duration**: Expected travel time
- **Stops**: Intermediate pickup points
- **Pricing**: Base fare structure
- **Seasonal Adjustments**: Holiday pricing

### 2. Route Analytics

#### Performance Tracking
```sql
-- Route performance query
SELECT 
  r.origin_city,
  r.destination_city,
  COUNT(b.id) as total_bookings,
  AVG(b.final_amount) as avg_revenue,
  AVG(t.price) as avg_price
FROM routes r
JOIN trips t ON r.id = t.route_id
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE b.status = 'confirmed'
GROUP BY r.id
ORDER BY total_bookings DESC;
```

#### Key Metrics
- **Booking Volume**: Total bookings per route
- **Revenue**: Total and average revenue
- **Occupancy**: Percentage of seats filled
- **Seasonality**: Booking patterns by month
- **Profitability**: Revenue minus operational costs

### 3. Route Optimization

#### Data-Driven Decisions
- **Demand Forecasting**: Predict future booking needs
- **Price Optimization**: Dynamic pricing strategies
- **Schedule Adjustments**: Optimal departure times
- **Capacity Planning**: Right-sizing bus assignments

## Fleet Management

### 1. Bus Registration

#### Adding New Buses
```typescript
interface BusRegistration {
  busNumber: string;      // Unique identifier (HR-001)
  capacity: number;       // Total passenger seats
  model: string;         // Bus model/manufacturer
  amenities: string[];   // Available features
  yearManufactured: number;
  licenseExpiry: Date;
  insuranceExpiry: Date;
  lastMaintenance: Date;
}
```

#### Bus Categories
- **Economy**: 50-55 seats, basic amenities
- **Standard**: 45-50 seats, WiFi, AC
- **Luxury**: 40-45 seats, premium amenities
- **VIP**: 35-40 seats, maximum comfort

### 2. Maintenance Management

#### Maintenance Scheduling
- **Preventive**: Regular scheduled maintenance
- **Corrective**: Repair after issues arise
- **Emergency**: Immediate safety-related repairs
- **Seasonal**: Weather-related preparations

#### Maintenance Tracking
```typescript
interface MaintenanceRecord {
  busId: string;
  maintenanceType: 'preventive' | 'corrective' | 'emergency';
  startDate: Date;
  endDate: Date;
  cost: number;
  description: string;
  nextDueDate: Date;
}
```

### 3. Fleet Analytics

#### Performance Metrics
- **Utilization Rate**: Hours in service vs. available
- **Maintenance Costs**: Monthly maintenance expenses
- **Fuel Efficiency**: Kilometers per liter
- **Breakdown Frequency**: Reliability tracking
- **Customer Ratings**: Passenger satisfaction per bus

#### Fleet Optimization
- **Route Assignment**: Best bus for specific routes
- **Capacity Matching**: Right bus size for demand
- **Maintenance Scheduling**: Minimize service disruption
- **Replacement Planning**: Fleet renewal strategy

## User Management

### 1. User Overview

#### User Database
```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  registrationDate: Date;
  lastLogin: Date;
  bookingCount: number;
  totalSpent: number;
  status: 'active' | 'suspended' | 'banned';
}
```

#### User Segmentation
- **New Users**: Registered in last 30 days
- **Regular Users**: 2+ bookings per month
- **VIP Users**: High-value customers
- **Inactive Users**: No recent activity

### 2. User Support

#### Support Tools
- **User Search**: Find users by email/booking reference
- **Booking History**: Complete user journey view
- **Communication Log**: All support interactions
- **Account Actions**: Suspend, reactivate, or modify accounts

#### Common Support Tasks
```typescript
const supportActions = {
  passwordReset: 'Help with login issues',
  bookingModification: 'Change booking details',
  refundProcessing: 'Handle refund requests',
  accountRecovery: 'Restore suspended accounts',
  dataExport: 'Provide user data export'
};
```

### 3. User Analytics

#### Behavioral Analysis
- **Booking Patterns**: When and how users book
- **Route Preferences**: Most popular destinations
- **Payment Methods**: Preferred payment options
- **Device Usage**: Mobile vs. desktop booking
- **Geographic Distribution**: User location analysis

## Promotion Management

### 1. Creating Promotions

#### Promotion Types
```typescript
interface PromotionCreation {
  promoCode: string;           // Unique code (SAVE20)
  discountType: 'percentage' | 'fixed';
  discountValue: number;       // 20 for 20% or fixed amount
  startDate: Date;            // When promotion begins
  endDate: Date;              // When promotion expires
  usageLimit: number;         // Maximum uses
  routeRestrictions: string[]; // Specific routes only
  userRestrictions: string[];  // Specific user groups
}
```

#### Promotion Categories
- **Welcome Offers**: First-time user discounts
- **Seasonal Promotions**: Holiday and special event offers
- **Loyalty Rewards**: Returning customer benefits
- **Flash Sales**: Limited-time high-discount offers
- **Group Discounts**: Multi-passenger savings

### 2. Promotion Analytics

#### Performance Tracking
```sql
-- Promotion effectiveness query
SELECT 
  p.promo_code,
  p.discount_value,
  COUNT(b.id) as times_used,
  SUM(b.discount_amount) as total_discount_given,
  AVG(b.final_amount) as avg_booking_value
FROM promotions p
LEFT JOIN bookings b ON p.promo_code = b.promo_code
WHERE p.is_active = true
GROUP BY p.id
ORDER BY total_discount_given DESC;
```

#### Key Metrics
- **Usage Rate**: How often codes are used
- **Conversion Impact**: Booking increase from promotions
- **Revenue Impact**: Net revenue after discounts
- **Customer Acquisition**: New users attracted
- **Customer Retention**: Repeat usage of promotions

### 3. Promotion Optimization

#### A/B Testing
- **Discount Amounts**: Test different percentage levels
- **Duration**: Short vs. long-term promotions
- **Targeting**: Different user segments
- **Communication**: Email vs. social media promotion

## Analytics and Reporting

### 1. Business Intelligence Dashboard

#### Key Performance Indicators (KPIs)
```typescript
interface BusinessMetrics {
  // Financial Metrics
  dailyRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  revenueGrowth: number;
  
  // Operational Metrics
  totalBookings: number;
  occupancyRate: number;
  onTimePerformance: number;
  customerSatisfaction: number;
  
  // Marketing Metrics
  newCustomers: number;
  customerRetention: number;
  promotionEffectiveness: number;
  conversionRate: number;
}
```

#### Real-time Dashboards
- **Sales Performance**: Live revenue tracking
- **Operational Status**: Fleet and route performance
- **Customer Metrics**: User engagement and satisfaction
- **System Health**: Technical performance monitoring

### 2. Custom Reports

#### Report Types
- **Financial Reports**: Revenue, costs, profitability
- **Operational Reports**: On-time performance, capacity utilization
- **Customer Reports**: User behavior, satisfaction, retention
- **Marketing Reports**: Campaign effectiveness, ROI analysis

#### Report Generation
```typescript
interface ReportConfiguration {
  reportType: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    routes?: string[];
    buses?: string[];
    userSegments?: string[];
  };
  format: 'pdf' | 'excel' | 'csv';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
}
```

### 3. Data Export

#### Export Options
- **Booking Data**: Complete booking information
- **Financial Data**: Revenue and payment details
- **User Data**: Customer information (privacy compliant)
- **Operational Data**: Trip and performance metrics

#### Data Privacy Compliance
- **GDPR Compliance**: European data protection
- **User Consent**: Explicit permission for data use
- **Data Minimization**: Only necessary data exported
- **Anonymization**: Personal identifiers removed when possible

## System Administration

### 1. Configuration Management

#### System Settings
```typescript
interface SystemConfiguration {
  // Booking Settings
  advanceBookingDays: number;    // How far ahead bookings allowed
  cancellationHours: number;     // Minimum hours for cancellation
  maxPassengersPerBooking: number;
  
  // Payment Settings
  paymentTimeoutMinutes: number; // Payment completion timeout
  refundProcessingDays: number;  // Refund processing time
  
  // Operational Settings
  boardingTimeMinutes: number;   // Check-in time before departure
  seatHoldTimeMinutes: number;   // How long seats are held
}
```

#### Feature Toggles
- **Maintenance Mode**: Disable bookings during updates
- **New Feature Rollout**: Gradual feature activation
- **Payment Methods**: Enable/disable payment options
- **Route Availability**: Temporarily disable routes

### 2. Security Management

#### Access Control
- **Admin Roles**: Different permission levels
- **IP Whitelisting**: Restrict admin access by location
- **Session Management**: Secure session handling
- **Activity Logging**: Comprehensive audit trail

#### Security Monitoring
```typescript
interface SecurityEvent {
  timestamp: Date;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: Record<string, any>;
}
```

### 3. System Monitoring

#### Health Checks
- **Database Performance**: Query response times
- **Payment Processing**: Stripe API status
- **Application Performance**: Response times and errors
- **User Experience**: Page load times and conversion rates

#### Alert Configuration
```typescript
interface AlertRule {
  metric: string;               // What to monitor
  threshold: number;            // Alert trigger point
  comparison: '>' | '<' | '=';  // Comparison operator
  duration: number;             // How long condition must persist
  severity: 'low' | 'medium' | 'high' | 'critical';
  notifications: string[];      // Who to notify
}
```

## Troubleshooting Guide

### 1. Common Issues

#### Booking Problems
- **Payment Failures**: Check Stripe dashboard for details
- **Seat Conflicts**: Verify seat allocation integrity
- **Email Delivery**: Monitor email service status
- **QR Code Issues**: Regenerate tickets if needed

#### System Performance
- **Slow Queries**: Monitor database performance
- **High CPU Usage**: Check for inefficient processes
- **Memory Leaks**: Monitor application memory usage
- **API Timeouts**: Verify external service connectivity

### 2. Emergency Procedures

#### Service Outage Response
1. **Assess Impact**: Determine scope of outage
2. **Notify Users**: Update status page and social media
3. **Implement Fix**: Apply emergency patches
4. **Monitor Recovery**: Verify service restoration
5. **Post-Incident Review**: Document lessons learned

#### Data Recovery
- **Database Backup**: Restore from latest backup
- **Transaction Log**: Replay missed transactions
- **Data Verification**: Validate data integrity
- **User Notification**: Inform affected users

### 3. Escalation Procedures

#### Support Escalation
- **Level 1**: Basic user support issues
- **Level 2**: Technical configuration problems
- **Level 3**: System architecture issues
- **Emergency**: Critical system failures

#### Contact Information
- **Technical Lead**: technical@haramain.sa
- **Operations Manager**: operations@haramain.sa
- **Emergency Hotline**: +966 XX XXX XXXX
- **System Administrator**: admin@haramain.sa