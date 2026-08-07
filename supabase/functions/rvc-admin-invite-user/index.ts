import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") || "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ error: "Function configuration is incomplete." }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  const caller = callerData.user;
  if (callerError || !caller) return json({ error: "Unauthorized." }, 401);

  const { data: adminMembership } = await adminClient
    .from("memberships")
    .select("id")
    .eq("user_id", caller.id)
    .eq("role", "conference_admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!adminMembership) return json({ error: "Conference administrator access is required." }, 403);

  let payload: { email?: unknown; fullName?: unknown; schoolId?: unknown; role?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const schoolId = typeof payload.schoolId === "string" ? payload.schoolId.trim() : "";
  const role = typeof payload.role === "string" ? payload.role.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2 || fullName.length > 120) {
    return json({ error: "Enter a valid name and email address." }, 400);
  }
  if (!schoolId || !["school_principal", "athletic_director"].includes(role)) {
    return json({ error: "Select a school and an approved school role." }, 400);
  }

  const { data: school } = await adminClient
    .from("schools")
    .select("id,name")
    .eq("id", schoolId)
    .eq("is_active", true)
    .maybeSingle();
  if (!school) return json({ error: "The selected school is not active." }, 400);

  const { data: listed, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return json({ error: "Could not check existing RVC accounts." }, 500);

  let targetUser = listed.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  let invitationSent = false;

  if (!targetUser) {
    const { data: invitation, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: "https://rvc-il.com/reset-password",
    });
    if (inviteError || !invitation.user) {
      console.error("RVC invitation failed", inviteError);
      return json({ error: inviteError?.message || "Could not send the RVC account invitation." }, 500);
    }
    targetUser = invitation.user;
    invitationSent = true;
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({ id: targetUser.id, full_name: fullName, is_active: true }, { onConflict: "id" });
  if (profileError) return json({ error: "Account was found, but its profile could not be updated." }, 500);

  const { data: existingMembership, error: membershipLookupError } = await adminClient
    .from("memberships")
    .select("id")
    .eq("user_id", targetUser.id)
    .eq("school_id", schoolId)
    .eq("role", role)
    .limit(1)
    .maybeSingle();
  if (membershipLookupError) return json({ error: "Could not check the user's conference role." }, 500);

  if (existingMembership) {
    const { error: updateError } = await adminClient
      .from("memberships")
      .update({ status: "active", invited_by: caller.id })
      .eq("id", existingMembership.id);
    if (updateError) return json({ error: "Could not reactivate the conference role." }, 500);
  } else {
    const { error: insertError } = await adminClient.from("memberships").insert({
      user_id: targetUser.id,
      school_id: schoolId,
      role,
      status: "active",
      invited_by: caller.id,
    });
    if (insertError) return json({ error: "Could not assign the conference role." }, 500);
  }

  return json({
    ok: true,
    userId: targetUser.id,
    email,
    fullName,
    schoolId,
    schoolName: school.name,
    role,
    invitationSent,
  });
});
