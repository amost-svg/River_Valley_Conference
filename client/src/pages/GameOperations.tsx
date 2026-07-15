import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, CalendarClock, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import { memberSelect, rpc } from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface Season { id: string; name: string }
interface Sport { id: string; name: string; gender_label: string | null }
interface Team { id: string; display_name: string | null; school_id: string; sport_id: string }
interface Game {
  id: string;
  sport_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  status: string;
  is_published: boolean;
  location_text: string | null;
  notes: string | null;
}
interface UserContext { name: string; role: string; isSuperAdmin: boolean }
interface OperationsData { user: UserContext; season: Season; sports: Sport[]; teams: Team[]; games: Game[] }

const controlClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-conference-navy focus:outline-none focus:ring-2 focus:ring-conference-navy/20";

function localInputValue(value: string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace(" ", "T");
}

function centralIso(value: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const month = Number(datePart.split("-")[1]);
  const offset = month >= 11 || month <= 2 ? "-06:00" : "-05:00";
  return `${datePart}T${timePart}:00${offset}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadOperations(): Promise<OperationsData> {
  const user = await getRvcUserContext() as UserContext | null;
  if (!user) throw new Error("Please sign in to manage games.");
  const seasons = await memberSelect<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active season is configured.");
  const sid = encodeURIComponent(season.id);
  const [sports, teams, games] = await Promise.all([
    memberSelect<Sport[]>("sports?is_active=eq.true&select=id,name,gender_label&order=display_order.asc"),
    memberSelect<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,display_name,school_id,sport_id`),
    memberSelect<Game[]>(`games?season_id=eq.${sid}&select=id,sport_id,home_team_id,away_team_id,starts_at,status,is_published,location_text,notes&order=starts_at.asc`),
  ]);
  return { user, season, sports, teams, games };
}

export default function GameOperations() {
  const [sportFilter, setSportFilter] = useState("all");
  const [gameId, setGameId] = useState("");
  const [newStatus, setNewStatus] = useState("postponed");
  const [newStart, setNewStart] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [forfeitingTeamId, setForfeitingTeamId] = useState("");
  const [forfeitNote, setForfeitNote] = useState("");
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({ queryKey: ["rvc-game-operations"], queryFn: loadOperations, staleTime: 15_000 });

  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const filteredGames = useMemo(
    () => data?.games.filter((game) => game.status !== "final" && (sportFilter === "all" || game.sport_id === sportFilter)) ?? [],
    [data?.games, sportFilter],
  );
  const selectedGame = data?.games.find((game) => game.id === gameId);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rvc-game-operations"] }),
      queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth-admin"] }),
      queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth"] }),
    ]);
  };

  const run = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      await refresh();
      toast({ title: success });
    } catch (actionError) {
      toast({
        title: "The game could not be updated",
        description: actionError instanceof Error ? actionError.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-600">Loading game operations…</div>;
  if (error || !data) return <div className="min-h-screen bg-slate-50 p-10 text-center text-red-700">{error instanceof Error ? error.message : "Game operations are unavailable."}</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="RVC Game Operations" description="Secure RVC game rescheduling, postponement, cancellation, and forfeit management." type="website" />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-conference-gold"><CalendarClock className="h-4 w-4" /> Game operations</div>
            <h1 className="mt-1 text-2xl font-bold">Schedule Changes and Forfeits</h1>
            <p className="text-sm text-slate-300">{data.user.name} · {data.user.role} · {data.season.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/conference-admin"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10"><ArrowLeft className="mr-2 h-4 w-4" /> Workspace</Button></Link>
            <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 flex-none" /><p>Postponements and cancellations require an explanation. A final result can only be created through the confirmed-score workflow or a conference-authorized forfeit.</p></div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Sport<select className={`${controlClass} mt-1`} value={sportFilter} onChange={(event) => { setSportFilter(event.target.value); setGameId(""); }}><option value="all">All sports</option>{data.sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${sport.name}` : sport.name}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Game<select className={`${controlClass} mt-1`} value={gameId} onChange={(event) => { const id=event.target.value; setGameId(id); const game=data.games.find((item)=>item.id===id); setNewStart(game ? localInputValue(game.starts_at) : ""); setForfeitingTeamId(""); }}><option value="">Choose a game</option>{filteredGames.map((game) => <option key={game.id} value={game.id}>{formatDate(game.starts_at)} — {teamMap.get(game.away_team_id ?? "")?.display_name ?? "TBD"} at {teamMap.get(game.home_team_id ?? "")?.display_name ?? "TBD"}</option>)}</select></label>
          </div>
          {selectedGame && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              <div className="font-bold text-slate-950">{teamMap.get(selectedGame.away_team_id ?? "")?.display_name} at {teamMap.get(selectedGame.home_team_id ?? "")?.display_name}</div>
              <div className="mt-1">{formatDate(selectedGame.starts_at)} · {sportMap.get(selectedGame.sport_id)?.name} · <span className="capitalize">{selectedGame.status}</span></div>
              <div>{selectedGame.location_text ?? "Location not specified"} · {selectedGame.is_published ? "Published" : "Internal draft"}</div>
              {selectedGame.notes && <div className="mt-2 text-xs text-slate-500">{selectedGame.notes}</div>}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Change schedule status</h2>
            <p className="mt-1 text-sm text-slate-600">Reschedule, postpone, or cancel a game your role is authorized to manage.</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">New status<select className={`${controlClass} mt-1`} value={newStatus} onChange={(event) => setNewStatus(event.target.value)}><option value="scheduled">Scheduled / rescheduled</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select></label>
              <label className="block text-sm font-semibold text-slate-700">New date and time<input className={`${controlClass} mt-1`} type="datetime-local" value={newStart} onChange={(event) => setNewStart(event.target.value)} /></label>
              <label className="block text-sm font-semibold text-slate-700">Required note for postponement or cancellation<textarea className={`${controlClass} mt-1`} rows={4} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Weather, facility conflict, mutually approved makeup date…" /></label>
              <Button disabled={!selectedGame} onClick={() => void run(async () => {
                if (!selectedGame) throw new Error("Choose a game.");
                if (["postponed", "cancelled"].includes(newStatus) && !statusNote.trim()) throw new Error("Enter an explanation.");
                await rpc("update_game_schedule_status", {
                  target_game_id: selectedGame.id,
                  new_status: newStatus,
                  new_starts_at: newStatus === "scheduled" ? centralIso(newStart) : null,
                  note: statusNote || null,
                });
                setStatusNote("");
              }, "Game schedule updated")}>Save schedule change</Button>
            </div>
          </section>

          <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-700" /><h2 className="text-lg font-bold text-slate-950">Record a forfeit</h2></div>
            <p className="mt-1 text-sm text-slate-600">This immediately creates a final 1–0 result, identifies the forfeiting team, rejects pending score submissions, and recalculates standings.</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Forfeiting team<select className={`${controlClass} mt-1`} value={forfeitingTeamId} onChange={(event) => setForfeitingTeamId(event.target.value)}><option value="">Choose team</option>{selectedGame?.home_team_id && <option value={selectedGame.home_team_id}>{teamMap.get(selectedGame.home_team_id)?.display_name}</option>}{selectedGame?.away_team_id && <option value={selectedGame.away_team_id}>{teamMap.get(selectedGame.away_team_id)?.display_name}</option>}</select></label>
              <label className="block text-sm font-semibold text-slate-700">Required conference ruling or explanation<textarea className={`${controlClass} mt-1`} rows={4} value={forfeitNote} onChange={(event) => setForfeitNote(event.target.value)} placeholder="Include who authorized the ruling and the conference basis." /></label>
              <Button variant="destructive" disabled={!selectedGame || !forfeitingTeamId} onClick={() => void run(async () => {
                if (!selectedGame || !forfeitingTeamId || !forfeitNote.trim()) throw new Error("Choose the forfeiting team and enter the conference explanation.");
                await rpc("record_game_forfeit", {
                  target_game_id: selectedGame.id,
                  forfeiting_team_id: forfeitingTeamId,
                  note: forfeitNote,
                });
                setForfeitingTeamId("");
                setForfeitNote("");
                setGameId("");
              }, "Forfeit recorded and standings recalculated")}>Record final forfeit</Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
