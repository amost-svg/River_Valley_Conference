# Replit migration status

## Target architecture

- React and Vite frontend on Cloudflare Pages
- Supabase Postgres for conference data
- Supabase Auth for administrator accounts
- Supabase Storage for logos, news media, documents, and schedule imports
- Cloudflare Pages Functions only for privileged workflows that should not run in the browser
- GitHub pull requests and Cloudflare previews for every production change

## Completed

- Cloudflare Pages project and `wrangler.toml`
- SPA routing through `client/public/_redirects`
- Supabase project with the core RVC schema, reference schools and sports, RLS policies, workflow functions, and storage buckets
- Supabase password login, invitations, and password recovery
- Replit-specific Vite plugins removed
- Replit run configuration removed
- Retired Flask prototype, Replit notes, generated ZIP archives, and duplicate attached assets removed
- School and conference logos consolidated under `client/public/logos`
- Default development and production builds now use Vite directly
- GitHub Actions validation added

## Temporary dependency

The current `/api/*` Pages Function still supports `API_ORIGIN` as a temporary bridge to the legacy Express API. The Cloudflare deployment does not currently have that value configured, so those endpoints return an intentional configuration error rather than silently using an unknown backend.

## Next migration phase

1. Export the live Replit PostgreSQL data and local uploads.
2. Import schedules, results, standings, news, and submissions into Supabase.
3. Replace frontend `/api/*` calls with Supabase queries and narrowly scoped RPC calls.
4. Move uploads to the existing Supabase Storage buckets.
5. Validate all public pages and administrator workflows.
6. Remove `API_ORIGIN`, the compatibility proxy, and the legacy Express server.

Do not disconnect or delete the Replit database until the import totals and production workflows have been verified.
