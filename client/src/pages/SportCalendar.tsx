import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, Users, Filter, X, Send, Plus } from "lucide-react";
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

export default function SportCalendar() {
  const { sportId } = useParams();
  const sportIdNum = sportId ? parseInt(sportId) : null;
  
  // Filter state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Report score state
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameWithDetails | null>(null);
  const { toast } = useToast();

  const { data: sport, isLoading: sportLoading } = useQuery<Sport>({
    queryKey: ["/api/sports", sportIdNum],
    queryFn: async () => {
      const response = await fetch(`/api/sports/${sportIdNum}`);
      if (!response.ok) throw new Error('Failed to fetch sport');
      return response.json();
    },
    enabled: !!sportIdNum,
  });

  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
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

  // Form setup for game result submission
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

  // Mutation for submitting game results
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
      return "";
    }
    return `${game.homeScore}-${game.awayScore}`;
  };

  // Filter games based on selected filters
  const getFilteredGames = (games: GameWithDetails[] | undefined) => {
    if (!games) return [];
    
    let filtered = [...games];
    
    // Filter by school (home or away)
    if (selectedSchoolId && selectedSchoolId !== "all") {
      const schoolId = parseInt(selectedSchoolId);
      filtered = filtered.filter(game => 
        game.homeTeamId === schoolId || game.awayTeamId === schoolId
      );
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(game => new Date(game.gameDate) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter(game => new Date(game.gameDate) <= end);
    }
    
    // Sort by date
    return filtered.sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSchoolId("all");
    setStartDate("");
    setEndDate("");
  };

  // Check if any filters are active
  const hasActiveFilters = (selectedSchoolId && selectedSchoolId !== "all") || startDate || endDate;

  const filteredGames = getFilteredGames(games);

  if (sportLoading || gamesLoading || schoolsLoading) {
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

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Games</h3>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="ml-auto text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* School Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Filter by School</label>
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All schools</SelectItem>
                    {schools?.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredGames.length} of {games?.length || 0} games
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Score Dialog */}
        <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
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

        <div className="grid gap-6">
          {filteredGames && filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(game.gameDate)}</span>
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
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>{game.location}</span>
                        </div>
                      )}
                      
                      {!game.isCompleted && (
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedGame(game);
                              form.setValue('gameId', game.id);
                              setIsSubmissionDialogOpen(true);
                            }}
                            className="border-conference-navy text-conference-navy hover:bg-conference-navy hover:text-white"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Report Score
                          </Button>
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