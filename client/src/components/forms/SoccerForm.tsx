import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { soccerScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface SoccerFormProps {
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
  regulation: z.object({
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  }),
  hasExtraTime: z.boolean(),
  extraTime: z.object({
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
  }).optional(),
  hasPenaltyKicks: z.boolean(),
  penaltyKicks: z.object({
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
    homeMade: z.number().int().min(0).optional(),
    awayMade: z.number().int().min(0).optional(),
    homeAttempts: z.number().int().min(0).optional(),
    awayAttempts: z.number().int().min(0).optional(),
  }).optional(),
});

type FormData = z.infer<typeof formSchema>;

const SoccerForm = forwardRef<FormHandle, SoccerFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [totalHomeScore, setTotalHomeScore] = useState(0);
  const [totalAwayScore, setTotalAwayScore] = useState(0);
  const [winner, setWinner] = useState<'home' | 'away' | 'tie' | null>(null);
  const [decidedBy, setDecidedBy] = useState<'regulation' | 'extra_time' | 'penalty_kicks'>('regulation');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      regulation: { homeScore: 0, awayScore: 0 },
      hasExtraTime: false,
      extraTime: { homeScore: 0, awayScore: 0 },
      hasPenaltyKicks: false,
      penaltyKicks: {
        homeScore: 0,
        awayScore: 0,
        homeMade: 0,
        awayMade: 0,
        homeAttempts: 0,
        awayAttempts: 0,
      },
    },
  });

  const regulation = form.watch('regulation');
  const hasExtraTime = form.watch('hasExtraTime');
  const extraTime = form.watch('extraTime');
  const hasPenaltyKicks = form.watch('hasPenaltyKicks');
  const penaltyKicks = form.watch('penaltyKicks');

  // Track form validity and notify parent
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  // Calculate totals and winner
  useEffect(() => {
    const regHomeScore = regulation.homeScore || 0;
    const regAwayScore = regulation.awayScore || 0;
    
    const etHomeScore = hasExtraTime ? (extraTime?.homeScore || 0) : 0;
    const etAwayScore = hasExtraTime ? (extraTime?.awayScore || 0) : 0;

    const homeTotal = regHomeScore + etHomeScore;
    const awayTotal = regAwayScore + etAwayScore;

    setTotalHomeScore(homeTotal);
    setTotalAwayScore(awayTotal);

    if (hasPenaltyKicks) {
      const pkHomeWins = penaltyKicks?.homeMade || 0;
      const pkAwayWins = penaltyKicks?.awayMade || 0;
      
      if (pkHomeWins > pkAwayWins) {
        setWinner('home');
        setDecidedBy('penalty_kicks');
      } else if (pkAwayWins > pkHomeWins) {
        setWinner('away');
        setDecidedBy('penalty_kicks');
      } else {
        setWinner('tie');
      }
    } else if (homeTotal > awayTotal) {
      setWinner('home');
      setDecidedBy(hasExtraTime ? 'extra_time' : 'regulation');
    } else if (awayTotal > homeTotal) {
      setWinner('away');
      setDecidedBy(hasExtraTime ? 'extra_time' : 'regulation');
    } else {
      setWinner('tie');
      setDecidedBy(hasExtraTime ? 'extra_time' : 'regulation');
    }
  }, [regulation, hasExtraTime, extraTime, hasPenaltyKicks, penaltyKicks]);

  const handleSubmit = (data: FormData) => {
    // Determine winner team ID
    const winnerTeamId = winner === 'home' 
      ? (game.homeTeamId || undefined)
      : winner === 'away'
      ? (game.awayTeamId || undefined)
      : undefined; // undefined for ties

    const soccerData = soccerScoringSchema.parse({
      regulation: data.regulation,
      extraTime: data.hasExtraTime ? data.extraTime : undefined,
      penaltyKicks: data.hasPenaltyKicks ? data.penaltyKicks : undefined,
      totalHomeScore,
      totalAwayScore,
      winner: winner!,
      decidedBy,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'aggregate_with_tiebreaker' as const,
      details: soccerData,
      homeTotal: totalHomeScore,
      awayTotal: totalAwayScore,
      winnerTeamId,
      decidedBy,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="soccer-form">
      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Final Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center" data-testid="home-total-score">
                <div className="text-4xl font-bold">{totalHomeScore}</div>
                <div className="text-sm">{homeTeamName}</div>
              </div>
              <div className="text-2xl">-</div>
              <div className="text-center" data-testid="away-total-score">
                <div className="text-4xl font-bold">{totalAwayScore}</div>
                <div className="text-sm">{awayTeamName}</div>
              </div>
            </div>
            <div className="text-center mt-4 space-y-2">
              {winner && (
                <Badge variant="secondary" data-testid="game-winner">
                  {winner === 'tie' ? 'Tie Game' : `Winner: ${winner === 'home' ? homeTeamName : awayTeamName}`}
                </Badge>
              )}
              {decidedBy !== 'regulation' && (
                <Badge variant="outline" data-testid="game-decided-by">
                  {decidedBy === 'extra_time' && 'Decided in Extra Time'}
                  {decidedBy === 'penalty_kicks' && 'Decided by Penalty Kicks'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Regulation Time */}
      <Card>
        <CardHeader>
          <CardTitle>Regulation Time (90 minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-home">{homeTeamName}</Label>
              <Input
                id="reg-home"
                type="number"
                min="0"
                {...form.register('regulation.homeScore', { valueAsNumber: true })}
                data-testid="input-regulation-home-score"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-away">{awayTeamName}</Label>
              <Input
                id="reg-away"
                type="number"
                min="0"
                {...form.register('regulation.awayScore', { valueAsNumber: true })}
                data-testid="input-regulation-away-score"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extra Time Option */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasExtraTime"
          checked={hasExtraTime}
          onCheckedChange={(checked) => form.setValue('hasExtraTime', !!checked)}
          data-testid="checkbox-extra-time"
        />
        <Label htmlFor="hasExtraTime">Game went to Extra Time (30 minutes)</Label>
      </div>

      {hasExtraTime && (
        <Card>
          <CardHeader>
            <CardTitle>Extra Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="et-home">{homeTeamName}</Label>
                <Input
                  id="et-home"
                  type="number"
                  min="0"
                  {...form.register('extraTime.homeScore', { valueAsNumber: true })}
                  data-testid="input-extra-time-home-score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="et-away">{awayTeamName}</Label>
                <Input
                  id="et-away"
                  type="number"
                  min="0"
                  {...form.register('extraTime.awayScore', { valueAsNumber: true })}
                  data-testid="input-extra-time-away-score"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Penalty Kicks Option */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasPenaltyKicks"
          checked={hasPenaltyKicks}
          onCheckedChange={(checked) => form.setValue('hasPenaltyKicks', !!checked)}
          data-testid="checkbox-penalty-kicks"
        />
        <Label htmlFor="hasPenaltyKicks">Game decided by Penalty Kicks</Label>
      </div>

      {hasPenaltyKicks && (
        <Card>
          <CardHeader>
            <CardTitle>Penalty Kick Shootout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pk-home-made">{homeTeamName} Made</Label>
                <Input
                  id="pk-home-made"
                  type="number"
                  min="0"
                  {...form.register('penaltyKicks.homeMade', { valueAsNumber: true })}
                  data-testid="input-penalty-kicks-home-made"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pk-away-made">{awayTeamName} Made</Label>
                <Input
                  id="pk-away-made"
                  type="number"
                  min="0"
                  {...form.register('penaltyKicks.awayMade', { valueAsNumber: true })}
                  data-testid="input-penalty-kicks-away-made"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pk-home-attempts">{homeTeamName} Attempts</Label>
                <Input
                  id="pk-home-attempts"
                  type="number"
                  min="0"
                  {...form.register('penaltyKicks.homeAttempts', { valueAsNumber: true })}
                  data-testid="input-penalty-kicks-home-attempts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pk-away-attempts">{awayTeamName} Attempts</Label>
                <Input
                  id="pk-away-attempts"
                  type="number"
                  min="0"
                  {...form.register('penaltyKicks.awayAttempts', { valueAsNumber: true })}
                  data-testid="input-penalty-kicks-away-attempts"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </form>
  );
});

SoccerForm.displayName = 'SoccerForm';

export default SoccerForm;