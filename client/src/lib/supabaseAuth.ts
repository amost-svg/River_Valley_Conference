const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const SESSION_STORAGE_KEY = "rvc.supabase.session";
const AUTH_CHANGE_EVENT = "rvc-auth-changed";

export type RvcAuthFlow = "invite" | "recovery" | "account";

export interface RvcAuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface RvcAuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: RvcAuthUser;
}

interface AuthPayload {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user?: RvcAuthUser;
}

interface ProfileRow {
  full_name: string | null;
}

interface MembershipRow {
  role: string;
  school_id: string | null;
}

function getConfiguration() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Cloudflare Pages.",
    );
  }

  return {
    url: supabaseUrl.replace(/\/$/, ""),
    key: supabasePublishableKey,
  };
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function readStoredSession(): RvcAuthSession | null {
  try {
    const value = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? (JSON.parse(value) as RvcAuthSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: RvcAuthSession | null) {
  if (session) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  emitAuthChange();
}

async function parseError(response: Response): Promise<Error> {
  try {
    const payload = await response.json();
    const message = payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error;
    return new Error(typeof message === "string" ? message : "Authentication request failed.");
  } catch {
    return new Error(`Authentication request failed (${response.status}).`);
  }
}

async function authRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const config = getConfiguration();
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${config.url}${path}`, { ...init, headers });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function getAuthUser(accessToken: string): Promise<RvcAuthUser> {
  return authRequest<RvcAuthUser>("/auth/v1/user", { method: "GET" }, accessToken);
}

async function persistAuthPayload(payload: AuthPayload): Promise<RvcAuthSession> {
  const user = payload.user ?? (await getAuthUser(payload.access_token));
  const expiresAt = payload.expires_at
    ? payload.expires_at * 1000
    : Date.now() + (payload.expires_in ?? 3600) * 1000;

  const session: RvcAuthSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: expiresAt,
    user,
  };
  storeSession(session);
  return session;
}

async function refreshSession(session: RvcAuthSession): Promise<RvcAuthSession> {
  const payload = await authRequest<AuthPayload>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  return persistAuthPayload(payload);
}

export function getAuthFlowFromUrl(): RvcAuthFlow {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const type = search.get("type") ?? hash.get("type");
  if (type === "invite") return "invite";
  if (type === "recovery") return "recovery";
  return "account";
}

export async function captureAuthSessionFromUrl(): Promise<RvcAuthSession | null> {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorDescription = search.get("error_description") ?? hash.get("error_description");
  if (errorDescription) throw new Error(errorDescription);

  const tokenHash = search.get("token_hash");
  const type = search.get("type");
  if (tokenHash && type) {
    const payload = await authRequest<AuthPayload>("/auth/v1/verify", {
      method: "POST",
      body: JSON.stringify({ token_hash: tokenHash, type }),
    });
    return persistAuthPayload(payload);
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    return persistAuthPayload({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: Number(hash.get("expires_in") ?? "3600"),
    });
  }

  return getSession();
}

export async function getSession(): Promise<RvcAuthSession | null> {
  const session = readStoredSession();
  if (!session) return null;
  if (session.expires_at > Date.now() + 60_000) return session;

  try {
    return await refreshSession(session);
  } catch {
    storeSession(null);
    return null;
  }
}

export async function signInWithPassword(email: string, password: string) {
  const payload = await authRequest<AuthPayload>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return persistAuthPayload(payload);
}

export async function sendPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/reset-password`;
  await authRequest<void>(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function updatePassword(password: string) {
  const session = await getSession();
  if (!session) throw new Error("Your secure account session has expired. Request a new link.");
  await authRequest<RvcAuthUser>(
    "/auth/v1/user",
    { method: "PUT", body: JSON.stringify({ password }) },
    session.access_token,
  );
}

export async function signOut() {
  const session = readStoredSession();
  try {
    if (session) {
      await authRequest<void>("/auth/v1/logout", { method: "POST" }, session.access_token);
    }
  } finally {
    storeSession(null);
  }
}

async function dataRequest<T>(path: string, accessToken: string): Promise<T> {
  const config = getConfiguration();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw await parseError(response);
  return (await response.json()) as T;
}

export async function getRvcUserContext() {
  const session = await getSession();
  if (!session) return null;

  const [profiles, memberships] = await Promise.all([
    dataRequest<ProfileRow[]>(
      `profiles?id=eq.${encodeURIComponent(session.user.id)}&select=full_name&limit=1`,
      session.access_token,
    ),
    dataRequest<MembershipRow[]>(
      `memberships?user_id=eq.${encodeURIComponent(session.user.id)}&status=eq.active&select=role,school_id`,
      session.access_token,
    ),
  ]);

  const roles = memberships.map((membership) => membership.role);
  const primaryMembership = memberships[0];
  const schoolMembership = memberships.find((membership) => membership.school_id);
  const role = roles.includes("conference_admin")
    ? "SuperAdmin"
    : roles.includes("school_principal")
      ? "Principal"
      : roles.includes("athletic_director")
        ? "AD"
        : primaryMembership?.role ?? "Authenticated";

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name:
      profiles[0]?.full_name ??
      (typeof session.user.user_metadata?.full_name === "string"
        ? session.user.user_metadata.full_name
        : session.user.email ?? "RVC user"),
    role,
    schoolId: schoolMembership?.school_id ?? null,
    isSuperAdmin: roles.includes("conference_admin"),
  };
}

export const authChangeEventName = AUTH_CHANGE_EVENT;
