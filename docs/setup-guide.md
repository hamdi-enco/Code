# Development Setup Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Replit Environment
This project is optimized for Replit development environment with:
- **NixOS**: Automatic dependency management
- **PostgreSQL**: Built-in database service
- **Environment Variables**: Secure secrets management

## Quick Start

### 1. Clone and Install
```bash
# Clone the repository (if not already in Replit)
git clone https://github.com/your-username/haramain-bus-booking.git
cd haramain-bus-booking

# Install dependencies
npm install
```

### 2. Environment Setup
Create environment variables in Replit Secrets or `.env.local`:

```env
# Database (automatically provided in Replit)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Replit Auth (automatically provided)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc
SESSION_SECRET=auto-generated-secret

# Stripe Keys (required for payments)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push

# Open database studio (optional)
npm run db:studio
```

### 4. Start Development Server
```bash
# Start the application
npm run dev
```

The application will be available at `http://localhost:5000`

## Detailed Setup

### Database Configuration

#### Automatic Setup (Replit)
1. Database is automatically provisioned
2. Environment variables are set automatically
3. Connection pooling is handled by Neon

#### Manual Setup (Local Development)
```bash
# Install PostgreSQL locally
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS with Homebrew:
brew install postgresql

# Start PostgreSQL service
sudo service postgresql start  # Linux
brew services start postgresql  # macOS

# Create database
createdb haramain_dev
```

#### Database Schema Migration
```bash
# Generate migration files (if schema changes)
npx drizzle-kit generate

# Push schema to database
npm run db:push

# Inspect database
npm run db:studio
```

### Stripe Payment Setup

#### 1. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or sign in
3. Switch to Test Mode for development

#### 2. Get API Keys
1. Navigate to **Developers > API Keys**
2. Copy **Publishable Key** (starts with `pk_test_`)
3. Copy **Secret Key** (starts with `sk_test_`)

#### 3. Configure Environment
```env
# Add to Replit Secrets
STRIPE_SECRET_KEY=sk_test_your_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
```

#### 4. Test Payment Flow
1. Use Stripe test card numbers:
   - **Success**: `4242424242424242`
   - **Decline**: `4000000000000002`
   - **3D Secure**: `4000002500003155`

### Authentication Setup

#### Replit Auth (Automatic)
Authentication is automatically configured in Replit environment:
- OAuth providers (Google, Facebook, etc.)
- Session management
- User profile data

#### Manual Auth Setup (Advanced)
For custom OAuth configuration:
```typescript
// server/replitAuth.ts
const config = {
  clientId: process.env.REPL_ID,
  redirectUri: `https://${domain}/api/callback`,
  scope: ['openid', 'email', 'profile']
};
```

### Sample Data Population

#### Add Sample Data
```sql
-- Run in database studio or psql
INSERT INTO routes (origin_city, destination_city, estimated_duration_minutes, is_active) VALUES 
('riyadh', 'jeddah', 480, true),
('jeddah', 'riyadh', 480, true),
('riyadh', 'makkah', 420, true),
('makkah', 'riyadh', 420, true);

INSERT INTO buses (bus_number, capacity, model, amenities) VALUES 
('HR-001', 45, 'Mercedes-Benz Travego', '["wifi", "ac", "reclining_seats"]'),
('HR-002', 50, 'Volvo 9700', '["wifi", "ac"]');
```

#### Or use provided script:
```bash
# Add sample data automatically
npm run seed-data
```

## Development Workflow

### 1. Code Structure
```
Project Root/
├── client/          # Frontend React app
├── server/          # Backend Express API
├── shared/          # Shared types and schemas
├── docs/           # Documentation
└── package.json    # Dependencies and scripts
```

### 2. Development Commands
```bash
# Start development server
npm run dev

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open database GUI

# Build for production
npm run build

# Type checking
npx tsc --noEmit
```

### 3. Hot Reloading
- **Frontend**: Vite HMR for instant updates
- **Backend**: tsx with watch mode for auto-restart
- **Database**: Schema changes via `db:push`

### 4. File Watching
The development server automatically watches:
- `client/src/**/*` - Frontend files
- `server/**/*` - Backend files
- `shared/**/*` - Shared schema files

## Common Issues and Solutions

### 1. Database Connection Issues
```bash
# Check database status
npm run db:studio

# Reset database connection
pkill -f "postgres"
npm run dev
```

### 2. Port Conflicts
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=3000 npm run dev
```

### 3. Stripe Integration Issues
```bash
# Verify environment variables
echo $STRIPE_SECRET_KEY
echo $VITE_STRIPE_PUBLIC_KEY

# Test Stripe connection
curl -u sk_test_...: https://api.stripe.com/v1/customers
```

### 4. Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf client/dist
npm run build
```

### 5. TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --showConfig

# Fix common path issues
npm run build
```

## IDE Setup

### VS Code (Recommended)
Install these extensions:
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint",
    "dbaeumer.vscode-eslint"
  ]
}
```

### VS Code Settings
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Testing Setup

### Unit Testing (Future)
```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react

# Run tests
npm run test
```

### E2E Testing (Future)
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
```

## Production Deployment

### 1. Environment Preparation
```env
# Production environment variables
NODE_ENV=production
DATABASE_URL=production-database-url
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### 2. Build Process
```bash
# Production build
npm run build

# Start production server
npm start
```

### 3. Replit Deployment
1. Click **Deploy** in Replit
2. Configure custom domain (optional)
3. Set production environment variables
4. Monitor deployment status

## Performance Optimization

### 1. Frontend Optimization
- **Code splitting**: Automatic with Vite
- **Asset optimization**: Images and fonts
- **Bundle analysis**: Check bundle size

### 2. Backend Optimization
- **Database indexing**: Optimize queries
- **Connection pooling**: Reuse connections
- **Caching**: Implement Redis (future)

### 3. Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_trips_route_date ON trips(route_id, departure_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_booked_seats_trip ON booked_seats(trip_id);
```

## Security Considerations

### 1. Environment Security
- Never commit `.env` files
- Use Replit Secrets for sensitive data
- Rotate API keys regularly

### 2. Code Security
- Validate all inputs with Zod
- Use parameterized queries
- Implement rate limiting

### 3. Deployment Security
- HTTPS only in production
- Secure headers configuration
- Regular dependency updates

## Getting Help

### Documentation
- [Architecture](architecture.md) - System design
- [API Documentation](api-documentation.md) - API reference
- [Database Schema](database-schema.md) - Database design

### Community
- Replit Community Forums
- GitHub Issues
- Discord/Slack channels (if available)

### Support
- Technical issues: Create GitHub issue
- Security concerns: Email security team
- General questions: Use community forums