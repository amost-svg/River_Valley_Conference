import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Standing, School, Sport } from "@shared/schema";

type StandingWithDetails = Standing & {
  school: School;
  sport: Sport;
};

export default function ConferenceStandings() {
  const { data: standings, isLoading, error } = useQuery<StandingWithDetails[]>({
    queryKey: ["/api/standings"],
  });

  const calculateWinPercentage = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return (wins / total).toFixed(3);
  };

  const footballStandings = standings?.filter(s => s.sport.name === "Football") || [];
  const basketballStandings = standings?.filter(s => s.sport.name === "Basketball") || [];

  if (error) {
    return (
      <section id="standings" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Conference Standings</h2>
            <p className="text-red-600">Failed to load standings. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="standings" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Conference Standings</h2>
          <p className="text-lg text-gray-600">Current season standings across all sports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Football Standings */}
          <Card className="shadow overflow-hidden">
            <CardHeader className="bg-conference-navy text-white">
              <CardTitle className="text-lg font-semibold">Football Standings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12" /></td>
                          </tr>
                        ))
                      : footballStandings.map((standing, index) => (
                          <tr key={standing.id} className={index === 0 ? "bg-yellow-50" : ""}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {standing.school.name} {standing.school.mascot}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.wins}</td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.losses}</td>
                            <td className="px-6 py-4 text-sm text-center font-semibold text-green-600">
                              {calculateWinPercentage(standing.wins, standing.losses)}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Basketball Standings */}
          <Card className="shadow overflow-hidden">
            <CardHeader className="bg-conference-gold text-white">
              <CardTitle className="text-lg font-semibold">Basketball Standings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12" /></td>
                          </tr>
                        ))
                      : basketballStandings.map((standing, index) => (
                          <tr key={standing.id} className={index === 0 ? "bg-yellow-50" : ""}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {standing.school.name} {standing.school.mascot}
                            </td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.wins}</td>
                            <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.losses}</td>
                            <td className="px-6 py-4 text-sm text-center font-semibold text-green-600">
                              {calculateWinPercentage(standing.wins, standing.losses)}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
