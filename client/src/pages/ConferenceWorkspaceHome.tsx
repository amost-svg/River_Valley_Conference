import { Link } from "wouter";
import { CalendarClock, Database, Home, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";

const workspaces = [
  {
    href: "/conference-admin/core",
    icon: Database,
    title: "Conference Data",
    description: "Import and validate schedules, submit and confirm scores, resolve standings ties, manage honors, events, documents, co-ops, and data-quality issues.",
  },
  {
    href: "/conference-admin/games",
    icon: CalendarClock,
    title: "Game Operations",
    description: "Reschedule, postpone, cancel, or record a conference-authorized forfeit with the required explanation and audit trail.",
  },
] as const;

export default function ConferenceWorkspaceHome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="RVC Conference Management"
        description="Secure River Valley Conference management workspace for schedules, results, standings, honors, and resources."
        type="website"
      />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-conference-gold">
            <ShieldCheck className="h-4 w-4" /> Secure conference workspace
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Manage the RVC Source of Truth</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            Approved schedules, results, standings, news, and conference records entered here feed the public website.
          </p>
          <div className="mt-6">
            <Link href="/"><Button className="bg-conference-gold text-conference-navy hover:bg-yellow-400"><Home className="mr-2 h-4 w-4" /> Open public homepage</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {workspaces.map(({ href, icon: Icon, title, description }) => (
            <div key={href} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-conference-navy text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
              <Link href={href}><Button className="mt-6 w-full">Open {title}</Button></Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
