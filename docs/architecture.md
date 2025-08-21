# System Architecture

## Architecture Overview

Haramain follows a modern, scalable architecture designed for high availability, security, and performance. The platform uses a full-stack TypeScript approach with clear separation of concerns.

## Technology Stack

### Frontend Layer
```
React 18 + TypeScript
├── Routing: Wouter (lightweight client-side routing)
├── Styling: Tailwind CSS + shadcn/ui components
├── State Management: TanStack Query (React Query)
├── Internationalization: i18next with RTL/LTR support
├── Build Tool: Vite (fast development and optimized builds)
└── UI Components: Radix UI primitives
```

### Backend Layer
```
Node.js + Express + TypeScript
├── Authentication: Replit Auth (OAuth 2.0)
├── Database: PostgreSQL with Drizzle ORM
├── Session Management: Express sessions with PostgreSQL store
├── Payment Processing: Stripe API integration
├── Real-time: WebSocket support (ws library)
└── API Design: RESTful endpoints with consistent error handling
```

### Database Layer
```
PostgreSQL (Neon Serverless)
├── ORM: Drizzle ORM with type-safe queries
├── Migrations: Drizzle Kit for schema management
├── Connection: @neondatabase/serverless with connection pooling
└── Schema: Comprehensive relational design
```

### Infrastructure Layer
```
Replit Platform
├── Hosting: Replit Deployments
├── Environment: NixOS with automatic dependency management
├── Database: Built-in PostgreSQL with backup/restore
├── Secrets: Secure environment variable management
└── Monitoring: Built-in logging and error tracking
```

## Architectural Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│     (React Components + Pages)      │
├─────────────────────────────────────┤
│           Service Layer             │
│      (API Endpoints + Business      │
│            Logic)                   │
├─────────────────────────────────────┤
│           Data Access Layer         │
│      (Drizzle ORM + Storage)        │
├─────────────────────────────────────┤
│            Database Layer           │
│         (PostgreSQL)                │
└─────────────────────────────────────┘
```

### 2. Component-Based Frontend

```
App.tsx
├── Navigation Component
├── Router Switch
│   ├── Home Page
│   │   ├── HeroSection Component
│   │   ├── SearchResults Component
│   │   └── Features Component
│   ├── Payment Page
│   ├── Booking Confirmation Page
│   └── Dashboard Pages
└── Footer Component
```

### 3. RESTful API Design

```
/api/
├── auth/          # Authentication endpoints
├── trips/         # Trip search and management
├── bookings/      # Booking operations
├── payments/      # Payment processing
├── admin/         # Administrative functions
└── social-links/  # Social media links
```

## Data Flow Architecture

### 1. Booking Flow
```
User Search → Trip Results → Seat Selection → Payment → Confirmation
     ↓             ↓             ↓           ↓           ↓
Frontend API → Backend API → Database → Stripe → Digital Ticket
```

### 2. Authentication Flow
```
User Login → Replit Auth → OAuth Provider → Token Exchange → Session Creation
     ↓            ↓              ↓              ↓              ↓
  Frontend → Backend → OAuth Server → Backend → PostgreSQL Session
```

### 3. Real-time Updates
```
Seat Selection → WebSocket Event → Live Updates → UI Refresh
      ↓              ↓               ↓            ↓
   Frontend → WebSocket Server → All Clients → Real-time UI
```

## Security Architecture

### 1. Authentication & Authorization
- **OAuth 2.0**: Secure authentication via Replit Auth
- **Session Management**: PostgreSQL-backed sessions with expiration
- **Route Protection**: Middleware-based access control
- **Token Refresh**: Automatic token renewal for extended sessions

### 2. Data Protection
- **HTTPS**: All communication encrypted with TLS
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Protection**: Content Security Policy and input sanitization

### 3. Payment Security
- **PCI DSS Compliance**: Stripe handles sensitive card data
- **Tokenization**: Card details never stored on our servers
- **3D Secure**: Additional authentication for card transactions
- **Webhook Verification**: Signed webhooks from Stripe

## Scalability Considerations

### 1. Database Optimization
- **Connection Pooling**: Efficient database connection management
- **Indexing Strategy**: Optimized indexes for common queries
- **Query Optimization**: Efficient joins and data retrieval
- **Caching Layer**: Redis integration planned for high-traffic scenarios

### 2. Frontend Performance
- **Code Splitting**: Lazy loading of route components
- **Asset Optimization**: Vite's built-in optimization
- **Image Optimization**: WebP format and lazy loading
- **CDN Integration**: Static asset delivery optimization

### 3. Backend Scalability
- **Stateless Design**: Sessions stored in database, not memory
- **Horizontal Scaling**: Load balancer ready architecture
- **Microservices Ready**: Modular design for service separation
- **API Rate Limiting**: Request throttling for abuse prevention

## Integration Architecture

### 1. Payment Integration
```
Frontend Payment Form
        ↓
Stripe Elements (Secure)
        ↓
Stripe API (Payment Processing)
        ↓
Webhook (Payment Confirmation)
        ↓
Backend (Booking Confirmation)
        ↓
Database (Status Update)
```

### 2. Internationalization Architecture
```
i18next Configuration
        ↓
Language Detection (Browser/Storage)
        ↓
Resource Loading (JSON Files)
        ↓
Component Translation (useTranslation)
        ↓
RTL/LTR Layout Switch
```

### 3. Real-time Architecture
```
WebSocket Server (ws)
        ↓
Connection Management
        ↓
Event Broadcasting
        ↓
Client State Sync
        ↓
UI Updates (React)
```

## Monitoring and Observability

### 1. Application Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time and throughput monitoring
- **User Analytics**: Usage patterns and conversion tracking
- **Health Checks**: Endpoint availability monitoring

### 2. Database Monitoring
- **Query Performance**: Slow query identification
- **Connection Health**: Pool utilization tracking
- **Storage Metrics**: Database size and growth monitoring
- **Backup Verification**: Automated backup testing

### 3. Business Metrics
- **Booking Analytics**: Conversion rates and revenue tracking
- **User Behavior**: Journey analysis and drop-off points
- **Operational Metrics**: Bus utilization and route performance
- **Financial Reporting**: Revenue, refunds, and commission tracking

## Disaster Recovery

### 1. Data Backup
- **Automated Backups**: Daily PostgreSQL backups
- **Point-in-time Recovery**: Transaction log archiving
- **Cross-region Replication**: Geographic redundancy
- **Backup Testing**: Regular restore verification

### 2. Application Recovery
- **Blue-Green Deployment**: Zero-downtime updates
- **Rollback Strategy**: Quick reversion to previous versions
- **Health Monitoring**: Automatic failover triggers
- **Documentation**: Incident response procedures