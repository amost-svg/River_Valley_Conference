# River Valley Conference Website

## Overview

This is a modern, professional website for the River Valley Conference IHSA organization featuring school directories, sports schedules, conference standings, and news announcements. The application serves as a central hub for the 10 member schools in the conference, providing information about athletics, schedules, results, and school details.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based architecture
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with custom conference color scheme (navy, gold, green)
- **UI Components**: shadcn/ui components for consistent, accessible design
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for type safety across the full stack
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Driver**: Neon serverless PostgreSQL driver
- **API Design**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Data Models
- **Schools**: Complete school information including contact details, administration, and streaming info
- **Sports**: Athletic programs organized by season (fall, winter, spring)
- **Games**: Schedule and results with home/away teams, scores, and completion status
- **Standings**: Conference standings with wins, losses, and calculated percentages
- **News**: Announcements and updates with categorization
- **Contacts**: Contact form submissions for communication

### User Interface Components
- **Navigation**: Sticky header with smooth scrolling to sections
- **Hero Section**: Conference branding with call-to-action buttons
- **Member Schools**: Interactive school directory with detailed information
- **Schedules & Results**: Filterable game schedules with real-time results
- **Conference Standings**: Live standings tables for different sports
- **News Section**: Latest conference news and announcements
- **Contact Form**: Inquiry system with form validation

### Admin Interface
- **School Management**: CRUD operations for school information
- **Content Management**: Admin panel for managing schools, games, and news
- **Data Import**: CSV import functionality for bulk data operations

## Data Flow

1. **Client Requests**: Frontend makes API calls using React Query
2. **Server Processing**: Express.js routes handle requests and validate data
3. **Database Operations**: Drizzle ORM performs type-safe database queries
4. **Response Delivery**: JSON responses sent back to client
5. **State Updates**: React Query manages cache and UI updates
6. **Real-time Updates**: Client-side polling for live data (standings, scores)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with schema management
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Schema validation for type safety
- **wouter**: Lightweight routing library

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and schema management tools

### Third-party Services
- **NFHS Network**: Live streaming platform integration
- **YouTube**: Video streaming platform integration
- **IHSA**: Illinois High School Association integration

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds optimized React application
2. **Backend Build**: esbuild bundles Express.js server
3. **Database Setup**: Drizzle migrations ensure schema consistency
4. **Asset Optimization**: Static assets are optimized and bundled

### Production Configuration
- **Environment Variables**: DATABASE_URL for PostgreSQL connection
- **Static Serving**: Express serves built frontend from dist/public
- **API Routes**: RESTful endpoints under /api prefix
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

### Database Management
- **Migrations**: Drizzle-kit manages database schema changes
- **Seeding**: Initial data population for schools, sports, and sample data
- **Backup Strategy**: Regular database backups for data protection

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```