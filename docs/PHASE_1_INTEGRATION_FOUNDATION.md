# Phase 1 — Sports Data Integration Foundation

## Purpose

Phase 1 turns the RVC platform into a provider-neutral conference sports-data hub without changing the current source-of-truth behavior for games, results, standings, or public schedules.

The governing rule is:

> RVC owns the canonical game. External providers own the fields they are responsible for, and their data attaches to the RVC game through explicit mappings.

No provider may silently overwrite canonical RVC schedule or result data.

## Source-of-truth boundaries

| Data | Authority |
| --- | --- |
| Member schools, teams, seasons, sports, levels | RVC |
| Conference game identity | RVC |
| Canonical schedule and verified game changes | RVC |
| Official conference result and standings | RVC |
| Official assignments and assignment acceptance | Arbiter / Horizon / future officiating provider |
| Detailed game scoring and statistics | GameChanger / Hudl / future scoring provider |
| MaxPreps publication / IHSA reporting | RVC outbound publication adapter |

## Phase 1 schema

### `integration_providers`
Catalog of supported providers and high-level capabilities. Initial providers:

- ArbiterSports
- HorizonWebRef
- MaxPreps
- GameChanger
- Hudl

This table never stores credentials.

### `provider_connections`
Represents a concrete RVC connection to a provider account, organization, school, or assigning group.

Examples:

- ArbiterSports → Joe Ewers assigning group
- HorizonWebRef → a specific officials organization
- MaxPreps → RVC partner connection

`configuration` and IDs are non-secret metadata only. Tokens, API keys, client secrets, refresh tokens, and passwords belong in server-side Supabase secrets/Vault or another approved secret store.

### `provider_game_links`
Maps one canonical RVC game to its corresponding external game record. It preserves both the provider's external game ID and any provider-supported custom ID.

Matching states:

- `unmatched`
- `suggested`
- `matched`
- `conflict`
- `ignored`

The mapping also stores how the match was made and a confidence value when heuristic matching is used.

### `provider_ingest_events`
Audit trail for raw inbound provider payloads and their normalized representation. This is intentionally internal because provider payloads can contain operational or personal information.

### `official_assignments`
Normalized official-assignment records attached to an RVC game. Provider-specific terminology is retained in `provider_status`, while RVC uses a small stable vocabulary:

- `unknown`
- `open`
- `assigned`
- `accepted`
- `declined`
- `removed`

### `integration_conflicts`
Records differences that require a human decision rather than overwriting RVC data. A schedule mismatch such as RVC 6:00 PM vs. Arbiter 6:30 PM should become a conflict here.

### `sync_runs`
The existing RVC sync ledger is extended with an optional provider connection, sync kind, and cursor. This avoids creating a second competing history of synchronization activity.

### `game_officiating_status`
A security-invoker view that reduces provider assignment data to a game-level status:

- `unknown`
- `open`
- `partially_filled`
- `filled_unconfirmed`
- `confirmed`
- `attention_needed`

## Provider adapter contract

Each provider adapter should eventually implement a common conceptual contract:

```text
connect / authorize
identify organizations or assigning groups
fetch changed games
fetch changed assignments
normalize provider statuses
map provider games to canonical RVC games
record raw ingest event
upsert normalized assignments
surface conflicts instead of overwriting canonical fields
record sync run and cursor
```

Outbound providers will add a parallel publication contract later:

```text
publish schedule
publish result
publish correction
read publication status / acknowledgment
```

## Arbiter Phase 2

Initial Arbiter work remains read-only:

1. Obtain Joe Ewers's authorization and API credentials.
2. Create the provider connection.
3. Discover group/school IDs.
4. Pull games incrementally using provider modification timestamps.
5. Match Arbiter games to RVC games, preferring stable/custom IDs when available.
6. Pull assignment slots and statuses.
7. Normalize assignment statuses.
8. Surface crew coverage on RVC game views.
9. Record changed/deleted provider games without deleting RVC history.

## Horizon Phase 3

Horizon uses the same RVC tables and UI. The adapter should use OAuth and begin with read-only organization access. Write scopes should be evaluated only after the read integration is proven and the ownership rules for schedule changes are explicit.

## Phase 1 proof fixture

The Integration Center includes a non-live normalization fixture representing a three-person crew:

```json
{
  "expected_positions": 3,
  "assignments": [
    { "provider_status": "Accepted", "normalized_status": "accepted" },
    { "provider_status": "Accepted", "normalized_status": "accepted" },
    { "provider_status": "Assigned", "normalized_status": "assigned" }
  ]
}
```

Expected RVC summary:

```text
assigned: 3
accepted: 2
declined: 0
coverage: filled_unconfirmed
```

This fixture verifies that the UI consumes normalized RVC concepts rather than provider-specific labels. The next proof replaces the fixture with one real Arbiter game after credentials are provisioned.

## Security rules

- No vendor credentials in browser code, Git, `provider_connections.configuration`, or raw public tables.
- Integration tables have RLS enabled.
- Raw ingest events remain conference-internal.
- Official-assignment data is visible only to conference roles or users authorized for the associated game.
- Provider views use `security_invoker` so they do not bypass RLS.
- External data must be treated as untrusted input and validated before normalization.

## Deployment order

1. Review and validate the migration in a transaction or development database.
2. Run TypeScript check and client build.
3. Apply the migration to the RVC Supabase project.
4. Verify RLS as conference admin and school-scoped users.
5. Deploy the client with the Integration Center route.
6. Do not create live provider connections until credentials are stored server-side.
