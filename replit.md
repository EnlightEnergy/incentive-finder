# Enlighting Incentive Finder

## Overview

Enlighting Incentive Finder is a commercial web application designed to assist facility managers in identifying and evaluating stackable energy efficiency incentives from utility, state, and federal sources. The platform offers instant incentive search, automated rebate value estimation, and lead generation for commercial energy efficiency consultants. It aims to streamline the process of discovering and leveraging financial incentives for energy-saving projects, ultimately driving adoption of sustainable practices. The application supports a wide range of programs, including those from third-party implementers, and integrates comprehensive administrative tools for program management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite.
- **UI Components**: Shadcn/ui (Radix UI primitives).
- **Styling**: Tailwind CSS with custom design tokens.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful endpoints (public and admin).
- **Request Handling**: Express middleware (JSON parsing, CORS, error handling).

### Data Layer
- **Database**: PostgreSQL with Neon serverless connection pooling.
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema Management**: Drizzle Kit for migrations.
- **Data Models**: Normalized tables for programs, geographic coverage, eligibility, benefit structures, documentation, leads, and rate caching.

### Search Architecture
- **Search Engine**: Hybrid approach using Typesense for advanced search, with PostgreSQL fallback.
- **Full-Text Search**: Typesense provides instant search, faceted filtering.
- **Data Sync**: Automatic synchronization from PostgreSQL to Typesense.

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage via `connect-pg-simple`.
- **Input Validation**: Zod schemas.
- **Environment Variables**: Secure configuration management.

### AI Chatbot System
- **Architecture**: Full-stack conversational interface for personalized incentive discovery.
- **Frontend**: Floating chat widget with expandable modal interface (Shadcn UI).
- **Backend**: Express API endpoints with OpenAI integration and PostgreSQL conversation storage.
- **Intelligence**: OpenAI GPT-4o-mini for natural language understanding and contextual responses, with an intelligent fallback system for API unavailability. Auto-detects ZIP codes and facility types. Handles unrecognized facility types by prompting for classification (Retail, Commercial, Industrial, Multi-family).
- **Data Integration**: Utilizes `utility_zip_codes` table for territory identification (2,173 verified California ZIP-to-utility mappings across 15 utilities, including comprehensive PG&E coverage) and `chat_conversations` for persistent history. Real-time program matching based on location and facility type.
- **User Flow**:
    1. Collects ZIP code to determine utility territory.
    2. Detects and confirms utility provider.
    3. User selects search mode (Measure or Building Type) via UI buttons.
    4. Gathers specific measure (e.g., LED, HVAC) or facility type (e.g., office, retail).
    5. For unrecognized facilities, prompts for classification.
    6. Searches and provides high-level program overviews.
    7. Triggers inline lead capture form when programs are found and consultation is discussed, submitting to the leads API and saving to PostgreSQL.
    8. Guides users towards consultation for detailed analysis.
- **Facility Type Coverage**: Covers Commercial, Industrial, Agricultural, and Multifamily, with a mechanism for classifying unrecognized types.
- **State Management**: Persistently updates detected values (ZIP, utility, facility, measure) and tracks search mode.
- **Interactive UI Components**: Includes search mode selector and an inline lead capture form, styled consistently.
- **Behavior**: Provides helpful information while promoting consultation for detailed technical analysis.

### Build & Deployment
- **Build System**: Vite for frontend, esbuild for backend.
- **Development Workflow**: Single command for concurrent frontend/backend serving.
- **Production**: Optimized builds with static asset serving.

## External Dependencies

- **Database**: PostgreSQL (via Neon serverless connection pooling)
- **AI Chatbot**: OpenAI GPT-4o-mini
- **Search Engine**: Typesense
- **Email Service**: SendGrid
- **Incentive Data Source**: DSIRE API (planned integration)
- **Utility Rate Data**: OpenEI Utility Rate Database API (planned integration)
- **Product Eligibility**: ENERGY STAR Rebate Finder (planned integration)