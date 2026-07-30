import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileText,
  Gamepad2,
  Home,
  ImagePlus,
  KeyRound,
  LogOut,
  Mail,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  School as SchoolIcon,
  ShieldCheck,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext, sendPasswordReset, signOut } from "@/lib/supabaseAuth";
import {
  createSignedStorageUrl,
  getCurrentUserId,
  insertRows,
  memberSelect,
  publicStorageUrl,
  rpc,
  updateRows,
  uploadFile,
} from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface UserContext {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  isSuperAdmin: boolean;
}
interface Season { id: string; name: string; code: string }
interface Sport {
  id: string;
  slug: string;
  name: string;
  gender_label: string | null;
  scoring_profile: Record<string, unknown>;
  standings_enabled: boolean;
}
interface School {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  mascot: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  superintendent_name: string | null;
  principal_name: string | null;
  athletic_director_name: string | null;
  website_url: string | null;
  athletics_url: string | null;
  ihsa_url: string | null;
  livestream_url: string | null;
  livestream_platform: string | null;
  mission_statement: string | null;
  logo_path: string | null;
}
interface SchoolContact {
  id: string;
  school_id: string;
  role: string;
  full_name: string;
  email: string;
  office_phone: string | null;
  is_active: boolean;
}
interface Team { id: string; school_id: string; sport_id: string; display_name: string | null; level: string }
interface Venue { id: string; school_id: string | null; name: string; city: string | null }
interface CalendarGame {
  id: string;
  season_id: string;
  sport_id: string;
  sport_slug: string;
  sport_name: string;
  gender_label: string | null;
  level: string;
  starts_at: string;
  status: string;
  is_published: boolean;
  is_conference: boolean;
  location_text: string | null;
  venue_name: string | null;
  home_school_id: string | null;
  home_name: string | null;
  home_logo_path: string | null;
  away_school_id: string | null;
  away_name: string | null;
  away_logo_path: string | null;
  home_score: number | null;
  away_score: number | null;
  result_details: Record<string, unknown> | null;
  notes: string | null;
}
interface ResultSubmission {
  id: string;
  game_id: string;
  home_score: number;
  away_score: number;
  details: Record<string, unknown>;
  status: string;
  submitted_at: string;
  review_note: string | null;
}
interface Confirmation { id: string; submission_id: string; team_id: string; status: string; note: string | null }
interface DocumentRow {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  storage_path: string;
  external_url: string | null;
  sport_id: string | null;
  visibility: string;
  status: string;
}
interface NewsRow {
  id: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  image_path: string | null;
  pdf_path: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}
interface StandingRow {
  id: string;
  sport_id: string;
  rank: number | null;
  team_name: string;
  conference_wins: number;
  conference_losses: number;
  conference_ties: number;
  tie_status: string;
}
interface UserDirectoryRow {
  user_id: string;
  email: string;
  full_name: string;
  last_sign_in_at: string | null;
  user_created_at: string;
  email_confirmed_at: string | null;
  membership_id: string | null;
  school_id: string | null;
  role: string | null;
  membership_status: string | null;
}
interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  school: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}
interface DashboardData {
  user: UserContext;
  season: Season;
  sports: Sport[];
  schools: School[];
  contacts: SchoolContact[];
  teams: Team[];
  venues: Venue[];
  games: CalendarGame[];
  submissions: ResultSubmission[];
  confirmations: Confirmation[];
  documents: DocumentRow[];
  news: NewsRow[];
  standings: StandingRow[];
  users: UserDirectoryRow[];
  contactSubmissions: ContactSubmission[];
}

type Section = "today" | "calendar" | "scores" | "games" | "school" | "standings" | "resources" | "news" | "contacts" | "users";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-conference-navy focus:outline-none focus:ring-2 focus:ring-conference-navy/20";

function centralDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatGameTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function gameTimeLabel(game: Pick<CalendarGame, "starts_at" | "notes">) {
  return game.notes?.includes("Start time requires school verification") ? "Time TBA" : formatGameTime(game.starts_at);
}

function formatLongDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function sportLabel(sport?: Sport | CalendarGame) {
  if (!sport) return "Conference";
  const name = "sport_name" in sport ? sport.sport_name : sport.name;
  return sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${name}` : name;
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-sm font-semibold text-slate-700"><span>{label}</span>{hint && <span className="ml-2 font-normal text-slate-500">{hint}</span>}<div className="mt-1">{children}</div></label>;
}

function GameCard({ game, onOpen }: { game: CalendarGame; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-conference-navy hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-conference-navy">{game.gender_label && game.gender_label !== "Coed" ? `${game.gender_label} ${game.sport_name}` : game.sport_name}</div>
          <div className="mt-1 text-sm text-slate-500">{gameTimeLabel(game)} · {game.level}</div>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${game.status === "final" ? "bg-emerald-100 text-emerald-800" : game.status === "postponed" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>{game.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div><div className="font-bold text-slate-950">{game.away_name ?? "TBD"}</div><div className="text-xs text-slate-500">Away</div></div>
        <div className="text-center text-xl font-bold text-slate-400">{game.status === "final" ? `${game.away_score ?? 0}–${game.home_score ?? 0}` : "at"}</div>
        <div className="text-right"><div className="font-bold text-slate-950">{game.home_name ?? "TBD"}</div><div className="text-xs text-slate-500">Home</div></div>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{game.venue_name ?? game.location_text ?? "Location forthcoming"}</div>
    </button>
  );
}

function ScoreModal({ game, sport, onClose, onSaved }: { game: CalendarGame; sport?: Sport; onClose: () => void; onSaved: () => Promise<void> }) {
  const [homeScore, setHomeScore] = useState(game.home_score?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(game.away_score?.toString() ?? "");
  const [sets, setSets] = useState([{ home: "", away: "" }, { home: "", away: "" }, { home: "", away: "" }]);
  const [innings, setInnings] = useState("7");
  const [summary, setSummary] = useState("");
  const [highlights, setHighlights] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const scoringType = String(sport?.scoring_profile?.type ?? "score");

  const save = async () => {
    try {
      setSaving(true);
      const userId = await getCurrentUserId();
      let resolvedHome = Number(homeScore);
      let resolvedAway = Number(awayScore);
      let details: Record<string, unknown> = { scoring_type: scoringType };

      if (scoringType === "sets") {
        const playedSets = sets.filter((set) => set.home !== "" && set.away !== "").map((set, index) => ({ set: index + 1, home: Number(set.home), away: Number(set.away) }));
        if (playedSets.length < 2) throw new Error("Enter each completed volleyball set.");
        resolvedHome = playedSets.filter((set) => set.home > set.away).length;
        resolvedAway = playedSets.filter((set) => set.away > set.home).length;
        details = { scoring_type: "sets", sets: playedSets };
      } else {
        if (homeScore === "" || awayScore === "") throw new Error("Enter both final scores.");
        if (scoringType === "innings") details = { scoring_type: "innings", innings_played: Number(innings) };
      }

      await insertRows("result_submissions", {
        game_id: game.id,
        home_score: resolvedHome,
        away_score: resolvedAway,
        details,
        game_summary: summary || null,
        game_highlights: highlights || null,
        key_players: [],
        submitted_by: userId,
        status: "pending",
      });
      await onSaved();
      toast({ title: "Score submitted for confirmation" });
      onClose();
    } catch (error) {
      toast({ title: "Score could not be submitted", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div><div className="text-sm font-semibold text-conference-navy">{sportLabel(sport)}</div><h2 className="text-xl font-bold text-slate-950">{game.away_name} at {game.home_name}</h2><p className="text-sm text-slate-500">{formatLongDate(game.starts_at)} · {gameTimeLabel(game)}</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-5">
          {game.status === "final" ? (
            <div className="rounded-xl bg-emerald-50 p-6 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-700" /><div className="mt-2 text-3xl font-bold text-slate-950">{game.away_score}–{game.home_score}</div><div className="text-sm text-emerald-800">Final result recorded</div></div>
          ) : scoringType === "sets" ? (
            <div><h3 className="font-bold text-slate-950">Volleyball set scores</h3><p className="mt-1 text-sm text-slate-600">Enter completed sets. Match totals are calculated automatically.</p><div className="mt-4 space-y-3">{sets.map((set, index) => <div key={index} className="grid grid-cols-[80px_1fr_1fr] items-end gap-3"><div className="pb-2 text-sm font-semibold">Set {index + 1}</div><Field label={game.home_name ?? "Home"}><input className={inputClass} type="number" min="0" value={set.home} onChange={(event) => setSets((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, home: event.target.value } : row))} /></Field><Field label={game.away_name ?? "Away"}><input className={inputClass} type="number" min="0" value={set.away} onChange={(event) => setSets((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, away: event.target.value } : row))} /></Field></div>)}</div></div>
          ) : (
            <div className="grid grid-cols-2 gap-4"><Field label={`${game.home_name ?? "Home"} score`}><input className={inputClass} type="number" min="0" value={homeScore} onChange={(event) => setHomeScore(event.target.value)} /></Field><Field label={`${game.away_name ?? "Away"} score`}><input className={inputClass} type="number" min="0" value={awayScore} onChange={(event) => setAwayScore(event.target.value)} /></Field>{scoringType === "innings" && <div className="col-span-2"><Field label="Innings played"><input className={inputClass} type="number" min="1" value={innings} onChange={(event) => setInnings(event.target.value)} /></Field></div>}</div>
          )}
          {game.status !== "final" && <><Field label="Game summary" hint="Optional"><textarea className={inputClass} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="A concise public recap or important context" /></Field><Field label="Highlights / key performances" hint="Optional"><textarea className={inputClass} rows={3} value={highlights} onChange={(event) => setHighlights(event.target.value)} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void save()}>{saving ? "Submitting…" : "Submit score"}</Button></div></>}
        </div>
      </div>
    </div>
  );
}

async function loadDashboard(): Promise<DashboardData> {
  const user = await getRvcUserContext() as UserContext | null;
  if (!user) throw new Error("Please sign in to open the RVC dashboard.");
  const seasons = await memberSelect<Season[]>("seasons?is_active=eq.true&select=id,name,code&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active RVC season is configured.");
  const sid = encodeURIComponent(season.id);

  const [sports, schools, contacts, teams, venues, games, submissions, confirmations, documents, news, standings, users, contactSubmissions] = await Promise.all([
    memberSelect<Sport[]>("sports?is_active=eq.true&select=id,slug,name,gender_label,scoring_profile,standings_enabled&order=display_order.asc"),
    memberSelect<School[]>("schools?is_active=eq.true&select=id,slug,name,short_name,mascot,address_line1,city,state,postal_code,phone,superintendent_name,principal_name,athletic_director_name,website_url,athletics_url,ihsa_url,livestream_url,livestream_platform,mission_statement,logo_path&order=display_order.asc"),
    memberSelect<SchoolContact[]>("school_contacts?is_active=eq.true&select=id,school_id,role,full_name,email,office_phone,is_active"),
    memberSelect<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,school_id,sport_id,display_name,level&order=display_name.asc`),
    memberSelect<Venue[]>("venues?is_active=eq.true&select=id,school_id,name,city&order=name.asc"),
    memberSelect<CalendarGame[]>(`game_calendar_view?season_id=eq.${sid}&select=*&order=starts_at.asc`),
    memberSelect<ResultSubmission[]>("result_submissions?select=id,game_id,home_score,away_score,details,status,submitted_at,review_note&order=submitted_at.desc"),
    memberSelect<Confirmation[]>("result_confirmations?select=id,submission_id,team_id,status,note&order=created_at.desc"),
    memberSelect<DocumentRow[]>("conference_documents?status=eq.published&select=id,title,category,description,storage_path,external_url,sport_id,visibility,status&order=category.asc,title.asc"),
    memberSelect<NewsRow[]>("news_items?select=id,title,excerpt,body,category,image_path,pdf_path,status,published_at,created_at&order=created_at.desc"),
    memberSelect<StandingRow[]>(`public_standings?season_id=eq.${sid}&select=id,sport_id,rank,team_name,conference_wins,conference_losses,conference_ties,tie_status&order=sport_name.asc,rank.asc,team_name.asc`),
    user.isSuperAdmin ? rpc<UserDirectoryRow[]>("admin_user_directory", {}) : Promise.resolve([]),
    user.isSuperAdmin
      ? memberSelect<ContactSubmission[]>("contact_submissions?select=id,name,email,school,subject,message,status,created_at,reviewed_at&order=created_at.desc")
      : Promise.resolve([]),
  ]);

  return { user, season, sports, schools, contacts, teams, venues, games, submissions, confirmations, documents, news, standings, users, contactSubmissions };
}

export default function AdminDashboardV2() {
  const [section, setSection] = useState<Section>("today");
  const [selectedDate, setSelectedDate] = useState(centralDateKey(new Date()));
  const [selectedGame, setSelectedGame] = useState<CalendarGame | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [schoolDraft, setSchoolDraft] = useState<Record<string, string>>( {} );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [principalEmail, setPrincipalEmail] = useState("");
  const [principalPhone, setPrincipalPhone] = useState("");
  const [adEmail, setAdEmail] = useState("");
  const [adPhone, setAdPhone] = useState("");
  const [gameSportId, setGameSportId] = useState("");
  const [gameHomeTeamId, setGameHomeTeamId] = useState("");
  const [gameAwayTeamId, setGameAwayTeamId] = useState("");
  const [gameStartsAt, setGameStartsAt] = useState("");
  const [gameLocation, setGameLocation] = useState("");
  const [gameLevel, setGameLevel] = useState("Varsity");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsExcerpt, setNewsExcerpt] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsCategory, setNewsCategory] = useState("Conference Update");
  const [newsPdf, setNewsPdf] = useState<File | null>(null);
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceCategory, setResourceCategory] = useState("Operations Guide");
  const [resourceSportId, setResourceSportId] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({ queryKey: ["rvc-admin-daily-dashboard"], queryFn: loadDashboard, staleTime: 15_000 });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rvc-admin-daily-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["public-supabase-schools"] }),
      queryClient.invalidateQueries({ queryKey: ["public-news-items"] }),
      queryClient.invalidateQueries({ queryKey: ["public-supabase-games"] }),
      queryClient.invalidateQueries({ queryKey: ["public-supabase-standings"] }),
    ]);
  };

  useEffect(() => {
    if (!data) return;
    const nextSchoolId = data.user.isSuperAdmin ? (selectedSchoolId || data.schools[0]?.id || "") : (data.user.schoolId ?? "");
    if (nextSchoolId !== selectedSchoolId) setSelectedSchoolId(nextSchoolId);
  }, [data, selectedSchoolId]);

  useEffect(() => {
    if (!data || !selectedSchoolId) return;
    const school = data.schools.find((item) => item.id === selectedSchoolId);
    if (!school) return;
    setSchoolDraft({
      name: school.name,
      short_name: school.short_name ?? "",
      mascot: school.mascot ?? "",
      address_line1: school.address_line1 ?? "",
      city: school.city ?? "",
      state: school.state ?? "IL",
      postal_code: school.postal_code ?? "",
      phone: school.phone ?? "",
      superintendent_name: school.superintendent_name ?? "",
      principal_name: school.principal_name ?? "",
      athletic_director_name: school.athletic_director_name ?? "",
      website_url: school.website_url ?? "",
      athletics_url: school.athletics_url ?? "",
      ihsa_url: school.ihsa_url ?? "",
      livestream_url: school.livestream_url ?? "",
      livestream_platform: school.livestream_platform ?? "",
      mission_statement: school.mission_statement ?? "",
      logo_path: school.logo_path ?? "",
    });
    const principal = data.contacts.find((contact) => contact.school_id === selectedSchoolId && contact.role === "school_principal");
    const ad = data.contacts.find((contact) => contact.school_id === selectedSchoolId && contact.role === "athletic_director");
    setPrincipalEmail(principal?.email ?? ""); setPrincipalPhone(principal?.office_phone ?? "");
    setAdEmail(ad?.email ?? ""); setAdPhone(ad?.office_phone ?? "");
    setLogoFile(null);
  }, [data, selectedSchoolId]);

  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const todayKey = centralDateKey(new Date());
  const todayGames = useMemo(() => data?.games.filter((game) => centralDateKey(game.starts_at) === todayKey) ?? [], [data?.games, todayKey]);
  const selectedDateGames = useMemo(() => data?.games.filter((game) => centralDateKey(game.starts_at) === selectedDate) ?? [], [data?.games, selectedDate]);
  const upcomingGames = useMemo(() => data?.games.filter((game) => new Date(game.starts_at).getTime() >= Date.now()).slice(0, 12) ?? [], [data?.games]);
  const selectedSportTeams = data?.teams.filter((team) => team.sport_id === gameSportId) ?? [];
  const canManageGames = Boolean(data && (data.user.isSuperAdmin || ["Principal", "AD", "conference_official"].includes(data.user.role)));
  const canEditNews = Boolean(data && (data.user.isSuperAdmin || data.user.role === "press_editor"));
  const canManageResources = Boolean(data && (data.user.isSuperAdmin || data.user.role === "conference_official"));

  const run = async (work: () => Promise<unknown>, success: string) => {
    try { await work(); await refresh(); toast({ title: success }); }
    catch (actionError) { toast({ title: "The action could not be completed", description: actionError instanceof Error ? actionError.message : "Please try again.", variant: "destructive" }); }
  };

  const changeDate = (days: number) => {
    const date = new Date(`${selectedDate}T12:00:00-05:00`);
    date.setDate(date.getDate() + days);
    setSelectedDate(centralDateKey(date));
  };

  const saveSchool = async () => {
    if (!data || !selectedSchoolId) return;
    await run(async () => {
      const school = data.schools.find((item) => item.id === selectedSchoolId)!;
      let logoPath = schoolDraft.logo_path || null;
      if (logoFile) {
        const path = `${school.slug}/${Date.now()}-${safeFilename(logoFile.name)}`;
        await uploadFile("school-logos", path, logoFile);
        logoPath = publicStorageUrl("school-logos", path);
      }
      await updateRows("schools", `id=eq.${selectedSchoolId}`, { ...schoolDraft, logo_path: logoPath, updated_at: new Date().toISOString() });
      for (const [role, name, email, phone] of [
        ["school_principal", schoolDraft.principal_name, principalEmail, principalPhone],
        ["athletic_director", schoolDraft.athletic_director_name, adEmail, adPhone],
      ] as const) {
        if (!name || !email) continue;
        const existing = data.contacts.find((contact) => contact.school_id === selectedSchoolId && contact.role === role);
        if (existing) await updateRows("school_contacts", `id=eq.${existing.id}`, { full_name: name, email, office_phone: phone || null, updated_at: new Date().toISOString() });
        else await insertRows("school_contacts", { school_id: selectedSchoolId, role, full_name: name, email, office_phone: phone || null, is_active: true });
      }
    }, "School profile updated");
  };

  const addGame = async () => {
    if (!data) return;
    await run(async () => {
      if (!gameSportId || !gameHomeTeamId || !gameAwayTeamId || !gameStartsAt) throw new Error("Choose a sport, both teams, and a game time.");
      if (gameHomeTeamId === gameAwayTeamId) throw new Error("A team cannot play itself.");
      const home = teamMap.get(gameHomeTeamId)!;
      const away = teamMap.get(gameAwayTeamId)!;
      if (!data.user.isSuperAdmin && data.user.schoolId && ![home.school_id, away.school_id].includes(data.user.schoolId)) throw new Error("Your school must participate in the game you add.");
      await insertRows("games", {
        season_id: data.season.id,
        sport_id: gameSportId,
        level: gameLevel,
        home_team_id: gameHomeTeamId,
        away_team_id: gameAwayTeamId,
        starts_at: new Date(gameStartsAt).toISOString(),
        timezone: "America/Chicago",
        location_text: gameLocation || null,
        is_conference: true,
        status: "scheduled",
        is_published: true,
        owner_school_id: data.user.schoolId ?? home.school_id,
        created_by: data.user.id,
      });
      setGameHomeTeamId(""); setGameAwayTeamId(""); setGameStartsAt(""); setGameLocation("");
    }, "Game added to the conference calendar");
  };

  const openDocument = async (document: DocumentRow) => {
    try {
      if (document.external_url) { window.open(document.external_url, "_blank", "noopener,noreferrer"); return; }
      const url = await createSignedStorageUrl("conference-documents", document.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (openError) { toast({ title: "Document could not be opened", description: openError instanceof Error ? openError.message : "Please try again.", variant: "destructive" }); }
  };

  const publishNews = async (status: "draft" | "published") => {
    if (!data) return;
    await run(async () => {
      if (!newsTitle.trim() || !newsExcerpt.trim()) throw new Error("Enter a headline and homepage summary.");
      let pdfPath: string | null = null;
      let imagePath: string | null = null;
      if (newsPdf) { const path = `pdf/${Date.now()}-${safeFilename(newsPdf.name)}`; await uploadFile("news-media", path, newsPdf); pdfPath = publicStorageUrl("news-media", path); }
      if (newsImage) { const path = `images/${Date.now()}-${safeFilename(newsImage.name)}`; await uploadFile("news-media", path, newsImage); imagePath = publicStorageUrl("news-media", path); }
      await insertRows("news_items", {
        title: newsTitle.trim(),
        slug: `${safeFilename(newsTitle)}-${Date.now()}`,
        excerpt: newsExcerpt.trim(),
        body: newsBody.trim() || null,
        category: newsCategory,
        pdf_path: pdfPath,
        image_path: imagePath,
        author_id: data.user.id,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      });
      setNewsTitle(""); setNewsExcerpt(""); setNewsBody(""); setNewsPdf(null); setNewsImage(null);
    }, status === "published" ? "News item published" : "News draft saved");
  };

  const addResource = async () => {
    if (!data) return;
    await run(async () => {
      if (!resourceTitle.trim() || (!resourceUrl.trim() && !resourceFile)) throw new Error("Enter a title and either a link or file.");
      let storagePath = `external/manual/${crypto.randomUUID()}`;
      if (resourceFile) { storagePath = `uploads/${Date.now()}-${safeFilename(resourceFile.name)}`; await uploadFile("conference-documents", storagePath, resourceFile); }
      await insertRows("conference_documents", {
        title: resourceTitle.trim(), category: resourceCategory, storage_path: storagePath,
        external_url: resourceUrl.trim() || null, sport_id: resourceSportId || null,
        visibility: "members", status: "published", uploaded_by: data.user.id, published_at: new Date().toISOString(),
      });
      setResourceTitle(""); setResourceUrl(""); setResourceFile(null); setResourceSportId("");
    }, "Resource added");
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-600">Loading the RVC administrator dashboard…</div>;
  if (error || !data) return <div className="min-h-screen bg-slate-50 p-6"><Panel className="mx-auto max-w-2xl p-8"><h1 className="text-xl font-bold">Dashboard unavailable</h1><p className="mt-2 text-slate-600">{error instanceof Error ? error.message : "Please sign in."}</p><Link href="/login"><Button className="mt-5">Sign in</Button></Link></Panel></div>;

  const nav: Array<[Section, string, React.ElementType]> = [
    ["today", "Today", Home], ["calendar", "Conference Calendar", CalendarDays], ["scores", "Scores & Confirmations", ClipboardCheck],
    ["games", "Add / Manage Games", Gamepad2], ["school", data.user.isSuperAdmin ? "School Profiles" : "My School", Building2],
    ["standings", "Standings", Trophy], ["resources", "Resources", BookOpen], ["news", "News & Publicity", Megaphone],
    ...(data.user.isSuperAdmin ? [
      ["contacts", "Contact Inbox", Mail] as [Section, string, React.ElementType],
      ["users", "User Accounts", Users] as [Section, string, React.ElementType],
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="RVC Administrator Dashboard" description="Daily River Valley Conference operations for principals, athletic directors, conference officials, and publicists." type="website" />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-conference-gold"><ShieldCheck className="h-4 w-4" /> Secure conference dashboard</div><h1 className="mt-1 text-2xl font-bold">River Valley Conference</h1><p className="text-sm text-slate-300">{data.user.name} · {data.user.role} · {data.season.name}</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Public website</Button></Link>{data.user.isSuperAdmin && <Link href="/conference-admin/core"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10"><Database className="mr-2 h-4 w-4" /> Conference operations</Button></Link>}<Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => void signOut().then(() => window.location.assign("/login"))}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <aside><Panel className="sticky top-4 p-2">{nav.map(([key, label, Icon]) => <button key={key} type="button" onClick={() => setSection(key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === key ? "bg-conference-navy text-white" : "text-slate-700 hover:bg-slate-100"}`}><Icon className="h-4 w-4" /> {label}</button>)}</Panel></aside>
        <main className="min-w-0 space-y-6">
          {section === "today" && <><div><h2 className="text-2xl font-bold text-slate-950">Today across the RVC</h2><p className="text-sm text-slate-600">{formatLongDate(new Date())}. Select any game to view it or submit a score.</p></div>{todayGames.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{todayGames.map((game) => <GameCard key={game.id} game={game} onOpen={() => setSelectedGame(game)} />)}</div> : <Panel className="p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 font-bold text-slate-950">No RVC games are scheduled today</h3><p className="mt-1 text-sm text-slate-600">The next scheduled contests appear below.</p></Panel>}<div><h3 className="mb-3 text-lg font-bold text-slate-950">Coming up</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{upcomingGames.map((game) => <GameCard key={game.id} game={game} onOpen={() => setSelectedGame(game)} />)}</div></div></>}

          {section === "calendar" && <><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold text-slate-950">Conference calendar</h2><p className="text-sm text-slate-600">Select a date, then choose a game for score entry or review.</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={() => changeDate(-1)}><ChevronLeft className="h-4 w-4" /></Button><input className={inputClass} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /><Button variant="outline" size="icon" onClick={() => changeDate(1)}><ChevronRight className="h-4 w-4" /></Button></div></div><h3 className="text-lg font-bold text-slate-950">{formatLongDate(`${selectedDate}T12:00:00-05:00`)}</h3>{selectedDateGames.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{selectedDateGames.map((game) => <GameCard key={game.id} game={game} onOpen={() => setSelectedGame(game)} />)}</div> : <Panel className="p-10 text-center text-sm text-slate-600">No conference games on this date.</Panel>}</>}

          {section === "scores" && <><div><h2 className="text-2xl font-bold text-slate-950">Scores and confirmations</h2><p className="text-sm text-slate-600">Scores become official after the opposing school confirms them or a conference administrator reviews a dispute.</p></div><div className="space-y-4">{data.submissions.filter((submission) => submission.status === "pending").map((submission) => { const game=data.games.find((item)=>item.id===submission.game_id); const confirmations=data.confirmations.filter((confirmation)=>confirmation.submission_id===submission.id); return <Panel key={submission.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="font-bold text-slate-950">{game?.away_name} {submission.away_score} at {game?.home_name} {submission.home_score}</div><div className="text-sm text-slate-500">Submitted {formatShortDate(submission.submitted_at)}</div></div><div className="flex flex-wrap gap-2">{confirmations.map((confirmation) => <div key={confirmation.id} className="rounded-lg border border-slate-200 px-3 py-2"><div className="text-xs font-semibold">{teamMap.get(confirmation.team_id)?.display_name ?? "Team"}</div><div className={`text-xs capitalize ${confirmation.status === "confirmed" ? "text-emerald-700" : confirmation.status === "disputed" ? "text-red-700" : "text-amber-700"}`}>{confirmation.status}</div>{confirmation.status === "pending" && <div className="mt-2 flex gap-1"><Button size="sm" onClick={() => void run(() => rpc("confirm_result_submission", { submission_id: submission.id, target_team_id: confirmation.team_id, decision: "confirmed", note: null }), "Result confirmed")}>Confirm</Button><Button size="sm" variant="outline" onClick={() => void run(() => rpc("confirm_result_submission", { submission_id: submission.id, target_team_id: confirmation.team_id, decision: "disputed", note: "Score requires review." }), "Result disputed")}>Dispute</Button></div>}</div>)}</div></div></Panel>; })}{!data.submissions.some((submission) => submission.status === "pending") && <Panel className="p-10 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" /><p className="mt-2 font-semibold text-slate-950">No scores are waiting for confirmation.</p></Panel>}</div></>}

          {section === "games" && <><div><h2 className="text-2xl font-bold text-slate-950">Add and manage games</h2><p className="text-sm text-slate-600">Athletic directors and principals may add games involving their school. Conference administrators may add any game.</p></div>{canManageGames ? <Panel className="grid gap-4 p-6 md:grid-cols-2"><Field label="Sport"><select className={inputClass} value={gameSportId} onChange={(event) => { setGameSportId(event.target.value); setGameHomeTeamId(""); setGameAwayTeamId(""); }}><option value="">Choose sport</option>{data.sports.map((sport) => <option key={sport.id} value={sport.id}>{sportLabel(sport)}</option>)}</select></Field><Field label="Level"><select className={inputClass} value={gameLevel} onChange={(event) => setGameLevel(event.target.value)}><option>Varsity</option><option>JV</option><option>Freshman</option></select></Field><Field label="Away team"><select className={inputClass} value={gameAwayTeamId} onChange={(event) => setGameAwayTeamId(event.target.value)}><option value="">Choose team</option>{selectedSportTeams.map((team) => <option key={team.id} value={team.id}>{team.display_name}</option>)}</select></Field><Field label="Home team"><select className={inputClass} value={gameHomeTeamId} onChange={(event) => setGameHomeTeamId(event.target.value)}><option value="">Choose team</option>{selectedSportTeams.map((team) => <option key={team.id} value={team.id}>{team.display_name}</option>)}</select></Field><Field label="Date and time"><input className={inputClass} type="datetime-local" value={gameStartsAt} onChange={(event) => setGameStartsAt(event.target.value)} /></Field><Field label="Location"><input className={inputClass} value={gameLocation} onChange={(event) => setGameLocation(event.target.value)} placeholder="Gym, field, or school address" /></Field><div className="md:col-span-2"><Button onClick={() => void addGame()}><Plus className="mr-2 h-4 w-4" /> Add game</Button></div></Panel> : <Panel className="p-6 text-sm text-amber-800">Your account does not have game-management permission.</Panel>}<div><h3 className="mb-3 text-lg font-bold">Upcoming games</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{upcomingGames.map((game) => <GameCard key={game.id} game={game} onOpen={() => setSelectedGame(game)} />)}</div></div></>}

          {section === "school" && <><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold text-slate-950">{data.user.isSuperAdmin ? "School profiles" : "My school"}</h2><p className="text-sm text-slate-600">Keep logos, leadership, contact details, and links current.</p></div>{data.user.isSuperAdmin && <select className={`${inputClass} sm:w-72`} value={selectedSchoolId} onChange={(event) => setSelectedSchoolId(event.target.value)}>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select>}</div><Panel className="space-y-6 p-6"><div className="grid gap-4 md:grid-cols-3"><Field label="Official name"><input className={inputClass} value={schoolDraft.name ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, name: event.target.value }))} /></Field><Field label="Short name"><input className={inputClass} value={schoolDraft.short_name ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, short_name: event.target.value }))} /></Field><Field label="Mascot"><input className={inputClass} value={schoolDraft.mascot ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, mascot: event.target.value }))} /></Field></div><div className="grid gap-4 md:grid-cols-3"><Field label="Superintendent"><input className={inputClass} value={schoolDraft.superintendent_name ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, superintendent_name: event.target.value }))} /></Field><Field label="Principal"><input className={inputClass} value={schoolDraft.principal_name ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, principal_name: event.target.value }))} /></Field><Field label="Athletic director"><input className={inputClass} value={schoolDraft.athletic_director_name ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, athletic_director_name: event.target.value }))} /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Principal email"><input className={inputClass} type="email" value={principalEmail} onChange={(event) => setPrincipalEmail(event.target.value)} /></Field><Field label="Principal phone"><input className={inputClass} value={principalPhone} onChange={(event) => setPrincipalPhone(event.target.value)} /></Field><Field label="AD email"><input className={inputClass} type="email" value={adEmail} onChange={(event) => setAdEmail(event.target.value)} /></Field><Field label="AD phone"><input className={inputClass} value={adPhone} onChange={(event) => setAdPhone(event.target.value)} /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="School website"><input className={inputClass} type="url" value={schoolDraft.website_url ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, website_url: event.target.value }))} /></Field><Field label="Athletics website"><input className={inputClass} type="url" value={schoolDraft.athletics_url ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, athletics_url: event.target.value }))} /></Field><Field label="IHSA profile"><input className={inputClass} type="url" value={schoolDraft.ihsa_url ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, ihsa_url: event.target.value }))} /></Field><Field label="Livestream link"><input className={inputClass} type="url" value={schoolDraft.livestream_url ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, livestream_url: event.target.value }))} /></Field></div><div className="grid gap-4 md:grid-cols-4"><div className="md:col-span-2"><Field label="Street address"><input className={inputClass} value={schoolDraft.address_line1 ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, address_line1: event.target.value }))} /></Field></div><Field label="City"><input className={inputClass} value={schoolDraft.city ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, city: event.target.value }))} /></Field><Field label="ZIP"><input className={inputClass} value={schoolDraft.postal_code ?? ""} onChange={(event) => setSchoolDraft((draft) => ({ ...draft, postal_code: event.target.value }))} /></Field></div><div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"><Field label="New school logo" hint="PNG, JPG, WEBP, or SVG"><input className={inputClass} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} /></Field>{schoolDraft.logo_path && <img src={schoolDraft.logo_path} alt="Current logo" className="h-20 w-20 rounded-lg object-contain" />}</div><Button onClick={() => void saveSchool()}><Save className="mr-2 h-4 w-4" /> Save school profile</Button></Panel></>}

          {section === "standings" && <><div><h2 className="text-2xl font-bold text-slate-950">Conference standings</h2><p className="text-sm text-slate-600">Standings update from confirmed results.</p></div>{data.sports.filter((sport) => sport.standings_enabled).map((sport) => <Panel key={sport.id} className="overflow-hidden"><div className="bg-conference-navy px-5 py-3 font-bold text-white">{sportLabel(sport)}</div><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Rank</th><th className="px-4 py-2 text-left">Team</th><th className="px-4 py-2 text-center">Conference</th><th className="px-4 py-2 text-left">Tie status</th></tr></thead><tbody className="divide-y">{data.standings.filter((row) => row.sport_id === sport.id).map((row) => <tr key={row.id}><td className="px-4 py-3 font-bold">{row.rank ?? "—"}</td><td className="px-4 py-3 font-semibold">{row.team_name}</td><td className="px-4 py-3 text-center">{row.conference_wins}-{row.conference_losses}{row.conference_ties ? `-${row.conference_ties}` : ""}</td><td className="px-4 py-3 capitalize">{row.tie_status.replaceAll("_", " ")}</td></tr>)}</tbody></table></Panel>)}</>}

          {section === "resources" && <><div><h2 className="text-2xl font-bold text-slate-950">Conference resources</h2><p className="text-sm text-slate-600">Constitution, sport-specific operations guides, calendars, and internal conference documents.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.documents.map((document) => <Panel key={document.id} className="flex flex-col p-5"><div className="text-xs font-semibold uppercase tracking-wide text-conference-navy">{document.category ?? "Conference Resource"}</div><h3 className="mt-1 font-bold text-slate-950">{document.title}</h3>{document.description && <p className="mt-2 flex-1 text-sm text-slate-600">{document.description}</p>}<Button variant="outline" className="mt-4" onClick={() => void openDocument(document)}>Open resource <ExternalLink className="ml-2 h-4 w-4" /></Button></Panel>)}</div>{canManageResources && <Panel className="grid gap-4 p-6 md:grid-cols-2"><div className="md:col-span-2"><h3 className="text-lg font-bold">Add a resource</h3></div><Field label="Title"><input className={inputClass} value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} /></Field><Field label="Category"><input className={inputClass} value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)} /></Field><Field label="Sport"><select className={inputClass} value={resourceSportId} onChange={(event) => setResourceSportId(event.target.value)}><option value="">Conference-wide</option>{data.sports.map((sport) => <option key={sport.id} value={sport.id}>{sportLabel(sport)}</option>)}</select></Field><Field label="External link"><input className={inputClass} type="url" value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} /></Field><div className="md:col-span-2"><Field label="Or upload a PDF / Office document"><input className={inputClass} type="file" accept="application/pdf,.docx,.xlsx" onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)} /></Field></div><div className="md:col-span-2"><Button onClick={() => void addResource()}><Upload className="mr-2 h-4 w-4" /> Add resource</Button></div></Panel>}</>}

          {section === "news" && <><div><h2 className="text-2xl font-bold text-slate-950">News and publicity</h2><p className="text-sm text-slate-600">Create a complete public announcement or upload a conference publicist PDF for newspapers and the website.</p></div>{canEditNews ? <Panel className="grid gap-4 p-6 md:grid-cols-2"><Field label="Headline"><input className={inputClass} value={newsTitle} onChange={(event) => setNewsTitle(event.target.value)} /></Field><Field label="Category"><select className={inputClass} value={newsCategory} onChange={(event) => setNewsCategory(event.target.value)}><option>Conference Update</option><option>Athletics</option><option>Event Recap</option><option>Schedule Update</option><option>Academic</option></select></Field><div className="md:col-span-2"><Field label="Homepage summary"><textarea className={inputClass} rows={3} value={newsExcerpt} onChange={(event) => setNewsExcerpt(event.target.value)} /></Field></div><div className="md:col-span-2"><Field label="Full announcement" hint="Optional when the PDF contains the complete release"><textarea className={inputClass} rows={7} value={newsBody} onChange={(event) => setNewsBody(event.target.value)} /></Field></div><Field label="Publicist PDF"><input className={inputClass} type="file" accept="application/pdf" onChange={(event) => setNewsPdf(event.target.files?.[0] ?? null)} /></Field><Field label="Story image"><input className={inputClass} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setNewsImage(event.target.files?.[0] ?? null)} /></Field><div className="md:col-span-2 flex gap-2"><Button variant="outline" onClick={() => void publishNews("draft")}>Save draft</Button><Button onClick={() => void publishNews("published")}><Megaphone className="mr-2 h-4 w-4" /> Publish</Button></div></Panel> : <Panel className="p-6 text-sm text-slate-600">News publishing is available to conference administrators and the conference publicist.</Panel>}<div className="space-y-3">{data.news.map((item) => <Panel key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-bold text-slate-950">{item.title}</div><div className="text-sm text-slate-500">{item.category ?? "Conference Update"} · <span className="capitalize">{item.status}</span> · {formatShortDate(item.published_at ?? item.created_at)}</div></div>{canEditNews && <Button variant="outline" size="sm" onClick={() => void run(() => updateRows("news_items", `id=eq.${item.id}`, { status: item.status === "published" ? "draft" : "published", published_at: item.status === "published" ? null : new Date().toISOString() }), item.status === "published" ? "News item returned to draft" : "News item published")}>{item.status === "published" ? "Unpublish" : "Publish"}</Button>}</Panel>)}</div></>}

          {section === "contacts" && data.user.isSuperAdmin && <><div><h2 className="text-2xl font-bold text-slate-950">Contact inbox</h2><p className="text-sm text-slate-600">Messages submitted through the public conference website.</p></div><div className="space-y-4">{data.contactSubmissions.map((submission) => <Panel key={submission.id} className={`p-5 ${submission.status === "new" ? "border-l-4 border-l-conference-gold" : ""}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-wide text-conference-navy">{submission.subject.replaceAll("_", " ")}</div><h3 className="mt-1 font-bold text-slate-950">{submission.name}{submission.school ? ` · ${submission.school}` : ""}</h3><a className="text-sm text-blue-700 hover:underline" href={`mailto:${submission.email}`}>{submission.email}</a><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.message}</p><div className="mt-3 text-xs text-slate-500">Received {formatShortDate(submission.created_at)} · <span className="capitalize">{submission.status}</span></div></div><div className="flex flex-none gap-2"><a href={`mailto:${submission.email}?subject=${encodeURIComponent(`RVC: ${submission.subject}`)}`}><Button variant="outline" size="sm"><Mail className="mr-2 h-4 w-4" /> Reply</Button></a>{submission.status === "new" && <Button size="sm" onClick={() => void run(() => updateRows("contact_submissions", `id=eq.${submission.id}`, { status: "reviewed", reviewed_at: new Date().toISOString(), reviewed_by: data.user.id }), "Message marked reviewed")}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark reviewed</Button>}</div></div></Panel>)}{!data.contactSubmissions.length && <Panel className="p-10 text-center"><Mail className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 font-semibold text-slate-950">No contact messages yet.</p></Panel>}</div></>}

          {section === "users" && data.user.isSuperAdmin && <><div><h2 className="text-2xl font-bold text-slate-950">User accounts</h2><p className="text-sm text-slate-600">Review registered users, school assignments, roles, access status, and send password-reset links.</p></div><Panel className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100"><tr><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">School</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Last sign-in</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y">{data.users.map((user) => <tr key={`${user.user_id}-${user.membership_id ?? "none"}`}><td className="px-4 py-3"><div className="font-semibold">{user.full_name || user.email}</div><div className="text-xs text-slate-500">{user.email}</div></td><td className="px-4 py-3"><select className={inputClass} value={user.role ?? ""} disabled={!user.membership_id} onChange={(event) => void run(() => updateRows("memberships", `id=eq.${user.membership_id}`, { role: event.target.value }), "Role updated")}><option value="">No role</option><option value="conference_admin">Conference admin</option><option value="conference_official">Conference official</option><option value="press_editor">Press editor</option><option value="school_principal">Principal</option><option value="athletic_director">Athletic director</option></select></td><td className="px-4 py-3"><select className={inputClass} value={user.school_id ?? ""} disabled={!user.membership_id} onChange={(event) => void run(() => updateRows("memberships", `id=eq.${user.membership_id}`, { school_id: event.target.value || null }), "School assignment updated")}><option value="">Conference-wide</option>{data.schools.map((school) => <option key={school.id} value={school.id}>{school.short_name ?? school.name}</option>)}</select></td><td className="px-4 py-3"><select className={inputClass} value={user.membership_status ?? ""} disabled={!user.membership_id} onChange={(event) => void run(() => updateRows("memberships", `id=eq.${user.membership_id}`, { status: event.target.value }), "Account status updated")}><option value="invited">Invited</option><option value="active">Active</option><option value="suspended">Suspended</option></select></td><td className="px-4 py-3 text-slate-600">{formatShortDate(user.last_sign_in_at)}</td><td className="px-4 py-3"><Button variant="outline" size="sm" onClick={() => void run(() => sendPasswordReset(user.email), `Password-reset link sent to ${user.email}`)}><KeyRound className="mr-2 h-4 w-4" /> Reset</Button></td></tr>)}</tbody></table></div></Panel><Panel className="p-5 text-sm text-slate-600"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" /><div><div className="font-semibold text-slate-950">New account invitations</div><p className="mt-1">The directory and reset workflow are active. Secure one-click invitations require a server-side Supabase Auth Admin service; that will be added without exposing administrative credentials to the browser.</p></div></div></Panel></>}
        </main>
      </div>
      {selectedGame && <ScoreModal key={selectedGame.id} game={selectedGame} sport={sportMap.get(selectedGame.sport_id)} onClose={() => setSelectedGame(null)} onSaved={refresh} />}
    </div>
  );
}
