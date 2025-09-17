import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Merge, Trash2, Eye, Calendar, MapPin, Users, Trophy } from "lucide-react";

interface DuplicateGame {
  id: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: string;
  gameTime: string;
  location?: string;
  sport: { name: string };
  duplicateOfGameId: number;
  originalGame: {
    id: number;
    homeTeamName: string;
    awayTeamName: string;
    gameDate: string;
    gameTime: string;
    location?: string;
  };
  uploadedBy: { name: string; email: string };
}

// Game result schema for score recording
const gameResultSchema = z.object({
  gameId: z.number(),
  homeScore: z.coerce.number().min(0, "Score must be 0 or greater"),
  awayScore: z.coerce.number().min(0, "Score must be 0 or greater"),
  gameSummary: z.string().optional(),
  keyPlayers: z.string().optional(),
  gameHighlights: z.string().optional(),
  nextGameInfo: z.string().optional(),
  recordAfterGame: z.string().optional(),
  conferenceRecord: z.string().optional(),
});

type GameResultFormData = z.infer<typeof gameResultSchema>;

export default function DuplicateGameManager() {
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateGame | null>(null);
  const [isGameResultDialogOpen, setIsGameResultDialogOpen] = useState(false);
  const [selectedGameForScore, setSelectedGameForScore] = useState<DuplicateGame | null>(null);
  const [scoreRecordingTarget, setScoreRecordingTarget] = useState<'duplicate' | 'original'>('duplicate');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch duplicate games
  const { data: duplicateGames = [], isLoading } = useQuery<DuplicateGame[]>({
    queryKey: ["/api/admin/duplicate-games"],
  });

  // Game result form
  const gameResultForm = useForm<GameResultFormData>({
    resolver: zodResolver(gameResultSchema),
    defaultValues: {
      gameId: 0,
      homeScore: 0,
      awayScore: 0,
      gameSummary: "",
      keyPlayers: "",
      gameHighlights: "",
      nextGameInfo: "",
      recordAfterGame: "",
      conferenceRecord: "",
    },
  });

  // Resolve duplicate mutation
  const resolveDuplicateMutation = useMutation({
    mutationFn: async ({ id, action, mergeWith }: { id: number; action: string; mergeWith?: number }) => {
      return apiRequest("POST", `/api/admin/duplicate-games/${id}/resolve`, { action, mergeWith });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duplicate-games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setSelectedDuplicate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve duplicate",
        variant: "destructive",
      });
    },
  });

  // Game result submission mutation  
  const submitGameResultMutation = useMutation({
    mutationFn: async (data: GameResultFormData) => {
      return apiRequest("POST", "/api/admin/game-results", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Game result saved successfully" });
      setIsGameResultDialogOpen(false);
      gameResultForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duplicate-games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
    onError: (error) => {
      console.error("Game result submission error:", error);
      toast({ title: "Error", description: "Failed to save game result", variant: "destructive" });
    },
  });

  const onSubmitGameResult = (data: GameResultFormData) => {
    submitGameResultMutation.mutate(data);
  };

  // Helper function to open score recording dialog
  const openGameResultDialog = (game: DuplicateGame, target: 'duplicate' | 'original') => {
    setSelectedGameForScore(game);
    setScoreRecordingTarget(target);
    const targetGameId = target === 'duplicate' ? game.id : game.originalGame.id;
    gameResultForm.reset({
      gameId: targetGameId,
      homeScore: 0,
      awayScore: 0,
      gameSummary: "",
      keyPlayers: "",
      gameHighlights: "",
      nextGameInfo: "",
      recordAfterGame: "",
      conferenceRecord: "",
    });
    setIsGameResultDialogOpen(true);
  };

  const handleResolve = (action: string, mergeWith?: number) => {
    if (!selectedDuplicate) return;
    resolveDuplicateMutation.mutate({
      id: selectedDuplicate.id,
      action,
      mergeWith
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getConfidenceLevel = (game: DuplicateGame) => {
    let score = 0;
    const original = game.originalGame;
    
    // Same date
    if (new Date(game.gameDate).toDateString() === new Date(original.gameDate).toDateString()) {
      score += 40;
    }
    
    // Same teams (considering home/away swaps)
    const sameTeams = (game.homeTeamName === original.homeTeamName && game.awayTeamName === original.awayTeamName) ||
                     (game.homeTeamName === original.awayTeamName && game.awayTeamName === original.homeTeamName);
    if (sameTeams) {
      score += 30;
    }
    
    // Similar time (within 2 hours)
    const timeDiff = Math.abs(new Date(`2000-01-01 ${game.gameTime}`).getTime() - 
                             new Date(`2000-01-01 ${original.gameTime}`).getTime());
    if (timeDiff <= 2 * 60 * 60 * 1000) {
      score += 20;
    }
    
    // Same location
    if (game.location && original.location && 
        game.location.toLowerCase() === original.location.toLowerCase()) {
      score += 10;
    }
    
    return Math.min(score, 100);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Low Risk</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Duplicate Game Detection
          </CardTitle>
          <CardDescription>Loading potential duplicate games...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (duplicateGames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Duplicate Game Detection
          </CardTitle>
          <CardDescription>No duplicate games detected. All games are unique!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Duplicate Game Detection
          </CardTitle>
          <CardDescription>
            {duplicateGames.length} potential duplicate game{duplicateGames.length !== 1 ? 's' : ''} found that require your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These games were flagged as potential duplicates when uploaded. Please review each one and decide how to handle them.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {duplicateGames.map((duplicate) => {
              const confidence = getConfidenceLevel(duplicate);
              return (
                <div key={duplicate.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        Potential Duplicate Game
                      </div>
                      {getConfidenceBadge(confidence)}
                      <Badge variant="outline">{confidence}% Match</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDuplicate(duplicate)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGameResultDialog(duplicate, 'duplicate')}
                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                        data-testid={`record-score-duplicate-${duplicate.id}`}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Score New Game
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGameResultDialog(duplicate, 'original')}
                        className="text-green-700 border-green-200 hover:bg-green-50"
                        data-testid={`record-score-original-${duplicate.id}`}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Score Existing Game
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* New Game */}
                    <div className="space-y-2">
                      <div className="font-medium text-blue-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        New Game Entry
                      </div>
                      <div className="pl-6 space-y-1">
                        <div><span className="font-medium">Teams:</span> {duplicate.homeTeamName} vs {duplicate.awayTeamName}</div>
                        <div><span className="font-medium">Date:</span> {formatDate(duplicate.gameDate)}</div>
                        <div><span className="font-medium">Time:</span> {duplicate.gameTime}</div>
                        {duplicate.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {duplicate.location}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Uploaded by: {duplicate.uploadedBy.name}
                        </div>
                      </div>
                    </div>

                    {/* Original Game */}
                    <div className="space-y-2">
                      <div className="font-medium text-green-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Existing Game
                      </div>
                      <div className="pl-6 space-y-1">
                        <div><span className="font-medium">Teams:</span> {duplicate.originalGame.homeTeamName} vs {duplicate.originalGame.awayTeamName}</div>
                        <div><span className="font-medium">Date:</span> {formatDate(duplicate.originalGame.gameDate)}</div>
                        <div><span className="font-medium">Time:</span> {duplicate.originalGame.gameTime}</div>
                        {duplicate.originalGame.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {duplicate.originalGame.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedDuplicate} onOpenChange={() => setSelectedDuplicate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Duplicate Game</DialogTitle>
            <DialogDescription>
              Choose how to resolve this potential duplicate game entry
            </DialogDescription>
          </DialogHeader>

          {selectedDuplicate && (
            <div className="space-y-6">
              {/* Confidence Analysis */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Duplicate Confidence Analysis</h4>
                  {getConfidenceBadge(getConfidenceLevel(selectedDuplicate))}
                </div>
                <div className="text-sm text-gray-600">
                  Based on team names, date, time, and location similarity
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* New Game */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-700">New Game Entry</CardTitle>
                    <CardDescription>Recently uploaded game</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{selectedDuplicate.homeTeamName} vs {selectedDuplicate.awayTeamName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(selectedDuplicate.gameDate)} at {selectedDuplicate.gameTime}</span>
                    </div>
                    {selectedDuplicate.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedDuplicate.location}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="text-sm text-gray-600">
                      <strong>Uploaded by:</strong> {selectedDuplicate.uploadedBy.name}
                      <br />
                      <strong>Email:</strong> {selectedDuplicate.uploadedBy.email}
                    </div>
                  </CardContent>
                </Card>

                {/* Original Game */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-700">Existing Game</CardTitle>
                    <CardDescription>Already in the system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{selectedDuplicate.originalGame.homeTeamName} vs {selectedDuplicate.originalGame.awayTeamName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(selectedDuplicate.originalGame.gameDate)} at {selectedDuplicate.originalGame.gameTime}</span>
                    </div>
                    {selectedDuplicate.originalGame.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedDuplicate.originalGame.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleResolve('merge', selectedDuplicate.originalGame.id)}
                  disabled={resolveDuplicateMutation.isPending}
                  className="flex-1"
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Merge Games
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleResolve('keep_separate')}
                  disabled={resolveDuplicateMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Keep Separate
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => handleResolve('delete')}
                  disabled={resolveDuplicateMutation.isPending}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete New Game
                </Button>
              </div>

              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                <strong>Merge:</strong> Combines both games into one, keeping the most complete information.<br />
                <strong>Keep Separate:</strong> Marks as reviewed but keeps both games (if they're actually different).<br />
                <strong>Delete:</strong> Removes the new game entry completely.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Game Result Recording Dialog */}
      <Dialog open={isGameResultDialogOpen} onOpenChange={setIsGameResultDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Record Score - {scoreRecordingTarget === 'duplicate' ? 'New Game Entry' : 'Existing Game'}
            </DialogTitle>
            {selectedGameForScore && (
              <DialogDescription>
                Recording final score for the <strong>{scoreRecordingTarget === 'duplicate' ? 'new game entry' : 'existing game'}</strong>: {' '}
                {scoreRecordingTarget === 'duplicate' 
                  ? `${selectedGameForScore.homeTeamName} vs ${selectedGameForScore.awayTeamName}`
                  : `${selectedGameForScore.originalGame.homeTeamName} vs ${selectedGameForScore.originalGame.awayTeamName}`
                } on {formatDate(scoreRecordingTarget === 'duplicate' ? selectedGameForScore.gameDate : selectedGameForScore.originalGame.gameDate)}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedGameForScore && (
            <Form {...gameResultForm}>
              <form onSubmit={gameResultForm.handleSubmit(onSubmitGameResult)} className="space-y-4">
                {/* Score Entry */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={gameResultForm.control}
                    name="homeScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Home Team Score ({
                            scoreRecordingTarget === 'duplicate' 
                              ? selectedGameForScore.homeTeamName 
                              : selectedGameForScore.originalGame.homeTeamName
                          })
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field}
                            data-testid="input-home-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={gameResultForm.control}
                    name="awayScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Away Team Score ({
                            scoreRecordingTarget === 'duplicate' 
                              ? selectedGameForScore.awayTeamName 
                              : selectedGameForScore.originalGame.awayTeamName
                          })
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field}
                            data-testid="input-away-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGameResultDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-conference-navy hover:bg-blue-800"
                    disabled={submitGameResultMutation.isPending}
                  >
                    {submitGameResultMutation.isPending ? "Saving..." : "Save Result"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}