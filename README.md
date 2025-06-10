# River Valley Conference Website

A modern, professional website for the River Valley Conference IHSA organization featuring school directories, sports schedules, conference standings, and news announcements.

## Features

- **Member Schools Directory**: Displays all 10 River Valley Conference schools with authentic logos and information
- **Sports Schedules & Results**: Interactive schedule viewer with game results across multiple sports
- **Conference Standings**: Real-time standings tables for Football and Basketball
- **News & Announcements**: Latest conference news and updates
- **Contact System**: Contact form for inquiries and communication
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **PostgreSQL Database**: Persistent data storage for all conference information

## Technology Stack

- **Frontend**: React + TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: TailwindCSS with custom conference color scheme
- **Icons**: Lucide React icons

## River Valley Conference Schools

1. Beecher High School (Bobcats) - Beecher, IL
2. Central High School (Comets) - Clifton, IL
3. Donovan High School (Wildcats) - Donovan, IL
4. Gardner South Wilmington High School (Panthers) - Gardner, IL
5. Grace Christian Academy (Crusaders) - Huntley, IL
6. Grant Park High School (Dragons) - Grant Park, IL
7. Illinois Lutheran High School (Chargers) - Crete, IL
8. Momence High School (Redskins) - Momence, IL
9. St. Anne High School (Cardinals) - St. Anne, IL
10. Tri-Point High School (Chargers) - Cullom, IL

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   
   # Seed the database with River Valley Conference data
   npx tsx server/seed.ts
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### Production Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── seed.ts            # Database seeding script
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── README.md              # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database viewer)

## Database Schema

The application uses PostgreSQL with the following main tables:

- **schools**: Member school information
- **sports**: Available sports programs
- **games**: Game schedules and results
- **standings**: Conference standings by sport
- **news**: News articles and announcements
- **contacts**: Contact form submissions

## Customization

### Colors

The website uses a custom color scheme defined in `client/src/index.css`:

- **Conference Navy**: Primary brand color
- **Conference Gold**: Secondary accent color
- **Conference Green**: Additional accent color

### Content

- School information is stored in the database and can be updated through the database
- News articles can be added through the database
- Game schedules and standings are managed through the database

## Support

For questions about the River Valley Conference website, please contact the conference administration through the contact form on the website.

## License

This project is developed specifically for the River Valley Conference IHSA organization.