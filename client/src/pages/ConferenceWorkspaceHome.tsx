import { Link } from "wouter";
import { CalendarClock, Database, Gamepad2, ShieldCheck, Trophy } from "lucide-react";
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
  {
    href: "/conference-admin/tournaments",
    icon: Trophy,
    title: "Tournament Brackets",
    description: "Seed tournaments from official standings, generate bracket rounds, review BYEs, and publish the approved bracket.",
  },
] as const;

export default function ConferenceWorkspaceHome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="RVC Conference Management"
        description="Secure River Valley Conference management workspace for schedules, results, standings, tournaments, honors, and resources."
        type="website"
      />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-conference-gold">
            <ShieldCheck className="h-4 w-4" /> Secure conference workspace
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Manage the RVC Source of Truth</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            Choose the area you need. Every approved change is stored in Supabase under role-based access and recorded in the conference audit trail.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/conference"><Button className="bg-conference-gold text-conference-navy hover:bg-yellow-400"><Gamepad2 className="mr-2 h-4 w-4" /> Open public conference hub</Button></Link>
            <Link href="/"><Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">Return to RVC home</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
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
