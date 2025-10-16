# River Valley Conference Website

## Overview
This project is a dynamic web application for the River Valley Conference IHSA organization. Its primary purpose is to provide a central platform for public users, authenticated Athletic Directors, and conference officials. Key capabilities include displaying school directories, sports schedules, conference standings, news, and administrative tools. It aims to enhance community engagement through features like game result submissions and automated schedule synchronization via Google Calendar APIs. The platform supports role-based access and focuses on providing comprehensive information and management tools for the conference.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Styling**: TailwindCSS with a custom conference color scheme (navy, gold, green) and integrated school-specific color palettes.
- **UI Components**: shadcn/ui for consistent, accessible design.
- **Design Elements**: Modern gradient backgrounds, interactive card designs with hover effects, color-coded elements (e.g., sport-specific tabs, news categories), and modern typography using Inter font.
- **Navigation**: Sticky header with smooth scrolling to homepage sections.
- **Accessibility**: Built with accessible UI component primitives.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite for fast builds, React Query for server state management, Wouter for routing, and React Hook Form with Zod for form management.
- **Backend**: Node.js with Express.js, TypeScript, PostgreSQL database managed with Drizzle ORM and Neon serverless driver. RESTful API design.
- **Authentication**: Role-based access for Athletic Directors and conference officials.
- **Admin Dashboard**: Comprehensive interface for game, news, and submission management.
- **News Management**: Supports rich articles with image uploads and PDF uploads, including publishing controls.
- **Game Submission System**: Public and Athletic Director forms for adding games, with an admin review and approval workflow.
- **Pending Submissions Review**: Dashboard card and detailed dialog for moderating pending game and result submissions, with calendar visual indicators.
- **Flask Scheduling Dashboard**: Separate Flask application (`flask_app/`) for Athletic Directors, offering secure schedule uploads via CSV and a public schedule view, running independently on port 5001.

### Feature Specifications
- **Data Models**: Schools, Sports, Games, Standings, News, Contacts.
- **Interactive Features**: Filterable game schedules, live standings tables, contact form.
- **Admin Tools**: Game management, news management, submission moderation, Google Calendar integration, data analytics.
- **Legal Documentation**: Comprehensive Privacy Policy and Terms of Use with dedicated routes.
- **Enhanced User Experience**: Homepage restructuring, interactive schedules, updated contact section.
- **Type Safety**: Full TypeScript coverage across the stack with Zod validation schemas.

## Recent Updates (October 16, 2025)

### Pending Submissions Review System
- **Pending Items Dashboard Card**: Visual card displaying counts of pending games and pending results with click-to-review functionality
- **Comprehensive Review Dialog**: PendingSubmissionsDialog with advanced filtering by sport, school, and date range
- **Calendar Visual Indicators**: Orange pulsing badges on calendar dates showing count of pending submissions per day
- **Batch Operations**: Approve or reject multiple submissions with admin notes and moderation tracking
- **Click-to-Review Workflow**: Calendar badges open review dialog filtered to that specific date for quick moderation

### News Management Enhancements
- **Advanced PDF Upload**: Complete PDF upload dialog with title, category, excerpt, PDF file input, and optional thumbnail image
- **Publish/Unpublish Toggle**: One-click toggle to publish or unpublish articles with visual status indicators (eye icon)
- **Article Deletion**: Delete button with confirmation dialog to prevent accidental deletions
- **Visual Status Badges**: Draft/Published badges, Image/PDF attachment indicators for clear content visibility
- **Backend API Support**: PATCH and DELETE endpoints for complete news article lifecycle management
- **Edit Functionality**: Edit button for each article (full edit dialog coming soon)

## External Dependencies

### Core Services
- **Google Calendar API**: For automated schedule synchronization across 8 sports.
- **NFHS Network**: Live streaming platform integration.
- **YouTube**: Video streaming platform integration.
- **IHSA**: Illinois High School Association integration.
- **@neondatabase/serverless**: PostgreSQL database connection.

### Libraries & Frameworks
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **@radix-ui/***: Accessible UI component primitives.
- **react-hook-form**: Form state management.
- **zod**: Schema validation.
- **wouter**: Lightweight routing library.
- **multer**: For file handling in news uploads.