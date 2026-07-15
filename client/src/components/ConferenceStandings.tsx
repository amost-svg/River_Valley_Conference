import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Trophy } from "lucide-react";
import { publicSelect } from "@/lib/rvcData";

interface Season { id: string; name: string }
interface Sport {
  id: string;
  slug: string;
  name: string;
  gender_label: string | null;
  standings_enabled: boolean;
}
interface PublicStanding {
  id: string;
  sport_id: string;
  rank: number | null;
  team_id: string;
  team_name: string;
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
}
interface StandingsData { season: Season; sports: Sport[]; standings: PublicStanding[] }

const sportThemes: Record<string, { header: string; active: string; dot: string }> = {
  "girls-volleyball": { header: "from-purple-700 to-fuchsia-500", active: "border-purple-600 bg-purple-50 text-purple-700", dot: "bg-purple-500" },
  "boys-soccer": { header: "from-emerald-700 to-green-500", active: "border-emerald-600 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  "girls-basketball": { header: "from-rose-700 to-pink-500", active: "border-rose-600 bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  "boys-basketball": { header: "from-orange-700 to-amber-500", active: "border-orange-600 bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  baseball: { header: "from-blue-800 to-sky-500", active: "border-blue-600 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  softball: { header: "from-yellow-600 to-orange-500", active: "border-yellow-600 bg-yellow-50 text-yellow-800", dot: "bg-yellow-500" },
  "track-field": { header: "from-red-700 to-rose-500", active: "border-red-600 bg-red-50 text-red-700", dot: "bg-red-500" },
  "scholastic-bowl": { header: "from-indigo-800 to-violet-500", active: "border-indigo-600 bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
};
const defaultTheme = { header: "from-conference-navy to-blue-600", active: "border-conference-navy bg-blue-50 text-conference-navy", dot: "bg-conference-navy" };

function sportLabel(sport: Sport) {
  return sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${sport.name}` : sport.name;
}

function record(wins: number, losses: number, ties: number) {
  return `${wins}-${losses}${ties ? `-${ties}` : ""}`;
}

function percentage(value: number) {
  return Number(value || 0).toFixed(3).replace(/^0/, "");
}

async function loadStandings(): Promise<StandingsData> {
  const seasons = await publicSelect<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active conference season is configured.");
  const [sports, standings] = await Promise.all([
    publicSelect<Sport[]>("sports?is_active=eq.true&standings_enabled=eq.true&select=id,slug,name,gender_label,standings_enabled&order=display_order.asc"),
    publicSelect<PublicStanding[]>(`public_standings?season_id=eq.${encodeURIComponent(season.id)}&select=id,sport_id,rank,team_id,team_name,mascot,conference_wins,conference_losses,conference_ties,overall_wins,overall_losses,overall_ties,conference_percentage,streak,tie_status&order=sport_name.asc,rank.asc,team_name.asc`),
  ]);
  return { season, sports, standings };
}

export default function ConferenceStandings() {
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-home-standings"],
    queryFn: loadStandings,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!selectedSportId && data?.sports.length) setSelectedSportId(data.sports[0].id);
  }, [data?.sports, selectedSportId]);

  const selectedSport = data?.sports.find((sport) => sport.id === selectedSportId);
  const rows = useMemo(
    () => data?.standings.filter((standing) => standing.sport_id === selectedSportId) ?? [],
    [data?.standings, selectedSportId],
  );
  const hasResults = rows.some((row) => row.conference_wins + row.conference_losses + row.conference_ties > 0);
  const theme = selectedSport ? (sportThemes[selectedSport.slug] ?? defaultTheme) : defaultTheme;

  return (
    <section id="standings" className="bg-section-gradient-2 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-10 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Conference Standings</h2>
          <p className="text-lg text-gray-600">Select a sport to view its official conference table</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
            <p className="font-semibold text-amber-900">Standings are temporarily unavailable.</p>
            <p className="mt-1 text-sm text-amber-800">Please refresh the page in a moment.</p>
          </div>
        ) : isLoading ? (
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex justify-center gap-2">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-11 w-28" />)}</div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="mb-7 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:justify-center">
              {data?.sports.map((sport) => {
                const sportTheme = sportThemes[sport.slug] ?? defaultTheme;
                const active = sport.id === selectedSportId;
                return (
                  <Button
                    key={sport.id}
                    variant="outline"
                    onClick={() => setSelectedSportId(sport.id)}
                    className={`flex-none gap-2 rounded-full border-2 px-4 ${active ? sportTheme.active : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${sportTheme.dot}`} />
                    {sportLabel(sport)}
                  </Button>
                );
              })}
            </div>

            {selectedSport && (
              <Card className="mx-auto max-w-5xl overflow-hidden border-0 shadow-xl">
                <CardHeader className={`bg-gradient-to-r ${theme.header} text-white`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Trophy className="h-5 w-5" /> {sportLabel(selectedSport)} Standings
                    </CardTitle>
                    <span className="text-sm text-white/80">{data?.season.name}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 text-left">Rank</th>
                          <th className="px-5 py-3 text-left">Team</th>
                          <th className="px-5 py-3 text-center">Conference</th>
                          <th className="px-5 py-3 text-center">Pct.</th>
                          <th className="px-5 py-3 text-center">Overall</th>
                          <th className="px-5 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {rows.map((row, index) => (
                          <tr key={row.id} className={hasResults && index === 0 ? "bg-amber-50/70" : "hover:bg-slate-50"}>
                            <td className="px-5 py-4 text-lg font-black text-conference-navy">{hasResults ? row.rank ?? "—" : "—"}</td>
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-950">{row.team_name}</div>
                              <div className="text-xs text-slate-500">{row.mascot}</div>
                            </td>
                            <td className="px-5 py-4 text-center font-semibold">{record(row.conference_wins, row.conference_losses, row.conference_ties)}</td>
                            <td className="px-5 py-4 text-center font-semibold text-conference-navy">{percentage(row.conference_percentage)}</td>
                            <td className="px-5 py-4 text-center text-slate-600">{record(row.overall_wins, row.overall_losses, row.overall_ties)}</td>
                            <td className="px-5 py-4">
                              {hasResults ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Official</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-500">Season not started</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {!rows.length && (
                          <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">Teams will appear after the conference roster is finalized.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!hasResults && rows.length > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-center text-sm text-slate-600">
                      Rankings will activate after the first confirmed conference result.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </section>
  );
}
