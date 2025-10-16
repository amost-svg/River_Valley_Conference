import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPendingGameSubmissionSchema, type Sport, type School } from "@shared/schema";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const formSchema = insertPendingGameSubmissionSchema.extend({
  gameDate: z.string().min(1, "Game date is required"),
  gameTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGameDialog({ open, onOpenChange }: AddGameDialogProps) {
  const { toast } = useToast();
  const [useCustomTeamNames, setUseCustomTeamNames] = useState(false);

  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sportId: undefined,
      level: "varsity",
      isConference: true,
      gameDate: "",
      gameTime: "",
      homeTeamId: undefined,
      awayTeamId: undefined,
      homeTeamName: "",
      awayTeamName: "",
      location: "",
      submitterName: "",
      submitterEmail: "",
      notes: "",
    },
  });

  const submitGameMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/pending-game-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit game");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Submitted!",
        description: "Your game has been submitted for review. It will appear on the schedule once approved.",
      });
      form.reset();
      setUseCustomTeamNames(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // If using custom team names, clear team IDs
    // If using school selection, clear custom names
    const submissionData = {
      ...values,
      homeTeamId: useCustomTeamNames ? null : values.homeTeamId,
      awayTeamId: useCustomTeamNames ? null : values.awayTeamId,
      homeTeamName: useCustomTeamNames ? values.homeTeamName : null,
      awayTeamName: useCustomTeamNames ? values.awayTeamName : null,
    };
    
    submitGameMutation.mutate(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Game</DialogTitle>
          <DialogDescription>
            Submit a game to be added to the schedule. All submissions will be reviewed before publishing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Sport Selection */}
            <FormField
              control={form.control}
              name="sportId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-sport">
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id.toString()}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Level and Conference */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="varsity">Varsity</SelectItem>
                        <SelectItem value="jv">JV</SelectItem>
                        <SelectItem value="freshman">Freshman</SelectItem>
                        <SelectItem value="8th grade">8th Grade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isConference"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Conference Game</FormLabel>
                    <div className="flex items-center space-x-2 h-10">
                      <Switch
                        id="is-conference"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-conference"
                      />
                      <Label htmlFor="is-conference" className="text-sm">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gameDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-game-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Time (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="input-game-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Team Selection Toggle */}
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Switch
                id="custom-teams"
                checked={useCustomTeamNames}
                onCheckedChange={setUseCustomTeamNames}
                data-testid="switch-custom-teams"
              />
              <Label htmlFor="custom-teams">
                Use custom team names (for non-conference teams)
              </Label>
            </div>

            {/* Team Selection - Conference Schools */}
            {!useCustomTeamNames && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="homeTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Team *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-home-team">
                            <SelectValue placeholder="Select home team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="awayTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Away Team *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-away-team">
                            <SelectValue placeholder="Select away team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Custom Team Names */}
            {useCustomTeamNames && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="homeTeamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Team Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Opponent High School"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-home-team-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="awayTeamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Away Team Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Opponent High School"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-away-team-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Home Gym, Away Field"
                      {...field}
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submitter Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="submitterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        data-testid="input-submitter-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submitterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        data-testid="input-submitter-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about this game..."
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitGameMutation.isPending}
                data-testid="button-submit-game"
              >
                {submitGameMutation.isPending ? "Submitting..." : "Submit Game"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
