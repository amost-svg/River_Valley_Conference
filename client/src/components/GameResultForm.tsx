import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Users, Calendar, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getSportProfile } from "@shared/scoringProfiles";
import { gameResultEntrySchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";
import VolleyballForm from "./forms/VolleyballForm";
import BasketballForm from "./forms/BasketballForm";
import SoccerForm from "./forms/SoccerForm";
import BaseballForm from "./forms/BaseballForm";
import TrackForm from "./forms/TrackForm";
import WrestlingForm from "./forms/WrestlingForm";
import TennisForm from "./forms/TennisForm";
import GolfForm from "./forms/GolfForm";
import CrossCountryForm from "./forms/CrossCountryForm";

// FormHandle interface for child form refs
interface FormHandle {
  submit: () => void;
  isValid: () => boolean;
}

interface GameResultFormProps {
  game: Game & {
    homeTeam?: School | null;
    awayTeam?: School | null;
    sport: Sport;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function GameResultForm({ game, onSuccess, onCancel }: GameResultFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);
  const [isActiveFormValid, setIsActiveFormValid] = useState(false);

  // Refs for all sport forms
  const volleyballFormRef = useRef<FormHandle>(null);
  const basketballFormRef = useRef<FormHandle>(null);
  const soccerFormRef = useRef<FormHandle>(null);
  const baseballFormRef = useRef<FormHandle>(null);
  const trackFormRef = useRef<FormHandle>(null);
  const wrestlingFormRef = useRef<FormHandle>(null);
  const tennisFormRef = useRef<FormHandle>(null);
  const golfFormRef = useRef<FormHandle>(null);
  const crossCountryFormRef = useRef<FormHandle>(null);

  const sportProfile = getSportProfile(game.sport.name.toLowerCase());

  // Game result submission mutation
  const submitGameResultMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/games/${game.id}/results`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Game result submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Game result submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit game result",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: any) => {
    try {
      // Validate the data using the discriminated union schema
      const validatedData = gameResultEntrySchema.parse(data);
      submitGameResultMutation.mutate(validatedData);
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "Please check your form data and try again",
        variant: "destructive",
      });
    }
  };

  if (!sportProfile) {
    return (
      <Alert>
        <AlertDescription>
          Sport-specific form not yet available for {game.sport.name}. Please use the basic scoring system.
        </AlertDescription>
      </Alert>
    );
  }

  // Get the active form ref based on the sport type
  const getActiveFormRef = () => {
    const sportName = game.sport.name.toLowerCase();
    
    switch (sportProfile.scoringType) {
      case 'set_match':
        return volleyballFormRef;
      case 'aggregate_with_periods':
        return basketballFormRef;
      case 'aggregate_with_tiebreaker':
        return soccerFormRef;
      case 'inning_line':
        return baseballFormRef;
      case 'team_points':
        return trackFormRef;
      case 'dual_meet':
        return wrestlingFormRef;
      case 'match_play':
        return tennisFormRef;
      case 'stroke_play':
        return golfFormRef;
      case 'runner_places':
        return crossCountryFormRef;
      default:
        return null;
    }
  };

  // Handle parent submit button click
  const handleParentSubmit = () => {
    const activeFormRef = getActiveFormRef();
    if (activeFormRef?.current) {
      activeFormRef.current.submit();
    }
  };


  // Render the appropriate sport-specific form
  const renderSportForm = () => {
    const sportName = game.sport.name.toLowerCase();
    
    switch (sportProfile.scoringType) {
      case 'set_match':
        return <VolleyballForm ref={volleyballFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'aggregate_with_periods':
        return <BasketballForm ref={basketballFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'aggregate_with_tiebreaker':
        if (sportName.includes('soccer') || sportName.includes('football')) {
          return <SoccerForm ref={soccerFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
        }
        return <SoccerForm ref={soccerFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'inning_line':
        return <BaseballForm ref={baseballFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'team_points':
        return <TrackForm ref={trackFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'dual_meet':
        return <WrestlingForm ref={wrestlingFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'match_play':
        return <TennisForm ref={tennisFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'stroke_play':
        return <GolfForm ref={golfFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      case 'runner_places':
        return <CrossCountryForm ref={crossCountryFormRef} game={game} onSubmit={handleFormSubmit} onValidityChange={setIsActiveFormValid} />;
      default:
        return (
          <Alert>
            <AlertDescription>
              Sport-specific form not implemented for {sportProfile.scoringType}
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="space-y-6" data-testid="game-result-form">
      {/* Game Information Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Record Game Result
            </CardTitle>
            <Badge variant="outline">{sportProfile.displayName}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Teams */}
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center" data-testid="home-team">
                <div className="font-semibold">{game.homeTeam?.name || game.homeTeamName}</div>
                <div className="text-sm text-muted-foreground">Home</div>
              </div>
              <div className="text-2xl font-bold">VS</div>
              <div className="text-center" data-testid="away-team">
                <div className="font-semibold">{game.awayTeam?.name || game.awayTeamName}</div>
                <div className="text-sm text-muted-foreground">Away</div>
              </div>
            </div>

            <Separator />

            {/* Game Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2" data-testid="game-date">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(game.gameDate), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="game-time">
                <Users className="h-4 w-4" />
                <span>{game.gameTime}</span>
              </div>
              {game.location && (
                <div className="flex items-center gap-2" data-testid="game-location">
                  <MapPin className="h-4 w-4" />
                  <span>{game.location}</span>
                </div>
              )}
            </div>

            {/* Sport-specific Information */}
            {sportProfile.validationRules.specialRules && (
              <Alert>
                <AlertDescription>
                  <strong>Scoring Notes:</strong>{" "}
                  {sportProfile.validationRules.specialRules.join(". ")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sport-specific Form */}
      <Card>
        <CardHeader>
          <CardTitle>{sportProfile.displayName} Scoring</CardTitle>
        </CardHeader>
        <CardContent>
          {renderSportForm()}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleParentSubmit}
          disabled={submitGameResultMutation.isPending || !isActiveFormValid}
          data-testid="button-submit"
        >
          {submitGameResultMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Submit Result
        </Button>
      </div>
    </div>
  );
}