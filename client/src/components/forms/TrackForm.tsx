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
import { trackScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface TrackFormProps {
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
  eventResults: z.array(z.object({
    event: z.string().min(1, "Event name required"),
    place: z.number().int().min(1),
    athlete: z.string().min(1, "Athlete name required"),
    school: z.enum(['home', 'away']),
    performance: z.string().min(1, "Performance required"),
    points: z.number().int().min(0),
  })),
  totalHomePoints: z.number().int().min(0),
  totalAwayPoints: z.number().int().min(0),
  manualEntry: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const COMMON_EVENTS = [
  "100m",
  "200m",
  "400m",
  "800m",
  "1600m",
  "3200m",
  "110m Hurdles",
  "300m Hurdles",
  "4x100m Relay",
  "4x400m Relay",
  "4x800m Relay",
  "High Jump",
  "Long Jump",
  "Pole Vault",
  "Shot Put",
  "Discus"
];

const POINT_VALUES = [10, 8, 6, 4, 2, 1]; // Standard 6-place scoring

const TrackForm = forwardRef<FormHandle, TrackFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [winner, setWinner] = useState<'home' | 'away' | 'tie' | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      eventResults: [],
      totalHomePoints: 0,
      totalAwayPoints: 0,
      manualEntry: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "eventResults",
  });

  const eventResults = form.watch('eventResults');
  const manualEntry = form.watch('manualEntry');
  const totalHomePoints = form.watch('totalHomePoints');
  const totalAwayPoints = form.watch('totalAwayPoints');

  // Track form validity and notify parent
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  // Calculate team points from event results
  useEffect(() => {
    if (!manualEntry) {
      let homePoints = 0;
      let awayPoints = 0;

      eventResults.forEach((result) => {
        if (result.school === 'home') {
          homePoints += result.points || 0;
        } else if (result.school === 'away') {
          awayPoints += result.points || 0;
        }
      });

      form.setValue('totalHomePoints', homePoints);
      form.setValue('totalAwayPoints', awayPoints);
    }
  }, [eventResults, manualEntry, form]);

  // Determine winner
  useEffect(() => {
    const homeTotal = form.getValues('totalHomePoints');
    const awayTotal = form.getValues('totalAwayPoints');

    if (homeTotal > awayTotal) {
      setWinner('home');
    } else if (awayTotal > homeTotal) {
      setWinner('away');
    } else if (homeTotal === awayTotal && homeTotal > 0) {
      setWinner('tie');
    } else {
      setWinner(null);
    }
  }, [totalHomePoints, totalAwayPoints, form]);

  const addEventResult = () => {
    append({
      event: "",
      place: 1,
      athlete: "",
      school: 'home',
      performance: "",
      points: 10,
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

    const trackData = trackScoringSchema.parse({
      eventResults: data.eventResults,
      totalHomePoints: data.totalHomePoints,
      totalAwayPoints: data.totalAwayPoints,
      winner: winner!,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'team_points' as const,
      details: trackData,
      homeTotal: data.totalHomePoints,
      awayTotal: data.totalAwayPoints,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="track-form">
      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center" data-testid="home-total-points">
                <div className="text-4xl font-bold">{totalHomePoints}</div>
                <div className="text-sm">{homeTeamName}</div>
              </div>
              <div className="text-2xl">-</div>
              <div className="text-center" data-testid="away-total-points">
                <div className="text-4xl font-bold">{totalAwayPoints}</div>
                <div className="text-sm">{awayTeamName}</div>
              </div>
            </div>
            {winner && (
              <div className="text-center mt-4">
                <Badge variant="secondary" data-testid="meet-winner">
                  {winner === 'tie' ? 'Tie Meet' : `Winner: ${winner === 'home' ? homeTeamName : awayTeamName}`}
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
              <Label htmlFor="detailed">Event-by-Event Results (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="manual"
                checked={manualEntry}
                onChange={() => form.setValue('manualEntry', true)}
                data-testid="radio-manual-entry"
              />
              <Label htmlFor="manual">Manual Team Point Entry</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {manualEntry ? (
        // Manual Point Entry
        <Card>
          <CardHeader>
            <CardTitle>Team Point Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home-points">{homeTeamName} Points</Label>
                <Input
                  id="home-points"
                  type="number"
                  min="0"
                  {...form.register('totalHomePoints', { valueAsNumber: true })}
                  data-testid="input-home-points"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-points">{awayTeamName} Points</Label>
                <Input
                  id="away-points"
                  type="number"
                  min="0"
                  {...form.register('totalAwayPoints', { valueAsNumber: true })}
                  data-testid="input-away-points"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Event Results Entry
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Event Results</h3>
            <Button
              type="button"
              variant="outline"
              onClick={addEventResult}
              data-testid="button-add-event"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event Result
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Event {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    data-testid={`button-remove-event-${index}`}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <Select
                      value={form.watch(`eventResults.${index}.event`)}
                      onValueChange={(value) => form.setValue(`eventResults.${index}.event`, value)}
                    >
                      <SelectTrigger data-testid={`select-event-${index}`}>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_EVENTS.map((event) => (
                          <SelectItem key={event} value={event}>
                            {event}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.watch(`eventResults.${index}.event`) === 'other' && (
                      <Input
                        placeholder="Enter event name"
                        {...form.register(`eventResults.${index}.event`)}
                        data-testid={`input-custom-event-${index}`}
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Place</Label>
                    <Select
                      value={form.watch(`eventResults.${index}.place`)?.toString()}
                      onValueChange={(value) => {
                        const place = parseInt(value);
                        form.setValue(`eventResults.${index}.place`, place);
                        form.setValue(`eventResults.${index}.points`, POINT_VALUES[place - 1] || 0);
                      }}
                    >
                      <SelectTrigger data-testid={`select-place-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((place) => (
                          <SelectItem key={place} value={place.toString()}>
                            {place}{place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                      value={form.watch(`eventResults.${index}.school`)}
                      onValueChange={(value: 'home' | 'away') => form.setValue(`eventResults.${index}.school`, value)}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Athlete</Label>
                    <Input
                      placeholder="Athlete name"
                      {...form.register(`eventResults.${index}.athlete`)}
                      data-testid={`input-athlete-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Performance</Label>
                    <Input
                      placeholder="Time/Distance/Height"
                      {...form.register(`eventResults.${index}.performance`)}
                      data-testid={`input-performance-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min="0"
                      {...form.register(`eventResults.${index}.points`, { valueAsNumber: true })}
                      data-testid={`input-points-${index}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </form>
  );
});

TrackForm.displayName = 'TrackForm';

export default TrackForm;