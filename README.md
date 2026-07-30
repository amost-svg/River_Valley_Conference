# River Valley Conference

The official public website and conference-operations portal for the River Valley Conference (RVC), an IHSA conference serving ten member schools in northeastern Illinois.

## What the platform does

- Publishes the conference’s game-day view, schedules, verified results, and automatically calculated standings.
- Gives athletic directors and principals a secure daily dashboard for games, scores, confirmations, school profiles, and conference resources.
- Requires both opponents to confirm a submitted score before it becomes an official result, with conference-administrator review for disputes.
- Supports approved cooperative programs, including the Tri-Point/GSW girls-basketball program.
- Keeps private conference documents behind authenticated membership access.
- Provides conference leaders with schedule import, data-quality, tournament, honors, event, and user-management tools.

## Source-of-truth model

| Information | Authoritative system |
| --- | --- |
| Games, results, standings, users, schools, events, and public content | Supabase |
| Collaborative and historical working documents | Google Drive |
| Initial 2026–27 schedule import | `Importable RVC Master` Google Sheet |
| Public website | Cloudflare Pages |

The website reads public information directly from Supabase. Authenticated operations use Supabase Auth, Row Level Security, and narrowly scoped database functions.

## Technology

- React, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- TanStack Query for client-side data synchronization
- Supabase Postgres, Auth, Storage, Row Level Security, and database functions
- Cloudflare Pages for the static production site

The old Replit Express/Postgres implementation remains in the repository only as migration history. Production does not depend on the legacy `/api` server.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run check
npm run build:client
npm run dev
```

Create a local `.env` file with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Never commit service-role keys or user credentials.

## Routes

- `/` — public conference homepage
- `/login` — conference sign-in
- `/admin` — daily AD/principal/conference dashboard
- `/conference-admin/core` — conference-wide operations and source-of-truth tools
- `/conference-admin/games` — specialist game operations
- `/conference-admin/content` — specialist content administration

## Schedule operations

Imported master-schedule rows are published with their dates and opponents, while their start time is shown as **Time TBA** until a school verifies it. Athletic directors can then update operational details and report results through the dashboard. Approved results automatically recalculate the public standings.

The 2026–27 import intentionally excludes:

- BYE rows
- self-matchups and exact duplicates
- superseded Tri-Point girls-basketball rows (the approved co-op uses GSW’s schedule)
- two extra boys-soccer matchups held for athletic-director confirmation

## Database changes

Versioned SQL lives in `supabase/migrations`. Apply migrations through the connected Supabase project, then run the type check and client build before publishing.

## Production checks

Before release:

```bash
npm run check
npm run build:client
```

Then verify the public homepage, school profiles, schedule filters, standings, contact submission, login, and authenticated dashboard against the production Supabase project.
