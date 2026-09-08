import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Cable,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Seo from "@/components/Seo";
import { memberSelect } from "@/lib/rvcData";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import { coverageLabel, summarizeOfficiatingCoverage } from "@/lib/integrations";

interface ProviderRow {
  provider_key: string;
  display_name: string;
  category: string;
  direction: string;
  description: string | null;
  capabilities: Record<string, unknown>;
  documentation_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface ConnectionRow {
  id: string;
  provider_key: string;
  name: string;
  school_id: string | null;
  scope_kind: string;
  external_organization_id: string | null;
  external_group_id: string | null;
  connection_status: string;
  last_successful_sync_at: string | null;
  last_error_at: string | null;
  last_error: string | null;
}

interface GameLinkRow {
  id: string;
  provider_connection_id: string;
  game_id: string;
  match_status: string;
}

interface AssignmentRow {
  id: string;
  provider_connection_id: string;
  game_id: string;
  normalized_status: string;
  is_deleted: boolean;
}

interface ConflictRow {
  id: string;
  provider_connection_id: string;
  game_id: string | null;
  conflict_type: string;
  field_name: string | null;
  detected_at: string;
}

interface SyncRunRow {
  id: string;
  provider_connection_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_count: number;
  created_at: string;
}

interface IntegrationPageData {
  user: Awaited<ReturnType<typeof getRvcUserContext>>;
  providers: ProviderRow[];
  connections: ConnectionRow[];
  gameLinks: GameLinkRow[];
  assignments: AssignmentRow[];
  conflicts: ConflictRow[];
  syncRuns: SyncRunRow[];
}

function capabilityLabel(value: string) {
  return value
    .replace(/_future$/, " (future)")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

function statusBadge(status: string) {
  const label = status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
  if (status === "connected") return <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">{label}</Badge>;
  if (status === "degraded") return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">{label}</Badge>;
  if (status === "revoked" || status === "disabled") return <Badge variant="secondary">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}

export default function IntegrationCenter() {
  const { data, isLoading, error } = useQuery<IntegrationPageData>({
    queryKey: ["rvc-integration-center"],
    queryFn: async () => {
      const user = await getRvcUserContext();
      if (!user) throw new Error("Please sign in to manage conference integrations.");
      if (!user.isSuperAdmin) {
        return { user, providers: [], connections: [], gameLinks: [], assignments: [], conflicts: [], syncRuns: [] };
      }

      const [providers, connections, gameLinks, assignments, conflicts, syncRuns] = await Promise.all([
        memberSelect<ProviderRow[]>(
          "integration_providers?select=provider_key,display_name,category,direction,description,capabilities,documentation_url,is_active,display_order&is_active=eq.true&order=display_order.asc",
        ),
        memberSelect<ConnectionRow[]>(
          "provider_connections?select=id,provider_key,name,school_id,scope_kind,external_organization_id,external_group_id,connection_status,last_successful_sync_at,last_error_at,last_error&order=created_at.asc",
        ),
        memberSelect<GameLinkRow[]>(
          "provider_game_links?select=id,provider_connection_id,game_id,match_status",
        ),
        memberSelect<AssignmentRow[]>(
          "official_assignments?select=id,provider_connection_id,game_id,normalized_status,is_deleted",
        ),
        memberSelect<ConflictRow[]>(
          "integration_conflicts?select=id,provider_connection_id,game_id,conflict_type,field_name,detected_at&status=eq.open&order=detected_at.desc&limit=20",
        ),
        memberSelect<SyncRunRow[]>(
          "sync_runs?select=id,provider_connection_id,status,started_at,completed_at,error_count,created_at&provider_connection_id=not.is.null&order=created_at.desc&limit=50",
        ),
      ]);

      return { user, providers, connections, gameLinks, assignments, conflicts, syncRuns };
    },
  });

  const mockCoverage = useMemo(
    () => summarizeOfficiatingCoverage([
      { normalized_status: "accepted" },
      { normalized_status: "accepted" },
      { normalized_status: "assigned" },
    ], 3),
    [],
  );

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 px-6 py-16 text-center text-slate-600">Loading integration foundation…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Integration Center could not load</h1>
          <p className="mt-2 text-slate-600">{error instanceof Error ? error.message : "Conference integration data is unavailable."}</p>
          <Link href="/conference-admin/tools"><Button className="mt-6">Back to conference tools</Button></Link>
        </div>
      </div>
    );
  }

  if (!data?.user?.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-8 w-8 text-conference-navy" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Conference administrator access required</h1>
          <p className="mt-2 text-slate-600">Provider credentials, mappings, sync health, and conflict resolution are managed at the conference level.</p>
          <Link href="/admin"><Button className="mt-6">Return to dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const { providers, connections, gameLinks, assignments, conflicts, syncRuns } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title="RVC Integration Center"
        description="Secure River Valley Conference provider connections, mappings, synchronization health, and sports-data integration status."
        type="website"
      />

      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/conference-admin/tools" className="inline-flex items-center text-sm font-semibold text-conference-gold hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Conference tools
          </Link>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-conference-gold">
                <Cable className="h-4 w-4" /> Sports data integration
              </div>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Integration Center</h1>
              <p className="mt-3 max-w-3xl text-slate-200">
                RVC remains the source of truth for conference games and results. External systems attach through explicit mappings, normalized statuses, and auditable sync records.
              </p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-100">
              Phase 1 foundation · no production provider credentials required
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4" /> Source-of-truth rule</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">
              Provider data never silently overwrites an RVC game. Conflicting schedule fields become review items.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Credential boundary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">
              Connection records store only non-secret metadata. API credentials belong server-side in Supabase secrets/Vault.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><RefreshCcw className="h-4 w-4" /> Shared sync ledger</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">
              Provider syncs reuse the existing RVC sync-run ledger so integrations do not create a second operational history.
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Providers</h2>
              <p className="mt-1 text-sm text-slate-600">The catalog is provider-neutral; each live account or assigning group becomes a separate connection.</p>
            </div>
            <Badge variant="outline">{providers.length} providers</Badge>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {providers.map((provider) => {
              const providerConnections = connections.filter((connection) => connection.provider_key === provider.provider_key);
              const connectionIds = new Set(providerConnections.map((connection) => connection.id));
              const providerLinks = gameLinks.filter((link) => connectionIds.has(link.provider_connection_id));
              const providerAssignments = assignments.filter((assignment) => connectionIds.has(assignment.provider_connection_id) && !assignment.is_deleted);
              const providerConflicts = conflicts.filter((conflict) => connectionIds.has(conflict.provider_connection_id));
              const latestSync = syncRuns.find((run) => run.provider_connection_id && connectionIds.has(run.provider_connection_id));
              const capabilities = Object.entries(provider.capabilities ?? {})
                .filter(([, enabled]) => enabled === true)
                .map(([key]) => capabilityLabel(key));

              return (
                <Card key={provider.provider_key} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle>{provider.display_name}</CardTitle>
                        <CardDescription className="mt-1 capitalize">{provider.category.replaceAll("_", " ")} · {provider.direction}</CardDescription>
                      </div>
                      {providerConnections.length === 0 ? <Badge variant="outline">Not connected</Badge> : statusBadge(providerConnections[0].connection_status)}
                    </div>
                    {provider.description && <p className="pt-2 text-sm leading-6 text-slate-600">{provider.description}</p>}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {capabilities.map((capability) => <Badge key={capability} variant="secondary">{capability}</Badge>)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-2xl font-bold text-slate-950">{providerConnections.length}</div>
                        <div className="text-xs text-slate-500">Connections</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-2xl font-bold text-slate-950">{providerLinks.filter((link) => link.match_status === "matched").length}</div>
                        <div className="text-xs text-slate-500">Linked games</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-2xl font-bold text-slate-950">{providerAssignments.length}</div>
                        <div className="text-xs text-slate-500">Assignments</div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <div className="text-2xl font-bold text-slate-950">{providerConflicts.length}</div>
                        <div className="text-xs text-slate-500">Open conflicts</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Last sync: {formatDate(latestSync?.completed_at ?? latestSync?.started_at ?? null)}</span>
                      {latestSync && latestSync.error_count > 0 && <span className="font-medium text-amber-700">{latestSync.error_count} sync errors</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Open integration conflicts</CardTitle>
              <CardDescription>Schedule or identity differences are surfaced for review instead of silently changing RVC data.</CardDescription>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> No unresolved provider conflicts.
                </div>
              ) : (
                <div className="space-y-3">
                  {conflicts.slice(0, 10).map((conflict) => {
                    const connection = connections.find((item) => item.id === conflict.provider_connection_id);
                    const provider = providers.find((item) => item.provider_key === connection?.provider_key);
                    return (
                      <div key={conflict.id} className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold text-slate-950">{provider?.display_name ?? "Provider"}: {conflict.conflict_type.replaceAll("_", " ")}</div>
                          <div className="mt-1 text-sm text-slate-600">{conflict.field_name ? `Field: ${conflict.field_name} · ` : ""}{formatDate(conflict.detected_at)}</div>
                        </div>
                        <Badge className="w-fit bg-amber-100 text-amber-900 hover:bg-amber-100">Review</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Normalization contract preview</CardTitle>
              <CardDescription>This is a Phase 1 fixture, not live provider data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-slate-950 p-5 text-white">
                <div className="text-sm text-slate-300">Mock 3-person crew</div>
                <div className="mt-2 text-xl font-bold">{coverageLabel(mockCoverage.status)}</div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/10 p-3"><div className="text-xl font-bold">{mockCoverage.assignedCount}</div><div className="text-xs text-slate-300">Assigned</div></div>
                  <div className="rounded-lg bg-white/10 p-3"><div className="text-xl font-bold">{mockCoverage.acceptedCount}</div><div className="text-xs text-slate-300">Accepted</div></div>
                  <div className="rounded-lg bg-white/10 p-3"><div className="text-xl font-bold">{mockCoverage.declinedCount}</div><div className="text-xs text-slate-300">Declined</div></div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-300">Provider-specific statuses are reduced to RVC's small vocabulary before the dashboard uses them.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
