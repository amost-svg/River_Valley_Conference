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
import { basketballScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface BasketballFormProps {
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
  quarters: z.array(z.object({
    period: z.number().int().min(1),
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  })).length(4),
  overtimePeriods: z.array(z.object({
    period: z.number().int().min(5),
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

const BasketballForm = forwardRef<FormHandle, BasketballFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [totalHomeScore, setTotalHomeScore] = useState(0);
  const [totalAwayScore, setTotalAwayScore] = useState(0);
  const [winner, setWinner] = useState<'home' | 'away' | null>(null);
  const [decidedBy, setDecidedBy] = useState<'regulation' | 'overtime'>('regulation');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      quarters: [
        { period: 1, homeScore: 0, awayScore: 0 },
        { period: 2, homeScore: 0, awayScore: 0 },
        { period: 3, homeScore: 0, awayScore: 0 },
        { period: 4, homeScore: 0, awayScore: 0 },
      ],
      overtimePeriods: [],
    },
  });

  const { fields: overtimeFields, append: appendOvertime, remove: removeOvertime } = useFieldArray({
    control: form.control,
    name: "overtimePeriods",
  });

  const quarters = form.watch('quarters');
  const overtimePeriods = form.watch('overtimePeriods') || [];

  // Track form validity and notify parent
  useEffect(() => {
    const isValid = !!winner && form.formState.isValid;
    onValidityChange?.(isValid);
  }, [winner, form.formState.isValid, onValidityChange]);

  // Calculate totals and winner
  useEffect(() => {
    const quarterHomeTotal = quarters.reduce((sum, quarter) => sum + (quarter.homeScore || 0), 0);
    const quarterAwayTotal = quarters.reduce((sum, quarter) => sum + (quarter.awayScore || 0), 0);
    
    const overtimeHomeTotal = overtimePeriods.reduce((sum, ot) => sum + (ot.homeScore || 0), 0);
    const overtimeAwayTotal = overtimePeriods.reduce((sum, ot) => sum + (ot.awayScore || 0), 0);

    const homeTotal = quarterHomeTotal + overtimeHomeTotal;
    const awayTotal = quarterAwayTotal + overtimeAwayTotal;

    setTotalHomeScore(homeTotal);
    setTotalAwayScore(awayTotal);

    if (homeTotal > awayTotal) {
      setWinner('home');
      setDecidedBy(overtimePeriods.length > 0 ? 'overtime' : 'regulation');
    } else if (awayTotal > homeTotal) {
      setWinner('away');
      setDecidedBy(overtimePeriods.length > 0 ? 'overtime' : 'regulation');
    } else {
      setWinner(null);
    }
  }, [quarters, overtimePeriods]);

  const addOvertimePeriod = () => {
    const nextOTPeriod = 5 + overtimeFields.length;
    appendOvertime({
      period: nextOTPeriod,
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

    const basketballData = basketballScoringSchema.parse({
      quarters: data.quarters,
      overtimePeriods: data.overtimePeriods,
      totalHomeScore,
      totalAwayScore,
      winner,
      decidedBy,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'aggregate_with_periods' as const,
      details: basketballData,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="basketball-form">
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
                  {decidedBy === 'overtime' ? ' (OT)' : ''}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Quarter Scores */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quarter Scores</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quarters.map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-sm">Quarter {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`q${index + 1}-home`}>{homeTeamName}</Label>
                    <Input
                      id={`q${index + 1}-home`}
                      type="number"
                      min="0"
                      {...form.register(`quarters.${index}.homeScore`, { valueAsNumber: true })}
                      data-testid={`input-quarter-${index + 1}-home-score`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`q${index + 1}-away`}>{awayTeamName}</Label>
                    <Input
                      id={`q${index + 1}-away`}
                      type="number"
                      min="0"
                      {...form.register(`quarters.${index}.awayScore`, { valueAsNumber: true })}
                      data-testid={`input-quarter-${index + 1}-away-score`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Overtime Periods */}
      {overtimeFields.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Overtime Periods</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeOvertime(overtimeFields.length - 1)}
                data-testid="button-remove-overtime"
              >
                Remove OT
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overtimeFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {index === 0 ? 'Overtime' : `${index + 1}OT`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`ot${index + 1}-home`}>{homeTeamName}</Label>
                        <Input
                          id={`ot${index + 1}-home`}
                          type="number"
                          min="0"
                          {...form.register(`overtimePeriods.${index}.homeScore`, { valueAsNumber: true })}
                          data-testid={`input-overtime-${index + 1}-home-score`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ot${index + 1}-away`}>{awayTeamName}</Label>
                        <Input
                          id={`ot${index + 1}-away`}
                          type="number"
                          min="0"
                          {...form.register(`overtimePeriods.${index}.awayScore`, { valueAsNumber: true })}
                          data-testid={`input-overtime-${index + 1}-away-score`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Overtime Button */}
      {totalHomeScore === totalAwayScore && totalHomeScore > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={addOvertimePeriod}
            data-testid="button-add-overtime"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Overtime Period
          </Button>
        </div>
      )}

    </form>
  );
});

BasketballForm.displayName = 'BasketballForm';

export default BasketballForm;