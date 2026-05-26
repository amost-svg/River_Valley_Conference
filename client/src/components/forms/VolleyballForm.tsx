import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus } from "lucide-react";
import { volleyballScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface VolleyballFormProps {
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
  bestOf: z.enum(['3', '5']),
  sets: z.array(z.object({
    setNumber: z.number().int().min(1),
    homeScore: z.number().int().min(0).max(50),
    awayScore: z.number().int().min(0).max(50),
    winnerTeam: z.enum(['home', 'away']),
  })),
});

type FormData = z.infer<typeof formSchema>;

const VolleyballForm = forwardRef<FormHandle, VolleyballFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [setsWonHome, setSetsWonHome] = useState(0);
  const [setsWonAway, setSetsWonAway] = useState(0);
  const [matchWinner, setMatchWinner] = useState<'home' | 'away' | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      bestOf: '3',
      sets: [
        { setNumber: 1, homeScore: 0, awayScore: 0, winnerTeam: 'home' },
        { setNumber: 2, homeScore: 0, awayScore: 0, winnerTeam: 'home' },
        { setNumber: 3, homeScore: 0, awayScore: 0, winnerTeam: 'home' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sets",
  });

  const bestOf = form.watch('bestOf');
  const sets = form.watch('sets');

  // Track form validity and notify parent
  useEffect(() => {
    const isValid = !!matchWinner && form.formState.isValid;
    onValidityChange?.(isValid);
  }, [matchWinner, form.formState.isValid, onValidityChange]);

  // Calculate sets won and match winner
  useEffect(() => {
    let homeWins = 0;
    let awayWins = 0;

    sets.forEach((set) => {
      if (set.homeScore > set.awayScore) {
        homeWins++;
        form.setValue(`sets.${sets.indexOf(set)}.winnerTeam`, 'home');
      } else if (set.awayScore > set.homeScore) {
        awayWins++;
        form.setValue(`sets.${sets.indexOf(set)}.winnerTeam`, 'away');
      }
    });

    setSetsWonHome(homeWins);
    setSetsWonAway(awayWins);

    const setsNeededToWin = bestOf === '3' ? 2 : 3;
    if (homeWins >= setsNeededToWin) {
      setMatchWinner('home');
    } else if (awayWins >= setsNeededToWin) {
      setMatchWinner('away');
    } else {
      setMatchWinner(null);
    }
  }, [sets, bestOf, form]);

  // Adjust number of sets when bestOf changes
  useEffect(() => {
    const requiredSets = bestOf === '3' ? 3 : 5;
    const currentSets = fields.length;

    if (currentSets < requiredSets) {
      for (let i = currentSets; i < requiredSets; i++) {
        append({
          setNumber: i + 1,
          homeScore: 0,
          awayScore: 0,
          winnerTeam: 'home',
        });
      }
    } else if (currentSets > requiredSets) {
      for (let i = currentSets; i > requiredSets; i--) {
        remove(i - 1);
      }
    }
  }, [bestOf, fields.length, append, remove]);

  const handleSubmit = (data: FormData) => {
    if (!matchWinner) {
      return; // Don't submit if no winner determined
    }

    // Calculate totals
    const homeTotal = setsWonHome;
    const awayTotal = setsWonAway;
    
    // Determine winner team ID
    const winnerTeamId = matchWinner === 'home' 
      ? (game.homeTeamId || undefined)
      : (game.awayTeamId || undefined);

    const volleyballData = volleyballScoringSchema.parse({
      bestOf: data.bestOf,
      sets: data.sets.map((set, index) => ({
        setNumber: index + 1,
        homeScore: set.homeScore,
        awayScore: set.awayScore,
        winnerTeam: set.homeScore > set.awayScore ? 'home' : 'away',
      })),
      setsWonHome: homeTotal,
      setsWonAway: awayTotal,
      matchWinner,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'set_match' as const,
      details: volleyballData,
      homeTotal,
      awayTotal,
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
    isValid: () => form.formState.isValid,
  }));

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="volleyball-form">
      {/* Match Format Selection */}
      <div className="space-y-2">
        <Label htmlFor="bestOf">Match Format</Label>
        <Select value={bestOf} onValueChange={(value: '3' | '5') => form.setValue('bestOf', value)}>
          <SelectTrigger data-testid="select-best-of">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Best of 3 Sets</SelectItem>
            <SelectItem value="5">Best of 5 Sets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Match Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center" data-testid="home-sets-won">
                <div className="text-3xl font-bold">{setsWonHome}</div>
                <div className="text-sm">{homeTeamName}</div>
              </div>
              <div className="text-2xl">-</div>
              <div className="text-center" data-testid="away-sets-won">
                <div className="text-3xl font-bold">{setsWonAway}</div>
                <div className="text-sm">{awayTeamName}</div>
              </div>
            </div>
            {matchWinner && (
              <div className="text-center mt-4">
                <Badge variant="secondary" data-testid="match-winner">
                  Winner: {matchWinner === 'home' ? homeTeamName : awayTeamName}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Set Scores */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Set Scores</h3>
        
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
              <CardTitle className="text-sm">Set {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`homeScore-${index}`}>{homeTeamName}</Label>
                  <Input
                    id={`homeScore-${index}`}
                    type="number"
                    min="0"
                    max="50"
                    {...form.register(`sets.${index}.homeScore`, { valueAsNumber: true })}
                    data-testid={`input-set-${index + 1}-home-score`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`awayScore-${index}`}>{awayTeamName}</Label>
                  <Input
                    id={`awayScore-${index}`}
                    type="number"
                    min="0"
                    max="50"
                    {...form.register(`sets.${index}.awayScore`, { valueAsNumber: true })}
                    data-testid={`input-set-${index + 1}-away-score`}
                  />
                </div>
              </div>
              
              {/* Set Winner Display */}
              <div className="mt-2 text-center">
                {sets[index] && sets[index].homeScore > sets[index].awayScore && (
                  <Badge variant="outline" data-testid={`set-${index + 1}-winner`}>
                    {homeTeamName} wins set
                  </Badge>
                )}
                {sets[index] && sets[index].awayScore > sets[index].homeScore && (
                  <Badge variant="outline" data-testid={`set-${index + 1}-winner`}>
                    {awayTeamName} wins set
                  </Badge>
                )}
                {sets[index] && sets[index].homeScore === sets[index].awayScore && sets[index].homeScore > 0 && (
                  <Badge variant="secondary" data-testid={`set-${index + 1}-winner`}>
                    Tied
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </form>
  );
});

VolleyballForm.displayName = 'VolleyballForm';

export default VolleyballForm;