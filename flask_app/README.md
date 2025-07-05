# RVC Scheduling Dashboard

A secure Flask web application for Athletic Directors to manage and share sports schedules for the River Valley Conference.

## Features

- **Secure Authentication**: Role-based access control for Athletic Directors using school email addresses
- **Schedule Management**: Upload CSV files for different sports and seasons
- **Public Schedule View**: Conference-wide calendar accessible to everyone
- **API Access**: JSON endpoint for external applications
- **Data Persistence**: SQLite database for reliable schedule storage

## Getting Started

### 1. Start the Application

```bash
cd flask_app
python app.py
```

The application will be available at http://localhost:5001

### 2. Login as an Athletic Director

Use these default credentials (password: `password` for all):

- **Beecher**: Brandon.DuBois@beecher200u.org
- **Central**: DJ.Harris@cusd4.org
- **Donovan**: Kim.Onnen@donovanschools.org
- **Gardner South Wilmington**: Amber.Eisha@gswhs73.org
- **Grace Christian Academy**: Jon.Chappell@gracecrusaders.org
- **Grant Park**: Jared.Thompson@grantparkdragons.org
- **Illinois Lutheran**: Nathan.Hinz@ilhs.org
- **Momence**: Ted.Rounds@momence.k12.il.us
- **St. Anne**: Zach.Kirkland@stanne24.org
- **Tri Point**: Alison.Buckley@tripointschools.org

**Important**: Change your password after first login!

### 3. Upload Schedules

Athletic Directors can upload CSV files with the following format:

```csv
date,time,opponent,location,home_away
2025-01-15,7:00 PM,Central High School,Home Gym,Home
2025-01-22,6:30 PM,Grant Park,Grant Park HS,Away
2025-01-29,7:00 PM,Donovan,Home Gym,Home
```

**Required columns:**
- `date` - Game date in YYYY-MM-DD format
- `time` - Game time (e.g., "7:00 PM")
- `opponent` - Opposing team name
- `location` - Game location
- `home_away` - Either "Home" or "Away"

### 4. Supported Sports

- Volleyball
- Soccer
- Girls Basketball
- Boys Basketball
- Baseball
- Softball
- Track
- Scholastic Bowl
- Math Competition

### 5. Public Access

Anyone can view the public schedule at `/schedule` without logging in. The page includes:
- Filters by sport, school, and date
- Responsive design for mobile and desktop
- Export capabilities via API

## API Documentation

### Get Games

```
GET /api/games
```

**Query Parameters:**
- `sport` - Filter by sport name
- `school` - Filter by school name
- `date` - Filter by specific date (YYYY-MM-DD)

**Example:**
```
GET /api/games?sport=Basketball&school=Beecher
```

**Response:**
```json
[
  {
    "id": 1,
    "school_name": "Beecher",
    "sport": "Basketball",
    "season": "Winter",
    "date": "2025-01-15",
    "time": "7:00 PM",
    "opponent": "Central",
    "location": "Home Gym",
    "home_away": "Home",
    "result": null,
    "notes": null
  }
]
```

## Security Features

- Password hashing using Werkzeug
- Session-based authentication
- Role-based access control (AD-only routes)
- File upload validation
- CSRF protection via Flask-Login

## File Structure

```
flask_app/
├── app.py                 # Main Flask application
├── templates/             # Jinja2 templates
│   ├── base.html         # Base template with Bootstrap
│   ├── index.html        # Home page
│   ├── login.html        # Login form
│   ├── dashboard.html    # AD dashboard
│   ├── upload.html       # Schedule upload form
│   ├── schedule.html     # Public schedule view
│   └── change_password.html
├── uploads/              # Temporary file uploads
├── sample_schedule.csv   # Example CSV format
└── rvc_schedule.db      # SQLite database (created on first run)
```

## Database Schema

### Users Table
- `id` - Primary key
- `email` - School email address (unique)
- `password_hash` - Hashed password
- `school_name` - School name
- `role` - User role (default: 'AD')

### Games Table
- `id` - Primary key
- `school_id` - Foreign key to users
- `sport` - Sport name
- `season` - Season (Fall/Winter/Spring)
- `date` - Game date
- `time` - Game time
- `opponent` - Opposing team
- `location` - Game location
- `home_away` - Home or Away
- `result` - Game result (optional)
- `notes` - Additional notes (optional)

### Schedule Uploads Table
- `id` - Primary key
- `school_id` - Foreign key to users
- `sport` - Sport name
- `season` - Season
- `filename` - Original filename
- `upload_date` - Upload timestamp

## Production Deployment

For production use:

1. Change the `SECRET_KEY` in app.py
2. Use a production WSGI server (gunicorn, uwsgi)
3. Consider using PostgreSQL instead of SQLite
4. Enable HTTPS
5. Set up proper logging
6. Configure environment variables for sensitive data

## Integration with Main Website

This Flask application runs independently on port 5001, while the main React/Express website runs on port 5000. The applications can share data through:

1. Direct database integration
2. API calls between services
3. Shared file system for schedule exports