# RVC Source of Truth

This document describes the River Valley Conference schedule, results, standings, honors, conference-news, and conference-resource system.

## Purpose

The official RVC website should be the dependable public record for:

- Member schools and season-specific cooperative programs
- Conference schedules, postponements, cancellations, and confirmed results
- Conference standings and recorded tie-break decisions
- Conference champions and All-Conference recognition
- Academic All-Conference and Scholar-Athlete recognition
- Genuine public conference announcements, event recaps, and schedule updates

Google Drive remains the source for collaborative documents and historical working files. Supabase is the structured operational database. The website is the official public presentation layer.

## Application routes

### Public

- `/` — public RVC homepage, including schools, schedules, standings, and published announcements
- `/conference` — redirects to the public homepage standings section

### Authenticated

- `/conference-admin` — role-aware workspace landing page
- `/conference-admin/core` — schedules, scores, standings, honors, events, co-ops, and data-quality review
- `/conference-admin/games` — rescheduling, postponement, cancellation, and forfeits
- `/conference-admin/content` — public news writing and the members-only rules and conference-resource library

## Core data model

Existing tables remain in use for schools, sports, seasons, teams, venues, games, result submissions, final results, standings, documents, contacts, calendars, and the audit log.

The source-of-truth work adds:

- `school_aliases`
- `cooperative_programs`
- `cooperative_program_schools`
- `team_schools`
- `standings_rules`
- `standings_tie_resolutions`
- `result_confirmations`
- `tournaments`
- `tournament_entries`
- `tournament_games`
- `awards`
- `award_recipients`
- `conference_events`
- `data_quality_issues`

## Public and administrative separation

The public homepage is the presentation layer. It receives approved school information, schedules, final results, standings, and published announcements from Supabase.

Rules, constitutions, operations guides, officials information, and other conference working resources are restricted to authenticated RVC members. A database trigger forces all `conference_documents` records to members-only visibility so an administrative mistake cannot expose them publicly.

## Conference news

The news section is for public discourse, not a file dump. Appropriate items include:

- Official conference statements
- Schedule or event announcements
- Conference-wide recognition stories
- Event and championship recaps
- Features that represent multiple schools or the conference as a whole

Individual certificates should be stored with honors records or in Drive rather than published as separate news stories.

News editors may save drafts or publish complete stories from `/conference-admin/content`. A public story requires a headline, homepage summary, and full body. Supporting links are optional.

## Member-school branding

School names and mascots come from the RVC Member Schools spreadsheet. School cards use the existing school-profile artwork from the prior official RVC site and each program's established athletic color palette. Because the spreadsheet does not provide official hex codes, the website uses web-safe color approximations rather than claiming a formal brand-standard value.

## Result workflow

1. An authorized school representative submits a score.
2. A confirmation record is created for both participating teams.
3. Each school confirms or disputes the submitted result.
4. When both teams confirm, the result becomes final automatically.
5. A conference administrator or official may override a dispute only with a recorded reason.
6. Finalization recalculates the applicable sport standings.

Final scores cannot be entered by changing a game status directly.

## Schedule changes and forfeits

Authorized school roles may reschedule, postpone, or cancel a game they manage. Postponements and cancellations require a note.

Only a conference administrator or conference official may record a forfeit. The forfeit workflow:

- Requires a conference explanation
- Records the forfeiting team
- Creates a 1–0 final result
- Rejects pending score submissions for that game
- Recalculates standings
- Writes the change to the audit log

## Standings

Conference rankings use conference winning percentage rather than overall winning percentage.

The calculation applies:

1. Conference winning percentage
2. Head-to-head results among teams tied at the same conference percentage
3. A recorded conference resolution when the sport's cascading comparison or blind-draw rule is still required

Before games have been played, the public standings section displays participating teams without implying a meaningful rank.

## Honors and privacy

The public awards model stores only approved public information:

- Recipient name
- School or team association
- Placement or recognition category
- Graduation year when appropriate
- Approved public biography

Private Scholar-Athlete application fields such as home address, phone number, guardian information, GPA details, rank, test scores, and recommendations are not imported into public tables.

## 2026–27 reference data

The active Supabase project has been seeded with:

- 72 varsity team records
- 10 main-campus venues
- 8 standings-rule configurations
- 15 conference events and deadlines
- 12 governing and sport-operations resources
- 5 paused tournament workspaces retained for possible future use
- 17 award definitions
- 1 approved cooperative program

Two data-quality issues intentionally remain open:

1. The approved Tri-Point / Gardner-South Wilmington girls-basketball co-op conflicts with the master schedule, which lists separate teams.
2. The 2026–27 soccer master contains duplicate and self-matchup rows.

Those conflicts are blocked from publication until conference leadership resolves them.

## Master-schedule import

The schedule importer accepts the `Importable RVC Master` CSV and:

- Imports only the active 2026–27 season
- Normalizes school aliases
- Skips blank and BYE rows
- Rejects self-matchups
- Rejects schools not configured for the sport
- Skips duplicates
- Blocks the unresolved girls-basketball co-op conflict
- Allows validated rows to remain internal drafts until times and locations are verified

Imported default start times must be verified by the appropriate AD before publication.

## Security model

- RLS is enabled on every source-of-truth table.
- Anonymous users see only approved public data and published news.
- Conference documents are members-only.
- Authenticated users see data permitted by conference or school membership.
- Write operations are restricted by conference role, school role, or both.
- Sensitive workflows use `SECURITY DEFINER` RPC functions with explicit internal role checks and fixed search paths.
- Every new operational table has audit triggers.
- Foreign-key lookup indexes cover the new operational relationships.
