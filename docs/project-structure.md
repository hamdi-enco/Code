# Project Structure

## Root Directory Structure

```
haramain-bus-booking/
├── client/                 # Frontend React application
├── server/                 # Backend Express application
├── shared/                 # Shared types and schemas
├── docs/                  # Comprehensive documentation
├── drizzle/               # Database migrations (auto-generated)
├── package.json           # Project dependencies and scripts
├── drizzle.config.ts      # Database configuration
├── vite.config.ts         # Vite build configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── replit.md             # Project overview and user preferences
└── README.md             # Project readme
```

## Frontend Structure (`client/`)

```
client/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...        # Other UI primitives
│   │   ├── Navigation.tsx # Main navigation component
│   │   ├── Footer.tsx     # Footer component
│   │   ├── HeroSection.tsx # Homepage hero with search
│   │   ├── SearchResults.tsx # Trip search results
│   │   ├── SeatSelection.tsx # Bus seat selection
│   │   ├── LiveChat.tsx   # Customer support chat
│   │   └── LanguageToggle.tsx # Language switcher
│   ├── pages/            # Application pages
│   │   ├── home.tsx      # Homepage with search
│   │   ├── dashboard.tsx # User dashboard
│   │   ├── admin.tsx     # Admin dashboard
│   │   ├── payment.tsx   # Payment processing
│   │   ├── booking-confirmation.tsx # Booking success
│   │   └── not-found.tsx # 404 error page
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts    # Authentication hook
│   │   └── use-toast.ts  # Toast notifications
│   ├── contexts/         # React contexts
│   │   └── LanguageContext.tsx # i18n context
│   ├── lib/              # Utility libraries
│   │   ├── queryClient.ts # TanStack Query setup
│   │   ├── i18n.ts       # Internationalization config
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles and Tailwind
├── public/               # Static assets
│   ├── favicon.ico
│   └── ...               # Other static files
└── index.html            # HTML template
```

## Backend Structure (`server/`)

```
server/
├── index.ts              # Server entry point
├── vite.ts               # Vite development integration
├── db.ts                 # Database connection setup
├── storage.ts            # Data access layer (IStorage interface)
├── routes.ts             # API route definitions
├── replitAuth.ts         # Replit Auth configuration
└── middleware/           # Custom middleware (if needed)
```

## Shared Structure (`shared/`)

```
shared/
└── schema.ts             # Database schema and types
    ├── User types and schemas
    ├── Route types and schemas
    ├── Bus types and schemas
    ├── Trip types and schemas
    ├── Booking types and schemas
    ├── Payment types and schemas
    └── Database relations
```

## Documentation Structure (`docs/`)

```
docs/
├── README.md                    # Documentation index
├── overview.md                  # Platform overview
├── architecture.md              # System architecture
├── project-structure.md         # This file
├── database-schema.md           # Database design
├── api-documentation.md         # REST API reference
├── features.md                  # Feature specifications
├── setup-guide.md              # Development setup
├── deployment.md               # Deployment guide
├── user-guide.md               # End-user guide
├── admin-guide.md              # Admin manual
├── development-guide.md         # Developer workflows
├── internationalization.md     # i18n implementation
├── payment-integration.md       # Payment system docs
└── security.md                 # Security measures
```

## Key Files Explained

### Configuration Files

#### `package.json`
```json
{
  "name": "haramain-bus-booking",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

#### `vite.config.ts`
- Frontend build configuration
- Development server setup
- Path aliases (`@/` points to `client/src/`)
- Replit-specific plugins

#### `tailwind.config.ts`
- Custom color scheme (Haramain green, gold)
- RTL/LTR support configuration
- Typography and spacing customization
- shadcn/ui integration

#### `drizzle.config.ts`
- Database connection configuration
- Migration file locations
- Schema file paths

### Core Application Files

#### `server/index.ts`
```typescript
// Server entry point
- Express app initialization
- Middleware setup
- Route registration
- Server startup
```

#### `client/src/App.tsx`
```typescript
// Main React application
- Route configuration
- Global providers (Query, Language, Toast)
- Authentication context
- Layout structure
```

#### `shared/schema.ts`
```typescript
// Database schema and types
- Drizzle table definitions
- TypeScript type exports
- Zod validation schemas
- Database relations
```

## File Naming Conventions

### Frontend Files
- **Components**: PascalCase (`SearchResults.tsx`)
- **Pages**: lowercase (`home.tsx`, `dashboard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`queryClient.ts`)
- **Types**: PascalCase interfaces/types

### Backend Files
- **Modules**: camelCase (`storage.ts`, `routes.ts`)
- **Configuration**: camelCase (`db.ts`)
- **Middleware**: camelCase (`auth.ts`)

### Shared Files
- **Schemas**: camelCase (`schema.ts`)
- **Types**: Export as PascalCase from schema files

## Import/Export Patterns

### Path Aliases
```typescript
// Configured in vite.config.ts
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
```

### Shared Imports
```typescript
// From shared schema
import type { User, Trip, Booking } from "@shared/schema";
import { insertUserSchema, users } from "@shared/schema";
```

### Barrel Exports
```typescript
// Components index files for clean imports
export { Navigation } from "./Navigation";
export { Footer } from "./Footer";
export { HeroSection } from "./HeroSection";
```

## Development Workflow

### Adding New Features
1. **Database Schema**: Update `shared/schema.ts`
2. **Backend Logic**: Add to `server/storage.ts`
3. **API Endpoints**: Create in `server/routes.ts`
4. **Frontend Components**: Build in `client/src/components/`
5. **Pages**: Add to `client/src/pages/`
6. **Routes**: Register in `client/src/App.tsx`

### Code Organization Principles
- **Single Responsibility**: Each file has one clear purpose
- **Type Safety**: TypeScript throughout the stack
- **Reusability**: Shared components and utilities
- **Consistency**: Unified naming and structure conventions
- **Documentation**: Comments for complex logic

## Asset Management

### Static Assets
- **Location**: `client/public/`
- **Access**: Direct URL paths in production
- **Types**: Images, icons, fonts, manifest files

### Dynamic Assets
- **Location**: `client/src/assets/` (if needed)
- **Import**: ES6 imports with Vite processing
- **Optimization**: Automatic by Vite build process

## Environment Configuration

### Development
- `.env.local` for local overrides
- Environment variables prefixed with `VITE_` for frontend
- Server environment variables without prefix

### Production
- Replit Secrets for sensitive data
- Environment-specific configurations
- Build-time optimizations