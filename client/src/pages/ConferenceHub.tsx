import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Medal,
  School as SchoolIcon,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { publicSelect } from "@/lib/rvcData";

interface Season { id: string; name: string; code: string }
interface Sport {
  id: string;
  slug: string;
  name: string;
  gender_label: string | null;
  season_period: string;
  standings_enabled: boolean;
}
interface School {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  mascot: string | null;
  city: string | null;
  state: string | null;
  athletics_url: string | null;
  livestream_url: string | null;
}
interface Team { id: string; school_id: string; sport_id: string; display_name: string | null; level: string }
interface Game {
  id: string;
  sport_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  status: string;
  location_text: string | null;
  is_conference: boolean;
}
interface GameResult { game_id: string; home_score: number; away_score: number; result_type: string }
interface Standing {
  id: string;
  sport_id: string;
  sport_slug: string;
  sport_name: string;
  gender_label: string | null;
  rank: number | null;
  team_id: string;
  team_name: string;
  school_name: string;
  school_slug: string;
  mascot: string | null;
  conference_wins: number;
  conference_losses: number;
  conference_ties: number;
  overall_wins: number;
  overall_losses: number;
  overall_ties: number;
  conference_percentage: number;
  streak: string | null;
  tie_status: string;
  computed_at: string;
}
interface ConferenceEvent {
  id: string;
  sport_id: string | null;
  title: string;
  event_type: string;
  starts_at: string;
  all_day: boolean;
  location_text: string | null;
  description: string | null;
  is_tentative: boolean;
}
interface Tournament {
  id: string;
  sport_id: string;
  name: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  bracket_size: number | null;
  seeding_notes: string | null;
}
interface TournamentEntry { tournament_id: string; team_id: string; seed: number | null; final_place: number | null; status: string }
interface Award { id: string; sport_id: string | null; name: string; category: string | null; description: string | null; published_at: string | null }
interface AwardRecipient {
  id: string;
  award_id: string;
  school_id: string | null;
  team_id: string | null;
  recipient_name: string;
  recipient_type: string;
  class_year: number | null;
  placement: string | null;
  public_bio: string | null;
}
interface ConferenceDocument {
  id: string;
  sport_id: string | null;
  title: string;
  category: string;
  description: string | null;
  external_url: string | null;
  updated_at: string;
}
interface CooperativeProgram { id: string; sport_id: string; display_name: string; notes: string | null; source_url: string | null }

interface HubData {
  season: Season;
  sports: Sport[];
  schools: School[];
  teams: Team[];
  games: Game[];
  results: GameResult[];
  standings: Standing[];
  events: ConferenceEvent[];
  tournaments: Tournament[];
  tournamentEntries: TournamentEntry[];
  awards: Award[];
  awardRecipients: AwardRecipient[];
  documents: ConferenceDocument[];
  coops: CooperativeProgram[];
}

const tabs = [
  ["overview", "Overview"],
  ["schedule", "Schedule & Results"],
  ["standings", "Standings"],
  ["tournaments", "Tournaments"],
  ["honors", "Honors"],
  ["resources", "Rules & Resources"],
] as const;

type TabKey = (typeof tabs)[number][0];

function sportLabel(sport?: Sport) {
  if (!sport) return "Conference";
  return sport.gender_label && sport.gender_label !== "Coed"
    ? `${sport.gender_label} ${sport.name}`
    : sport.name;
}

function formatDate(value: string, allDay = false) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(allDay ? {} : { hour: "numeric", minute: "2-digit" }),
  }).format(date);
}

function pct(value: number) {
  return Number(value || 0).toFixed(3).replace(/^0/, "");
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-amber-600" />
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">{body}</p>
    </div>
  );
}

async function loadHubData(): Promise<HubData> {
  const seasons = await publicSelect<Season[]>("seasons?is_active=eq.true&select=id,name,code&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active RVC season is configured.");
  const sid = encodeURIComponent(season.id);

  const [sports, schools, teams, games, results, standings, events, tournaments, entries, awards, recipients, documents, coops] = await Promise.all([
    publicSelect<Sport[]>("sports?is_active=eq.true&select=id,slug,name,gender_label,season_period,standings_enabled&order=display_order.asc"),
    publicSelect<School[]>("schools?is_active=eq.true&select=id,slug,name,short_name,mascot,city,state,athletics_url,livestream_url&order=display_order.asc"),
    publicSelect<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,school_id,sport_id,display_name,level`),
    publicSelect<Game[]>(`games?season_id=eq.${sid}&is_published=eq.true&select=id,sport_id,home_team_id,away_team_id,starts_at,status,location_text,is_conference&order=starts_at.asc`),
    publicSelect<GameResult[]>("game_results?select=game_id,home_score,away_score,result_type"),
    publicSelect<Standing[]>(`public_standings?season_id=eq.${sid}&select=*&order=sport_name.asc,rank.asc,team_name.asc`),
    publicSelect<ConferenceEvent[]>(`conference_events?season_id=eq.${sid}&select=id,sport_id,title,event_type,starts_at,all_day,location_text,description,is_tentative&order=starts_at.asc`),
    publicSelect<Tournament[]>(`tournaments?season_id=eq.${sid}&select=id,sport_id,name,status,starts_on,ends_on,bracket_size,seeding_notes&order=starts_on.asc.nullslast,name.asc`),
    publicSelect<TournamentEntry[]>("tournament_entries?select=tournament_id,team_id,seed,final_place,status&order=seed.asc.nullslast"),
    publicSelect<Award[]>(`awards?season_id=eq.${sid}&select=id,sport_id,name,category,description,published_at&order=name.asc`),
    publicSelect<AwardRecipient[]>("award_recipients?select=id,award_id,school_id,team_id,recipient_name,recipient_type,class_year,placement,public_bio&order=display_order.asc,recipient_name.asc"),
    publicSelect<ConferenceDocument[]>("conference_documents?status=eq.published&visibility=eq.public&select=id,sport_id,title,category,description,external_url,updated_at&order=category.asc,title.asc"),
    publicSelect<CooperativeProgram[]>(`cooperative_programs?season_id=eq.${sid}&status=eq.approved&select=id,sport_id,display_name,notes,source_url&order=display_name.asc`),
  ]);

  return { season, sports, schools, teams, games, results, standings, events, tournaments, tournamentEntries: entries, awards, awardRecipients: recipients, documents, coops };
}

export default function ConferenceHub() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [sportFilter, setSportFilter] = useState("all");
  const { data, isLoading, error } = useQuery({ queryKey: ["rvc-source-of-truth"], queryFn: loadHubData, staleTime: 60_000 });

  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const schoolMap = useMemo(() => new Map(data?.schools.map((school) => [school.id, school]) ?? []), [data?.schools]);
  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const resultMap = useMemo(() => new Map(data?.results.map((result) => [result.game_id, result]) ?? []), [data?.results]);

  const filteredGames = useMemo(
    () => data?.games.filter((game) => sportFilter === "all" || game.sport_id === sportFilter) ?? [],
    [data?.games, sportFilter],
  );
  const upcomingEvents = useMemo(
    () => data?.events.filter((event) => new Date(event.starts_at).getTime() >= Date.now()).slice(0, 8) ?? [],
    [data?.events],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="RVC Conference Hub - Official Schedules, Standings, and Honors"
        description="The official River Valley Conference source for schedules, confirmed results, conference standings, tournaments, honors, rules, and member resources."
        type="website"
      />
      <Navigation />

      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-conference-gold">
                <ShieldCheck className="h-4 w-4" /> Official Conference Record
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">River Valley Conference Hub</h1>
              <p className="mt-3 max-w-3xl text-slate-200">
                One dependable place for conference schedules, confirmed scores, standings, tournament seeds, honors, events, and governing resources.
              </p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm">
              <div className="text-slate-300">Active season</div>
              <div className="text-lg font-semibold">{data?.season.name ?? "Loading"}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Conference hub sections">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === key ? "bg-conference-navy text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-conference-navy"
              }`}
              aria-selected={activeTab === key}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && <Panel className="p-10 text-center text-slate-600">Loading the official conference record…</Panel>}
        {error && <EmptyState title="The conference hub could not load" body={error instanceof Error ? error.message : "Please try again."} />}

        {data && activeTab === "overview" && (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [SchoolIcon, data.schools.length, "Member schools"],
                [CalendarDays, data.games.length, "Published contests"],
                [Trophy, data.tournaments.length, "Conference tournaments"],
                [FileText, data.documents.length, "Official resources"],
              ].map(([Icon, value, label]) => {
                const IconComponent = Icon as typeof SchoolIcon;
                return (
                  <Panel key={String(label)} className="p-5">
                    <IconComponent className="mb-4 h-6 w-6 text-conference-navy" />
                    <div className="text-3xl font-bold text-slate-950">{String(value)}</div>
                    <div className="text-sm text-slate-600">{String(label)}</div>
                  </Panel>
                );
              })}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <Panel className="p-6 lg:col-span-2">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Upcoming conference dates</h2>
                    <p className="text-sm text-slate-600">Meetings, deadlines, tournaments, festivals, and conference events.</p>
                  </div>
                  <CalendarDays className="h-6 w-6 text-conference-navy" />
                </div>
                <div className="divide-y divide-slate-200">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="grid gap-1 py-4 sm:grid-cols-[170px_1fr]">
                      <div className="text-sm font-semibold text-conference-navy">{formatDate(event.starts_at, event.all_day)}</div>
                      <div>
                        <div className="font-semibold text-slate-950">
                          {event.title} {event.is_tentative && <span className="ml-2 text-xs font-medium text-amber-700">Tentative</span>}
                        </div>
                        <div className="text-sm text-slate-600">{event.location_text ?? "Location forthcoming"}</div>
                      </div>
                    </div>
                  ))}
                  {!upcomingEvents.length && <p className="py-8 text-sm text-slate-600">No upcoming events are published.</p>}
                </div>
              </Panel>

              <Panel className="p-6">
                <h2 className="text-xl font-bold text-slate-950">Approved co-ops</h2>
                <p className="mt-1 text-sm text-slate-600">Season-specific cooperative programs are shown separately from permanent member schools.</p>
                <div className="mt-5 space-y-4">
                  {data.coops.map((coop) => (
                    <div key={coop.id} className="rounded-lg bg-slate-50 p-4">
                      <div className="font-semibold text-slate-950">{coop.display_name}</div>
                      {coop.notes && <p className="mt-2 text-sm text-slate-600">{coop.notes}</p>}
                      {coop.source_url && (
                        <a className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-conference-navy hover:underline" href={coop.source_url} target="_blank" rel="noreferrer">
                          Approval record <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                  {!data.coops.length && <p className="text-sm text-slate-600">No active co-ops are published.</p>}
                </div>
              </Panel>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Member schools</h2>
                  <p className="text-sm text-slate-600">Official school profiles and athletic links.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {data.schools.map((school) => (
                  <Panel key={school.id} className="p-5">
                    <h3 className="font-bold text-slate-950">{school.short_name ?? school.name}</h3>
                    <p className="text-sm text-slate-600">{school.mascot}</p>
                    <p className="mt-2 text-xs text-slate-500">{school.city}, {school.state}</p>
                    <Link href={`/schools/${school.id}`} className="mt-4 inline-block text-sm font-semibold text-conference-navy hover:underline">School profile</Link>
                  </Panel>
                ))}
              </div>
            </section>
          </div>
        )}

        {data && activeTab === "schedule" && (
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Conference schedule and confirmed results</h2>
                <p className="text-sm text-slate-600">Only published conference records appear here. Final scores have passed the conference confirmation workflow.</p>
              </div>
              <label className="text-sm font-semibold text-slate-700">
                Sport
                <select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
                  <option value="all">All sports</option>
                  {data.sports.map((sport) => <option key={sport.id} value={sport.id}>{sportLabel(sport)}</option>)}
                </select>
              </label>
            </div>
            {!filteredGames.length ? (
              <EmptyState title="The active schedule is being verified" body="Conference administrators are validating the 2026–27 master schedule before publishing it. This protects the official standings from duplicate, self-matchup, BYE, and co-op conflicts." />
            ) : (
              <Panel className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                      <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Sport</th><th className="px-4 py-3">Matchup</th><th className="px-4 py-3">Result / Status</th><th className="px-4 py-3">Location</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGames.map((game) => {
                        const home = game.home_team_id ? teamMap.get(game.home_team_id) : undefined;
                        const away = game.away_team_id ? teamMap.get(game.away_team_id) : undefined;
                        const result = resultMap.get(game.id);
                        return (
                          <tr key={game.id}>
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatDate(game.starts_at)}</td>
                            <td className="px-4 py-3 text-slate-600">{sportLabel(sportMap.get(game.sport_id))}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{away?.display_name ?? "TBD"} at {home?.display_name ?? "TBD"}</td>
                            <td className="px-4 py-3">
                              {result ? <span className="font-bold text-conference-navy">{result.away_score}–{result.home_score} <span className="ml-2 text-xs font-medium uppercase text-emerald-700">Final</span></span> : <span className="capitalize text-slate-600">{game.status.replaceAll("_", " ")}</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{game.location_text ?? "Home school"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </section>
        )}

        {data && activeTab === "standings" && (
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Official conference standings</h2>
              <p className="text-sm text-slate-600">Rankings use conference winning percentage, then the approved sport-specific tie-break rules. Unresolved cascading ties are clearly marked for conference review.</p>
            </div>
            {data.sports.filter((sport) => sport.standings_enabled).map((sport) => {
              const rows = data.standings.filter((standing) => standing.sport_id === sport.id);
              return (
                <Panel key={sport.id} className="overflow-hidden">
                  <div className="flex items-center justify-between bg-conference-navy px-5 py-4 text-white">
                    <h3 className="text-lg font-bold">{sportLabel(sport)}</h3>
                    <span className="text-xs text-slate-300">Conference record controls rank</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3 text-left">Rank</th><th className="px-4 py-3 text-left">Team</th><th className="px-4 py-3 text-center">Conference</th><th className="px-4 py-3 text-center">Pct.</th><th className="px-4 py-3 text-center">Overall</th><th className="px-4 py-3 text-left">Tie status</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 text-lg font-bold text-conference-navy">{row.rank ?? "—"}</td>
                            <td className="px-4 py-3"><div className="font-semibold text-slate-950">{row.team_name}</div><div className="text-xs text-slate-500">{row.mascot}</div></td>
                            <td className="px-4 py-3 text-center font-semibold">{row.conference_wins}-{row.conference_losses}{row.conference_ties ? `-${row.conference_ties}` : ""}</td>
                            <td className="px-4 py-3 text-center">{pct(row.conference_percentage)}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{row.overall_wins}-{row.overall_losses}{row.overall_ties ? `-${row.overall_ties}` : ""}</td>
                            <td className="px-4 py-3">{row.tie_status === "pending" ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Conference review</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {row.tie_status === "resolved" ? "Resolved" : "Clear"}</span>}</td>
                          </tr>
                        ))}
                        {!rows.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-600">Standings will populate when teams and confirmed results are published.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              );
            })}
          </section>
        )}

        {data && activeTab === "tournaments" && (
          <section className="space-y-6">
            <div><h2 className="text-2xl font-bold text-slate-950">Conference tournaments</h2><p className="text-sm text-slate-600">Brackets remain private while in draft. Published brackets use confirmed standings and approved tie resolutions.</p></div>
            {!data.tournaments.length ? <EmptyState title="No tournament brackets are published" body="Tournament shells are prepared for conference administrators and will appear here once dates and seeds are approved." /> : (
              <div className="grid gap-5 lg:grid-cols-2">
                {data.tournaments.map((tournament) => {
                  const entries = data.tournamentEntries.filter((entry) => entry.tournament_id === tournament.id);
                  return (
                    <Panel key={tournament.id} className="p-6">
                      <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-950">{tournament.name}</h3><p className="text-sm text-slate-600">{tournament.starts_on ? formatDate(tournament.starts_on, true) : "Dates forthcoming"}</p></div><Trophy className="h-6 w-6 text-conference-gold" /></div>
                      <div className="mt-5 space-y-2">{entries.map((entry) => <div key={entry.team_id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold">{entry.seed ? `#${entry.seed} ` : ""}{teamMap.get(entry.team_id)?.display_name ?? "Team"}</span><span className="capitalize text-slate-500">{entry.status}</span></div>)}</div>
                      {tournament.seeding_notes && <p className="mt-4 text-xs text-slate-500">{tournament.seeding_notes}</p>}
                    </Panel>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {data && activeTab === "honors" && (
          <section className="space-y-6">
            <div><h2 className="text-2xl font-bold text-slate-950">Conference honors and history</h2><p className="text-sm text-slate-600">Conference champions, All-Conference teams, Academic All-Conference, and Scholar-Athlete recognition.</p></div>
            {!data.awards.length ? <EmptyState title="The 2026–27 honors record has not been published" body="Award categories are prepared in the conference workspace. Recipients will appear after the official selection and verification process." /> : (
              <div className="grid gap-5 lg:grid-cols-2">
                {data.awards.map((award) => {
                  const recipients = data.awardRecipients.filter((recipient) => recipient.award_id === award.id);
                  return <Panel key={award.id} className="p-6"><div className="flex items-start gap-3"><Medal className="mt-1 h-6 w-6 text-conference-gold" /><div><h3 className="text-lg font-bold text-slate-950">{award.name}</h3><p className="text-sm text-slate-600">{award.description}</p></div></div><div className="mt-4 space-y-3">{recipients.map((recipient) => <div key={recipient.id} className="rounded-lg bg-slate-50 p-3"><div className="font-semibold text-slate-950">{recipient.recipient_name}</div><div className="text-xs text-slate-500">{recipient.placement}{recipient.class_year ? ` · Class of ${recipient.class_year}` : ""}</div>{recipient.public_bio && <p className="mt-2 text-sm text-slate-600">{recipient.public_bio}</p>}</div>)}</div></Panel>;
                })}
              </div>
            )}
          </section>
        )}

        {data && activeTab === "resources" && (
          <section className="space-y-6">
            <div><h2 className="text-2xl font-bold text-slate-950">Rules and conference resources</h2><p className="text-sm text-slate-600">The current constitution, sport operations guides, event calendar, and published conference documents.</p></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.documents.map((document) => (
                <Panel key={document.id} className="flex flex-col p-5">
                  <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 text-conference-navy" /><div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{document.category}</div><h3 className="mt-1 font-bold text-slate-950">{document.title}</h3></div></div>
                  {document.description && <p className="mt-3 flex-1 text-sm text-slate-600">{document.description}</p>}
                  {document.external_url && <a href={document.external_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-conference-navy hover:underline">Open official document <ExternalLink className="h-3.5 w-3.5" /></a>}
                </Panel>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
