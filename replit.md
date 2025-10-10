# Enlighting Incentive Finder

## Overview

Enlighting Incentive Finder is a commercial web application designed to assist facility managers in identifying and evaluating stackable energy efficiency incentives from utility, state, and federal sources. The platform offers instant incentive search, automated rebate value estimation, and lead generation for commercial energy efficiency consultants. It aims to streamline the process of discovering and leveraging financial incentives for energy-saving projects, ultimately driving adoption of sustainable practices. The application supports a wide range of programs, including those from third-party implementers, and integrates comprehensive administrative tools for program management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)

### Homepage UI/UX Enhancements
- **Hero Section**: Updated title to "Unlock utility, state, and federal programs your facility can use for energy efficiency upgrades." Replaced gradient background with blue cityscape image (imported via `@assets/Incentive_background_1760128727694.png`) with 35% dark overlay for text readability. Changed all hero text (kicker, title, subtitle) to white. Hero section contains ONLY the text content - search form moved to separate white section below. Removed "Get my Incentive Report" CTA button. Background image properly imported through Vite's asset pipeline for correct serving and caching.
- **Search Form Section**: Moved outside hero into dedicated white background section below. Contains "Find Your Energy Incentives" heading, 3-step process, search form card, 6 round icons, and blue turnkey proposition block.
- **3-Step Process**: Added visual guide under "Find Your Energy Incentives" with Discover, Qualify, and Deliver steps with icons. Simplified description text to focus on program availability.
- **Turnkey Proposition Block**: Moved "As a licensed turnkey contractor..." text from hero to below the 6 round icons (Commercial Buildings, Small Commercial, Industrial, Multifamily, Direct Install, Solar). Added blue background block (#0c558c) with white text.
- **Right Rail CTA**: Added sticky CTA card on results page with "Want help implementing?" message and two action buttons (Talk to an Engineer, Email me this report).
- **Typography**: Updated to Inter font at 17px body, H1 52px, H2 30px with improved line heights and negative letter-spacing.
- **Layout**: Standardized max-width to 1180px across sections, added proper section spacing (64-80px). Hero section isolated from content sections.
- **Responsive Design**: 2-column desktop layout (programs 65% + CTA rail 35%) that stacks on mobile.
- **Chatbot Icon**: Replaced with new AI ball design with orange blinking indicator.
- **Modal Text Updates**: 
  - ApplyEnlightingModal: Changed title to "Contact Enlighting for your custom report", removed secondary program name line
  - LeadCaptureModal: Changed title to "Contact Me About Incentives", submit button to "Contact Me", bottom text to "We will be in touch within 48 hours. No Spam."
- **Copy Updates**:
  - Footer: Updated copyright to include "and aggregators" in data sources
  - Right Rail CTA and 3-Step Process: Changed "under one contract" to "in one turnkey proposition" for consistent messaging

### Chatbot Search Fix (October 10, 2025)
- **Critical Issue Resolved**: Fixed chatbot search returning only 2-5 programs instead of all available programs (11+ for SCE territories)
- **Root Cause**: Chatbot limited search results to 5 programs and excluded state/federal programs when utility was explicitly selected
- **Solution Implemented**:
  - Increased chatbot search limit from 5 to 50 programs to capture all relevant incentives
  - Modified utility filtering logic to always include state/federal programs (179D, CEITC, SGIP) alongside utility-specific programs
  - Updated state-level condition to handle both NULL and empty string values in `utility_service_area` field
- **Verification**: All test scenarios pass - single-utility ZIPs, multi-utility ZIPs with explicit selection, and chatbot/API endpoints all return complete program lists
- **Impact**: Users now see comprehensive incentive opportunities including stackable state and federal programs, significantly improving search results quality

### ZIP Code Location Filtering Fix (October 10, 2025)
- **Critical Issue Resolved**: Fixed ZIP code search returning programs from ALL utilities instead of only the specific utility serving that ZIP plus state/federal programs
- **Root Cause**: Query was filtering on `programGeos.utilityServiceArea` (joined table) using LEFT JOIN, which didn't properly exclude programs from other utilities
- **Solution Implemented**:
  - Changed filtering logic in `server/storage.ts` to filter directly on `programs.owner` (main table) instead of joined table field
  - This ensures proper filtering at the program level before the LEFT JOIN executes
  - State/federal programs still correctly identified via program_geos with NULL/empty utility_service_area
- **Verification**: End-to-end testing confirmed correct behavior:
  - ZIP 93102 (SCE): Returns only SCE + state/federal programs (11 total)
  - ZIP 92101 (SDG&E): Returns only SDG&E + state/federal programs (12 total)
  - ZIP 90001 (LADWP): Returns only LADWP + state/federal programs (4 total)
  - Programs from unrelated utilities are properly excluded
- **Impact**: Search results now accurately reflect utility territory boundaries, ensuring users only see programs they're eligible for based on their location

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