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
import { wrestlingScoringSchema } from "@shared/schema";
import type { Game, School, Sport } from "@shared/schema";

interface WrestlingFormProps {
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

const WEIGHT_CLASSES = [
  "106", "113", "120", "126", "132", "138", "144", "150", 
  "157", "165", "175", "190", "215", "285"
];

const WIN_TYPES = [
  { value: 'pin', label: 'Pin/Fall', points: 6 },
  { value: 'tech_fall', label: 'Tech Fall', points: 5 },
  { value: 'major_decision', label: 'Major Decision', points: 4 },
  { value: 'decision', label: 'Decision', points: 3 },
  { value: 'forfeit', label: 'Forfeit', points: 6 },
  { value: 'disqualification', label: 'Disqualification', points: 6 },
];

const formSchema = z.object({
  matches: z.array(z.object({
    weightClass: z.string().min(1, "Weight class required"),
    homeWrestler: z.string().optional(),
    awayWrestler: z.string().optional(),
    winner: z.enum(['home', 'away', 'forfeit_home', 'forfeit_away', 'double_forfeit']),
    winType: z.enum(['pin', 'tech_fall', 'major_decision', 'decision', 'forfeit', 'disqualification']).optional(),
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
    teamPoints: z.number().int().min(0),
  })),
});

type FormData = z.infer<typeof formSchema>;

const WrestlingForm = forwardRef<FormHandle, WrestlingFormProps>(({ game, onSubmit, onValidityChange }, ref) => {
  const [totalHomePoints, setTotalHomePoints] = useState(0);
  const [totalAwayPoints, setTotalAwayPoints] = useState(0);
  const [winner, setWinner] = useState<'home' | 'away' | 'tie' | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      matches: WEIGHT_CLASSES.map(weight => ({
        weightClass: weight,
        homeWrestler: "",
        awayWrestler: "",
        winner: 'home' as const,
        winType: 'decision' as const,
        homeScore: 0,
        awayScore: 0,
        teamPoints: 0,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "matches",
  });

  const matches = form.watch('matches');

  // Track form validity and notify parent
  useEffect(() => {
    onValidityChange?.(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  // Calculate team points
  useEffect(() => {
    let homePoints = 0;
    let awayPoints = 0;

    matches.forEach((match, index) => {
      const teamPoints = match.teamPoints || 0;
      
      if (match.winner === 'home' || match.winner === 'forfeit_home') {
        homePoints += teamPoints;
      } else if (match.winner === 'away' || match.winner === 'forfeit_away') {
        awayPoints += teamPoints;
      }
    });

    setTotalHomePoints(homePoints);
    setTotalAwayPoints(awayPoints);

    if (homePoints > awayPoints) {
      setWinner('home');
    } else if (awayPoints > homePoints) {
      setWinner('away');
    } else if (homePoints === awayPoints && homePoints > 0) {
      setWinner('tie');
    } else {
      setWinner(null);
    }
  }, [matches]);

  const updateMatchPoints = (index: number, winner: string, winType?: string) => {
    const winTypeData = WIN_TYPES.find(wt => wt.value === winType);
    const teamPoints = winTypeData?.points || 0;
    
    form.setValue(`matches.${index}.winner`, winner as any);
    form.setValue(`matches.${index}.winType`, winType as any);
    form.setValue(`matches.${index}.teamPoints`, teamPoints);
  };

  const handleSubmit = (data: FormData) => {
    // Determine winner team ID
    const winnerTeamId = winner === 'home' 
      ? (game.homeTeamId || undefined)
      : winner === 'away'
      ? (game.awayTeamId || undefined)
      : undefined; // undefined for ties

    const wrestlingData = wrestlingScoringSchema.parse({
      matches: data.matches,
      totalHomeTeamPoints: totalHomePoints,
      totalAwayTeamPoints: totalAwayPoints,
      winner: winner!,
    });

    const submissionData = {
      gameId: game.id,
      scoringType: 'dual_meet' as const,
      details: wrestlingData,
      homeTotal: totalHomePoints,
      awayTotal: totalAwayPoints,
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="wrestling-form">
      {/* Current Score Display */}
      <div className="flex justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Score</CardTitle>
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
                <Badge variant="secondary" data-testid="dual-winner">
                  {winner === 'tie' ? 'Tie Dual' : `Winner: ${winner === 'home' ? homeTeamName : awayTeamName}`}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Match Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Match Results</h3>
        
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
              <CardTitle className="text-sm">{matches[index]?.weightClass} lbs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Wrestler Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{homeTeamName} Wrestler</Label>
                    <Input
                      placeholder="Wrestler name"
                      {...form.register(`matches.${index}.homeWrestler`)}
                      data-testid={`input-home-wrestler-${index}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{awayTeamName} Wrestler</Label>
                    <Input
                      placeholder="Wrestler name"
                      {...form.register(`matches.${index}.awayWrestler`)}
                      data-testid={`input-away-wrestler-${index}`}
                    />
                  </div>
                </div>

                {/* Match Result */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Winner</Label>
                    <Select
                      value={matches[index]?.winner}
                      onValueChange={(value) => updateMatchPoints(index, value, matches[index]?.winType)}
                    >
                      <SelectTrigger data-testid={`select-winner-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">{homeTeamName}</SelectItem>
                        <SelectItem value="away">{awayTeamName}</SelectItem>
                        <SelectItem value="forfeit_home">{homeTeamName} (Forfeit)</SelectItem>
                        <SelectItem value="forfeit_away">{awayTeamName} (Forfeit)</SelectItem>
                        <SelectItem value="double_forfeit">Double Forfeit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Win Type</Label>
                    <Select
                      value={matches[index]?.winType}
                      onValueChange={(value) => updateMatchPoints(index, matches[index]?.winner, value)}
                    >
                      <SelectTrigger data-testid={`select-win-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WIN_TYPES.map((winType) => (
                          <SelectItem key={winType.value} value={winType.value}>
                            {winType.label} ({winType.points} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Team Points</Label>
                    <div className="flex items-center justify-center h-10 bg-muted rounded-md">
                      <span className="font-bold" data-testid={`team-points-${index}`}>
                        {matches[index]?.teamPoints || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Match Score */}
                {matches[index]?.winType && !['forfeit', 'disqualification'].includes(matches[index]?.winType!) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{homeTeamName} Score</Label>
                      <Input
                        type="number"
                        min="0"
                        {...form.register(`matches.${index}.homeScore`, { valueAsNumber: true })}
                        data-testid={`input-home-score-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{awayTeamName} Score</Label>
                      <Input
                        type="number"
                        min="0"
                        {...form.register(`matches.${index}.awayScore`, { valueAsNumber: true })}
                        data-testid={`input-away-score-${index}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </form>
  );
});

WrestlingForm.displayName = 'WrestlingForm';

export default WrestlingForm;