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
import { Plus, Send } from "lucide-react";
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatResult = (game: GameWithDetails) => {
    if (!game.isCompleted || game.homeScore === null || game.awayScore === null) {
      return "TBD";
    }
    return `${game.homeScore}-${game.awayScore}`;
  };

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
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
                <DialogTitle>Submit Game Result</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitResult)} className="space-y-4">
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
                            {game.homeTeamName || game.homeTeam?.name || 'Home Team'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {game.awayTeamName || game.awayTeam?.name || 'Away Team'}
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
    </div>
  );
}
