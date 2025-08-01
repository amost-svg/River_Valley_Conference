import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import type { Standing, School, Sport } from "@shared/schema";

type StandingWithDetails = Standing & {
  school: School;
  sport: Sport;
};

export default function ConferenceStandings() {
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);

  const { data: sports, isLoading: sportsLoading } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });

  // Set initial sport when sports are loaded
  React.useEffect(() => {
    if (sports && sports.length > 0 && selectedSportId === null) {
      setSelectedSportId(sports[0].id);
    }
  }, [sports, selectedSportId]);

  const { data: standings, isLoading: standingsLoading, error } = useQuery<StandingWithDetails[]>({
    queryKey: ["/api/standings", selectedSportId],
    queryFn: async () => {
      if (!selectedSportId) return [];
      const response = await fetch(`/api/standings?sportId=${selectedSportId}`);
      if (!response.ok) throw new Error('Failed to fetch standings');
      return response.json();
    },
    enabled: !!selectedSportId,
  });

  const calculateWinPercentage = (wins: number, losses: number, ties: number = 0) => {
    const total = wins + losses + ties;
    if (total === 0) return "0.000";
    return ((wins + ties * 0.5) / total).toFixed(3);
  };

  const getSportGradient = (sportName: string) => {
    switch (sportName?.toLowerCase()) {
      case 'volleyball':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'soccer':
        return 'bg-gradient-to-r from-green-600 to-emerald-600';
      case 'basketball':
        return 'bg-gradient-to-r from-orange-600 to-red-600';
      case 'baseball':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
      case 'softball':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600';
      case 'track':
        return 'bg-gradient-to-r from-red-600 to-rose-600';
      case 'cross country':
        return 'bg-gradient-to-r from-teal-600 to-cyan-600';
      case 'scholastic bowl':
        return 'bg-gradient-to-r from-indigo-600 to-purple-600';
      default:
        return 'bg-gradient-to-r from-conference-navy to-central-blue';
    }
  };

  const getSportTabColor = (sportName: string, isSelected: boolean) => {
    if (!isSelected) return "text-gray-500 hover:text-conference-navy border-transparent";
    
    switch (sportName?.toLowerCase()) {
      case 'volleyball':
        return 'text-purple-600 border-purple-600 bg-purple-50';
      case 'soccer':
        return 'text-green-600 border-green-600 bg-green-50';
      case 'basketball':
        return 'text-orange-600 border-orange-600 bg-orange-50';
      case 'baseball':
        return 'text-blue-600 border-blue-600 bg-blue-50';
      case 'softball':
        return 'text-yellow-600 border-yellow-600 bg-yellow-50';
      case 'track':
        return 'text-red-600 border-red-600 bg-red-50';
      case 'cross country':
        return 'text-teal-600 border-teal-600 bg-teal-50';
      case 'scholastic bowl':
        return 'text-indigo-600 border-indigo-600 bg-indigo-50';
      default:
        return 'text-conference-navy border-conference-navy bg-blue-50';
    }
  };

  const selectedSport = sports?.find(sport => sport.id === selectedSportId);

  // Sort standings by win percentage
  const sortedStandings = standings?.sort((a, b) => {
    const aWinPct = parseFloat(calculateWinPercentage(a.wins, a.losses, a.ties));
    const bWinPct = parseFloat(calculateWinPercentage(b.wins, b.losses, b.ties));
    return bWinPct - aWinPct;
  }) || [];

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
    <section id="standings" className="py-16 bg-section-gradient-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 section-divider pb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Conference Standings</h2>
          <p className="text-lg text-gray-600">Current season standings updated from game results</p>
        </div>

        {/* Sport Tabs */}
        <div className="flex flex-wrap justify-center mb-8 border-b gap-2">
          {sportsLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-24" />
              ))
            : sports?.map((sport) => (
                <Button
                  key={sport.id}
                  variant="ghost"
                  onClick={() => setSelectedSportId(sport.id)}
                  className={`px-6 py-3 font-semibold border-b-2 rounded-none transition-all duration-200 ${getSportTabColor(sport.name, selectedSportId === sport.id)}`}
                >
                  {sport.name}
                </Button>
              ))
          }
        </div>

        {/* Standings Table */}
        {selectedSportId && (
          <Card className="shadow overflow-hidden max-w-4xl mx-auto">
            <CardHeader className={`${getSportGradient(selectedSport?.name || '')} text-white`}>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {selectedSport?.name} Standings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">T</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {standingsLoading
                      ? Array.from({ length: 6 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-8" /></td>
                            <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12" /></td>
                          </tr>
                        ))
                      : sortedStandings.length > 0 ? (
                          sortedStandings.map((standing, index) => (
                            <tr key={standing.id} className={index === 0 ? "bg-yellow-50" : index === 1 ? "bg-gray-50" : ""}>
                              <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">
                                #{index + 1}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                  {standing.school.name} {standing.school.mascot}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-center text-gray-900 font-semibold">{standing.wins}</td>
                              <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.losses}</td>
                              <td className="px-6 py-4 text-sm text-center text-gray-900">{standing.ties || 0}</td>
                              <td className="px-6 py-4 text-sm text-center font-bold text-conference-navy">
                                {calculateWinPercentage(standing.wins, standing.losses, standing.ties)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                              <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                              <p className="text-lg font-semibold mb-1">No Standings Available</p>
                              <p className="text-sm">Standings will appear after games are completed and results are recorded.</p>
                            </td>
                          </tr>
                        )
                    }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
