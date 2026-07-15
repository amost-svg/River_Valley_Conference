import { useEffect, useMemo, useState } from "react";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadSchedule(): Promise<ScheduleData> {
  const seasons = await publicSelect<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active conference season is configured.");
  const sid = encodeURIComponent(season.id);
  const [sports, teams, games, results] = await Promise.all([
    publicSelect<Sport[]>("sports?is_active=eq.true&select=id,slug,name,gender_label&order=display_order.asc"),
    publicSelect<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,sport_id,display_name`),
    publicSelect<Game[]>(`games?season_id=eq.${sid}&is_published=eq.true&select=id,sport_id,home_team_id,away_team_id,starts_at,status,location_text,is_conference&order=starts_at.asc`),
    publicSelect<GameResult[]>("game_results?select=game_id,home_score,away_score,result_type"),
  ]);
  const scheduledSportIds = new Set(teams.map((team) => team.sport_id));
  return { season, sports: sports.filter((sport) => scheduledSportIds.has(sport.id)), teams, games, results };
}

export default function SchedulesResults() {
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-home-schedule"],
    queryFn: loadSchedule,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!selectedSportId && data?.sports.length) setSelectedSportId(data.sports[0].id);
  }, [data?.sports, selectedSportId]);

  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);
  const resultMap = useMemo(() => new Map(data?.results.map((result) => [result.game_id, result]) ?? []), [data?.results]);
  const selectedSport = data?.sports.find((sport) => sport.id === selectedSportId);
  const selectedGames = useMemo(
    () => data?.games.filter((game) => game.sport_id === selectedSportId) ?? [],
    [data?.games, selectedSportId],
  );
  const upcoming = selectedGames.filter((game) => game.status !== "final" && new Date(game.starts_at).getTime() >= Date.now()).slice(0, 6);
  const recent = selectedGames.filter((game) => game.status === "final").slice(-6).reverse();

  return (
    <section id="schedules" className="bg-section-gradient-1 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-10 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Schedules & Results</h2>
          <p className="text-lg text-gray-600">Published directly from the conference management dashboard</p>
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

            {selectedSport && !selectedGames.length ? (
              <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-sm">
                <Calendar className="mx-auto mb-4 h-10 w-10 text-conference-navy/50" />
                <h3 className="text-xl font-bold text-slate-950">The {sportLabel(selectedSport)} schedule is being verified</h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Games will appear here as conference administrators and athletic directors confirm dates, times, locations, and cooperative-team arrangements.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {upcoming.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xl font-bold text-slate-950">Upcoming Games</h3>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {upcoming.map((game) => (
                        <Card key={game.id} className={`border-l-4 ${sportAccent[selectedSport?.slug ?? ""] ?? "border-conference-navy"} shadow-md`}>
                          <CardContent className="p-6">
                            <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(game.starts_at)}</span>
                              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(game.starts_at)}</span>
                            </div>
                            <div className="text-lg font-bold text-slate-950">
                              {teamMap.get(game.away_team_id ?? "")?.display_name ?? "TBD"}
                              <span className="mx-2 text-sm font-normal text-slate-400">at</span>
                              {teamMap.get(game.home_team_id ?? "")?.display_name ?? "TBD"}
                            </div>
                            <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4" /> {game.location_text ?? "Home school"}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {recent.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-xl font-bold text-slate-950">Recent Results</h3>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {recent.map((game) => {
                        const result = resultMap.get(game.id);
                        return (
                          <Card key={game.id} className="border-l-4 border-emerald-500 shadow-md">
                            <CardContent className="p-6">
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
