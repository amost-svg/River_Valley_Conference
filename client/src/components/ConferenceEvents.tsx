import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { publicSelect } from "@/lib/rvcData";

interface ConferenceEvent {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  all_day: boolean;
  location_text: string | null;
  is_tentative: boolean;
}

function dateParts(value: string) {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short" }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", day: "numeric" }).format(date),
    full: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date),
  };
}

function timeLabel(event: ConferenceEvent) {
  if (event.all_day) return "All day";
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }).format(new Date(event.starts_at));
}

export default function ConferenceEvents() {
  const { data: events, isLoading, error } = useQuery<ConferenceEvent[]>({
    queryKey: ["public-conference-events"],
    queryFn: () => publicSelect<ConferenceEvent[]>(
      "conference_events?visibility=eq.public&status=eq.published&event_type=neq.meeting&select=id,title,event_type,starts_at,all_day,location_text,is_tentative&order=starts_at.asc&limit=8",
    ),
    staleTime: 5 * 60_000,
  });

  const upcoming = events?.filter((event) => new Date(event.starts_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000) ?? [];

  return (
    <section id="events" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-10 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Conference Events & Deadlines</h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">Key RVC tournaments, academic and fine-arts events, recognition dates, and conference-wide deadlines</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">Conference events are temporarily unavailable.</div>
        ) : isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : upcoming.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((event) => {
              const parts = dateParts(event.starts_at);
              return (
                <Card key={event.id} className="overflow-hidden border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex border-b border-slate-100 bg-slate-50">
                      <div className="flex w-20 flex-col items-center justify-center bg-conference-navy px-2 py-4 text-white">
                        <span className="text-xs font-bold tracking-[0.15em] text-conference-gold">{parts.month}</span>
                        <span className="mt-1 text-3xl font-black leading-none">{parts.day}</span>
                      </div>
                      <div className="flex flex-1 items-center px-4">{event.is_tentative && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Tentative</Badge>}</div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold leading-snug text-slate-950">{event.title}</h3>
                      <p className="mt-3 text-sm font-medium text-slate-600">{parts.full}</p>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> {timeLabel(event)}</p>
                        {event.location_text && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 flex-none text-slate-400" /> {event.location_text}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-10 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-slate-400" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No upcoming conference-wide events are posted yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
