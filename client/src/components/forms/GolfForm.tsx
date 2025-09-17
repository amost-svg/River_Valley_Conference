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
import { Plus, Minus } from "lucide-react";
import { golfScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface GolfFormProps {
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

const formSchema = z.object({
  players: z.array(z.object({
    name: z.string().min(1, "Player name required"),
    school: z.enum(['home', 'away']),
    score: z.number().int().min(18, "Minimum score is 18"),
    isScoring: z.boolean().default(true),
  })),
  homeTeamTotal: z.number().int().min(0),
  awayTeamTotal: z.number().int().min(0),
  manualEntry: z.boolean().default(false),
  scoringPlayers: z.object({
    home: z.array(z.number().int()).max(5),
    away: z.array(z.number().int()).max(5),
  }).optional(),
});

type FormData = z.infer<typeof formSchema>;

const GolfForm = forwardRef<FormHandle, GolfFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [winner, setWinner] = useState<'home' | 'away' | 'tie' | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      players: [],
      homeTeamTotal: 0,
      awayTeamTotal: 0,
      manualEntry: false,
      scoringPlayers: { home: [], away: [] },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "players",
  });

  const players = form.watch('players');
  const manualEntry = form.watch('manualEntry');
  const homeTeamTotal = form.watch('homeTeamTotal');
  const awayTeamTotal = form.watch('awayTeamTotal');

  // Track form validity and notify parent
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  // Calculate team totals from individual scores
  useEffect(() => {
    if (!manualEntry) {
      const homePlayers = players.filter(p => p.school === 'home' && p.isScoring).sort((a, b) => a.score - b.score);
      const awayPlayers = players.filter(p => p.school === 'away' && p.isScoring).sort((a, b) => a.score - b.score);

      // Typically use top 4 or 5 scores for team total
      const homeScores = homePlayers.slice(0, 4).map(p => p.score || 0);
      const awayScores = awayPlayers.slice(0, 4).map(p => p.score || 0);

      const homeTotal = homeScores.reduce((sum, score) => sum + score, 0);
      const awayTotal = awayScores.reduce((sum, score) => sum + score, 0);

      form.setValue('homeTeamTotal', homeTotal);
      form.setValue('awayTeamTotal', awayTotal);
      form.setValue('scoringPlayers', {
        home: homeScores,
        away: awayScores,
      });
    }
  }, [players, manualEntry, form]);

  // Determine winner (lower score wins in golf)
  useEffect(() => {
    const homeTotal = form.getValues('homeTeamTotal');
    const awayTotal = form.getValues('awayTeamTotal');

    if (homeTotal > 0 && awayTotal > 0) {
      if (homeTotal < awayTotal) {
        setWinner('home');
      } else if (awayTotal < homeTotal) {
        setWinner('away');
      } else {
        setWinner('tie');
      }
    } else {
      setWinner(null);
    }
  }, [homeTeamTotal, awayTeamTotal, form]);

  const addPlayer = () => {
    append({
      name: "",
      school: 'home',
      score: 72,
      isScoring: true,
    });
  };

  const handleSubmit = (data: FormData) => {
    if (!winner) {
      return; // Don't submit if no winner determined
    }

    // Determine winner team ID
    const winnerTeamId = winner === 'home' 
      ? (game.homeTeamId || undefined)
      : winner === 'away'
      ? (game.awayTeamId || undefined)
      : undefined; // undefined for ties

    const golfData = golfScoringSchema.parse({
      players: data.players,
      homeTeamTotal: data.homeTeamTotal,
      awayTeamTotal: data.awayTeamTotal,
      winner: winner!,
      scoringPlayers: data.scoringPlayers,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'stroke_play' as const,
      details: golfData,
      homeTotal: data.homeTeamTotal,
      awayTotal: data.awayTeamTotal,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="golf-form">
      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center" data-testid="home-team-total">
                <div className="text-4xl font-bold">{homeTeamTotal}</div>
                <div className="text-sm">{homeTeamName}</div>
              </div>
              <div className="text-2xl">vs</div>
              <div className="text-center" data-testid="away-team-total">
                <div className="text-4xl font-bold">{awayTeamTotal}</div>
                <div className="text-sm">{awayTeamName}</div>
              </div>
            </div>
            {winner && (
              <div className="text-center mt-4">
                <Badge variant="secondary" data-testid="match-winner">
                  {winner === 'tie' ? 'Tie Match' : `Winner: ${winner === 'home' ? homeTeamName : awayTeamName}`}
                  {winner !== 'tie' && ' (Lower Score)'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Entry Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="detailed"
                checked={!manualEntry}
                onChange={() => form.setValue('manualEntry', false)}
                data-testid="radio-detailed-entry"
              />
              <Label htmlFor="detailed">Individual Player Scores (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="manual"
                checked={manualEntry}
                onChange={() => form.setValue('manualEntry', true)}
                data-testid="radio-manual-entry"
              />
              <Label htmlFor="manual">Manual Team Total Entry</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {manualEntry ? (
        // Manual Total Entry
        <Card>
          <CardHeader>
            <CardTitle>Team Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home-total">{homeTeamName} Total</Label>
                <Input
                  id="home-total"
                  type="number"
                  min="0"
                  {...form.register('homeTeamTotal', { valueAsNumber: true })}
                  data-testid="input-home-total"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-total">{awayTeamName} Total</Label>
                <Input
                  id="away-total"
                  type="number"
                  min="0"
                  {...form.register('awayTeamTotal', { valueAsNumber: true })}
                  data-testid="input-away-total"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Individual Player Entry
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Individual Scores</h3>
            <Button
              type="button"
              variant="outline"
              onClick={addPlayer}
              data-testid="button-add-player"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>

          {fields.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No players added yet. Click "Add Player" to start entering scores.
                </p>
              </CardContent>
            </Card>
          )}

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Player {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    data-testid={`button-remove-player-${index}`}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Player Name</Label>
                    <Input
                      placeholder="Player name"
                      {...form.register(`players.${index}.name`)}
                      data-testid={`input-player-name-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                      value={players[index]?.school}
                      onValueChange={(value: 'home' | 'away') => form.setValue(`players.${index}.school`, value)}
                    >
                      <SelectTrigger data-testid={`select-team-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">{homeTeamName}</SelectItem>
                        <SelectItem value="away">{awayTeamName}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Score</Label>
                    <Input
                      type="number"
                      min="18"
                      {...form.register(`players.${index}.score`, { valueAsNumber: true })}
                      data-testid={`input-score-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Counts for Team</Label>
                    <div className="flex items-center justify-center h-10">
                      <input
                        type="checkbox"
                        checked={players[index]?.isScoring || false}
                        onChange={(e) => form.setValue(`players.${index}.isScoring`, e.target.checked)}
                        data-testid={`checkbox-scoring-${index}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!manualEntry && players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Team Scoring Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">{homeTeamName} (Best 4)</h4>
                    <div className="text-sm space-y-1">
                      {players
                        .filter(p => p.school === 'home' && p.isScoring)
                        .sort((a, b) => a.score - b.score)
                        .slice(0, 4)
                        .map((player, idx) => (
                          <div key={idx} className="flex justify-between" data-testid={`home-scoring-player-${idx}`}>
                            <span>{player.name}</span>
                            <span>{player.score}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{awayTeamName} (Best 4)</h4>
                    <div className="text-sm space-y-1">
                      {players
                        .filter(p => p.school === 'away' && p.isScoring)
                        .sort((a, b) => a.score - b.score)
                        .slice(0, 4)
                        .map((player, idx) => (
                          <div key={idx} className="flex justify-between" data-testid={`away-scoring-player-${idx}`}>
                            <span>{player.name}</span>
                            <span>{player.score}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </form>
  );
});

GolfForm.displayName = 'GolfForm';

export default GolfForm;