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
import { Plus } from "lucide-react";
import { baseballScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface BaseballFormProps {
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
  innings: z.array(z.object({
    inning: z.number().int().min(1),
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  })).min(7),
  extraInnings: z.array(z.object({
    inning: z.number().int().min(8),
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  })).optional(),
  homeHits: z.number().int().min(0).optional(),
  awayHits: z.number().int().min(0).optional(),
  homeErrors: z.number().int().min(0).optional(),
  awayErrors: z.number().int().min(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

const BaseballForm = forwardRef<FormHandle, BaseballFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [totalHomeScore, setTotalHomeScore] = useState(0);
  const [totalAwayScore, setTotalAwayScore] = useState(0);
  const [winner, setWinner] = useState<'home' | 'away' | null>(null);
  const [decidedBy, setDecidedBy] = useState<'regulation' | 'extra_innings'>('regulation');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      innings: Array.from({ length: 7 }, (_, i) => ({
        inning: i + 1,
        homeScore: 0,
        awayScore: 0,
      })),
      extraInnings: [],
      homeHits: 0,
      awayHits: 0,
      homeErrors: 0,
      awayErrors: 0,
    },
  });

  const { fields: extraInningFields, append: appendExtraInning, remove: removeExtraInning } = useFieldArray({
    control: form.control,
    name: "extraInnings",
  });

  const innings = form.watch('innings');
  const extraInnings = form.watch('extraInnings') || [];

  // Track form validity and notify parent
  useEffect(() => {
    const isValid = !!winner && form.formState.isValid;
    onValidityChange?.(isValid);
  }, [winner, form.formState.isValid, onValidityChange]);

  // Calculate totals and winner
  useEffect(() => {
    const inningHomeTotal = innings.reduce((sum, inning) => sum + (inning.homeScore || 0), 0);
    const inningAwayTotal = innings.reduce((sum, inning) => sum + (inning.awayScore || 0), 0);
    
    const extraHomeTotal = extraInnings.reduce((sum, inning) => sum + (inning.homeScore || 0), 0);
    const extraAwayTotal = extraInnings.reduce((sum, inning) => sum + (inning.awayScore || 0), 0);

    const homeTotal = inningHomeTotal + extraHomeTotal;
    const awayTotal = inningAwayTotal + extraAwayTotal;

    setTotalHomeScore(homeTotal);
    setTotalAwayScore(awayTotal);

    if (homeTotal > awayTotal) {
      setWinner('home');
      setDecidedBy(extraInnings.length > 0 ? 'extra_innings' : 'regulation');
    } else if (awayTotal > homeTotal) {
      setWinner('away');
      setDecidedBy(extraInnings.length > 0 ? 'extra_innings' : 'regulation');
    } else {
      setWinner(null);
    }
  }, [innings, extraInnings]);

  const addExtraInning = () => {
    const nextInning = 8 + extraInningFields.length;
    appendExtraInning({
      inning: nextInning,
      homeScore: 0,
      awayScore: 0,
    });
  };

  const handleSubmit = (data: FormData) => {
    if (!winner) {
      return; // Don't submit if game is tied
    }

    // Determine winner team ID
    const winnerTeamId = winner === 'home' 
      ? (game.homeTeamId || undefined)
      : (game.awayTeamId || undefined);

    const baseballData = baseballScoringSchema.parse({
      innings: data.innings,
      extraInnings: data.extraInnings,
      totalHomeScore,
      totalAwayScore,
      homeHits: data.homeHits,
      awayHits: data.awayHits,
      homeErrors: data.homeErrors,
      awayErrors: data.awayErrors,
      winner,
      decidedBy,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'inning_line' as const,
      details: baseballData,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="baseball-form">
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
            {winner && (
              <div className="text-center mt-4">
                <Badge variant="secondary" data-testid="game-winner">
                  Winner: {winner === 'home' ? homeTeamName : awayTeamName}
                  {decidedBy === 'extra_innings' ? ' (Extra Innings)' : ''}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Line Score Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Line Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-10 gap-2 text-sm font-semibold text-center">
              <div>Team</div>
              {Array.from({ length: Math.max(7, innings.length + extraInnings.length) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
              <div>R</div>
              <div>H</div>
              <div>E</div>
            </div>

            {/* Home Team Row */}
            <div className="grid grid-cols-10 gap-2 text-sm text-center">
              <div className="font-semibold" data-testid="home-team-label">{homeTeamName}</div>
              {innings.map((_, index) => (
                <Input
                  key={`home-${index}`}
                  type="number"
                  min="0"
                  className="text-center h-8"
                  {...form.register(`innings.${index}.homeScore`, { valueAsNumber: true })}
                  data-testid={`input-inning-${index + 1}-home-score`}
                />
              ))}
              {extraInnings.map((_, index) => (
                <Input
                  key={`home-extra-${index}`}
                  type="number"
                  min="0"
                  className="text-center h-8"
                  {...form.register(`extraInnings.${index}.homeScore`, { valueAsNumber: true })}
                  data-testid={`input-extra-inning-${index + 1}-home-score`}
                />
              ))}
              <div className="flex items-center justify-center font-bold" data-testid="home-runs-total">
                {totalHomeScore}
              </div>
              <Input
                type="number"
                min="0"
                className="text-center h-8"
                {...form.register('homeHits', { valueAsNumber: true })}
                data-testid="input-home-hits"
              />
              <Input
                type="number"
                min="0"
                className="text-center h-8"
                {...form.register('homeErrors', { valueAsNumber: true })}
                data-testid="input-home-errors"
              />
            </div>

            {/* Away Team Row */}
            <div className="grid grid-cols-10 gap-2 text-sm text-center">
              <div className="font-semibold" data-testid="away-team-label">{awayTeamName}</div>
              {innings.map((_, index) => (
                <Input
                  key={`away-${index}`}
                  type="number"
                  min="0"
                  className="text-center h-8"
                  {...form.register(`innings.${index}.awayScore`, { valueAsNumber: true })}
                  data-testid={`input-inning-${index + 1}-away-score`}
                />
              ))}
              {extraInnings.map((_, index) => (
                <Input
                  key={`away-extra-${index}`}
                  type="number"
                  min="0"
                  className="text-center h-8"
                  {...form.register(`extraInnings.${index}.awayScore`, { valueAsNumber: true })}
                  data-testid={`input-extra-inning-${index + 1}-away-score`}
                />
              ))}
              <div className="flex items-center justify-center font-bold" data-testid="away-runs-total">
                {totalAwayScore}
              </div>
              <Input
                type="number"
                min="0"
                className="text-center h-8"
                {...form.register('awayHits', { valueAsNumber: true })}
                data-testid="input-away-hits"
              />
              <Input
                type="number"
                min="0"
                className="text-center h-8"
                {...form.register('awayErrors', { valueAsNumber: true })}
                data-testid="input-away-errors"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Extra Innings Button */}
      {totalHomeScore === totalAwayScore && totalHomeScore >= 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={addExtraInning}
            data-testid="button-add-extra-inning"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Extra Inning
          </Button>
        </div>
      )}

    </form>
  );
});

BaseballForm.displayName = 'BaseballForm';

export default BaseballForm;