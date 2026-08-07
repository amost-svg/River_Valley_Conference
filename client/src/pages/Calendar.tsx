import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Trophy } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { publicSelect } from "@/lib/rvcData";

interface Season { id: string; name: string }
interface Sport { id: string; slug: string; name: string; gender_label: string | null }
interface School { id: string; name: string; short_name: string | null }
interface Team { id: string; sport_id: string; school_id: string; display_name: string | null }
interface Game {
  id: string;
  sport_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  status: string;
  location_text: string | null;
  notes: string | null;
  external_source: string | null;
}
interface ConferenceEvent {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  all_day: boolean;
  location_text: string | null;
  is_tentative: boolean;
}
interface CalendarData {
  season: Season;
  sports: Sport[];
  schools: School[];
  teams: Team[];
  games: Game[];
  events: ConferenceEvent[];
}

type ItemKind = "game" | "event";
interface CalendarItem {
  id: string;
  kind: ItemKind;
  startsAt: string;
  dateKey: string;
  title: string;
  subtitle: string;
  location: string | null;
  timeLabel: string;
  sportId: string | null;
  schoolIds: string[];
  tentative: boolean;
  status: string | null;
}

const CHICAGO = "America/Chicago";
const VERIFY_MARKER = "Start time requires school verification";

function centralDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function monthPartsFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function dateKeyFromUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function monthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function dayHeading(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function sportLabel(sport: Sport) {
  return sport.gender_label && sport.gender_label !== "Coed" ? `${sport.gender_label} ${sport.name}` : sport.name;
}

function gameTimeLabel(game: Game) {
  if (game.external_source === "Importable RVC Master" && game.notes?.includes(VERIFY_MARKER)) return "Time TBA";
  return new Intl.DateTimeFormat("en-US", { timeZone: CHICAGO, hour: "numeric", minute: "2-digit" }).format(new Date(game.starts_at));
}

function eventTimeLabel(event: ConferenceEvent) {
  if (event.all_day) return "All day";
  return new Intl.DateTimeFormat("en-US", { timeZone: CHICAGO, hour: "numeric", minute: "2-digit" }).format(new Date(event.starts_at));
}

function eventTypeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function loadCalendar(): Promise<CalendarData> {
  const seasons = await publicSelect<Season[]>("seasons?is_active=eq.true&select=id,name&limit=1");
  const season = seasons[0];
  if (!season) throw new Error("No active conference season is configured.");
  const sid = encodeURIComponent(season.id);

  const [sports, schools, teams, games, events] = await Promise.all([
    publicSelect<Sport[]>("sports?is_active=eq.true&select=id,slug,name,gender_label&order=display_order.asc"),
    publicSelect<School[]>("schools?is_active=eq.true&select=id,name,short_name&order=display_order.asc"),
    publicSelect<Team[]>(`teams?season_id=eq.${sid}&is_active=eq.true&select=id,sport_id,school_id,display_name`),
    publicSelect<Game[]>(`games?season_id=eq.${sid}&is_published=eq.true&select=id,sport_id,home_team_id,away_team_id,starts_at,status,location_text,notes,external_source&order=starts_at.asc`),
    publicSelect<ConferenceEvent[]>(`conference_events?season_id=eq.${sid}&visibility=eq.public&status=eq.published&event_type=neq.meeting&select=id,title,event_type,starts_at,all_day,location_text,is_tentative&order=starts_at.asc`),
  ]);

  return { season, sports, schools, teams, games, events };
}

export default function CalendarPage() {
  const todayKey = centralDateKey(new Date());
  const initialMonth = monthPartsFromKey(todayKey);
  const [year, setYear] = useState(initialMonth.year);
  const [monthIndex, setMonthIndex] = useState(initialMonth.monthIndex);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [kindFilter, setKindFilter] = useState<"all" | ItemKind>("all");
  const [sportFilter, setSportFilter] = useState(() => new URLSearchParams(window.location.search).get("sport") || "");
  const [schoolFilter, setSchoolFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-rvc-calendar"],
    queryFn: loadCalendar,
    staleTime: 60_000,
  });

  const sportMap = useMemo(() => new Map(data?.sports.map((sport) => [sport.id, sport]) ?? []), [data?.sports]);
  const teamMap = useMemo(() => new Map(data?.teams.map((team) => [team.id, team]) ?? []), [data?.teams]);

  const items = useMemo<CalendarItem[]>(() => {
    if (!data) return [];

    const gameItems = data.games.map((game) => {
      const home = game.home_team_id ? teamMap.get(game.home_team_id) : undefined;
      const away = game.away_team_id ? teamMap.get(game.away_team_id) : undefined;
      const sport = sportMap.get(game.sport_id);
      return {
        id: `game-${game.id}`,
        kind: "game" as const,
        startsAt: game.starts_at,
        dateKey: centralDateKey(game.starts_at),
        title: `${away?.display_name ?? "TBD"} at ${home?.display_name ?? "TBD"}`,
        subtitle: sport ? sportLabel(sport) : "Conference Game",
        location: game.location_text,
        timeLabel: gameTimeLabel(game),
        sportId: game.sport_id,
        schoolIds: [home?.school_id, away?.school_id].filter((value): value is string => Boolean(value)),
        tentative: false,
        status: game.status,
      };
    });

    const eventItems = data.events.map((event) => ({
      id: `event-${event.id}`,
      kind: "event" as const,
      startsAt: event.starts_at,
      dateKey: centralDateKey(event.starts_at),
      title: event.title,
      subtitle: eventTypeLabel(event.event_type),
      location: event.location_text,
      timeLabel: eventTimeLabel(event),
      sportId: null,
      schoolIds: [],
      tentative: event.is_tentative,
      status: null,
    }));

    return [...gameItems, ...eventItems].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [data, sportMap, teamMap]);

  const filteredItems = useMemo(() => items.filter((item) => {
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    if (sportFilter && item.kind === "game" && item.sportId !== sportFilter) return false;
    if (sportFilter && item.kind === "event") return false;
    if (schoolFilter && item.kind === "game" && !item.schoolIds.includes(schoolFilter)) return false;
    return true;
  }), [items, kindFilter, sportFilter, schoolFilter]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    filteredItems.forEach((item) => map.set(item.dateKey, [...(map.get(item.dateKey) ?? []), item]));
    return map;
  }, [filteredItems]);

  const calendarDays = useMemo(() => {
    const first = new Date(Date.UTC(year, monthIndex, 1));
    const startOffset = first.getUTCDay();
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(Date.UTC(year, monthIndex, index - startOffset + 1));
      return {
        key: dateKeyFromUtcDate(date),
        day: date.getUTCDate(),
        inMonth: date.getUTCMonth() === monthIndex,
        year: date.getUTCFullYear(),
        monthIndex: date.getUTCMonth(),
      };
    });
  }, [year, monthIndex]);

  const selectedItems = itemsByDate.get(selectedDateKey) ?? [];

  const moveMonth = (direction: number) => {
    const next = new Date(Date.UTC(year, monthIndex + direction, 1));
    setYear(next.getUTCFullYear());
    setMonthIndex(next.getUTCMonth());
    setSelectedDateKey(dateKeyFromUtcDate(next));
  };

  const goToday = () => {
    const parts = monthPartsFromKey(todayKey);
    setYear(parts.year);
    setMonthIndex(parts.monthIndex);
    setSelectedDateKey(todayKey);
  };

  const chooseDay = (day: (typeof calendarDays)[number]) => {
    setSelectedDateKey(day.key);
    if (!day.inMonth) {
      setYear(day.year);
      setMonthIndex(day.monthIndex);
    }
  };

  const clearFilters = () => {
    setKindFilter("all");
    setSportFilter("");
    setSchoolFilter("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="RVC Calendar | Games, Events & Deadlines"
        description="Browse River Valley Conference games, tournaments, academic events, fine arts dates, deadlines, and other public conference events by day or month."
        url="/calendar"
        type="website"
      />
      <Navigation />

      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-conference-gold">
            <CalendarDays className="h-4 w-4" /> Conference calendar
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Everything Happening in the RVC</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            See games, conference-wide events, tournaments, fine arts dates, academic competitions, recognition events, and deadlines in one place.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">The RVC calendar is temporarily unavailable.</div>
        ) : isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading the conference calendar…</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="text-sm font-semibold text-slate-700">
                  Show
                  <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as "all" | ItemKind)}>
                    <option value="all">Games & conference events</option>
                    <option value="game">Games only</option>
                    <option value="event">Conference events only</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Sport
                  <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}>
                    <option value="">All sports</option>
                    {data?.sports.map((sport) => <option key={sport.id} value={sport.id}>{sportLabel(sport)}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  School
                  <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
                    <option value="">All schools</option>
                    {data?.schools.map((school) => <option key={school.id} value={school.id}>{school.short_name ?? school.name}</option>)}
                  </select>
                </label>
                <div className="flex items-end"><Button variant="outline" className="w-full" onClick={clearFilters}>Clear filters</Button></div>
              </div>
              {schoolFilter && kindFilter !== "game" && !sportFilter && (
                <p className="mt-3 text-xs text-slate-500">Conference-wide events remain visible because they apply to the full RVC, even when a school is selected.</p>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
                </div>
                <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{monthLabel(year, monthIndex)}</h2>
                <div className="hidden text-xs text-slate-500 sm:block">{filteredItems.length} items in filtered calendar</div>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 py-3">{day}</div>)}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayItems = itemsByDate.get(day.key) ?? [];
                  const selected = day.key === selectedDateKey;
                  const today = day.key === todayKey;
                  return (
                    <button
                      type="button"
                      key={day.key}
                      onClick={() => chooseDay(day)}
                      className={`min-h-[72px] border-b border-r border-slate-200 p-1 text-left transition sm:min-h-[126px] sm:p-2 ${day.inMonth ? "bg-white" : "bg-slate-50 text-slate-400"} ${selected ? "ring-2 ring-inset ring-conference-navy" : "hover:bg-blue-50/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${today ? "bg-conference-navy text-white" : ""}`}>{day.day}</span>
                        {dayItems.length > 0 && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 sm:hidden">{dayItems.length}</span>}
                      </div>
                      <div className="mt-1 hidden space-y-1 sm:block">
                        {dayItems.slice(0, 3).map((item) => (
                          <div key={item.id} className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold ${item.kind === "game" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-900"}`} title={item.title}>
                            {item.timeLabel !== "All day" ? `${item.timeLabel} · ` : ""}{item.title}
                          </div>
                        ))}
                        {dayItems.length > 3 && <div className="px-1 text-[10px] font-semibold text-slate-500">+{dayItems.length - 3} more</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-conference-navy">Selected day</div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">{dayHeading(selectedDateKey)}</h2>
                </div>
                <div className="text-sm text-slate-500">{selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}</div>
              </div>

              {selectedItems.length ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {selectedItems.map((item) => (
                    <article key={item.id} className={`rounded-xl border p-5 ${item.kind === "game" ? "border-blue-200 bg-blue-50/40" : "border-amber-200 bg-amber-50/40"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] ${item.kind === "game" ? "text-blue-800" : "text-amber-900"}`}>
                            {item.kind === "game" ? <Trophy className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
                            {item.subtitle}
                          </div>
                          <h3 className="mt-1 text-lg font-bold text-slate-950">{item.title}</h3>
                        </div>
                        {item.tentative && <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Tentative</span>}
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" /> {item.timeLabel}</p>
                        {item.location && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 flex-none text-slate-400" /> {item.location}</p>}
                        {item.status && <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status: {item.status}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">Nothing is scheduled for this day with the current filters.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
