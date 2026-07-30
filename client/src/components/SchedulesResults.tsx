import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle2, Clock, MapPin } from "lucide-react";
import { publicSelect } from "@/lib/rvcData";

interface Season { id: string; name: string }
interface Sport { id: string; slug: string; name: string; gender_label: string | null }
interface Team { id: string; sport_id: string; display_name: string | null }
interface Game {
  id: string;
  sport_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  status: string;
  location_text: string | null;
  is_conference: boolean;
  notes: string | null;
  external_source: string | null;
}
interface GameResult { game_id: string; home_score: number; away_score: number; result_type: string }
interface ScheduleData { season: Season; sports: Sport[]; teams: Team[]; games: Game[]; results: GameResult[] }

const sportAccent: Record<string, string> = {
  "girls-volleyball": "border-purple-500",
  "boys-soccer": "border-emerald-500",
  "girls-basketball": "border-rose-500",
  "boys-basketball": "border-orange-500",
  baseball: "border-blue-500",
  softball: "border-yellow-500",
  "track-field": "border-red-500",
  "scholastic-bowl": "border-indigo-500",
};

function sportLabel(sport: Sport) {
  return sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${sport.name}` : sport.name;
}

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

function formatDate(value: string, long = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: long ? "long" : "short",
    month: long ? "long" : "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(game: Game) {
  if (
    game.external_source === "Importable RVC Master"
    && game.notes?.includes("Start time requires school verification")
  ) {
    return "Time TBA";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(game.starts_at));
}

async function loadSchedule(): Promise<ScheduleData> {
  const seasons = await publicSelect<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active conference season is configured.");
  const sid = encodeURIComponent(season.id);
  const [sports, teams, games, results] = await Promise.all([
    publicSelect<Sport[]>("sports?is_active=eq.true&select=id,slug,name,gender_label&order=display_order.asc"),
    publicSelect<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,sport_id,display_name`),
    publicSelect<Game[]>(`games?season_id=eq.${sid}&is_published=eq.true&select=id,sport_id,home_team_id,away_team_id,starts_at,status,location_text,is_conference,notes,external_source&order=starts_at.asc`),
    publicSelect<GameResult[]>("game_results?select=game_id,home_score,away_score,result_type"),
  ]);
  const scheduledSportIds = new Set(games.map((game) => game.sport_id));
  return { season, sports: sports.filter((sport) => scheduledSportIds.has(sport.id)), teams, games, results };
}

export default function SchedulesResults() {
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-home-schedule"],
    queryFn: loadSchedule,
    staleTime: 60_000,
  });

  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const resultMap = useMemo(() => new Map(data?.results.map((result) => [result.game_id, result]) ?? []), [data?.results]);
  const selectedSport = data?.sports.find((sport) => sport.id === selectedSportId);
  const selectedGames = useMemo(
    () => data?.games.filter((game) => !selectedSportId || game.sport_id === selectedSportId) ?? [],
    [data?.games, selectedSportId],
  );
  const todayKey = centralDateKey(new Date());
  const todayGames = selectedGames.filter((game) => centralDateKey(game.starts_at) === todayKey);
  const nextDateKey = selectedGames
    .filter((game) => game.status !== "final" && centralDateKey(game.starts_at) > todayKey)
    .map((game) => centralDateKey(game.starts_at))
    .sort()[0];
  const featuredGames = todayGames.length
    ? todayGames
    : selectedGames.filter((game) => nextDateKey && centralDateKey(game.starts_at) === nextDateKey);
  const upcoming = selectedGames
    .filter((game) => game.status !== "final" && centralDateKey(game.starts_at) >= todayKey)
    .slice(0, selectedSportId ? 6 : 12);
  const recent = selectedGames
    .filter((game) => game.status === "final")
    .slice(-(selectedSportId ? 6 : 12))
    .reverse();

  const GameCard = ({ game }: { game: Game }) => {
    const sport = sportMap.get(game.sport_id);
    return (
      <Card className={`border-l-4 ${sportAccent[sport?.slug ?? ""] ?? "border-conference-navy"} shadow-md`}>
        <CardContent className="p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-conference-navy">
            {sport ? sportLabel(sport) : "Conference"}
          </div>
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(game.starts_at)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(game)}</span>
          </div>
          <div className="text-lg font-bold text-slate-950">
            {teamMap.get(game.away_team_id ?? "")?.display_name ?? "TBD"}
            <span className="mx-2 text-sm font-normal text-slate-400">at</span>
            {teamMap.get(game.home_team_id ?? "")?.display_name ?? "TBD"}
          </div>
          <div className="mt-4 flex items-start gap-1.5 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 flex-none" /> {game.location_text ?? "Location TBA"}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section id="schedules" className="bg-section-gradient-1 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-10 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Today in the RVC</h2>
          <p className="text-lg text-gray-600">Conference schedules, verified results, and the next contests across all member schools</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
            <p className="font-semibold text-amber-900">The conference schedule is temporarily unavailable.</p>
            <p className="mt-1 text-sm text-amber-800">Please refresh the page in a moment.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            <div className="flex justify-center gap-2">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-11 w-28" />)}</div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}</div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:justify-center">
              <Button
                variant={selectedSportId === null ? "default" : "outline"}
                onClick={() => setSelectedSportId(null)}
                className={`flex-none rounded-full px-5 ${selectedSportId === null ? "bg-conference-navy text-white" : "bg-white"}`}
              >
                All sports
              </Button>
              {data?.sports.map((sport) => (
                <Button
                  key={sport.id}
                  variant={sport.id === selectedSportId ? "default" : "outline"}
                  onClick={() => setSelectedSportId(sport.id)}
                  className={`flex-none rounded-full px-5 ${sport.id === selectedSportId ? "bg-conference-navy text-white" : "bg-white"}`}
                >
                  {sportLabel(sport)}
                </Button>
              ))}
            </div>

            {!selectedGames.length ? (
              <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-sm">
                <Calendar className="mx-auto mb-4 h-10 w-10 text-conference-navy/50" />
                <h3 className="text-xl font-bold text-slate-950">
                  {selectedSport ? `The ${sportLabel(selectedSport)} schedule is being verified` : "The conference schedule is being verified"}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Games appear here as conference administrators and athletic directors confirm dates, times, locations, and cooperative-team arrangements.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {featuredGames.length > 0 && (
                  <div className="rounded-2xl bg-conference-navy p-5 shadow-lg sm:p-7">
                    <div className="mb-5 text-white">
                      <div className="text-sm font-semibold uppercase tracking-wide text-conference-gold">
                        {todayGames.length ? "Tonight across the conference" : "Next conference action"}
                      </div>
                      <h3 className="mt-1 text-2xl font-bold">{formatDate(featuredGames[0].starts_at, true)}</h3>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {featuredGames.map((game) => <GameCard key={game.id} game={game} />)}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xl font-bold text-slate-950">Upcoming Games</h3>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {upcoming.map((game) => <GameCard key={game.id} game={game} />)}
                    </div>
                  </div>
                )}

                {recent.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xl font-bold text-slate-950">Recent Verified Results</h3>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {recent.map((game) => {
                        const result = resultMap.get(game.id);
                        const sport = sportMap.get(game.sport_id);
                        return (
                          <Card key={game.id} className="border-l-4 border-emerald-500 shadow-md">
                            <CardContent className="p-6">
                              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-conference-navy">{sport ? sportLabel(sport) : "Conference"}</div>
                              <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                                <span>{formatDate(game.starts_at)}</span>
                                <span className="flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Final</span>
                              </div>
                              <div className="space-y-2 text-lg font-bold text-slate-950">
                                <div className="flex justify-between"><span>{teamMap.get(game.away_team_id ?? "")?.display_name ?? "Away"}</span><span>{result?.away_score ?? "—"}</span></div>
                                <div className="flex justify-between"><span>{teamMap.get(game.home_team_id ?? "")?.display_name ?? "Home"}</span><span>{result?.home_score ?? "—"}</span></div>
                              </div>
                              {result?.result_type === "forfeit" && <p className="mt-3 text-xs font-semibold uppercase text-red-700">Forfeit</p>}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
