# Phase 2: read-only Arbiter operations

## Architecture and readiness

RVC's existing Cloudflare Pages frontend reads Supabase with user JWTs and RLS.
A new `rvc-arbiter-sync` Supabase Edge Function uses server credentials, reads
Arbiter, and commits one atomic transaction through the existing Phase 1 tables.
One conference-level partner connection is the stable deduplication boundary.
School/group query duplicates use `uniqueGameId`; assignments use `uniqueSlotId`.
Unmatched games remain in `provider_game_links` with a null canonical game, rather
than a new parallel staging table. Suggested matches are held in metadata until
review. No canonical games, results, standings, conference flags, or schedules are
written by this adapter.

The credential belongs in the RVC-only secret named `rvc_arbiter_client_secret`
in Supabase Vault, or the server function's `ARBITER_CLIENT_SECRET`. Vault is
already installed on RVC. Human roles cannot execute its reader. Never place it
in connection configuration, Vite variables, logs, Git, or provider payloads.
Grace's environment and integration are outside this change.

## Deployment and recovery order

1. Run `npm ci`, `npm run test:arbiter`, `npm run check`, `npm run build:client`,
   and `deno check supabase/functions/rvc-arbiter-sync/index.ts`.
2. Review the additive Phase 2 migration and current live schema. The local
   PostgreSQL harness compiles Phase 1 and Phase 2, tests repeated imports,
   overlapping fences, immutable canonical schedules, and three scoped roles.
   It uses a minimal canonical-schema harness; it does not replace live role QA.
3. Apply `20261109023059_arbiter_read_only_sync.sql` to RVC only. It changes
   integration privileges and nullability; no canonical data is changed.
4. Set the RVC Vault credential securely and deploy the function. The handler
   validates user tokens with Auth and checks active conference-admin membership.
   If JWT gateway verification is disabled for the dedicated cron header, these
   internal checks remain mandatory. The client uses the ordinary user JWT.
5. Run a controlled manual pilot, inspect a real match, run twice, compare counts
   and canonical checksums, test anonymous and school-scoped access directly.
6. Deploy the client feature branch preview and verify the Integration Center,
   mapping queue, game detail, and `/admin/officiating` before merging.
7. Enable the optional scheduler only after pilot and UI acceptance.

Recovery is a **forward disable**: unschedule the named job, set
`configuration.automation_enabled=false` and `connection_status='disabled'`, and
restore the prior frontend deployment/function version. Preserve ingest history,
provider mappings, conflicts, and assignments for audit. No canonical restoration
is necessary because the importer never writes those records. An expired run is
failed on the next attempt; reimport starts from the retained successful cursor.
Do not drop integration tables or cascade-delete canonical games for rollback.

## API contract verified 2026-11-08

Live documentation: https://partner.arbitersports.com/swagger/v1/swagger.json.
OAuth client credentials: `https://token.arbitersports.com/connect/token`, scopes
`Scheduling Assigning`; observed token lifetime 3,600 seconds. Arrays are repeated
query keys. `DateFilter=Range` needs `GameStartDate` and `GameEndDate`.
No page, page-size, or continuation parameter is documented for these endpoints.
The adapter fails on unexpected envelopes or continuation headers instead of
pretending an incomplete page is a complete import. Supabase reads are paginated.

`GetGames`: `SchoolIds`, `GroupIds`, `GameModifiedSince`, `GameModifiedTo`,
`IncludeDeletedGames`, `IncludePendingInformation` are supported.
`GetAssignments`: `SchoolIds`, `GroupIds`, `AssignmentModifiedSince`,
`IncludeDeletedAssignments`, `IncludePendingInformation` are supported.
The by-ID endpoints use repeated `uniqueGameIds` (lowercase first letter).
`DeletedGames` uses `fromDate` and `toDate`.

HTTP 200 empty arrays, HTTP 403, HTTP 401, HTTP 404, and transport failures are
separate states. Natalia documented GetGames 404 as no games; assignment/deleted
404 remains unavailable, not a successful proof of zero records.
Requests have timeouts, bounded backoff, one token refresh, Retry-After handling,
and no redirects. Only allowlisted read endpoints and the token POST are allowed.

Live `fromDate` and `lastModifiedDate` often omit UTC offsets. We use the game’s
explicit `utcOffset` and retain its original time, timezone label, and modification
string. We do **not** claim a naive modification string is UTC. Supplied `CST/-6`
values occur even in summer; timestamp disagreements require review. The modified
filter returned five Grace records for Nov 1–8, but its timezone/boundary semantics
still need vendor confirmation. Until then, synchronization uses bounded rolling
reconciliation (past 30 days/future 210 days); the cursor records completed windows
rather than an unsafe modification watermark. Historical discovery covered
Aug 1, 2026–Jun 30, 2027. Older corrections need a deliberate historical backfill.

## Matching, coverage, and privacy

Reviewed mappings win. Exact unique identities require sport, gender, level,
provider school IDs, sides, and identical timestamps. Date/team matches with time
or side differences are suggestions. Coops, ambiguous doubleheaders, and unknown
opponents stay for review; no conference-contest inference occurs. Multiple
external games claiming one canonical game are not silently merged.

Game conflicts retain both values. Mapping approval never accepts a provider
schedule; existing audited RVC workflows remain responsible for schedule changes.
Imported mappings cannot be remapped through the simple review RPC; an audited
administrator correction must first reconcile their assignments.

Documented slot statuses Pending (4), Published (5), Notified (6) map to assigned;
Accepted (7) maps to accepted. Observed live statuses match those names. Unknown
or negated text stays unknown. No observed declined/tombstone example was available;
those normalization paths are unit/database tested, not claimed live-proven.

Expected crew sizes are not exposed by the tested records. They stay null, so
accepted visible slots do not imply a complete crew. Empty/inaccessible assignment
queries display unavailable/unknown rather than open. Assignment omission does not
prove removal; only explicit provider deletion/removal changes history. Old rows
are retained. Contact details, payment, fees, eligibility, private travel notes,
and assigner personal data are stripped before database storage; even raw_payload
is intentionally empty. Assignment details remain behind RLS, never public.

## Ownership, freshness, and alerts

Conference administrators own credentials, manual refresh, matching, and conflict
triage. ADs/principals read their authorized games. The Integration Center shows
last successful sync, retrieved/matched/review/conflict counts, API response states,
recent failures, and school/group configuration. Six hours without a successful
game refresh is stale. Persistent failures should be reviewed from that queue;
no email is sent automatically by this implementation.

Start with every two hours (12 runs/day); verify vendor rate limits before
activation. This is deliberately conservative for school scheduling needs. A
15-minute database lease/fence prevents overlapping imports; the atomic commit
fails for expired jobs. Future incremental mode requires confirmed timestamp and
removal semantics, then a periodic broad reconciliation as a safety net.

## Credential rotation

Disable automation, replace the existing Vault secret by its ID using the secure
Supabase dashboard (never paste it into an issue), run a manual authenticated
pilot, verify the school scope and assignment data, and reenable the job. If a
credential is revoked, the next run fails without moving the successful cursor.
Tokens are memory-only and refreshed at least 60 seconds before expiration.

## Optional scheduler activation (after pilot acceptance)

RVC currently has no pg_cron/pg_net scheduler installed. Enable the supported
Supabase Cron and pg_net extensions first; do not create a new external Worker.
Store a generated `rvc_arbiter_cron_secret` in Vault. The function can validate
that secret using a service-only RPC; it never returns it. Deploy with internal
authentication enforced. Then schedule this single named job:

```sql
select cron.schedule('rvc-arbiter-read-only', '17 */2 * * *', $$
  select net.http_post(
    url := 'https://vekqbtfojdnnkdernxzp.supabase.co/functions/v1/rvc-arbiter-sync',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-rvc-cron-secret',(select decrypted_secret from vault.decrypted_secrets
        where name='rvc_arbiter_cron_secret' limit 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000
  );
$$);
```

Separately set `automation_enabled=true` only after verifying the named job is the
exclusive scheduler. Unschedule with `cron.unschedule('rvc-arbiter-read-only')`.
Do not enable while the feature remains an unaccepted pilot. Function resource
limits and runtime for all-school requests must be measured before activation.
