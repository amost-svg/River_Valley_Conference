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
import { crossCountryScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface CrossCountryFormProps {
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
  runners: z.array(z.object({
    place: z.number().int().min(1),
    name: z.string().min(1, "Runner name required"),
    school: z.enum(['home', 'away']),
    time: z.string().min(1, "Time required"),
    points: z.number().int().min(0).optional(),
  })),
  homeTeamScore: z.number().int().min(0),
  awayTeamScore: z.number().int().min(0),
  manualEntry: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const CrossCountryForm = forwardRef<FormHandle, CrossCountryFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [winner, setWinner] = useState<'home' | 'away' | null>(null);
  const [scoringRunners, setScoringRunners] = useState<{ home: number[], away: number[] }>({ 
    home: [], 
    away: [] 
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      runners: [],
      homeTeamScore: 0,
      awayTeamScore: 0,
      manualEntry: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "runners",
  });

  const runners = form.watch('runners');
  const manualEntry = form.watch('manualEntry');
  const homeTeamScore = form.watch('homeTeamScore');
  const awayTeamScore = form.watch('awayTeamScore');

  // Track form validity and notify parent
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  // Calculate team scores from runner places
  useEffect(() => {
    if (!manualEntry && runners.length > 0) {
      // Sort runners by place
      const sortedRunners = [...runners].sort((a, b) => a.place - b.place);
      
      // Update places based on position and assign points
      const updatedRunners = sortedRunners.map((runner, index) => ({
        ...runner,
        place: index + 1,
        points: index + 1, // In cross country, place = points
      }));

      // Update form with corrected places
      updatedRunners.forEach((runner, index) => {
        form.setValue(`runners.${index}.place`, runner.place);
        form.setValue(`runners.${index}.points`, runner.points);
      });

      // Calculate team scores (sum of top 5 finishers)
      const homeRunners = updatedRunners.filter(r => r.school === 'home').slice(0, 5);
      const awayRunners = updatedRunners.filter(r => r.school === 'away').slice(0, 5);

      const homeScore = homeRunners.length >= 5 
        ? homeRunners.reduce((sum, runner) => sum + runner.place, 0)
        : 999; // High penalty score if less than 5 runners

      const awayScore = awayRunners.length >= 5
        ? awayRunners.reduce((sum, runner) => sum + runner.place, 0)
        : 999; // High penalty score if less than 5 runners

      form.setValue('homeTeamScore', homeScore);
      form.setValue('awayTeamScore', awayScore);

      setScoringRunners({
        home: homeRunners.map(r => r.place),
        away: awayRunners.map(r => r.place),
      });
    }
  }, [runners, manualEntry, form]);

  // Determine winner (lower score wins in cross country)
  useEffect(() => {
    const homeTotal = form.getValues('homeTeamScore');
    const awayTotal = form.getValues('awayTeamScore');

    if (homeTotal > 0 && awayTotal > 0 && homeTotal < 999 && awayTotal < 999) {
      if (homeTotal < awayTotal) {
        setWinner('home');
      } else if (awayTotal < homeTotal) {
        setWinner('away');
      } else {
        // Tie - typically broken by 6th runner
        setWinner('home'); // Simplified for now
      }
    } else {
      setWinner(null);
    }
  }, [homeTeamScore, awayTeamScore, form]);

  const addRunner = () => {
    append({
      place: runners.length + 1,
      name: "",
      school: 'home',
      time: "",
      points: runners.length + 1,
    });
  };

  const handleSubmit = (data: FormData) => {
    if (!winner) {
      return; // Don't submit if no winner determined
    }

    // Determine winner team ID
    const winnerTeamId = winner === 'home' 
      ? (game.homeTeamId || undefined)
      : (game.awayTeamId || undefined);

    const crossCountryData = crossCountryScoringSchema.parse({
      runners: data.runners,
      homeTeamScore: data.homeTeamScore,
      awayTeamScore: data.awayTeamScore,
      winner,
      scoringRunners,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'runner_places' as const,
      details: crossCountryData,
      homeTotal: data.homeTeamScore,
      awayTotal: data.awayTeamScore,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="cross-country-form">
      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center" data-testid="home-team-score">
                <div className="text-4xl font-bold">{homeTeamScore}</div>
                <div className="text-sm">{homeTeamName}</div>
              </div>
              <div className="text-2xl">vs</div>
              <div className="text-center" data-testid="away-team-score">
                <div className="text-4xl font-bold">{awayTeamScore}</div>
                <div className="text-sm">{awayTeamName}</div>
              </div>
            </div>
            {winner && (
              <div className="text-center mt-4">
                <Badge variant="secondary" data-testid="meet-winner">
                  Winner: {winner === 'home' ? homeTeamName : awayTeamName} (Lower Score)
                </Badge>
              </div>
            )}
            <div className="text-center mt-2 text-sm text-muted-foreground">
              Lower score wins • Score = sum of top 5 runner places
            </div>
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
              <Label htmlFor="detailed">Individual Runner Results (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="manual"
                checked={manualEntry}
                onChange={() => form.setValue('manualEntry', true)}
                data-testid="radio-manual-entry"
              />
              <Label htmlFor="manual">Manual Team Score Entry</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {manualEntry ? (
        // Manual Score Entry
        <Card>
          <CardHeader>
            <CardTitle>Team Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home-score">{homeTeamName} Score</Label>
                <Input
                  id="home-score"
                  type="number"
                  min="15"
                  {...form.register('homeTeamScore', { valueAsNumber: true })}
                  data-testid="input-home-score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-score">{awayTeamName} Score</Label>
                <Input
                  id="away-score"
                  type="number"
                  min="15"
                  {...form.register('awayTeamScore', { valueAsNumber: true })}
                  data-testid="input-away-score"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Individual Runner Entry
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Race Results</h3>
            <Button
              type="button"
              variant="outline"
              onClick={addRunner}
              data-testid="button-add-runner"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Runner
            </Button>
          </div>

          {fields.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No runners added yet. Click "Add Runner" to start entering results.
                </p>
              </CardContent>
            </Card>
          )}

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Place {runners[index]?.place || index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    data-testid={`button-remove-runner-${index}`}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Place</Label>
                    <Input
                      type="number"
                      min="1"
                      {...form.register(`runners.${index}.place`, { valueAsNumber: true })}
                      data-testid={`input-place-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Runner Name</Label>
                    <Input
                      placeholder="Runner name"
                      {...form.register(`runners.${index}.name`)}
                      data-testid={`input-runner-name-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                      value={runners[index]?.school}
                      onValueChange={(value: 'home' | 'away') => form.setValue(`runners.${index}.school`, value)}
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
                    <Label>Time</Label>
                    <Input
                      placeholder="MM:SS.00"
                      {...form.register(`runners.${index}.time`)}
                      data-testid={`input-time-${index}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!manualEntry && runners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Team Scoring Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">{homeTeamName} Top 5</h4>
                    <div className="text-sm space-y-1">
                      {runners
                        .filter(r => r.school === 'home')
                        .sort((a, b) => a.place - b.place)
                        .slice(0, 5)
                        .map((runner, idx) => (
                          <div key={idx} className="flex justify-between" data-testid={`home-scoring-runner-${idx}`}>
                            <span>{runner.name}</span>
                            <span>{runner.place} ({runner.time})</span>
                          </div>
                        ))}
                    </div>
                    <div className="font-medium mt-2">
                      Score: {scoringRunners.home.reduce((sum, place) => sum + place, 0)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{awayTeamName} Top 5</h4>
                    <div className="text-sm space-y-1">
                      {runners
                        .filter(r => r.school === 'away')
                        .sort((a, b) => a.place - b.place)
                        .slice(0, 5)
                        .map((runner, idx) => (
                          <div key={idx} className="flex justify-between" data-testid={`away-scoring-runner-${idx}`}>
                            <span>{runner.name}</span>
                            <span>{runner.place} ({runner.time})</span>
                          </div>
                        ))}
                    </div>
                    <div className="font-medium mt-2">
                      Score: {scoringRunners.away.reduce((sum, place) => sum + place, 0)}
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

CrossCountryForm.displayName = 'CrossCountryForm';

export default CrossCountryForm;