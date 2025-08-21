# Haramain Bus Booking Platform

## Overview

Haramain is a comprehensive bus ticket booking platform specifically designed for Saudi Arabia. The application provides a modern, bilingual (Arabic/English) web experience for booking bus tickets between major Saudi cities including Riyadh, Jeddah, Makkah, Madinah, and Dammam. The platform features a customer-facing booking system, admin dashboard for operations management, and real-time seat selection capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Internationalization**: i18next for bilingual support (Arabic/English) with RTL/LTR layout switching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **API Design**: RESTful endpoints with consistent error handling and response formatting
- **Real-time Features**: WebSocket support for live seat availability updates
- **Session Management**: Express sessions with PostgreSQL store for persistent user sessions

### Authentication & Authorization
- **Primary Method**: Replit Auth integration for OAuth-based authentication
- **Session Storage**: PostgreSQL-backed session store with automatic cleanup
- **User Management**: Support for social login providers (Google, Facebook) through Replit Auth
- **Role-based Access**: Admin dashboard with different permission levels

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Connection**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Tables**: Comprehensive schema including users, admins, buses, routes, trips, bookings, seats, and promotions

### UI/UX Architecture
- **Component System**: Radix UI primitives with custom theming for accessibility and consistency
- **Design Language**: Modern, clean interface with Saudi cultural relevance
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Language Support**: Full RTL support for Arabic with seamless language switching
- **Color Scheme**: Custom "Haramain Green" brand color with comprehensive design tokens

### Development Tools
- **Type Safety**: TypeScript across frontend, backend, and shared schemas
- **Code Quality**: ESLint and TypeScript compiler for code validation
- **Development**: Hot module replacement with Vite for fast iteration
- **Path Aliases**: Configured import aliases for clean code organization

## External Dependencies

### Database & Hosting
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

### UI Components & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Modern icon library

### State Management & API
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling and validation
- **@hookform/resolvers**: Form validation resolvers

### Internationalization
- **react-i18next**: React integration for i18next
- **i18next**: Internationalization framework for language support

### Authentication & Sessions
- **Replit Auth**: OAuth-based authentication system
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store adapter

### Real-time Communication
- **ws**: WebSocket implementation for real-time features
- **Socket.IO**: Planned integration for live seat updates and chat support

### Development Dependencies
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds