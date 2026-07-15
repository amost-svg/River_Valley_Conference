import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Database,
  FileUp,
  Medal,
  RefreshCw,
  Save,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import {
  getCurrentUserId,
  insertRows,
  memberSelect,
  normalizeLookupValue,
  rpc,
  updateRows,
} from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface Season { id: string; name: string; code: string }
interface Sport { id: string; slug: string; name: string; gender_label: string | null; standings_enabled: boolean }
interface School { id: string; slug: string; name: string; short_name: string | null; mascot: string | null }
interface Alias { school_id: string; alias: string; normalized_alias: string }
interface Team { id: string; school_id: string; sport_id: string; display_name: string | null; level: string }
interface Game {
  id: string;
  sport_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  status: string;
  is_published: boolean;
  location_text: string | null;
}
interface ResultSubmission { id: string; game_id: string; home_score: number; away_score: number; status: string; submitted_at: string; review_note: string | null }
interface Confirmation { id: string; submission_id: string; team_id: string; status: string; note: string | null }
interface Standing { id: string; sport_id: string; rank: number | null; team_id: string; team_name: string; conference_wins: number; conference_losses: number; conference_ties: number; conference_percentage: number; tie_status: string }
interface Tournament { id: string; sport_id: string; name: string; status: string; bracket_size: number | null }
interface TournamentEntry { tournament_id: string; team_id: string; seed: number | null; status: string }
interface Award { id: string; sport_id: string | null; name: string; category: string | null; status: string }
interface ConferenceEvent { id: string; title: string; starts_at: string; event_type: string; status: string; location_text: string | null; is_tentative: boolean }
interface ConferenceDocument { id: string; title: string; category: string; visibility: string; status: string; external_url: string | null }
interface CooperativeProgram { id: string; display_name: string; status: string; notes: string | null }
interface QualityIssue { id: string; entity_type: string; entity_id: string | null; issue_code: string; severity: string; description: string; status: string }
interface UserContext { id: string; email: string; name: string; role: string; schoolId: string | null; isSuperAdmin: boolean }

interface AdminData {
  user: UserContext;
  season: Season;
  sports: Sport[];
  schools: School[];
  aliases: Alias[];
  teams: Team[];
  games: Game[];
  submissions: ResultSubmission[];
  confirmations: Confirmation[];
  standings: Standing[];
  tournaments: Tournament[];
  tournamentEntries: TournamentEntry[];
  awards: Award[];
  events: ConferenceEvent[];
  documents: ConferenceDocument[];
  coops: CooperativeProgram[];
  qualityIssues: QualityIssue[];
}

interface ImportPreviewRow {
  sourceRow: number;
  sportName: string;
  sportId?: string;
  date: string;
  awayName: string;
  homeName: string;
  awayTeamId?: string;
  homeTeamId?: string;
  homeSchoolId?: string;
  status: "ready" | "skip" | "blocked";
  reason?: string;
  duplicateKey?: string;
}

const sections = [
  ["dashboard", "Dashboard"],
  ["schedule", "Schedule Import"],
  ["scores", "Scores & Confirmations"],
  ["standings", "Standings & Ties"],
  ["tournaments", "Tournaments"],
  ["honors", "Honors"],
  ["content", "Events & Resources"],
  ["quality", "Data Quality"],
] as const;
type SectionKey = (typeof sections)[number][0];

const masterScheduleUrl = "https://docs.google.com/spreadsheets/d/1OzK3sD7MZH4EgEhRkGjwXsE50VALdu_ogi-_Y77_gs8/export?format=csv&gid=0";

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700"><span>{label}</span><div className="mt-1">{children}</div></label>;
}

const controlClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-conference-navy focus:outline-none focus:ring-2 focus:ring-conference-navy/20";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function sportLabel(sport?: Sport) {
  if (!sport) return "Conference";
  return sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${sport.name}` : sport.name;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += character;
  }
  values.push(value.trim());
  return values;
}

function centralStart(dateValue: string) {
  const [monthValue, dayValue, yearValue] = dateValue.split("/").map(Number);
  if (!monthValue || !dayValue || !yearValue) return null;
  const month = String(monthValue).padStart(2, "0");
  const day = String(dayValue).padStart(2, "0");
  const offset = monthValue >= 11 || monthValue <= 2 ? "-06:00" : "-05:00";
  return `${yearValue}-${month}-${day}T18:00:00${offset}`;
}

async function loadAdminData(): Promise<AdminData> {
  const user = await getRvcUserContext() as UserContext | null;
  if (!user) throw new Error("Please sign in to open the conference workspace.");
  const seasons = await memberSelect<Season[]>("seasons?is_active=eq.true&select=id,name,code&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active RVC season is configured.");
  const sid = encodeURIComponent(season.id);

  const [sports, schools, aliases, teams, games, submissions, confirmations, standings, tournaments, entries, awards, events, documents, coops, issues] = await Promise.all([
    memberSelect<Sport[]>("sports?is_active=eq.true&select=id,slug,name,gender_label,standings_enabled&order=display_order.asc"),
    memberSelect<School[]>("schools?is_active=eq.true&select=id,slug,name,short_name,mascot&order=display_order.asc"),
    memberSelect<Alias[]>("school_aliases?select=school_id,alias,normalized_alias"),
    memberSelect<Team[]>(`teams?season_id=eq.${sid}&select=id,school_id,sport_id,display_name,level&order=display_name.asc`),
    memberSelect<Game[]>(`games?season_id=eq.${sid}&select=id,sport_id,home_team_id,away_team_id,starts_at,status,is_published,location_text&order=starts_at.asc`),
    memberSelect<ResultSubmission[]>("result_submissions?select=id,game_id,home_score,away_score,status,submitted_at,review_note&order=submitted_at.desc"),
    memberSelect<Confirmation[]>("result_confirmations?select=id,submission_id,team_id,status,note&order=created_at.desc"),
    memberSelect<Standing[]>(`public_standings?season_id=eq.${sid}&select=id,sport_id,rank,team_id,team_name,conference_wins,conference_losses,conference_ties,conference_percentage,tie_status&order=sport_name.asc,rank.asc,team_name.asc`),
    memberSelect<Tournament[]>(`tournaments?season_id=eq.${sid}&select=id,sport_id,name,status,bracket_size&order=name.asc`),
    memberSelect<TournamentEntry[]>("tournament_entries?select=tournament_id,team_id,seed,status&order=seed.asc.nullslast"),
    memberSelect<Award[]>(`awards?season_id=eq.${sid}&select=id,sport_id,name,category,status&order=name.asc`),
    memberSelect<ConferenceEvent[]>(`conference_events?season_id=eq.${sid}&select=id,title,starts_at,event_type,status,location_text,is_tentative&order=starts_at.asc`),
    memberSelect<ConferenceDocument[]>("conference_documents?select=id,title,category,visibility,status,external_url&order=category.asc,title.asc"),
    memberSelect<CooperativeProgram[]>(`cooperative_programs?season_id=eq.${sid}&select=id,display_name,status,notes&order=display_name.asc`),
    memberSelect<QualityIssue[]>("data_quality_issues?status=eq.open&select=id,entity_type,entity_id,issue_code,severity,description,status&order=severity.desc,created_at.desc"),
  ]);

  return { user, season, sports, schools, aliases, teams, games, submissions, confirmations, standings, tournaments, tournamentEntries: entries, awards, events, documents, coops, qualityIssues: issues };
}

export default function ConferenceAdmin() {
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [csvText, setCsvText] = useState("");
  const [publishImported, setPublishImported] = useState(false);
  const [scoreGameId, setScoreGameId] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [scoreSummary, setScoreSummary] = useState("");
  const [tieSportId, setTieSportId] = useState("");
  const [tieTeamId, setTieTeamId] = useState("");
  const [tieRank, setTieRank] = useState("");
  const [tieMethod, setTieMethod] = useState("record_vs_highest_non_tied");
  const [tieNote, setTieNote] = useState("");
  const [awardId, setAwardId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientSchoolId, setRecipientSchoolId] = useState("");
  const [recipientPlacement, setRecipientPlacement] = useState("");
  const [recipientBio, setRecipientBio] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState("Conference Resource");
  const [documentUrl, setDocumentUrl] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({ queryKey: ["rvc-source-of-truth-admin"], queryFn: loadAdminData, staleTime: 15_000 });
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth-admin"] }),
    queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth"] }),
  ]);

  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const schoolMap = useMemo(() => new Map(data?.schools.map((school) => [school.id, school]) ?? []), [data?.schools]);
  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const canConferenceManage = Boolean(data?.user.isSuperAdmin || ["conference_admin", "conference_official", "press_editor", "SuperAdmin"].includes(data?.user.role ?? ""));

  const importPreview = useMemo<ImportPreviewRow[]>(() => {
    if (!data || !csvText.trim()) return [];
    const aliases = new Map<string, string>();
    data.schools.forEach((school) => {
      aliases.set(normalizeLookupValue(school.name), school.id);
      aliases.set(normalizeLookupValue(school.short_name ?? school.name), school.id);
    });
    data.aliases.forEach((alias) => aliases.set(alias.normalized_alias, alias.school_id));
    const sportAliases = new Map<string, string>();
    const slugBySource: Record<string, string> = {
      volleyball: "girls-volleyball", soccer: "boys-soccer", boysbasketball: "boys-basketball",
      girlsbasketball: "girls-basketball", baseball: "baseball", softball: "softball",
    };
    data.sports.forEach((sport) => sportAliases.set(sport.slug, sport.id));
    const teamBySportSchool = new Map(data.teams.map((team) => [`${team.sport_id}:${team.school_id}`, team]));
    const existingKeys = new Set(data.games.map((game) => `${game.sport_id}:${game.starts_at.slice(0, 10)}:${game.away_team_id}:${game.home_team_id}`));
    const seen = new Set<string>();

    return csvText.split(/\r?\n/).slice(1).map((line, index) => {
      const [sportName = "", date = "", awayName = "", homeName = ""] = parseCsvLine(line);
      const row: ImportPreviewRow = { sourceRow: index + 2, sportName, date, awayName, homeName, status: "ready" };
      if (!sportName && !date && !awayName && !homeName) return { ...row, status: "skip", reason: "Blank row" };
      const startsAt = centralStart(date);
      const year = startsAt ? Number(startsAt.slice(0, 4)) : 0;
      if (!startsAt || (year !== 2026 && year !== 2027)) return { ...row, status: "skip", reason: "Outside active 2026–27 season" };
      if (normalizeLookupValue(awayName) === "bye" || normalizeLookupValue(homeName) === "bye") return { ...row, status: "skip", reason: "BYE row" };
      const sourceSportSlug = slugBySource[normalizeLookupValue(sportName)];
      const sportId = sourceSportSlug ? sportAliases.get(sourceSportSlug) : undefined;
      if (!sportId) return { ...row, status: "blocked", reason: "Unknown sport" };
      row.sportId = sportId;
      const awaySchoolId = aliases.get(normalizeLookupValue(awayName));
      const homeSchoolId = aliases.get(normalizeLookupValue(homeName));
      if (!awaySchoolId || !homeSchoolId) return { ...row, status: "blocked", reason: "Unknown school alias" };
      if (awaySchoolId === homeSchoolId) return { ...row, status: "blocked", reason: "Self-matchup" };
      const awayTeam = teamBySportSchool.get(`${sportId}:${awaySchoolId}`);
      const homeTeam = teamBySportSchool.get(`${sportId}:${homeSchoolId}`);
      if (!awayTeam || !homeTeam) return { ...row, status: "blocked", reason: "School is not configured as a participant in this sport" };
      row.awayTeamId = awayTeam.id;
      row.homeTeamId = homeTeam.id;
      row.homeSchoolId = homeSchoolId;
      if (sourceSportSlug === "girls-basketball" && ["gsw", "tripoint"].includes(normalizeLookupValue(awayName)) || sourceSportSlug === "girls-basketball" && ["gsw", "tripoint"].includes(normalizeLookupValue(homeName))) {
        return { ...row, status: "blocked", reason: "Blocked until the approved Tri-Point/GSW co-op schedule is reconciled" };
      }
      const duplicateKey = `${sportId}:${startsAt.slice(0, 10)}:${awayTeam.id}:${homeTeam.id}`;
      row.duplicateKey = duplicateKey;
      if (seen.has(duplicateKey) || existingKeys.has(duplicateKey)) return { ...row, status: "skip", reason: "Duplicate matchup" };
      seen.add(duplicateKey);
      return row;
    });
  }, [csvText, data]);

  const runAction = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      await refresh();
      toast({ title: success });
    } catch (actionError) {
      toast({ title: "The action could not be completed", description: actionError instanceof Error ? actionError.message : "Please try again.", variant: "destructive" });
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!data || !canConferenceManage) throw new Error("Conference administrator access is required.");
      const rows = importPreview.filter((row) => row.status === "ready");
      if (!rows.length) throw new Error("There are no validated rows ready to import.");
      const games = rows.map((row) => ({
        season_id: data.season.id,
        sport_id: row.sportId,
        level: "Varsity",
        home_team_id: row.homeTeamId,
        away_team_id: row.awayTeamId,
        starts_at: centralStart(row.date),
        timezone: "America/Chicago",
        is_conference: true,
        status: "scheduled",
        is_published: publishImported,
        location_text: schoolMap.get(row.homeSchoolId ?? "")?.short_name ?? "Home school",
        notes: `Imported from Importable RVC Master row ${row.sourceRow}. Start time requires school verification.`,
        owner_school_id: row.homeSchoolId,
      }));
      for (let index = 0; index < games.length; index += 100) await insertRows("games", games.slice(index, index + 100));
      return games.length;
    },
    onSuccess: async (count) => { await refresh(); toast({ title: `${count} validated schedule records imported` }); },
    onError: (mutationError) => toast({ title: "Schedule import failed", description: mutationError instanceof Error ? mutationError.message : "Please try again.", variant: "destructive" }),
  });

  const loadMasterSchedule = async () => {
    try {
      const response = await fetch(masterScheduleUrl);
      if (!response.ok) throw new Error("The Google Sheet is not publicly readable from the browser.");
      setCsvText(await response.text());
      toast({ title: "Master schedule loaded for validation" });
    } catch (loadError) {
      toast({ title: "Automatic load unavailable", description: `${loadError instanceof Error ? loadError.message : "Upload or paste the CSV instead."} You can still export the sheet as CSV and choose the file below.`, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-600">Loading the conference workspace…</div>;
  if (error || !data) return <div className="min-h-screen bg-slate-50 p-10"><Panel className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-bold text-slate-950">Conference workspace unavailable</h1><p className="mt-2 text-slate-600">{error instanceof Error ? error.message : "Please sign in."}</p><Link href="/login"><Button className="mt-5">Sign in</Button></Link></Panel></div>;

  const selectedGame = data.games.find((game) => game.id === scoreGameId);
  const readyCount = importPreview.filter((row) => row.status === "ready").length;
  const blockedCount = importPreview.filter((row) => row.status === "blocked").length;
  const skippedCount = importPreview.filter((row) => row.status === "skip").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="RVC Conference Management" description="Secure River Valley Conference schedule, standings, tournament, honors, and content workspace." type="website" />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-conference-gold"><ShieldCheck className="h-4 w-4" /> Secure conference workspace</div><h1 className="mt-1 text-2xl font-bold">RVC Source of Truth</h1><p className="text-sm text-slate-300">{data.user.name} · {data.user.role} · {data.season.name}</p></div>
          <div className="flex gap-2"><Link href="/conference"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10"><ArrowLeft className="mr-2 h-4 w-4" /> Public hub</Button></Link><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside><Panel className="sticky top-4 p-2">{sections.map(([key, label]) => <button key={key} type="button" onClick={() => setSection(key)} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === key ? "bg-conference-navy text-white" : "text-slate-700 hover:bg-slate-100"}`}>{label}</button>)}</Panel></aside>
        <main className="min-w-0 space-y-6">
          {section === "dashboard" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Conference operating dashboard</h2><p className="text-sm text-slate-600">The numbers below are live from Supabase and governed by role-based access.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[Database,data.games.length,"Active-season games"],[AlertTriangle,data.qualityIssues.length,"Open data issues"],[Trophy,data.tournaments.length,"Tournament workspaces"],[Medal,data.awards.length,"Award categories"]].map(([Icon,value,label]) => { const I=Icon as typeof Database; return <Panel key={String(label)} className="p-5"><I className="mb-3 h-6 w-6 text-conference-navy" /><div className="text-3xl font-bold">{String(value)}</div><div className="text-sm text-slate-600">{String(label)}</div></Panel>; })}</div>
            <div className="grid gap-5 lg:grid-cols-2"><Panel className="p-6"><h3 className="font-bold text-slate-950">Result workflow</h3><p className="mt-2 text-sm text-slate-600">An AD submits the score. The other team confirms or disputes it. Only confirmed or conference-overridden results become final and recalculate standings.</p><div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {data.submissions.filter((submission) => submission.status === "approved").length} finalized submissions</div></Panel><Panel className="p-6"><h3 className="font-bold text-slate-950">Active co-ops</h3><div className="mt-3 space-y-3">{data.coops.map((coop) => <div key={coop.id} className="rounded-lg bg-slate-50 p-3"><div className="font-semibold">{coop.display_name}</div><p className="mt-1 text-xs text-slate-600">{coop.notes}</p></div>)}</div></Panel></div>
          </>}

          {section === "schedule" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Validated schedule import</h2><p className="text-sm text-slate-600">The importer normalizes school names, skips BYEs and duplicates, blocks self-matchups, and refuses to publish the unresolved girls-basketball co-op conflict.</p></div>
            {!canConferenceManage && <Panel className="p-5 text-sm text-amber-800">Only conference administrators and conference officials can import the master schedule.</Panel>}
            {canConferenceManage && <Panel className="space-y-5 p-6">
              <div className="flex flex-wrap gap-3"><Button onClick={() => void loadMasterSchedule()}><FileUp className="mr-2 h-4 w-4" /> Load Google Sheet</Button><label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file=event.target.files?.[0]; if(file) void file.text().then(setCsvText); }} /> Choose CSV file</label></div>
              <Field label="CSV content"><textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} rows={8} className={`${controlClass} font-mono text-xs`} placeholder="Sport,Date,Away Team,Home Team" /></Field>
              {importPreview.length > 0 && <><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-emerald-50 p-4 text-emerald-800"><div className="text-2xl font-bold">{readyCount}</div><div className="text-sm">Ready</div></div><div className="rounded-lg bg-amber-50 p-4 text-amber-800"><div className="text-2xl font-bold">{skippedCount}</div><div className="text-sm">Skipped</div></div><div className="rounded-lg bg-red-50 p-4 text-red-800"><div className="text-2xl font-bold">{blockedCount}</div><div className="text-sm">Blocked</div></div></div><div className="max-h-80 overflow-auto rounded-lg border"><table className="min-w-full text-xs"><thead className="sticky top-0 bg-slate-100"><tr><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">Sport</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Matchup</th><th className="px-3 py-2 text-left">Validation</th></tr></thead><tbody className="divide-y">{importPreview.map((row) => <tr key={row.sourceRow} className={row.status === "blocked" ? "bg-red-50" : row.status === "skip" ? "bg-amber-50" : ""}><td className="px-3 py-2">{row.sourceRow}</td><td className="px-3 py-2">{row.sportName}</td><td className="px-3 py-2">{row.date}</td><td className="px-3 py-2">{row.awayName} at {row.homeName}</td><td className="px-3 py-2 font-semibold capitalize">{row.status}{row.reason ? ` — ${row.reason}` : ""}</td></tr>)}</tbody></table></div></>}
              <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={publishImported} onChange={(event) => setPublishImported(event.target.checked)} className="mt-1" /><span><strong>Publish validated games immediately.</strong> Leave unchecked to import as internal drafts until ADs verify times and locations.</span></label>
              <Button disabled={!readyCount || importMutation.isPending} onClick={() => importMutation.mutate()}><Save className="mr-2 h-4 w-4" /> {importMutation.isPending ? "Importing…" : `Import ${readyCount} validated games`}</Button>
            </Panel>}
          </>}

          {section === "scores" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Scores and opponent confirmation</h2><p className="text-sm text-slate-600">Submit a score for a game your school manages. The opponent must confirm it before the score becomes final.</p></div>
            <Panel className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Game"><select className={controlClass} value={scoreGameId} onChange={(event) => setScoreGameId(event.target.value)}><option value="">Choose a scheduled game</option>{data.games.filter((game) => game.status !== "final").map((game) => <option key={game.id} value={game.id}>{formatDate(game.starts_at)} — {teamMap.get(game.away_team_id ?? "")?.display_name} at {teamMap.get(game.home_team_id ?? "")?.display_name}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label={`${teamMap.get(selectedGame?.home_team_id ?? "")?.display_name ?? "Home"} score`}><input className={controlClass} type="number" min="0" value={homeScore} onChange={(event) => setHomeScore(event.target.value)} /></Field><Field label={`${teamMap.get(selectedGame?.away_team_id ?? "")?.display_name ?? "Away"} score`}><input className={controlClass} type="number" min="0" value={awayScore} onChange={(event) => setAwayScore(event.target.value)} /></Field></div>
              <div className="md:col-span-2"><Field label="Optional game summary"><textarea className={controlClass} rows={3} value={scoreSummary} onChange={(event) => setScoreSummary(event.target.value)} /></Field></div>
              <div className="md:col-span-2"><Button onClick={() => void runAction(async () => { if(!scoreGameId || homeScore==="" || awayScore==="") throw new Error("Choose a game and enter both scores."); const userId=await getCurrentUserId(); await insertRows("result_submissions",{ game_id:scoreGameId,home_score:Number(homeScore),away_score:Number(awayScore),game_summary:scoreSummary||null,details:{},key_players:[],submitted_by:userId,status:"pending" }); setHomeScore("");setAwayScore("");setScoreSummary(""); },"Score submitted for opponent confirmation")}>Submit score</Button></div>
            </Panel>
            <div className="space-y-4">{data.submissions.filter((submission) => submission.status === "pending").map((submission) => { const game=data.games.find((item)=>item.id===submission.game_id); const confirmationRows=data.confirmations.filter((confirmation)=>confirmation.submission_id===submission.id); return <Panel key={submission.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="font-bold text-slate-950">{teamMap.get(game?.away_team_id ?? "")?.display_name} {submission.away_score} at {teamMap.get(game?.home_team_id ?? "")?.display_name} {submission.home_score}</div><div className="text-sm text-slate-600">Submitted {formatDate(submission.submitted_at)}</div></div><div className="flex flex-wrap gap-2">{confirmationRows.map((confirmation) => <div key={confirmation.id} className="rounded-lg border px-3 py-2"><div className="text-xs font-semibold">{teamMap.get(confirmation.team_id)?.display_name}</div><div className={`text-xs capitalize ${confirmation.status === "confirmed" ? "text-emerald-700" : confirmation.status === "disputed" ? "text-red-700" : "text-amber-700"}`}>{confirmation.status}</div>{confirmation.status === "pending" && <div className="mt-2 flex gap-1"><Button size="sm" onClick={() => void runAction(() => rpc("confirm_result_submission",{ submission_id:submission.id,target_team_id:confirmation.team_id,decision:"confirmed",note:null }),"Result confirmed")}>Confirm</Button><Button size="sm" variant="outline" onClick={() => void runAction(() => rpc("confirm_result_submission",{ submission_id:submission.id,target_team_id:confirmation.team_id,decision:"disputed",note:"Score requires conference review." }),"Result disputed")}>Dispute</Button></div>}</div>)}{canConferenceManage && <Button variant="outline" onClick={() => void runAction(() => rpc("override_result_confirmation",{ submission_id:submission.id,note:"Conference administrator override after review." }),"Result finalized by conference override")}>Admin override</Button>}</div></div></Panel>; })}{!data.submissions.some((submission)=>submission.status==="pending") && <Panel className="p-8 text-center text-sm text-slate-600">No pending score confirmations.</Panel>}</div>
          </>}

          {section === "standings" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Standings and tie resolution</h2><p className="text-sm text-slate-600">Automatic head-to-head is applied first. Cascading comparisons and blind draws are recorded here with an approved explanation.</p></div>
            <div className="space-y-5">{data.sports.filter((sport)=>sport.standings_enabled).map((sport)=><Panel key={sport.id} className="overflow-hidden"><div className="bg-conference-navy px-5 py-3 font-bold text-white">{sportLabel(sport)}</div><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Rank</th><th className="px-3 py-2 text-left">Team</th><th className="px-3 py-2 text-center">Conference</th><th className="px-3 py-2 text-left">Tie status</th></tr></thead><tbody className="divide-y">{data.standings.filter((row)=>row.sport_id===sport.id).map((row)=><tr key={row.id}><td className="px-3 py-2 font-bold">{row.rank}</td><td className="px-3 py-2">{row.team_name}</td><td className="px-3 py-2 text-center">{row.conference_wins}-{row.conference_losses}{row.conference_ties?`-${row.conference_ties}`:""}</td><td className="px-3 py-2 capitalize">{row.tie_status}</td></tr>)}</tbody></table></Panel>)}</div>
            {canConferenceManage && <Panel className="grid gap-4 p-6 md:grid-cols-2"><Field label="Sport"><select className={controlClass} value={tieSportId} onChange={(event)=>{setTieSportId(event.target.value);setTieTeamId("");}}><option value="">Choose sport</option>{data.sports.filter((sport)=>sport.standings_enabled).map((sport)=><option key={sport.id} value={sport.id}>{sportLabel(sport)}</option>)}</select></Field><Field label="Team"><select className={controlClass} value={tieTeamId} onChange={(event)=>setTieTeamId(event.target.value)}><option value="">Choose tied team</option>{data.standings.filter((row)=>row.sport_id===tieSportId).map((row)=><option key={row.team_id} value={row.team_id}>{row.team_name}</option>)}</select></Field><Field label="Resolved rank"><input className={controlClass} type="number" min="1" value={tieRank} onChange={(event)=>setTieRank(event.target.value)} /></Field><Field label="Method"><select className={controlClass} value={tieMethod} onChange={(event)=>setTieMethod(event.target.value)}><option value="record_vs_highest_non_tied">Record vs. highest non-tied team</option><option value="manual_blind_draw">Blind draw</option><option value="conference_vote">Conference vote</option><option value="correction">Record correction</option></select></Field><div className="md:col-span-2"><Field label="Required explanation"><textarea className={controlClass} rows={3} value={tieNote} onChange={(event)=>setTieNote(event.target.value)} /></Field></div><div className="md:col-span-2"><Button onClick={()=>void runAction(async()=>{if(!tieSportId||!tieTeamId||!tieRank||!tieNote.trim()) throw new Error("Complete all tie-resolution fields."); const userId=await getCurrentUserId(); await insertRows("standings_tie_resolutions",{season_id:data.season.id,sport_id:tieSportId,team_id:tieTeamId,resolved_rank:Number(tieRank),method:tieMethod,note:tieNote,approved_by:userId}); await rpc("recalculate_standings",{target_season_id:data.season.id,target_sport_id:tieSportId});},"Tie resolution recorded and standings recalculated")}>Record resolution</Button></div></Panel>}
          </>}

          {section === "tournaments" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Tournament seeding and publication</h2><p className="text-sm text-slate-600">Draft brackets stay internal. Auto-seeding uses the current official rank and refuses to invent a resolution for pending ties.</p></div>
            <div className="space-y-5">{data.tournaments.map((tournament)=>{const entries=data.tournamentEntries.filter((entry)=>entry.tournament_id===tournament.id);const rows=data.standings.filter((standing)=>standing.sport_id===tournament.sport_id);return <Panel key={tournament.id} className="p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-bold">{tournament.name}</h3><p className="text-sm capitalize text-slate-600">{tournament.status}</p></div>{canConferenceManage&&<div className="flex gap-2"><Button variant="outline" onClick={()=>void runAction(async()=>{if(rows.some((row)=>row.tie_status==="pending")) throw new Error("Resolve pending standings ties before auto-seeding."); for(const row of rows){await updateRows("tournament_entries",`tournament_id=eq.${tournament.id}&team_id=eq.${row.team_id}`,{seed:row.rank});}},"Tournament seeded from official standings")}>Auto-seed</Button><Button onClick={()=>void runAction(()=>updateRows("tournaments",`id=eq.${tournament.id}`,{status:"published",published_at:new Date().toISOString()}),"Tournament published")}>Publish</Button></div>}</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{entries.sort((a,b)=>(a.seed??999)-(b.seed??999)).map((entry)=><div key={entry.team_id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{entry.seed?`#${entry.seed} `:""}{teamMap.get(entry.team_id)?.display_name}</span>{canConferenceManage&&<input aria-label="Seed" className="w-16 rounded border px-2 py-1" type="number" min="1" value={entry.seed??""} onChange={(event)=>void runAction(()=>updateRows("tournament_entries",`tournament_id=eq.${tournament.id}&team_id=eq.${entry.team_id}`,{seed:event.target.value?Number(event.target.value):null}),"Seed updated")} />}</div>)}</div></Panel>;})}</div>
          </>}

          {section === "honors" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Conference honors</h2><p className="text-sm text-slate-600">Manage champions, All-Conference selections, Academic All-Conference, and Scholar-Athlete recognition without exposing private application data.</p></div>
            <Panel className="grid gap-4 p-6 md:grid-cols-2"><Field label="Award"><select className={controlClass} value={awardId} onChange={(event)=>setAwardId(event.target.value)}><option value="">Choose award</option>{data.awards.map((award)=><option key={award.id} value={award.id}>{award.name}{award.category?` — ${award.category}`:""}</option>)}</select></Field><Field label="Recipient name"><input className={controlClass} value={recipientName} onChange={(event)=>setRecipientName(event.target.value)} /></Field><Field label="School"><select className={controlClass} value={recipientSchoolId} onChange={(event)=>setRecipientSchoolId(event.target.value)}><option value="">No school / team award</option>{data.schools.map((school)=><option key={school.id} value={school.id}>{school.short_name??school.name}</option>)}</select></Field><Field label="Placement or team"><input className={controlClass} value={recipientPlacement} onChange={(event)=>setRecipientPlacement(event.target.value)} placeholder="First Team, Champion, Male Honoree…" /></Field><div className="md:col-span-2"><Field label="Public biography (never paste private application fields)"><textarea className={controlClass} rows={3} value={recipientBio} onChange={(event)=>setRecipientBio(event.target.value)} /></Field></div><div className="md:col-span-2 flex flex-wrap gap-2"><Button onClick={()=>void runAction(async()=>{if(!awardId||!recipientName.trim()) throw new Error("Choose an award and enter a recipient."); await insertRows("award_recipients",{award_id:awardId,school_id:recipientSchoolId||null,recipient_name:recipientName,recipient_type:"student",placement:recipientPlacement||null,public_bio:recipientBio||null});setRecipientName("");setRecipientPlacement("");setRecipientBio("");},"Recipient added")}>Add recipient</Button><Button variant="outline" disabled={!awardId} onClick={()=>void runAction(()=>updateRows("awards",`id=eq.${awardId}`,{status:"published",published_at:new Date().toISOString()}),"Award published")}>Publish award</Button></div></Panel>
          </>}

          {section === "content" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Events and conference resources</h2><p className="text-sm text-slate-600">Publish meeting dates, deadlines, festivals, operations guides, and conference documents.</p></div>
            <div className="grid gap-5 xl:grid-cols-2"><Panel className="space-y-4 p-6"><div className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-conference-navy" /><h3 className="font-bold">Add event</h3></div><Field label="Title"><input className={controlClass} value={eventTitle} onChange={(event)=>setEventTitle(event.target.value)} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Type"><input className={controlClass} value={eventType} onChange={(event)=>setEventType(event.target.value)} /></Field><Field label="Start"><input className={controlClass} type="datetime-local" value={eventStartsAt} onChange={(event)=>setEventStartsAt(event.target.value)} /></Field></div><Field label="Location"><input className={controlClass} value={eventLocation} onChange={(event)=>setEventLocation(event.target.value)} /></Field><Button onClick={()=>void runAction(async()=>{if(!eventTitle||!eventStartsAt) throw new Error("Enter a title and start date."); await insertRows("conference_events",{season_id:data.season.id,title:eventTitle,event_type:eventType,starts_at:new Date(eventStartsAt).toISOString(),location_text:eventLocation||null,visibility:"public",status:"published",published_at:new Date().toISOString()});setEventTitle("");setEventStartsAt("");setEventLocation("");},"Event published")}>Publish event</Button></Panel><Panel className="space-y-4 p-6"><div className="flex items-center gap-2"><FileUp className="h-5 w-5 text-conference-navy" /><h3 className="font-bold">Add linked resource</h3></div><Field label="Title"><input className={controlClass} value={documentTitle} onChange={(event)=>setDocumentTitle(event.target.value)} /></Field><Field label="Category"><input className={controlClass} value={documentCategory} onChange={(event)=>setDocumentCategory(event.target.value)} /></Field><Field label="Google Drive or public URL"><input className={controlClass} type="url" value={documentUrl} onChange={(event)=>setDocumentUrl(event.target.value)} /></Field><Button onClick={()=>void runAction(async()=>{if(!documentTitle||!documentUrl) throw new Error("Enter a title and URL."); await insertRows("conference_documents",{title:documentTitle,category:documentCategory,storage_path:`external/manual/${crypto.randomUUID()}`,external_url:documentUrl,source_name:"Conference workspace",visibility:"public",status:"published",published_at:new Date().toISOString()});setDocumentTitle("");setDocumentUrl("");},"Resource published")}>Publish resource</Button></Panel></div>
            <Panel className="overflow-hidden"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2 text-left">Upcoming event</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Location</th></tr></thead><tbody className="divide-y">{data.events.map((event)=><tr key={event.id}><td className="px-3 py-2 font-semibold">{event.title}{event.is_tentative&&<span className="ml-2 text-xs text-amber-700">Tentative</span>}</td><td className="px-3 py-2">{formatDate(event.starts_at)}</td><td className="px-3 py-2">{event.location_text}</td></tr>)}</tbody></table></Panel>
          </>}

          {section === "quality" && <>
            <div><h2 className="text-2xl font-bold text-slate-950">Data-quality review</h2><p className="text-sm text-slate-600">Conflicts stay visible until an authorized conference leader records how they were resolved.</p></div>
            <div className="space-y-4">{data.qualityIssues.map((issue)=><Panel key={issue.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className={`text-xs font-bold uppercase tracking-wide ${issue.severity==="error"?"text-red-700":"text-amber-700"}`}>{issue.severity} · {issue.issue_code}</div><h3 className="mt-1 font-bold text-slate-950">{issue.entity_id??issue.entity_type}</h3><p className="mt-2 max-w-3xl text-sm text-slate-600">{issue.description}</p></div>{canConferenceManage&&<Button variant="outline" onClick={()=>void runAction(()=>updateRows("data_quality_issues",`id=eq.${issue.id}`,{status:"resolved",resolution_note:"Resolved through conference review.",resolved_at:new Date().toISOString(),resolved_by:data.user.id}),"Data-quality issue resolved")}>Mark resolved</Button>}</div></Panel>)}{!data.qualityIssues.length&&<Panel className="p-8 text-center"><CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-600" /><div className="font-semibold text-slate-950">No open data-quality issues</div></Panel>}</div>
          </>}
        </main>
      </div>
    </div>
  );
}
