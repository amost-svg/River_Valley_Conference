import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, Calendar, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Sport, Game, School } from "@shared/schema";
import { insertGameResultSubmissionSchema } from "@shared/schema";

type GameWithDetails = Game & {
  homeTeam: School;
  awayTeam: School;
  sport: Sport;
};

const gameResultSchema = insertGameResultSubmissionSchema.extend({
  gameId: z.number().min(1, "Please select a game"),
});

type GameResultFormData = z.infer<typeof gameResultSchema>;

export default function SchedulesResults() {
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameWithDetails | null>(null);
  const { toast } = useToast();

  const { data: sports, isLoading: sportsLoading } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });

  // Set initial sport when sports are loaded
  React.useEffect(() => {
    if (sports && sports.length > 0 && selectedSportId === null) {
      setSelectedSportId(sports[0].id);
    }
  }, [sports, selectedSportId]);

  const { data: games, isLoading: gamesLoading } = useQuery<GameWithDetails[]>({
    queryKey: ["/api/games", selectedSportId],
    queryFn: async () => {
      if (!selectedSportId) return [];
      const response = await fetch(`/api/games?sportId=${selectedSportId}`);
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    },
    enabled: !!selectedSportId,
  });

  const form = useForm<GameResultFormData>({
    resolver: zodResolver(gameResultSchema),
    defaultValues: {
      gameId: 0,
      submitterName: "",
      submitterEmail: "",
      homeScore: 0,
      awayScore: 0,
    },
  });

  const gameResultMutation = useMutation({
    mutationFn: async (data: GameResultFormData) => {
      return apiRequest("POST", "/api/game-results", data);
    },
    onSuccess: () => {
      toast({
        title: "Result Submitted",
        description: "Thank you! Your game result submission will be reviewed before publishing.",
      });
      form.reset();
      setSelectedGame(null);
      setIsSubmissionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit game result. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitResult = (data: GameResultFormData) => {
    gameResultMutation.mutate(data);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
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

  // Get next 6 games for the selected sport
  const getUpcomingGames = (games: GameWithDetails[] | undefined) => {
    if (!games) return [];
    const now = new Date();
    return games
      .filter(game => new Date(game.gameDate) >= now || !game.isCompleted)
      .sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime())
      .slice(0, 6);
  };

  return (
    <div className="py-16 bg-section-gradient-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 section-divider pb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Schedules & Results</h2>
          <p className="text-lg text-gray-600 mb-6">Stay up to date with all conference games and results</p>
          
          <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-conference-navy hover:bg-blue-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Report Game Result
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedGame 
                    ? `Report Result: ${selectedGame.awayTeam?.name || 'Away'} @ ${selectedGame.homeTeam?.name || 'Home'}`
                    : 'Submit Game Result'
                  }
                </DialogTitle>
              </DialogHeader>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All game results will be reviewed and approved before being published on the website.
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitResult)} className="space-y-4">
                  {!selectedGame && (
                    <FormField
                      control={form.control}
                      name="gameId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Game</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a game" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {games?.filter(game => !game.isCompleted).map((game) => (
                                <SelectItem key={game.id} value={game.id.toString()}>
                                  {game.homeTeamName || game.homeTeam?.name || 'Home Team'} vs {game.awayTeamName || game.awayTeam?.name || 'Away Team'} - {formatDate(game.gameDate)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="homeScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="awayScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Away Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="submitterName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="submitterEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-conference-navy hover:bg-blue-800"
                    disabled={gameResultMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {gameResultMutation.isPending ? "Submitting..." : "Submit Result"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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

        {/* Upcoming Games Cards */}
        {selectedSportId && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gamesLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-6 w-full mb-2" />
                        <Skeleton className="h-4 w-32 mb-3" />
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))
                : getUpcomingGames(games).length > 0 ? (
                    getUpcomingGames(games).map((game) => (
                      <Card 
                        key={game.id} 
                        className="card-hover shadow-blue hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-conference-navy"
                        onClick={() => {
                          setSelectedGame(game);
                          form.setValue('gameId', game.id);
                          setIsSubmissionDialogOpen(true);
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(game.gameDate)}</span>
                            <Clock className="h-4 w-4 ml-2" />
                            <span>{formatTime(game.gameDate)}</span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-lg font-semibold text-gray-900 mb-1">
                              {game.awayTeam?.name || 'Away Team'} @ {game.homeTeam?.name || 'Home Team'}
                            </div>
                            <div className="text-2xl font-bold text-conference-navy">
                              {formatResult(game)}
                            </div>
                          </div>
                          
                          {game.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{game.location}</span>
                            </div>
                          )}
                          
                          {!game.isCompleted && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 text-center">
                                Click to report result
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="md:col-span-2 lg:col-span-3">
                      <CardContent className="p-8 text-center">
                        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Games</h3>
                        <p className="text-gray-600">No games scheduled for this sport yet.</p>
                      </CardContent>
                    </Card>
                  )
              }
            </div>
            
            {/* See Full Schedule Button */}
            {games && games.length > 0 && (
              <div className="text-center">
                <Link href={`/sports/${selectedSportId}/calendar`}>
                  <Button variant="outline" className="border-conference-navy text-conference-navy hover:bg-conference-navy hover:text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    See Full Conference Schedule
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
