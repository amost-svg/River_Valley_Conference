import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Calendar, User, Mail, MapPin, Clock, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Sport, School } from "@shared/schema";
import { format } from "date-fns";

interface PendingSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingSubmissionsDialog({ open, onOpenChange }: PendingSubmissionsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"games" | "results">("games");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Data queries
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const { data: pendingGameSubmissions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-game-submissions"],
  });

  const { data: pendingResultSubmissions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/game-result-submissions"],
  });

  // Mutations for approving/rejecting games
  const approveGameMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/pending-game-submissions/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-game-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Approved",
        description: "The game has been added to the schedule.",
      });
      setSelectedItem(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve game submission.",
        variant: "destructive",
      });
    },
  });

  const rejectGameMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/pending-game-submissions/${id}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-game-submissions"] });
      toast({
        title: "Game Rejected",
        description: "The game submission has been rejected.",
      });
      setSelectedItem(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject game submission.",
        variant: "destructive",
      });
    },
  });

  // Mutations for approving/rejecting results
  const moderateResultMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: number; action: "approve" | "reject"; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/game-result-submissions/${id}/moderate`, { action, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Result Moderated",
        description: "The game result has been processed.",
      });
      setSelectedItem(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to moderate result submission.",
        variant: "destructive",
      });
    },
  });

  // Filter functions
  const filteredGames = pendingGameSubmissions.filter((game) => {
    if (sportFilter !== "all" && game.sportId !== parseInt(sportFilter)) return false;
    if (schoolFilter !== "all" && game.homeTeamId !== parseInt(schoolFilter) && game.awayTeamId !== parseInt(schoolFilter)) return false;
    return true;
  });

  const filteredResults = pendingResultSubmissions.filter((result) => {
    if (result.isModerated) return false;
    // Additional filtering can be added here
    return true;
  });

  const getSportName = (sportId: number) => {
    return sports.find((s) => s.id === sportId)?.name || "Unknown";
  };

  const getSchoolName = (schoolId: number | null) => {
    if (!schoolId) return null;
    return schools.find((s) => s.id === schoolId)?.name || "Unknown";
  };

  const handleApprove = () => {
    if (!selectedItem) return;

    if (activeTab === "games") {
      approveGameMutation.mutate({ id: selectedItem.id, notes: reviewNotes });
    } else {
      moderateResultMutation.mutate({ id: selectedItem.id, action: "approve", notes: reviewNotes });
    }
  };

  const handleReject = () => {
    if (!selectedItem) return;

    if (activeTab === "games") {
      rejectGameMutation.mutate({ id: selectedItem.id, notes: reviewNotes || "Rejected by admin" });
    } else {
      moderateResultMutation.mutate({ id: selectedItem.id, action: "reject", notes: reviewNotes || "Rejected by admin" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Pending Submissions</DialogTitle>
          <DialogDescription>
            Approve or reject pending game and result submissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Filter by Sport</Label>
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger data-testid="filter-sport">
                  <SelectValue placeholder="All sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filter by School</Label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger data-testid="filter-school">
                  <SelectValue placeholder="All schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs for Games vs Results */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "games" | "results")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="games" data-testid="tab-pending-games">
                Pending Games ({filteredGames.length})
              </TabsTrigger>
              <TabsTrigger value="results" data-testid="tab-pending-results">
                Pending Results ({filteredResults.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Games Tab */}
            <TabsContent value="games" className="space-y-3 mt-4">
              {filteredGames.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending game submissions</p>
              ) : (
                filteredGames.map((game) => (
                  <Card 
                    key={game.id} 
                    className={`cursor-pointer transition-all ${
                      selectedItem?.id === game.id ? "border-orange-500 shadow-lg" : "hover:border-orange-200"
                    }`}
                    onClick={() => setSelectedItem(game)}
                    data-testid={`pending-game-${game.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{getSportName(game.sportId)}</Badge>
                            <Badge>{game.level}</Badge>
                            {game.isConference && <Badge variant="secondary">Conference</Badge>}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Trophy className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                {game.homeTeamName || getSchoolName(game.homeTeamId)} vs {game.awayTeamName || getSchoolName(game.awayTeamId)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(game.gameDate), "MMM d, yyyy")}
                              {game.gameTime && (
                                <>
                                  <Clock className="h-4 w-4 ml-2" />
                                  {game.gameTime}
                                </>
                              )}
                            </div>
                            {game.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                {game.location}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                              <User className="h-4 w-4" />
                              {game.submitterName}
                              <Mail className="h-4 w-4 ml-2" />
                              {game.submitterEmail}
                            </div>
                          </div>
                        </div>
                        {selectedItem?.id === game.id && (
                          <Badge variant="default" className="bg-orange-500">Selected</Badge>
                        )}
                      </div>
                      {game.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600"><strong>Notes:</strong> {game.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Pending Results Tab */}
            <TabsContent value="results" className="space-y-3 mt-4">
              {filteredResults.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending result submissions</p>
              ) : (
                filteredResults.map((result) => (
                  <Card 
                    key={result.id} 
                    className={`cursor-pointer transition-all ${
                      selectedItem?.id === result.id ? "border-orange-500 shadow-lg" : "hover:border-orange-200"
                    }`}
                    onClick={() => setSelectedItem(result)}
                    data-testid={`pending-result-${result.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-lg font-semibold mb-2">
                            {result.homeScore} - {result.awayScore}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Game ID:</strong> {result.gameId}</p>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {result.submitterName}
                              <Mail className="h-4 w-4 ml-2" />
                              {result.submitterEmail}
                            </div>
                          </div>
                        </div>
                        {selectedItem?.id === result.id && (
                          <Badge variant="default" className="bg-orange-500">Selected</Badge>
                        )}
                      </div>
                      {result.additionalNotes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600"><strong>Notes:</strong> {result.additionalNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Review Section */}
          {selectedItem && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Review & Moderate</h3>
                <div>
                  <Label htmlFor="review-notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add any notes about this decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-1"
                    data-testid="textarea-review-notes"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={approveGameMutation.isPending || moderateResultMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-approve-submission"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={rejectGameMutation.isPending || moderateResultMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                    data-testid="button-reject-submission"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
