# Enlighting Incentive Finder

## Overview

Enlighting Incentive Finder is a commercial web application that helps facility managers discover and evaluate stackable utility, state, and federal incentives for energy efficiency projects. The platform provides instant incentive search, automated rebate value estimation, and lead generation capabilities for commercial energy efficiency consultants.

The application is built as a full-stack TypeScript solution using Express.js for the backend API, React with Vite for the frontend, and PostgreSQL for data persistence. It integrates with external APIs like DSIRE for incentive data and includes comprehensive admin tools for program management.

## Recent Changes

### October 4, 2025 - Enhanced Program Details Display
**Improved chatbot responses to include incentive amounts and program descriptions:**

1. **AI Response Enhancement** ✅
   - Updated SYSTEM_PROMPT to instruct AI to always include incentive details (amounts, types, descriptions)
   - Provides full incentive descriptions in context (not truncated to 150 chars)
   - AI now presents programs with 💰 for incentives and 📋 for descriptions

2. **Fallback Response Enhancement** ✅
   - Updated fallback response to show detailed program information
   - Each program now displays: name, owner, incentive amounts/details, and description
   - Uses emojis (💰 📋) to make information scannable

**Files Modified:**
- `server/chatbot.ts` - Updated SYSTEM_PROMPT and context building, enhanced fallback formatting

**Example Program Display:**
```
1. **PG&E Business Energy Efficiency Rebates & Financing** from Pacific Gas & Electric
   💰 0% Interest On-Bill Financing up to 10 years, prescriptive equipment rebates...
   📋 Comprehensive business energy efficiency program with industry-specific options...
```

### October 4, 2025 - Lead Form Scroll & ZIP Reset Bug Fixes
**Fixed critical UX issues with lead capture form and conversation state management:**

1. **Lead Form Scroll-to-Top** ✅
   - Added `leadFormRef` with `scrollIntoView` to automatically scroll form to top when it appears
   - Improves UX by ensuring users see the form immediately without manual scrolling
   - Smooth scroll animation with `block: 'start'` positioning

2. **Complete ZIP Reset State Management** ✅
   - **Frontend**: Created local `next*` variables for all state (zipCode, facilityType, utility, measure, searchMode, unrecognizedFacility)
   - **Frontend**: When new ZIP detected, clears ALL `next*` variables and React state, hides lead form
   - **Frontend**: Guards ALL detection (utility, facility, measure, searchMode) with `!isNewZipDetected` to prevent keyword leaks
   - **Frontend**: Always updates lead form visibility explicitly (shows when true, hides when false) - fixes form staying visible forever
   - **Backend**: Detects `isNewZip` flag and sets all detected values (utility, facility, measure) to undefined
   - **Backend**: Guards ALL detection loops with `if (!isNewZip)` to prevent re-detection during reset
   - **Backend**: Clears database fields (facilityType, utility, searchMode) when isNewZip
   - **Backend**: Added `!isNewZip` guard to `shouldShowLeadCapture` - never shows lead form during reset

3. **ZIP Reset Flow** ✅
   - Entering new ZIP completely restarts conversation from utility confirmation
   - No state leaks: facility, measure, utility, searchMode all cleared
   - Lead form hidden until new flow completes with affirmative consultation response
   - Complex messages with new ZIP (e.g., "93103 PGE office HVAC") only process ZIP, ignore all other keywords

**Files Modified:**
- `client/src/components/chatbot.tsx` - Added leadFormRef scroll, complete next* variable system, lead form visibility logic
- `server/storage.ts` - Added isNewZip guards, database searchMode clearing, shouldShowLeadCapture guard

**Testing:**
- Automated end-to-end playwright test passed all scenarios
- Lead form scroll verified ✅
- ZIP reset flow verified ✅
- No state leaks verified ✅
- Lead form visibility correctly managed ✅

### October 4, 2025 - Critical Chatbot Flow Fixes & Lead Capture Implementation
**Successfully fixed all critical issues and completed lead capture functionality:**

1. **Search Mode Selection UI & Flow** ✅
   - Added interactive UI buttons for search mode selection (measure vs. building type)
   - Users now see clear visual choice between "Search by Energy Measure" and "Search by Building Type"
   - Backend logic properly waits for searchMode selection before asking follow-up questions
   - Search mode tracked in conversation state and database

2. **State Persistence Improvements** ✅
   - Removed conditional checks that prevented state updates (ZIP, utility, facility, measure)
   - All detected values now update immediately when detected in conversation
   - Users can change their inputs mid-conversation and system adapts correctly

3. **Lead Capture Full Implementation** ✅
   - Fixed fallback responses to ask about consultation when ZIP+utility+facility/measure context complete
   - Lead capture triggers when user responds affirmatively (yes, yeah, sure, etc.) to consultation question
   - Inline lead capture form appears in chat with: company name, contact name, email, phone
   - Form submits directly to /api/leads endpoint with validation
   - Success confirmation message displayed after submission
   - Lead data persisted to PostgreSQL database
   - End-to-end tested: ZIP → facility → consultation → "yes" → lead form → submission → database save

4. **Lead Capture Timing Fix** ✅
   - Fixed issue where form appeared immediately when AI asked about consultation
   - Form now waits for user's affirmative response before appearing
   - Prevents user from having to scroll up to see the question
   - Improved user experience: question → user decision → form (proper flow)

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
- **Database**: PostgreSQL with Neon serverless connection pooling as source of truth
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Data Models**: Normalized tables for programs, geographic coverage, eligibility rules, benefit structures, documentation, leads, and rate caching

### Search Architecture
- **Search Engine**: Hybrid approach using Typesense for advanced search with PostgreSQL fallback
- **Full-Text Search**: Typesense provides instant search, faceted filtering, and relevance scoring
- **Resilience**: Graceful fallback to PostgreSQL search when Typesense is unavailable
- **Data Sync**: Automatic synchronization from PostgreSQL to Typesense search index
- **Performance**: Optimized for thousands of incentive programs with complex filtering requirements

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Input Validation**: Zod schemas for runtime type checking and validation
- **Environment Variables**: Secure configuration management for database URLs and API keys

### External Integrations
- **Email Service**: SendGrid for transactional emails and lead notifications
- **Data Sources**: Designed to integrate with DSIRE API for incentive metadata
- **Rate Data**: Built to consume OpenEI Utility Rate Database API for electricity/gas rates
- **Product Eligibility**: Ready for ENERGY STAR Rebate Finder integration
- **AI Chatbot**: OpenAI GPT-4o-mini for conversational incentive discovery with intelligent fallback system

### AI Chatbot System
- **Architecture**: Full-stack conversational interface for personalized incentive discovery
- **Frontend**: Floating chat widget with expandable modal interface using Shadcn UI components
- **Backend**: Express API endpoints with OpenAI integration and PostgreSQL conversation storage
- **Intelligence**: 
  - OpenAI GPT-4o-mini for natural language understanding and contextual responses
  - Intelligent fallback system when API quota exceeded - generates contextual responses using business logic
  - Auto-detects ZIP codes and facility types from natural language input
  - **Unrecognized Facility Handling**: When users mention unknown facility types (library, museum, church, etc.), system prompts for classification as Retail, Commercial, Industrial, or Multi-family
- **Data Integration**:
  - utility_zip_codes table: 4,368 California ZIP-to-utility mappings for territory identification
  - chat_conversations table: Persistent conversation history with JSONB message storage
  - Real-time program matching based on location and facility type
- **User Flow** (Updated October 2025):
  1. Collects ZIP code to determine utility territory
  2. Detects and confirms utility provider (handles multiple utilities per ZIP)
  3. **Search Mode Selection** (NEW): Shows UI buttons for user to choose search method:
     - "Search by Energy Measure" (LED, HVAC, Solar, etc.)
     - "Search by Building Type" (Office, Retail, Warehouse, etc.)
  4. Based on search mode selection:
     - If Measure: Asks for specific measure (LED, HVAC, solar, etc.)
     - If Building Type: Asks for facility type (office, retail, restaurant, etc.)
  5. For unrecognized facilities: prompts user to classify into one of four categories
  6. Searches relevant programs from database
  7. Provides high-level program overview (2-3 examples)
  8. **Lead Capture** (NEW): When programs found and consultation mentioned, shows inline form:
     - Company name, contact name, email, phone
     - Submits directly to leads API
     - Confirmation message upon successful submission
  9. Guides users toward consultation for detailed analysis
- **Facility Type Coverage**:
  - **Commercial**: retail, office, restaurant, hotel, medical, school, recreation (golf course, gym), grocery, auto dealer, food processing
  - **Industrial**: warehouse, industrial, manufacturing, factory
  - **Agricultural**: farm, vineyard, agriculture
  - **Multifamily**: apartment, multifamily, condo
  - **Unrecognized**: library, museum, church, theater, stadium → triggers classification prompt
- **State Management** (Updated October 2025):
  - Always updates detected values (ZIP, utility, facility, measure) - no conditional blocking
  - Tracks searchMode in both frontend and conversation database
  - Persistent state across conversation for seamless experience
- **Interactive UI Components** (NEW):
  - Search Mode Selector: Two-button card with icons for clear visual choice
  - Lead Capture Form: Inline form with validation that appears in chat flow
  - All components styled with brand colors and Shadcn UI consistency
- **Behavior**: Provides helpful information while avoiding complete technical details, positioning consultation as the value-added service
- **Resilience**: Graceful degradation - fallback responses maintain conversation quality when AI API unavailable

### Build & Deployment
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development Workflow**: Single command development with concurrent frontend/backend serving
- **Production**: Optimized builds with static asset serving from Express
- **Replit Integration**: Custom plugins for development banner and cartographer support