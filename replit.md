# River Valley Conference Website

## Overview

This is a comprehensive, dynamic web application for the River Valley Conference IHSA organization featuring school directories, sports schedules, conference standings, news announcements, and administrative capabilities. The platform serves public users (parents, students, fans), authenticated Athletic Directors, and conference officials with role-based access and functionality. The application integrates with Google Calendar APIs for automated schedule synchronization and provides game result submission capabilities for community engagement.

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
- **Navigation**: Sticky header with smooth scrolling to homepage sections
- **Hero Section**: Conference branding with call-to-action buttons
- **Member Schools**: Interactive school directory with detailed information
- **Schedules & Results**: Filterable game schedules with game result submission form
- **Conference Standings**: Live standings tables for different sports
- **News Section**: Latest conference news and announcements
- **Contact Form**: Inquiry system with conference officials contact information

### Admin Dashboard
- **Authentication System**: Role-based access for Athletic Directors and officials
- **Game Management**: Create, edit, and manage game schedules with form validation
- **News Management**: Create and publish news articles with rich content
- **Submission Moderation**: Review and approve public game result submissions
- **Google Calendar Integration**: Real-time synchronization with sport-specific calendars
- **Data Analytics**: Dashboard metrics for schools, sports, games, and submissions

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
- **Google Calendar API**: Automated schedule synchronization for 8 sports
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

## Flask Scheduling Dashboard

### Overview
A separate Flask web application (`flask_app/`) provides secure scheduling management for Athletic Directors. This runs independently on port 5001 alongside the main website.

### Features
- **Secure Authentication**: Role-based access for Athletic Directors using school email addresses
- **CSV Upload System**: Upload schedules for 9 different sports across Fall/Winter/Spring seasons
- **Public Schedule View**: Conference-wide calendar accessible without login
- **JSON API**: RESTful endpoint for external application integration
- **SQLite Database**: Persistent storage for schedules, users, and upload history

### Integration Points
- Independent Flask application on port 5001
- Can integrate with main PostgreSQL database for shared data
- API endpoints available for cross-application data sharing
- Shared authentication potential for future unified login

### Athletic Director Access
Default login credentials (password: "password" - should be changed):
- Beecher: Brandon.DuBois@beecher200u.org
- Central: DJ.Harris@cusd4.org  
- Donovan: Kim.Onnen@donovanschools.org
- Gardner South Wilmington: Amber.Eisha@gswhs73.org
- Grace Christian Academy: Jon.Chappell@gracecrusaders.org
- Grant Park: Jared.Thompson@grantparkdragons.org
- Illinois Lutheran: Nathan.Hinz@ilhs.org
- Momence: Ted.Rounds@momence.k12.il.us
- St. Anne: Zach.Kirkland@stanne24.org
- Tri Point: Alison.Buckley@tripointschools.org

## Recent Features

### News Management System (Enhanced August 2025)
- **PDF Upload Functionality**: Dedicated "Upload PDF" button for principal-created letterhead documents
- **Enhanced Add Article**: Native article creation with image upload and drag-and-drop interface
- **File Upload Backend**: Complete multer-based file handling supporting images and PDFs up to 10MB
- **Visual Media Indicators**: Enhanced news display with badges showing attached PDFs and images
- **Static File Serving**: Secure file access with proper routing for uploaded content
- **Dual Upload Options**: Separate workflows for rich articles (with images) and quick PDF uploads

### Authentication & Admin System
- **Role-based Access**: Separate authentication for Athletic Directors and conference officials
- **Admin Dashboard**: Comprehensive admin interface with game management, news publishing, and submission moderation
- **Game Result Submissions**: Public form allowing visitors to submit game results for review
- **Google Calendar Integration**: Real-time synchronization with 8 sport-specific Google Calendars

### Enhanced User Experience
- **Homepage Restructuring**: Updated section ordering with proper anchor navigation (Home → Schedules → Schools → About → News → Contact)
- **Interactive Schedules**: Game result submission dialog integrated into schedules section
- **Conference Officials Contact**: Updated contact section to feature conference leadership instead of physical addresses
- **Form Validation**: Comprehensive validation for all user inputs with real-time feedback

### Technical Infrastructure
- **Calendar Service**: Backend service for Google Calendar API integration with iCal support
- **Database Schema**: Extended schema supporting users, game submissions, news management, conference officials, and file uploads
- **API Endpoints**: RESTful APIs for authentication, game result submissions, calendar synchronization, and file uploads
- **Type Safety**: Full TypeScript coverage with Zod validation schemas

### Visual Design System (Enhanced August 2025)
- **School Color Integration**: Complete color palette incorporating all 10 member schools (Beecher orange, Central blue, Grant Park green/gold, Illinois Lutheran navy/teal, Donovan gold, St. Anne red/yellow, Momence red)
- **Gradient Backgrounds**: Modern section gradients using school colors for visual differentiation
- **Enhanced Card Design**: Interactive cards with hover effects, colored borders, and subtle shadows
- **Section Dividers**: Modern gradient dividers using conference colors for professional appearance
- **Color-Coded Elements**: Sport-specific tabs, news categories, and game cards with school color themes
- **CSS Variable System**: Comprehensive custom property system for maintainable color management
- **Shadow System**: Color-tinted shadows (orange, blue, green, red) for enhanced depth
- **Typography**: Modern font stack with Inter for professional appearance

## Google Calendar Integration

### Sport Calendars
- RVC Volleyball
- RVC Soccer  
- RVC Girls Basketball
- RVC Boys Basketball
- RVC Baseball
- RVC Softball
- RVC Track
- RVC Scholastic Bowl

### Sync Capabilities
- Automated event retrieval from Google Calendar API
- iCal format support for external calendar applications
- Real-time schedule updates across all sports
- Event parsing for team matchups and game details

## Changelog

```
Changelog:
- August 01, 2025. Implemented comprehensive visual design system with school colors integration
- August 01, 2025. Enhanced all components with modern gradients, card designs, and color-coded elements
- August 01, 2025. Added comprehensive news management with PDF upload and image upload capabilities
- August 01, 2025. Enhanced with comprehensive admin dashboard and Google Calendar integration
- August 01, 2025. Added game result submission system for public users
- August 01, 2025. Implemented authentication system for Athletic Directors
- July 05, 2025. Added Flask scheduling dashboard for Athletic Directors
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```