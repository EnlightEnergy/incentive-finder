# Enlighting Incentive Finder

## Overview

Enlighting Incentive Finder is a commercial web application that helps facility managers discover and evaluate stackable utility, state, and federal incentives for energy efficiency projects. The platform provides instant incentive search, automated rebate value estimation, and lead generation capabilities for commercial energy efficiency consultants.

The application is built as a full-stack TypeScript solution using Express.js for the backend API, React with Vite for the frontend, and PostgreSQL for data persistence. It integrates with external APIs like DSIRE for incentive data and includes comprehensive admin tools for program management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with separate public and admin routes
- **Request Handling**: Express middleware for JSON parsing, CORS, and error handling
- **Development**: Hot reloading with Vite integration in development mode

### Data Layer
- **Database**: PostgreSQL with Neon serverless connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Data Models**: Normalized tables for programs, geographic coverage, eligibility rules, benefit structures, documentation, leads, and rate caching

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Input Validation**: Zod schemas for runtime type checking and validation
- **Environment Variables**: Secure configuration management for database URLs and API keys

### External Integrations
- **Email Service**: SendGrid for transactional emails and lead notifications
- **Data Sources**: Designed to integrate with DSIRE API for incentive metadata
- **Rate Data**: Built to consume OpenEI Utility Rate Database API for electricity/gas rates
- **Product Eligibility**: Ready for ENERGY STAR Rebate Finder integration

### Build & Deployment
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development Workflow**: Single command development with concurrent frontend/backend serving
- **Production**: Optimized builds with static asset serving from Express
- **Replit Integration**: Custom plugins for development banner and cartographer support