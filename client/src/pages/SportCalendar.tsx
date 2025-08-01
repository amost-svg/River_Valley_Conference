import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import type { Sport, Game, School } from "@shared/schema";

type GameWithDetails = Game & {
  homeTeam: School;
  awayTeam: School;
  sport: Sport;
};

export default function SportCalendar() {
  const { sportId } = useParams();
  const sportIdNum = sportId ? parseInt(sportId) : null;

  const { data: sport, isLoading: sportLoading } = useQuery<Sport>({
    queryKey: ["/api/sports", sportIdNum],
    queryFn: async () => {
      const response = await fetch(`/api/sports/${sportIdNum}`);
      if (!response.ok) throw new Error('Failed to fetch sport');
      return response.json();
    },
    enabled: !!sportIdNum,
  });

  const { data: games, isLoading: gamesLoading } = useQuery<GameWithDetails[]>({
    queryKey: ["/api/games", sportIdNum],
    queryFn: async () => {
      if (!sportIdNum) return [];
      const response = await fetch(`/api/games?sportId=${sportIdNum}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    },
    enabled: !!sportIdNum,
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatResult = (game: GameWithDetails) => {
    if (!game.isCompleted || game.homeScore === null || game.awayScore === null) {
      return "TBD";
    }
    return `${game.homeScore}-${game.awayScore}`;
  };

  if (sportLoading || gamesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sport) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sport Not Found</h1>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {sport.name} Schedule
          </h1>
          <p className="text-lg text-gray-600 capitalize">
            {sport.season} Season • River Valley Conference
          </p>
        </div>

        <div className="grid gap-6">
          {games && games.length > 0 ? (
            games.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(game.gameDate)}</span>
                        <span>•</span>
                        <span>{formatTime(game.gameDate)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-semibold">
                          {game.awayTeam?.name || 'TBD'} @ {game.homeTeam?.name || 'TBD'}
                        </div>
                        <div className="text-xl font-bold text-conference-navy">
                          {formatResult(game)}
                        </div>
                      </div>
                      
                      {game.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{game.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Games Scheduled</h3>
                <p className="text-gray-600">No games have been scheduled for this sport yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}