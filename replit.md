# Enlighting Incentive Finder

## Overview

Enlighting Incentive Finder is a commercial web application designed to help facility managers identify and evaluate stackable energy efficiency incentives from utility, state, and federal sources. The platform provides instant incentive search, automated rebate value estimation, and lead generation for commercial energy efficiency consultants. Its core purpose is to simplify the discovery and utilization of financial incentives for energy-saving projects, promoting the adoption of sustainable practices. The application supports a wide array of programs, including those from third-party implementers, and includes comprehensive administrative tools for program management. The business vision is to become the leading platform for maximizing energy efficiency savings, tapping into a significant market by streamlining a complex process and offering substantial financial benefits to businesses.

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
- **UI/UX Decisions**:
    - **Brand Identity**: Utilizes a purple sunburst logo and a color palette featuring primary purple (#5B3A7D) and accent magenta (#B54BE3).
    - **Hero Section**: Features a CSS-based light purple gradient design with abstract energy waves and building geometry, replacing photographic backgrounds.
    - **Lead Capture**: Simplified with reduced required fields (name, work email, company).
    - **Search Results**: Implements a two-tier display showing "Programs matching your criteria" (exact matches) and "Other programs available for your facility" to maximize relevant results.
    - **Typography**: Inter font with defined sizes for body, H1, H2.
    - **Layout**: Standardized max-width of 1180px with responsive design, including a 2-column desktop layout that stacks on mobile.

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
- **Search Engine**: Hybrid approach using Typesense for advanced search, with PostgreSQL fallback for comprehensive results.
- **Full-Text Search**: Typesense provides instant search and faceted filtering.
- **Data Sync**: Automatic synchronization from PostgreSQL to Typesense.

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage via `connect-pg-simple`.
- **Input Validation**: Zod schemas.
- **Environment Variables**: Secure configuration management.

### AI Chatbot System
- **Architecture**: Full-stack conversational interface for personalized incentive discovery.
- **Frontend**: Floating chat widget with expandable modal interface (Shadcn UI).
- **Backend**: Express API endpoints with OpenAI integration and PostgreSQL conversation storage.
- **Intelligence**: OpenAI GPT-4o-mini for natural language understanding and contextual responses, with an intelligent fallback system.
- **Data Integration**: Utilizes `utility_zip_codes` table for territory identification (2,173 verified California ZIP-to-utility mappings) and `chat_conversations` for persistent history.
- **User Flow**: Collects ZIP code, confirms utility, allows selection of search mode (Measure or Building Type), gathers specifics, classifies unrecognized facilities, searches and provides high-level program overviews, and triggers inline lead capture for consultation.
- **Facility Type Coverage**: Covers Commercial, Industrial, Agricultural, and Multifamily, with mechanisms for classifying unrecognized types.

### Build & Deployment
- **Build System**: Vite for frontend, esbuild for backend.
- **Development Workflow**: Single command for concurrent frontend/backend serving.
- **Production**: Optimized builds with static asset serving.

## External Dependencies

- **Database**: PostgreSQL (via Neon serverless connection pooling)
- **AI Chatbot**: OpenAI GPT-4o-mini
- **Search Engine**: Typesense
- **Email Service**: SendGrid