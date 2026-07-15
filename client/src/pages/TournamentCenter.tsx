import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import { memberSelect, publicSelect, rpc, updateRows } from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface Season { id: string; name: string }
interface Sport { id: string; name: string; gender_label: string | null }
interface Team { id: string; display_name: string | null; school_id: string }
interface Standing { sport_id: string; team_id: string; rank: number | null; team_name: string; tie_status: string }
interface Tournament {
  id: string;
  sport_id: string;
  name: string;
  status: string;
  bracket_size: number | null;
  starts_on: string | null;
  ends_on: string | null;
  seeding_notes: string | null;
  published_at: string | null;
}
interface Entry { tournament_id: string; team_id: string; seed: number | null; final_place: number | null; status: string }
interface BracketGame {
  id: string;
  tournament_id: string;
  round_number: number;
  round_name: string | null;
  bracket_position: number;
  home_source: string | null;
  away_source: string | null;
  game_id: string | null;
}
interface Game { id: string; starts_at: string; status: string; location_text: string | null }
interface GameResult { game_id: string; home_score: number; away_score: number; result_type: string }
interface UserContext { name: string; role: string; isSuperAdmin: boolean }
interface TournamentData {
  user: UserContext | null;
  season: Season;
  sports: Sport[];
  teams: Team[];
  standings: Standing[];
  tournaments: Tournament[];
  entries: Entry[];
  bracketGames: BracketGame[];
  games: Game[];
  results: GameResult[];
}

function label(sport?: Sport) {
  if (!sport) return "Conference";
  return sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${sport.name}` : sport.name;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadTournamentData(adminMode: boolean): Promise<TournamentData> {
  const select = adminMode ? memberSelect : publicSelect;
  const user = adminMode ? await getRvcUserContext() as UserContext | null : null;
  if (adminMode && !user) throw new Error("Please sign in to manage tournaments.");
  const seasons = await select<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active conference season is configured.");
  const sid = encodeURIComponent(season.id);
  const tournamentStatusFilter = adminMode ? "" : "&status=in.(published,complete)";
  const [sports, teams, standings, tournaments, entries, bracketGames, games, results] = await Promise.all([
    select<Sport[]>("sports?is_active=eq.true&select=id,name,gender_label&order=display_order.asc"),
    select<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,display_name,school_id`),
    select<Standing[]>(`public_standings?season_id=eq.${sid}&select=sport_id,team_id,rank,team_name,tie_status&order=sport_name.asc,rank.asc,team_name.asc`),
    select<Tournament[]>(`tournaments?season_id=eq.${sid}${tournamentStatusFilter}&select=id,sport_id,name,status,bracket_size,starts_on,ends_on,seeding_notes,published_at&order=starts_on.asc.nullslast,name.asc`),
    select<Entry[]>("tournament_entries?select=tournament_id,team_id,seed,final_place,status&order=seed.asc.nullslast"),
    select<BracketGame[]>("tournament_games?select=id,tournament_id,round_number,round_name,bracket_position,home_source,away_source,game_id&order=round_number.asc,bracket_position.asc"),
    select<Game[]>(`games?season_id=eq.${sid}&select=id,starts_at,status,location_text`),
    select<GameResult[]>("game_results?select=game_id,home_score,away_score,result_type"),
  ]);
  return { user, season, sports, teams, standings, tournaments, entries, bracketGames, games, results };
}

export default function TournamentCenter({ adminMode = false }: { adminMode?: boolean }) {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: [adminMode ? "rvc-tournament-admin" : "rvc-tournament-public"],
    queryFn: () => loadTournamentData(adminMode),
    staleTime: adminMode ? 15_000 : 60_000,
  });
  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const gameMap = useMemo(() => new Map(data?.games.map((game) => [game.id, game]) ?? []), [data?.games]);
  const resultMap = useMemo(() => new Map(data?.results.map((result) => [result.game_id, result]) ?? []), [data?.results]);
  const canManage = Boolean(adminMode && data?.user && (data.user.isSuperAdmin || ["SuperAdmin", "conference_admin", "conference_official"].includes(data.user.role)));

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rvc-tournament-admin"] }),
      queryClient.invalidateQueries({ queryKey: ["rvc-tournament-public"] }),
      queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth"] }),
      queryClient.invalidateQueries({ queryKey: ["rvc-source-of-truth-admin"] }),
    ]);
  };
  const run = async (work: () => Promise<unknown>, success: string) => {
    try {
      await work();
      await refresh();
      toast({ title: success });
    } catch (actionError) {
      toast({ title: "Tournament update failed", description: actionError instanceof Error ? actionError.message : "Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-600">Loading conference tournaments…</div>;
  if (error || !data) return <div className="min-h-screen bg-slate-50 p-10 text-center text-red-700">{error instanceof Error ? error.message : "Tournament information is unavailable."}</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title={adminMode ? "RVC Tournament Management" : "RVC Conference Tournaments"}
        description="Official River Valley Conference tournament seeds and brackets generated from confirmed conference standings."
        type="website"
      />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-9 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-conference-gold">
              {adminMode ? <ShieldCheck className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
              {adminMode ? "Secure bracket workspace" : "Official conference brackets"}
            </div>
            <h1 className="mt-2 text-3xl font-bold">{adminMode ? "Tournament Management" : "RVC Tournaments"}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Brackets are generated from confirmed conference standings. Pending ties must be formally resolved before seeds or brackets can be published.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={adminMode ? "/conference-admin" : "/conference"}><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10"><ArrowLeft className="mr-2 h-4 w-4" /> {adminMode ? "Workspace" : "Conference hub"}</Button></Link>
            {adminMode && <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {!data.tournaments.length && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h2 className="font-bold text-slate-950">No tournament bracket is published yet</h2>
            <p className="mt-2 text-sm text-slate-600">The conference will publish brackets after standings and tie-breakers are verified.</p>
          </div>
        )}

        {data.tournaments.map((tournament) => {
          const standings = data.standings.filter((standing) => standing.sport_id === tournament.sport_id);
          const entries = data.entries.filter((entry) => entry.tournament_id === tournament.id).sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
          const bracketGames = data.bracketGames.filter((game) => game.tournament_id === tournament.id);
          const rounds = [...new Set(bracketGames.map((game) => game.round_number))].sort((a, b) => a - b);
          const hasPendingTie = standings.some((standing) => standing.tie_status === "pending");

          return (
            <section key={tournament.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-conference-navy">{label(sportMap.get(tournament.sport_id))}</div>
                    <h2 className="mt-1 text-2xl font-bold text-slate-950">{tournament.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {tournament.starts_on ? new Date(tournament.starts_on).toLocaleDateString() : "Dates forthcoming"} · <span className="capitalize">{tournament.status}</span>
                    </p>
                    {tournament.seeding_notes && <p className="mt-3 max-w-3xl text-xs text-slate-500">{tournament.seeding_notes}</p>}
                  </div>
                  {adminMode && canManage && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" disabled={hasPendingTie || !standings.length} onClick={() => void run(async () => {
                        if (hasPendingTie) throw new Error("Resolve pending standings ties before seeding.");
                        for (const standing of standings) {
                          if (!standing.rank) throw new Error(`No official rank is available for ${standing.team_name}.`);
                          await updateRows("tournament_entries", `tournament_id=eq.${tournament.id}&team_id=eq.${standing.team_id}`, { seed: standing.rank });
                        }
                      }, "Tournament seeded from official standings")}>Seed from standings</Button>
                      <Button variant="outline" disabled={hasPendingTie || entries.some((entry) => !entry.seed)} onClick={() => void run(
                        () => rpc("generate_tournament_bracket", { target_tournament_id: tournament.id }),
                        "Tournament bracket generated",
                      )}>Generate bracket</Button>
                      <Button disabled={!bracketGames.length} onClick={() => void run(
                        () => updateRows("tournaments", `id=eq.${tournament.id}`, { status: "published", published_at: new Date().toISOString() }),
                        "Tournament bracket published",
                      )}>Publish bracket</Button>
                    </div>
                  )}
                </div>
                {adminMode && hasPendingTie && <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">A standings tie is still pending. Record the conference resolution before seeding this tournament.</div>}
              </div>

              {adminMode && (
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Seed list</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {entries.map((entry) => (
                      <div key={entry.team_id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        <span className="font-semibold">{entry.seed ? `#${entry.seed} ` : ""}{teamMap.get(entry.team_id)?.display_name ?? "Team"}</span>
                        {canManage && <input aria-label={`Seed for ${teamMap.get(entry.team_id)?.display_name ?? "team"}`} className="w-14 rounded border border-slate-300 px-2 py-1 text-center" type="number" min="1" value={entry.seed ?? ""} onChange={(event) => void run(
                          () => updateRows("tournament_entries", `tournament_id=eq.${tournament.id}&team_id=eq.${entry.team_id}`, { seed: event.target.value ? Number(event.target.value) : null }),
                          "Seed updated",
                        )} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto px-6 py-7">
                {!rounds.length ? (
                  <div className="py-8 text-center text-sm text-slate-600">The bracket has not been generated.</div>
                ) : (
                  <div className="flex min-w-max items-stretch gap-6">
                    {rounds.map((roundNumber) => {
                      const games = bracketGames.filter((game) => game.round_number === roundNumber);
                      return (
                        <div key={roundNumber} className="w-72 flex-none">
                          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-conference-navy">{games[0]?.round_name ?? `Round ${roundNumber}`}</h3>
                          <div className="flex h-full flex-col justify-around gap-5">
                            {games.map((bracketGame) => {
                              const linkedGame = bracketGame.game_id ? gameMap.get(bracketGame.game_id) : undefined;
                              const result = bracketGame.game_id ? resultMap.get(bracketGame.game_id) : undefined;
                              return (
                                <div key={bracketGame.id} className="rounded-lg border border-slate-300 bg-white shadow-sm">
                                  <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">Match {bracketGame.bracket_position}</div>
                                  <div className="divide-y divide-slate-200">
                                    <div className="flex items-center justify-between px-3 py-3"><span className="font-semibold text-slate-900">{bracketGame.home_source ?? "TBD"}</span>{result && <span className="text-lg font-bold">{result.home_score}</span>}</div>
                                    <div className="flex items-center justify-between px-3 py-3"><span className="font-semibold text-slate-900">{bracketGame.away_source ?? "TBD"}</span>{result && <span className="text-lg font-bold">{result.away_score}</span>}</div>
                                  </div>
                                  {linkedGame && <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"><div>{formatDate(linkedGame.starts_at)}</div><div>{linkedGame.location_text ?? "Location forthcoming"}</div>{result && <div className="mt-1 inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Final{result.result_type === "forfeit" ? " — Forfeit" : ""}</div>}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {!adminMode && <div className="text-center"><Link href="/conference"><Button variant="outline">Return to the conference hub <ExternalLink className="ml-2 h-4 w-4" /></Button></Link></div>}
      </main>
    </div>
  );
}
