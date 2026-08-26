# KaamMitra - Hyperlocal Job Finder

## Overview

KaamMitra is a modern web platform that connects daily wage workers with nearby employers through an intelligent, location-based matching system. The application focuses on secure, verified interactions and streamlined communication via WhatsApp integration, eliminating the need for app downloads.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript (converted to JavaScript with ES modules)
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Module System**: ES Modules (ESM) with `"type": "module"` in package.json
- **Authentication**: Passport.js with express-session and local strategy
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt for hashing

### Database Architecture
- **Database**: PostgreSQL (Neon Cloud recommended)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Authentication System
- **Strategy**: Email verification with time-limited codes
- **Session Management**: Express sessions with PostgreSQL store
- **User Types**: Worker and Employer roles with separate dashboards
- **Security**: Password hashing with salt, session-based authentication

### User Management
- **Registration**: Multi-step process with email verification
- **Profiles**: Worker profiles with skills, ratings, and availability
- **Verification**: Government ID verification system for trust

### Job Management
- **Job Posting**: Employers can post jobs with location, category, and wage
- **Job Matching**: Location-based matching algorithm
- **Applications**: Workers can apply to jobs with status tracking
- **Categories**: Construction, plumbing, electrical, housekeeping, gardening

### Messaging System
- **Real-time Communication**: Direct messaging between workers and employers
- **WhatsApp Integration**: Communication bridge to WhatsApp for convenience
- **Conversation Management**: Persistent conversation history

### Rating System
- **Worker Ratings**: Employers rate workers after job completion
- **Trust Building**: Average ratings and verification status display
- **Quality Assurance**: Rating-based worker recommendations

## Data Flow

### User Registration Flow
1. User selects role (worker/employer) and fills registration form
2. Email verification code sent via Nodemailer
3. User verifies email with time-limited code
4. Account created with appropriate dashboard access
5. Optional ID verification for enhanced trust

### Job Posting and Application Flow
1. Employer posts job with details and location
2. System matches nearby workers based on skills and location
3. Workers browse and apply to relevant jobs
4. Employer reviews applications and selects workers
5. Communication begins through messaging system
6. Job completion and rating exchange

### Messaging Flow
1. User initiates conversation from job listing or worker profile
2. Messages stored in PostgreSQL with conversation threading
3. Real-time updates via React Query polling
4. Optional WhatsApp redirection for external communication

## External Dependencies

### Email Service
- **Provider**: Nodemailer with Gmail SMTP (configurable)
- **Fallback**: Ethereal test accounts for development
- **Purpose**: Email verification, notifications, password resets

### Database Service
- **Provider**: Neon Cloud PostgreSQL (recommended)
- **Alternative**: Local PostgreSQL installation
- **Features**: Serverless scaling, branching, free tier

### AI Integration
- **Provider**: OpenAI GPT-4o for chatbot assistance
- **Purpose**: Customer support, job recommendations, hiring tips
- **Fallback**: Graceful degradation when API unavailable

### File Storage
- **Method**: Local file system with Multer
- **Purpose**: User profile images, verification documents
- **Directory**: `/uploads` with automatic creation

## Deployment Strategy

### Development Environment
- **Start Command**: `node server/index.js`
- **Database Setup**: `npm run db:push` for schema migration
- **Environment**: `.env` file with database URL and email credentials

### Production Considerations
- **Build Process**: Vite build for frontend, esbuild for backend
- **Session Store**: PostgreSQL-backed sessions for scalability
- **File Uploads**: Consider cloud storage for production
- **Environment Variables**: Secure credential management

### Database Migration
- **Tool**: Drizzle Kit for schema changes
- **Strategy**: Progressive migration with backwards compatibility
- **Seeding**: Automated test data creation for development

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 07, 2025. Initial setup