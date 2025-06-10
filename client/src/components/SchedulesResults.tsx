import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sport, Game, School } from "@shared/schema";

type GameWithDetails = Game & {
  homeTeam: School;
  awayTeam: School;
  sport: Sport;
};

export default function SchedulesResults() {
  const [selectedSportId, setSelectedSportId] = useState<number>(1);

  const { data: sports, isLoading: sportsLoading } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });

  const { data: games, isLoading: gamesLoading } = useQuery<GameWithDetails[]>({
    queryKey: ["/api/games", selectedSportId],
    queryFn: async () => {
      const response = await fetch(`/api/games?sportId=${selectedSportId}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    },
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatResult = (game: GameWithDetails) => {
    if (!game.isCompleted || game.homeScore === null || game.awayScore === null) {
      return "TBD";
    }
    return `${game.homeScore}-${game.awayScore}`;
  };

  return (
    <section id="schedules" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Schedules & Results</h2>
          <p className="text-lg text-gray-600">Stay up to date with all conference games and results</p>
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
                  className={`px-6 py-3 font-semibold border-b-2 rounded-none ${
                    selectedSportId === sport.id
                      ? "conference-navy border-conference-navy"
                      : "text-gray-500 hover:conference-navy border-transparent"
                  }`}
                >
                  {sport.name}
                </Button>
              ))
          }
        </div>

        {/* Schedule Table */}
        <Card className="shadow overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Away Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gamesLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                        </tr>
                      ))
                    : games?.map((game) => (
                        <tr key={game.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(game.gameDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {game.homeTeam.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {game.awayTeam.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {game.gameTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span className={game.isCompleted ? "text-green-600" : "text-gray-500"}>
                              {formatResult(game)}
                            </span>
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
    </section>
  );
}
