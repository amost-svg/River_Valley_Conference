import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, MailPlus, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { getRvcUserContext } from "@/lib/supabaseAuth";
import { invokeFunction, memberSelect, rpc } from "@/lib/rvcData";
import { queryClient } from "@/lib/queryClient";

interface UserContext {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  isSuperAdmin: boolean;
}

interface School {
  id: string;
  name: string;
  short_name: string | null;
}

interface SchoolContact {
  id: string;
  school_id: string;
  role: string;
  full_name: string;
  email: string;
}

interface UserDirectoryRow {
  user_id: string;
  email: string;
  full_name: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  membership_id: string | null;
  school_id: string | null;
  role: string | null;
  membership_status: string | null;
}

interface PageData {
  user: UserContext;
  schools: School[];
  contacts: SchoolContact[];
  directory: UserDirectoryRow[];
}

interface InviteResult {
  ok: boolean;
  email: string;
  fullName: string;
  schoolName: string;
  role: string;
  invitationSent: boolean;
}

async function loadData(): Promise<PageData> {
  const user = await getRvcUserContext() as UserContext | null;
  if (!user) throw new Error("Please sign in to manage conference accounts.");
  if (!user.isSuperAdmin) throw new Error("Conference administrator access is required.");

  const [schools, contacts, directory] = await Promise.all([
    memberSelect<School[]>("schools?is_active=eq.true&select=id,name,short_name&order=display_order.asc"),
    memberSelect<SchoolContact[]>("school_contacts?is_active=eq.true&role=in.(school_principal,athletic_director)&select=id,school_id,role,full_name,email&order=school_id.asc,role.asc"),
    rpc<UserDirectoryRow[]>("admin_user_directory", {}),
  ]);

  return { user, schools, contacts, directory };
}

function roleLabel(role: string) {
  return role === "school_principal" ? "Principal" : role === "athletic_director" ? "Athletic Director" : role;
}

export default function AccountManagement() {
  const { toast } = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["rvc-account-management"],
    queryFn: loadData,
    staleTime: 15_000,
  });

  const schoolMap = useMemo(() => new Map(data?.schools.map((school) => [school.id, school]) ?? []), [data?.schools]);
  const directoryKeys = useMemo(
    () => new Set((data?.directory ?? []).filter((row) => row.membership_status === "active").map((row) => `${row.email.toLowerCase()}:${row.school_id}:${row.role}`)),
    [data?.directory],
  );
  const missing = useMemo(
    () => (data?.contacts ?? []).filter((contact) => !directoryKeys.has(`${contact.email.toLowerCase()}:${contact.school_id}:${contact.role}`)),
    [data?.contacts, directoryKeys],
  );

  const invite = async (contact: SchoolContact) => {
    const key = `${contact.email}:${contact.role}`;
    try {
      setBusyKey(key);
      const result = await invokeFunction<InviteResult>("rvc-admin-invite-user", {
        email: contact.email,
        fullName: contact.full_name,
        schoolId: contact.school_id,
        role: contact.role,
      });
      toast({
        title: result.invitationSent ? "RVC invitation sent" : "RVC access updated",
        description: `${contact.full_name} now has ${roleLabel(contact.role)} access for ${result.schoolName}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["rvc-account-management"] });
      await refetch();
    } catch (inviteError) {
      toast({
        title: "Account could not be provisioned",
        description: inviteError instanceof Error ? inviteError.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo title="RVC Account Management" description="Secure conference administrator account management." url="/conference-admin/users" />
      <header className="bg-conference-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-conference-gold">
            <ShieldCheck className="h-4 w-4" /> Conference administrator
          </div>
          <h1 className="mt-3 text-3xl font-bold">RVC Account Management</h1>
          <p className="mt-2 max-w-3xl text-slate-200">Provision Principal and Athletic Director access from the official RVC school contact directory.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/conference-admin/tools"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to conference tools</Button></Link>
          <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">{error instanceof Error ? error.message : "Account management is unavailable."}</div>
        ) : isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600">Loading RVC accounts…</div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <Users className="h-6 w-6 text-conference-navy" />
                <div className="mt-3 text-3xl font-bold text-slate-950">{new Set(data?.directory.map((row) => row.user_id)).size}</div>
                <div className="text-sm text-slate-600">RVC user accounts</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <div className="mt-3 text-3xl font-bold text-slate-950">{(data?.contacts.length ?? 0) - missing.length}</div>
                <div className="text-sm text-slate-600">Current school roles provisioned</div>
              </div>
              <div className={`rounded-xl border p-5 shadow-sm ${missing.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                <MailPlus className={`h-6 w-6 ${missing.length ? "text-amber-700" : "text-emerald-700"}`} />
                <div className="mt-3 text-3xl font-bold text-slate-950">{missing.length}</div>
                <div className="text-sm text-slate-600">Missing invitations / roles</div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-950">Accounts Needing Attention</h2>
                <p className="mt-1 text-sm text-slate-600">These active RVC school contacts do not currently have the matching active role in the platform.</p>
              </div>

              {missing.length ? (
                <div className="divide-y divide-slate-100">
                  {missing.map((contact) => {
                    const school = schoolMap.get(contact.school_id);
                    const key = `${contact.email}:${contact.role}`;
                    return (
                      <div key={key} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-bold text-slate-950">{contact.full_name}</div>
                          <div className="mt-1 text-sm text-slate-600">{roleLabel(contact.role)} · {school?.short_name ?? school?.name ?? "RVC school"}</div>
                          <div className="mt-1 text-sm text-slate-500">{contact.email}</div>
                        </div>
                        <Button onClick={() => void invite(contact)} disabled={busyKey === key}>
                          <UserPlus className="mr-2 h-4 w-4" /> {busyKey === key ? "Provisioning…" : "Invite / Assign Access"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
                  <p className="mt-3 font-semibold text-slate-950">All current Principal and AD contacts have matching RVC access.</p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Current Account Directory</h2>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">School</th><th className="pb-3 pr-4">Role</th><th className="pb-3">Last sign-in</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.directory.map((row) => (
                      <tr key={`${row.user_id}:${row.membership_id ?? row.role}`}>
                        <td className="py-3 pr-4 font-medium text-slate-950">{row.full_name || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{row.email}</td>
                        <td className="py-3 pr-4 text-slate-600">{row.school_id ? schoolMap.get(row.school_id)?.short_name ?? schoolMap.get(row.school_id)?.name ?? "—" : "Conference"}</td>
                        <td className="py-3 pr-4 text-slate-600">{row.role ? roleLabel(row.role) : "No active role"}</td>
                        <td className="py-3 text-slate-600">{row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleDateString() : "Never"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
