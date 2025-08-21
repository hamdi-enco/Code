# Deployment Guide

## Deployment Overview

Haramain is designed for seamless deployment on the Replit platform, with built-in support for automatic scaling, database management, and environment configuration.

## Replit Deployment

### 1. Automatic Deployment Setup

#### Prerequisites
- Replit account with deployment access
- Project configured with proper `replit.nix`
- Environment variables configured in Secrets

#### Deployment Process
```bash
# 1. Ensure project is ready
npm run build

# 2. Deploy via Replit UI
# Click "Deploy" button in Replit interface

# 3. Configure deployment settings
# - Custom domain (optional)
# - Environment variables
# - Resource allocation
```

### 2. Environment Configuration

#### Production Environment Variables
```env
# Database (automatically configured)
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=your-db-name

# Authentication (automatically configured)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.app,custom-domain.com
SESSION_SECRET=production-session-secret
ISSUER_URL=https://replit.com/oidc

# Payment Processing (required)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_public_key

# Optional Configuration
NODE_ENV=production
PORT=5000
```

#### Setting Environment Variables
1. **Replit Secrets**: Use Secrets tab for sensitive data
2. **Environment Variables**: Set in deployment configuration
3. **Build Variables**: Configure for build-time variables

### 3. Custom Domain Setup

#### DNS Configuration
```dns
# A Record
Type: A
Name: @
Value: 35.192.123.45  # Replit's IP

# CNAME Record (for www)
Type: CNAME
Name: www
Value: your-repl-name.replit.app
```

#### SSL Certificate
- Automatic SSL via Replit Deployments
- Let's Encrypt integration
- Automatic renewal

### 4. Deployment Monitoring

#### Health Checks
```typescript
// Built-in health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

#### Deployment Status
- Monitor via Replit Dashboard
- Automatic rollback on failure
- Deployment logs and metrics

## Alternative Deployment Options

### 1. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 5000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=haramain
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 2. Cloud Platform Deployment

#### Vercel Deployment
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["client/dist/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ]
}
```

#### Railway Deployment
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

#### Heroku Deployment
```json
{
  "name": "haramain-bus-booking",
  "stack": "heroku-22",
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ],
  "addons": [
    {
      "plan": "heroku-postgresql:mini"
    }
  ],
  "env": {
    "NODE_ENV": {
      "value": "production"
    }
  }
}
```

## Database Deployment

### 1. Production Database Setup

#### Neon Database (Recommended)
```bash
# Create production database
# Via Neon Dashboard or CLI

# Configure connection
DATABASE_URL=postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/dbname?sslmode=require
```

#### Migration Strategy
```bash
# Production migration workflow
npm run db:push  # Apply schema changes
npm run db:seed  # Populate initial data (if needed)
```

### 2. Database Backup Strategy

#### Automatic Backups
- **Replit**: Built-in backup system
- **Neon**: Point-in-time recovery
- **Manual**: Regular SQL dumps

#### Backup Configuration
```bash
# Weekly backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
```

### 3. Database Monitoring
```sql
-- Performance monitoring queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Connection monitoring
SELECT 
  state,
  COUNT(*)
FROM pg_stat_activity
GROUP BY state;
```

## Security Configuration

### 1. Production Security

#### Environment Security
```typescript
// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'STRIPE_SECRET_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

#### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "js.stripe.com"],
      connectSrc: ["'self'", "api.stripe.com"],
    }
  }
}));
```

### 2. SSL/TLS Configuration
```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 3. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## Performance Optimization

### 1. Build Optimization

#### Production Build
```bash
# Optimized production build
npm run build

# Build output analysis
npx vite-bundle-analyzer
```

#### Asset Optimization
```typescript
// Vite production config
export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    }
  }
});
```

### 2. Database Optimization

#### Connection Pooling
```typescript
// Production database configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Query Optimization
```sql
-- Production indexes
CREATE INDEX CONCURRENTLY idx_trips_search ON trips(route_id, departure_time, status);
CREATE INDEX CONCURRENTLY idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX CONCURRENTLY idx_booked_seats_trip ON booked_seats(trip_id);

-- Analyze table statistics
ANALYZE trips;
ANALYZE bookings;
ANALYZE booked_seats;
```

### 3. Caching Strategy

#### Application Caching
```typescript
// In-memory caching for frequent queries
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

app.get('/api/routes', (req, res) => {
  const cachedRoutes = cache.get('routes');
  if (cachedRoutes) {
    return res.json(cachedRoutes);
  }
  
  // Fetch from database
  const routes = await storage.getRoutes();
  cache.set('routes', routes);
  res.json(routes);
});
```

#### CDN Integration
```typescript
// Static asset CDN configuration
const CDN_BASE = process.env.CDN_URL || '';

app.use('/static', express.static('public', {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (CDN_BASE) {
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  }
}));
```

## Monitoring and Logging

### 1. Application Monitoring

#### Error Tracking
```typescript
// Error tracking setup
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  });
}

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
```

#### Performance Monitoring
```typescript
// Request logging
import morgan from 'morgan';

app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
```

### 2. Health Monitoring

#### Health Check Endpoints
```typescript
app.get('/health', async (req, res) => {
  try {
    // Database health check
    await db.raw('SELECT 1');
    
    // External service checks
    const stripeHealth = await checkStripeHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        stripe: stripeHealth ? 'up' : 'down'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### 3. Metrics Collection
```typescript
// Business metrics
app.use('/api/bookings', (req, res, next) => {
  if (req.method === 'POST') {
    metrics.increment('bookings.created');
  }
  next();
});

app.use('/api/payments', (req, res, next) => {
  if (req.method === 'POST' && res.statusCode === 200) {
    metrics.increment('payments.successful');
  }
  next();
});
```

## Backup and Recovery

### 1. Data Backup Strategy

#### Database Backups
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="haramain_backup_$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to cloud storage
aws s3 cp $BACKUP_FILE s3://haramain-backups/

# Clean up local file
rm $BACKUP_FILE
```

#### File Backups
```bash
# Application file backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  .
```

### 2. Disaster Recovery

#### Recovery Procedures
1. **Database Recovery**:
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_file.sql
   ```

2. **Application Recovery**:
   ```bash
   # Redeploy from git
   git pull origin main
   npm install
   npm run build
   npm start
   ```

3. **Rollback Strategy**:
   - Keep previous deployment versions
   - Blue-green deployment for zero downtime
   - Automated rollback triggers

### 3. Monitoring Recovery
```bash
# Recovery time monitoring
curl -f http://localhost:5000/health || exit 1

# Database connectivity check
psql $DATABASE_URL -c "SELECT 1" || exit 1
```

## Troubleshooting

### 1. Common Deployment Issues

#### Build Failures
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check connection pool
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
```

#### Payment Integration Issues
```bash
# Test Stripe connectivity
curl -u $STRIPE_SECRET_KEY: https://api.stripe.com/v1/payment_intents

# Verify webhook endpoints
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### 2. Performance Issues

#### Database Performance
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'trips';
```

#### Application Performance
```bash
# Memory usage monitoring
ps aux | grep node

# CPU usage monitoring
top -p $(pgrep -f "node")
```

### 3. Recovery Procedures

#### Quick Recovery Checklist
1. ✅ Check deployment status
2. ✅ Verify environment variables
3. ✅ Test database connectivity
4. ✅ Validate external service integrations
5. ✅ Monitor error logs
6. ✅ Verify health check endpoints
7. ✅ Test critical user flows