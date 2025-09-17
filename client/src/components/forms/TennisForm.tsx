import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tennisScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface TennisFormProps {
  game: Game & {
    homeTeam?: School | null;
    awayTeam?: School | null;
    sport: Sport;
  };
  onSubmit: (data: any) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export interface FormHandle {
  submit: () => void;
  isValid: () => boolean;
}

const MATCH_POSITIONS = [
  "1 Singles",
  "2 Singles", 
  "3 Singles",
  "4 Singles",
  "5 Singles",
  "6 Singles",
  "1 Doubles",
  "2 Doubles",
  "3 Doubles"
];

const formSchema = z.object({
  matches: z.array(z.object({
    position: z.string().min(1, "Position required"),
    homePlayers: z.string().optional(),
    awayPlayers: z.string().optional(),
    winner: z.enum(['home', 'away', 'forfeit_home', 'forfeit_away']),
    score: z.string().optional(),
    completed: z.boolean().default(true),
  })),
});

type FormData = z.infer<typeof formSchema>;

const TennisForm = forwardRef<FormHandle, TennisFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [homeMatchesWon, setHomeMatchesWon] = useState(0);
  const [awayMatchesWon, setAwayMatchesWon] = useState(0);
  const [winner, setWinner] = useState<'home' | 'away' | 'tie' | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      matches: MATCH_POSITIONS.map(position => ({
        position,
        homePlayers: "",
        awayPlayers: "",
        winner: 'home' as const,
        score: "",
        completed: true,
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "matches",
  });

  const matches = form.watch('matches');

  // Track form validity and notify parent
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  // Calculate matches won
  useEffect(() => {
    let homeWins = 0;
    let awayWins = 0;

    matches.forEach((match) => {
      if (match.completed) {
        if (match.winner === 'home' || match.winner === 'forfeit_home') {
          homeWins++;
        } else if (match.winner === 'away' || match.winner === 'forfeit_away') {
          awayWins++;
        }
      }
    });

    setHomeMatchesWon(homeWins);
    setAwayMatchesWon(awayWins);

    if (homeWins > awayWins) {
      setWinner('home');
    } else if (awayWins > homeWins) {
      setWinner('away');
    } else if (homeWins === awayWins && homeWins > 0) {
      setWinner('tie');
    } else {
      setWinner(null);
    }
  }, [matches]);

  const handleSubmit = (data: FormData) => {
    // Determine winner team ID
    const winnerTeamId = winner === 'home' 
      ? (game.homeTeamId || undefined)
      : winner === 'away'
      ? (game.awayTeamId || undefined)
      : undefined; // undefined for ties

    const tennisData = tennisScoringSchema.parse({
      matches: data.matches,
      homeMatchesWon,
      awayMatchesWon,
      winner: winner!,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'match_play' as const,
      details: tennisData,
      homeTotal: homeMatchesWon,
      awayTotal: awayMatchesWon,
      winnerTeamId,
      decidedBy: 'regulation' as const,
      // enteredBy and enteredByName will be server-derived from auth context
    };

    onSubmit(submissionData);
  };

  const homeTeamName = game.homeTeam?.name || game.homeTeamName || "Home";
  const awayTeamName = game.awayTeam?.name || game.awayTeamName || "Away";

  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(handleSubmit)();
    },
  }));

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="tennis-form">
      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center" data-testid="home-matches-won">
                <div className="text-4xl font-bold">{homeMatchesWon}</div>
                <div className="text-sm">{homeTeamName}</div>
              </div>
              <div className="text-2xl">-</div>
              <div className="text-center" data-testid="away-matches-won">
                <div className="text-4xl font-bold">{awayMatchesWon}</div>
                <div className="text-sm">{awayTeamName}</div>
              </div>
            </div>
            {winner && (
              <div className="text-center mt-4">
                <Badge variant="secondary" data-testid="dual-winner">
                  {winner === 'tie' ? 'Tie Match' : `Winner: ${winner === 'home' ? homeTeamName : awayTeamName}`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Match Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Individual Match Results</h3>
        
        {/* Singles Matches */}
        <div className="space-y-3">
          <h4 className="font-medium">Singles</h4>
          {fields.slice(0, 6).map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <CardTitle className="text-sm">{matches[index]?.position}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Player Names */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{homeTeamName} Player</Label>
                      <Input
                        placeholder="Player name"
                        {...form.register(`matches.${index}.homePlayers`)}
                        data-testid={`input-home-player-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{awayTeamName} Player</Label>
                      <Input
                        placeholder="Player name"
                        {...form.register(`matches.${index}.awayPlayers`)}
                        data-testid={`input-away-player-${index}`}
                      />
                    </div>
                  </div>

                  {/* Match Result */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Winner</Label>
                      <Select
                        value={matches[index]?.winner}
                        onValueChange={(value: any) => form.setValue(`matches.${index}.winner`, value)}
                      >
                        <SelectTrigger data-testid={`select-winner-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">{homeTeamName}</SelectItem>
                          <SelectItem value="away">{awayTeamName}</SelectItem>
                          <SelectItem value="forfeit_home">{homeTeamName} (Forfeit)</SelectItem>
                          <SelectItem value="forfeit_away">{awayTeamName} (Forfeit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Score</Label>
                      <Input
                        placeholder="6-4, 7-5"
                        {...form.register(`matches.${index}.score`)}
                        data-testid={`input-score-${index}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={matches[index]?.completed ? "completed" : "incomplete"}
                        onValueChange={(value) => form.setValue(`matches.${index}.completed`, value === "completed")}
                      >
                        <SelectTrigger data-testid={`select-status-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="incomplete">Not Played</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Doubles Matches */}
        <div className="space-y-3">
          <h4 className="font-medium">Doubles</h4>
          {fields.slice(6).map((field, index) => {
            const actualIndex = index + 6;
            return (
              <Card key={field.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{matches[actualIndex]?.position}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Player Names */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{homeTeamName} Doubles</Label>
                        <Input
                          placeholder="Player 1 / Player 2"
                          {...form.register(`matches.${actualIndex}.homePlayers`)}
                          data-testid={`input-home-doubles-${actualIndex}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{awayTeamName} Doubles</Label>
                        <Input
                          placeholder="Player 1 / Player 2"
                          {...form.register(`matches.${actualIndex}.awayPlayers`)}
                          data-testid={`input-away-doubles-${actualIndex}`}
                        />
                      </div>
                    </div>

                    {/* Match Result */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Winner</Label>
                        <Select
                          value={matches[actualIndex]?.winner}
                          onValueChange={(value: any) => form.setValue(`matches.${actualIndex}.winner`, value)}
                        >
                          <SelectTrigger data-testid={`select-winner-${actualIndex}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">{homeTeamName}</SelectItem>
                            <SelectItem value="away">{awayTeamName}</SelectItem>
                            <SelectItem value="forfeit_home">{homeTeamName} (Forfeit)</SelectItem>
                            <SelectItem value="forfeit_away">{awayTeamName} (Forfeit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Score</Label>
                        <Input
                          placeholder="6-4, 7-5"
                          {...form.register(`matches.${actualIndex}.score`)}
                          data-testid={`input-score-${actualIndex}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={matches[actualIndex]?.completed ? "completed" : "incomplete"}
                          onValueChange={(value) => form.setValue(`matches.${actualIndex}.completed`, value === "completed")}
                        >
                          <SelectTrigger data-testid={`select-status-${actualIndex}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="incomplete">Not Played</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </form>
  );
});

TennisForm.displayName = 'TennisForm';

export default TennisForm;