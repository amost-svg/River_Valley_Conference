# RVC Source of Truth

This document describes the River Valley Conference schedule, results, standings, tournament, honors, and conference-resource system.

## Purpose

The official RVC website should be the dependable public record for:

- Member schools and season-specific cooperative programs
- Conference schedules, postponements, cancellations, and confirmed results
- Conference standings and recorded tie-break decisions
- Tournament seeds and brackets
- Conference champions and All-Conference recognition
- Academic All-Conference and Scholar-Athlete recognition
- Conference meetings, deadlines, festivals, and governing documents

Google Drive remains the source for collaborative documents and historical working files. Supabase is the structured operational database. The website is the official public presentation layer.

## Application routes

### Public

- `/conference` — conference hub
- `/conference/tournaments` — published tournament brackets

### Authenticated

- `/conference-admin` — role-aware workspace landing page
- `/conference-admin/core` — schedules, scores, standings, honors, resources, co-ops, and data-quality review
- `/conference-admin/games` — rescheduling, postponement, cancellation, and forfeits
- `/conference-admin/tournaments` — seeding, bracket generation, and bracket publication

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

Pending ties are visible to conference administrators and block automatic tournament seeding.

## Tournaments

Draft tournament workspaces have been created for volleyball, boys soccer, girls basketball, boys basketball, and Scholastic Bowl.

The tournament workflow:

1. Resolve pending standings ties.
2. Seed tournament entries from official standings or enter approved seeds manually.
3. Generate the bracket.
4. Review BYEs and round advancement sources.
5. Publish the approved bracket.

Only published or completed tournaments and bracket games are available to anonymous users.

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
- 5 tournament workspaces
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

## Supabase migrations

The following migrations are recorded in the hosted project's migration history:

- `20260715123636_rvc_source_of_truth_schema`
- `20260715123732_rvc_result_confirmation_workflow`
- `20260715123947_rvc_conference_standings_ranking`
- `20260715124038_rvc_source_of_truth_rls`
- `20260715124104_rvc_source_of_truth_audit_triggers`
- `20260715124516_rvc_2026_27_teams_seed`
- `20260715124634_rvc_2026_27_rules_events_documents_seed`
- `20260715124719_rvc_2026_27_coops_tournaments_awards_seed`
- `20260715130957_rvc_forfeits_and_bracket_generation`

## Required deployment variables

Cloudflare Pages must provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

The browser never receives a Supabase service-role key.

## Security model

- RLS is enabled on every source-of-truth table.
- Anonymous users see only approved or published public data.
- Authenticated users see data permitted by conference or school membership.
- Write operations are restricted by conference role, school role, or both.
- Sensitive workflows use `SECURITY DEFINER` RPC functions with explicit internal role checks and fixed search paths.
- Every new operational table has audit triggers.
