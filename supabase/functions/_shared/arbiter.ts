/** Read-only adapter for the live Arbiter External API v1 (verified 2026-11-08).
 * No generic URL/method escape hatch: only the listed GET endpoints and OAuth POST.
 */
export const SCHOOL_IDS: Record<string, number> = {
  beecher: 1417, central: 4536, donovan: 6040, 'gardner-south-wilmington': 8260,
  'grace-christian-academy': 8753, 'grant-park': 8900, 'illinois-lutheran': 10737,
  momence: 14948, 'st-anne': 21900, 'tri-point': 23756,
};
export const GROUP_IDS = [112994, 113158];
export type Row = Record<string, any>;
export type Outcome = { state: 'available' | 'empty' | 'unavailable'; status: number; rows: Row[] };
const endpoints = new Set(['/api/Identity', '/api/Group', '/api/School/GetAllSchools',
  '/api/School/GetPartnerIdsForSchools', '/api/Game/GetGames', '/api/Game/GetGamesByUniqueGameIds',
  '/api/Game/DeletedGames', '/api/Assignment/GetAssignments', '/api/Assignment/GetAssignmentsByUniqueGameIds']);
export class ProviderError extends Error {
  constructor(public status: number, public endpoint: string) { super(`Arbiter ${endpoint}: HTTP ${status}`); }
}
export class ArbiterClient {
  private token = ''; private expires = 0;
  constructor(private secret: string, private transport: typeof fetch = fetch,
    private pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms))) {}
  private async authenticate() {
    if (this.token && this.expires > Date.now() + 60_000) return;
    const r = await this.transport('https://token.arbitersports.com/connect/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: 'RiverValleyConference', client_secret: this.secret,
        grant_type: 'client_credentials', scope: 'Scheduling Assigning' }),
    });
    if (!r.ok) throw new ProviderError(r.status, 'authentication');
    const p = await r.json();
    if (typeof p.access_token !== 'string' || !p.access_token) throw new Error('Invalid Arbiter token response');
    this.token = p.access_token; this.expires = Date.now() + Math.min(Number(p.expires_in) || 300, 3600) * 1000;
  }
  async get(path: string, params: Record<string, string | number | boolean | number[]> = {}): Promise<Outcome> {
    if (!endpoints.has(path)) throw new Error('Unsupported Arbiter endpoint');
    const url = new URL(path, 'https://partner.arbitersports.com');
    for (const [k, v] of Object.entries(params)) for (const n of Array.isArray(v) ? v : [v]) url.searchParams.append(k, String(n));
    // v1 documents no paging parameters. Fail on an unexpected envelope/continuation;
    // do not silently mark a truncated response successful.
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.authenticate();
      let r: Response;
      try { r = await this.transport(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(40_000),
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' } }); }
      catch { if (attempt === 3) throw new Error(`Arbiter transport failure: ${path}`); await this.pause(500 * 2 ** attempt); continue; }
      if (r.status === 401 && attempt === 0) { this.token = ''; continue; }
      if ((r.status === 429 || r.status >= 500) && attempt < 3) {
        const retry = r.headers.get('Retry-After');
        const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : 500 * 2 ** attempt;
        if (delay > 10_000) throw new ProviderError(r.status, path); // retry next run instead of exhausting runtime
        await this.pause(delay); continue;
      }
      if (r.status === 403) return { state: 'unavailable', status: 403, rows: [] };
      if (r.status === 404) {
        // Natalia confirmed this specific endpoint returns 404 for an empty group.
        // Other 404s remain unavailable; zero assignments cannot establish coverage.
        return { state: path === '/api/Game/GetGames' ? 'empty' : 'unavailable', status: 404, rows: [] };
      }
      if (!r.ok) throw new ProviderError(r.status, path);
      if (r.headers.has('Link') || r.headers.has('X-Next-Page')) throw new Error(`Unexpected Arbiter pagination: ${path}`);
      const p = await r.json();
      const rows: Row[] | null = Array.isArray(p) ? p : p && typeof p === 'object' &&
        ('uniqueGameId' in p || 'groupId' in p || 'schoolId' in p) ? [p] : null;
      if (!rows || rows.some(x => !x || typeof x !== 'object')) throw new Error(`Unexpected Arbiter response shape: ${path}`);
      return { state: rows.length ? 'available' : 'empty', status: r.status, rows };
    }
    throw new Error(`Arbiter retry limit: ${path}`);
  }
}
export const text = (v: unknown) => typeof v === 'string' ? v.trim().slice(0, 250) : '';
export const key = (v: unknown) => text(v).toLowerCase().replace(/[^a-z0-9]/g, '');
const validId = (v: unknown): string => {
  if (!Number.isSafeInteger(v) || Number(v) <= 0) throw new Error('Missing stable Arbiter identifier');
  return String(v);
};
export function providerDate(v: unknown, offset?: number | null): string | null {
  const value = text(v);
  if (!value || !/^\d{4}-\d\d-\d\dT/.test(value)) return null;
  // Never let the host timezone interpret a naive provider timestamp.
  if (!/(Z|[+-]\d\d:\d\d)$/i.test(value)) {
    if (typeof offset !== 'number' || !Number.isInteger(offset) || Math.abs(offset) > 14) return null;
    return providerDate(`${value}${offset < 0 ? '-' : '+'}${String(Math.abs(offset)).padStart(2, '0')}:00`);
  }
  const ms = Date.parse(value); return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
export function assignmentStatus(raw: unknown, deleted = false): string {
  if (deleted) return 'removed';
  // Exact documented names only. In particular "Not Accepted" must never become accepted.
  switch (key(raw)) {
    case 'pending': case 'published': case 'notified': case 'assigned': return 'assigned';
    case 'accepted': return 'accepted';
    case 'declined': case 'rejected': return 'declined';
    case 'open': case 'unfilled': return 'open';
    case 'removed': case 'deleted': return 'removed';
    default: return 'unknown';
  }
}
export function normalizeGame(g: Row): Row {
  const teams = (Array.isArray(g.teams) ? g.teams : []).map((t: Row) => ({ school_id: t.schoolId,
    name: text(t.schoolName || t.teamName), is_home: t.isHome === true, is_coop: t.isCoop === true }));
  return { external_game_id: validId(g.uniqueGameId), group_id: validId(g.groupId),
    custom_id: text(g.customGameId) || null, starts_at: providerDate(g.fromDate, g.utcOffset),
    provider_local_time: text(g.fromDate), utc_offset: g.utcOffset ?? null, timezone: text(g.timeZone),
    // Live modification timestamps lack offsets. Retain verbatim; don't invent a UTC cursor.
    provider_updated_raw: text(g.lastModifiedDate), provider_updated_at: providerDate(g.lastModifiedDate),
    sport: text(g.sportName), gender: text(g.gender), level: text(g.levelName), level_alias: text(g.levelAlias),
    venue: [text(g.siteName), text(g.subSiteName)].filter(Boolean).join(' · '),
    status: text(g.status), status_id: g.statusId, deleted: g.isDeleted === true, teams };
}
export function normalizeAssignment(a: Row): Row {
  const deleted = a.isDeleted === true || a.gameIsDeleted === true;
  return { external_assignment_id: validId(a.uniqueSlotId), external_game_id: validId(a.uniqueGameId),
    group_id: validId(a.groupId), external_official_id: a.officialId > 0 ? String(a.officialId) : null,
    official_display_name: [text(a.officialFirstName), text(a.officialLastName)].filter(Boolean).join(' ') || null,
    position: text(a.positionName) || null, provider_status: text(a.status),
    normalized_status: assignmentStatus(a.status, deleted), is_deleted: deleted,
    provider_updated_raw: text(a.lastModifiedDate), provider_updated_at: providerDate(a.lastModifiedDate),
    status_changed_at: providerDate(a.statusDate) };
}
export function deduplicate(rows: Row[], id: string): Row[] {
  const map = new Map<string, Row>();
  for (const r of rows) {
    const old = map.get(r[id]);
    if (!old || String(r.provider_updated_raw) > String(old.provider_updated_raw)) map.set(r[id], r);
    else if (String(r.provider_updated_raw) === String(old.provider_updated_raw) && JSON.stringify(r) !== JSON.stringify(old))
      throw new Error(`Conflicting Arbiter versions for ${id} ${r[id]}`);
  }
  return [...map.values()];
}
export function canonicalStatus(g: Row): string | null {
  if (g.deleted) return null;
  return ({ 1: 'scheduled', 2: 'postponed', 3: 'cancelled', 14: 'forfeit', 15: 'suspended' } as Record<number,string>)[g.status_id] ?? null;
}
export function matchGame(g: Row, snapshot: { games: Row[]; teams: Row[]; schools: Row[]; sports: Row[] }, links: Row[] = []): Row {
  const existing = links.find(l => l.external_game_id === g.external_game_id);
  if (existing && ['matched','ignored','conflict'].includes(existing.match_status)) return { game_id: existing.game_id, method: existing.match_method || 'manual', state: existing.match_status };
  const stable = snapshot.games.filter(c => (g.custom_id && c.id === g.custom_id) ||
    (c.external_source === 'arbiter' && String(c.external_event_id) === g.external_game_id));
  if (stable.length === 1) return { game_id: stable[0].id, method: 'custom_id', state: 'matched' };
  const schoolsByEntity = new Map(snapshot.schools.map(s => [SCHOOL_IDS[s.slug],s.id]));
  const teamMap = new Map(snapshot.teams.map(t => [t.id,t]));
  const sportMap = new Map(snapshot.sports.map(s => [s.id,s]));
  const teamMatches = (canonicalTeamId: string, opponent: string, t?: Row) => {
    if (!t || t.is_coop) return false; // cooperative programs require a reviewed provider link
    const c = teamMap.get(canonicalTeamId);
    if (c?.cooperative_program_id) return false;
    if (c) return !!schoolsByEntity.get(t.school_id) && c.school_id === schoolsByEntity.get(t.school_id);
    return !!opponent && key(opponent) === key(t.name);
  };
  const home = g.teams.find((t: Row) => t.is_home), away = g.teams.find((t: Row) => !t.is_home);
  const candidates = snapshot.games.filter(c => {
    const s = sportMap.get(c.sport_id);
    if (!s || key(s.name) !== key(g.sport) || key(s.gender_label) !== key(g.gender) || key(c.level) !== key(g.level)) return false;
    if (!g.starts_at || Math.abs(Date.parse(c.starts_at) - Date.parse(g.starts_at)) > 12 * 3600_000) return false;
    return (teamMatches(c.home_team_id,c.home_opponent_name,home) && teamMatches(c.away_team_id,c.away_opponent_name,away)) ||
      (teamMatches(c.home_team_id,c.home_opponent_name,away) && teamMatches(c.away_team_id,c.away_opponent_name,home));
  });
  const exact = candidates.filter(c => Date.parse(c.starts_at) === Date.parse(g.starts_at) &&
    teamMatches(c.home_team_id,c.home_opponent_name,home) && teamMatches(c.away_team_id,c.away_opponent_name,away));
  if (exact.length === 1) return { game_id: exact[0].id, method: 'exact', state: 'matched' };
  // Date/team heuristics are review suggestions, never accepted implicitly.
  return candidates.length === 1 ? { game_id: candidates[0].id, method: 'heuristic', state: 'suggested' } :
    { game_id: null, method: null, state: 'unmatched', candidate_count: candidates.length };
}
export function scheduleConflicts(g: Row, c: Row, teams: Row[] = [], schools: Row[] = []): Row[] {
  const diffs: Row[] = [];
  const add = (field: string, a: unknown, b: unknown) => diffs.push({ field_name: field, canonical_value: a, provider_value: b });
  if (g.deleted) add('deleted',c.status,'Provider record deleted; RVC retained');
  if (g.starts_at && Date.parse(c.starts_at) !== Date.parse(g.starts_at)) add('starts_at',c.starts_at,g.starts_at);
  const status = canonicalStatus(g);
  if (status && c.status !== status && c.status !== 'final') add('status',c.status,status);
  if (g.venue && c.location_text && !key(g.venue).includes(key(c.location_text))) add('location_text',c.location_text,g.venue);
  const home = g.teams.find((t: Row) => t.is_home);
  const ct = teams.find(t => t.id === c.home_team_id), cs = schools.find(s => s.id === ct?.school_id);
  if (home && cs && SCHOOL_IDS[cs.slug] !== home.school_id) add('home_team',cs.name,home.name);
  return diffs;
}
