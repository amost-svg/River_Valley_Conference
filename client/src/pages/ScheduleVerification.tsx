import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fromZonedTime } from "date-fns-tz";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, MapPin, Save, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import { getCurrentUserId, memberSelect, updateRows } from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface UserContext {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  isSuperAdmin: boolean;
}

interface Season { id: string; name: string }
interface School { id: string; name: string; short_name: string | null }
interface CalendarGame {
  id: string;
  sport_id: string;
  sport_name: string;
  sport_slug: string;
  gender_label: string | null;
  starts_at: string;
  status: string;
  is_published: boolean;
  location_text: string | null;
  venue_name: string | null;
  home_school_id: string | null;
  home_name: string | null;
  away_name: string | null;
  notes: string | null;
}

interface PageData {
  user: UserContext;
  season: Season;
  schools: School[];
  games: CalendarGame[];
}

interface GameDraft {
  time: string;
  location: string;
}

const VERIFY_MARKER = "Start time requires school verification";

function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function sportLabel(game: CalendarGame) {
  return game.gender_label && game.gender_label !== "Coed" ? `${game.gender_label} ${game.sport_name}` : game.sport_name;
}

function cleanVerificationNote(notes: string | null) {
  const cleaned = (notes ?? "")
    .replace(/Start time requires school verification\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
  return cleaned || null;
}

async function loadData(): Promise<PageData> {
  const user = await getRvcUserContext() as UserContext | null;
  if (!user) throw new Error("Please sign in to verify conference schedules.");

  const seasons = await memberSelect<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active RVC season is configured.");

  const [schools, games] = await Promise.all([
    memberSelect<School[]>("schools?is_active=eq.true&select=id,name,short_name&order=display_order.asc"),
    memberSelect<CalendarGame[]>(`game_calendar_view?season_id=eq.${encodeURIComponent(season.id)}&status=eq.scheduled&is_published=eq.true&select=id,sport_id,sport_name,sport_slug,gender_label,starts_at,status,is_published,location_text,venue_name,home_school_id,home_name,away_name,notes&order=starts_at.asc`),
  ]);

  return { user, season, schools, games };
}

export default function ScheduleVerification() {
  const { toast } = useToast();
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, GameDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["rvc-schedule-verification"],
    queryFn: loadData,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!data) return;
    const next = data.user.isSuperAdmin
      ? selectedSchoolId || data.schools[0]?.id || ""
      : data.user.schoolId ?? "";
    if (next !== selectedSchoolId) setSelectedSchoolId(next);
  }, [data, selectedSchoolId]);

  const school = data?.schools.find((item) => item.id === selectedSchoolId);
  const pendingGames = useMemo(
    () => (data?.games ?? []).filter((game) => game.home_school_id === selectedSchoolId && game.notes?.includes(VERIFY_MARKER)),
    [data?.games, selectedSchoolId],
  );

  const countsBySport = useMemo(() => {
    const counts = new Map<string, number>();
    pendingGames.forEach((game) => counts.set(sportLabel(game), (counts.get(sportLabel(game)) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [pendingGames]);

  useEffect(() => {
    if (!pendingGames.length) return;
    setDrafts((current) => {
      const next = { ...current };
      pendingGames.forEach((game) => {
        if (!next[game.id]) {
          next[game.id] = {
            time: "",
            location: game.venue_name ?? game.location_text ?? "",
          };
        }
      });
      return next;
    });
  }, [pendingGames]);

  const updateDraft = (gameId: string, values: Partial<GameDraft>) => {
    setDrafts((current) => ({
      ...current,
      [gameId]: { time: "", location: "", ...current[gameId], ...values },
    }));
  };

  const saveGame = async (game: CalendarGame) => {
    const draft = drafts[game.id];
    if (!draft?.time) {
      toast({ title: "Choose the verified start time", variant: "destructive" });
      return;
    }

    try {
      setSavingId(game.id);
      const userId = await getCurrentUserId();
      const localDate = dateKey(game.starts_at);
      const verifiedStart = fromZonedTime(`${localDate}T${draft.time}:00`, "America/Chicago").toISOString();

      await updateRows("games", `id=eq.${encodeURIComponent(game.id)}`, {
        starts_at: verifiedStart,
        location_text: draft.location.trim() || game.location_text,
        notes: cleanVerificationNote(game.notes),
        updated_by: userId,
      });

      toast({
        title: "Game time verified",
        description: `${game.away_name ?? "Away"} at ${game.home_name ?? "Home"} will now show ${draft.time} instead of Time TBA.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["rvc-schedule-verification"] });
      await queryClient.invalidateQueries({ queryKey: ["public-home-schedule"] });
      await refetch();
    } catch (saveError) {
      toast({
        title: "Game could not be updated",
        description: saveError instanceof Error ? saveError.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="RVC Schedule Verification" description="Secure RVC workflow for verifying imported home-game start times and locations." url="/conference-admin/verify-schedule" />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-conference-gold">
            <ShieldCheck className="h-4 w-4" /> Secure schedule workflow
          </div>
          <h1 className="mt-3 text-3xl font-bold">Verify Home Game Times</h1>
          <p className="mt-2 max-w-3xl text-slate-200">Imported RVC schedule dates are public, but start times remain Time TBA until the home school verifies them here.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/conference-admin/tools"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to conference tools</Button></Link>
          {data?.user.isSuperAdmin && (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              School
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-2" value={selectedSchoolId} onChange={(event) => setSelectedSchoolId(event.target.value)}>
                {data.schools.map((item) => <option key={item.id} value={item.id}>{item.short_name ?? item.name}</option>)}
              </select>
            </label>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">{error instanceof Error ? error.message : "Schedule verification is unavailable."}</div>
        ) : isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600">Loading schedule verification…</div>
        ) : !selectedSchoolId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">Your RVC account is not assigned to a school.</div>
        ) : (
          <div className="space-y-7">
            <section className="grid gap-4 md:grid-cols-[1.2fr_2fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Clock3 className="h-7 w-7 text-conference-navy" />
                <div className="mt-3 text-4xl font-black text-slate-950">{pendingGames.length}</div>
                <p className="text-sm text-slate-600">{school?.short_name ?? school?.name} home games still showing Time TBA</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-950">Remaining by sport</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {countsBySport.length ? countsBySport.map(([sport, count]) => (
                    <span key={sport} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{sport}: {count}</span>
                  )) : <span className="text-sm text-emerald-700">No unverified home times remain.</span>}
                </div>
              </div>
            </section>

            {pendingGames.length ? (
              <section className="space-y-4">
                {pendingGames.map((game) => {
                  const draft = drafts[game.id] ?? { time: "", location: game.venue_name ?? game.location_text ?? "" };
                  return (
                    <div key={game.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold uppercase tracking-[0.13em] text-conference-navy">{sportLabel(game)}</div>
                          <h2 className="mt-1 text-xl font-bold text-slate-950">{game.away_name ?? "Away"} at {game.home_name ?? "Home"}</h2>
                          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarClock className="h-4 w-4" /> {dateLabel(game.starts_at)}</p>
                        </div>

                        <div className="grid flex-1 gap-3 sm:grid-cols-[150px_1fr_auto]">
                          <label className="text-sm font-semibold text-slate-700">
                            Verified start time
                            <input type="time" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={draft.time} onChange={(event) => updateDraft(game.id, { time: event.target.value })} />
                          </label>
                          <label className="text-sm font-semibold text-slate-700">
                            Location
                            <div className="relative mt-1">
                              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3" value={draft.location} onChange={(event) => updateDraft(game.id, { location: event.target.value })} />
                            </div>
                          </label>
                          <Button className="sm:mb-0" disabled={savingId === game.id || !draft.time} onClick={() => void saveGame(game)}>
                            <Save className="mr-2 h-4 w-4" /> {savingId === game.id ? "Saving…" : "Verify"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            ) : (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-10 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
                <h2 className="mt-3 text-xl font-bold text-emerald-950">Home game times are verified</h2>
                <p className="mt-2 text-sm text-emerald-800">This school has no remaining published home games marked Time TBA.</p>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
