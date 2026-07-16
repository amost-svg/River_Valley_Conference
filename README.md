# River Valley Conference website

The River Valley Conference website is a React and TypeScript application for
member-school information, schedules, results, standings, news, and conference
administration.

## Current platform

- Source control and review: GitHub
- Frontend hosting: Cloudflare Pages
- Database and authentication: Supabase
- Frontend: React, TypeScript, Vite, Tailwind CSS, and shadcn/ui

The default development and production workflows no longer require Replit.

## Development

Requirements:

- Node.js 20
- npm

Install and run:

```bash
npm ci
npm run dev
```

The Vite development server prints its local URL when it starts.

## Validation

```bash
npm run check
npm run build
```

The production frontend is written to `dist/public`. GitHub Actions runs both
commands on every pull request and every push to `main`.

## Environment variables

Copy `.env.example` to `.env.local` for local development and provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`API_ORIGIN` is a temporary migration bridge for legacy `/api/*` routes. It
must be removed after those calls are converted to Supabase. Never commit real
keys, database connection strings, or service-role credentials.

## Deployment

Cloudflare Pages builds the repository with:

- Build command: `npm run build`
- Output directory: `dist/public`

Every pull request receives a Cloudflare preview. Merge only after the preview
and GitHub validation checks pass.

## Migration

See [MIGRATION_STATUS.md](MIGRATION_STATUS.md) for the Replit retirement plan,
what has already moved, and what remains before the old backend can be switched
off.

## Repository layout

```text
client/       React application and public assets
functions/    Cloudflare Pages Functions
shared/       Shared validation and scoring logic
server/       Temporary legacy Express API reference
legacy/       Retired Flask prototype
scripts/      Temporary data-migration utilities
```
