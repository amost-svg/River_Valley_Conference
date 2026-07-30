import { getSession } from "@/lib/supabaseAuth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

export interface RvcDataError extends Error {
  status?: number;
  details?: unknown;
}

function getConfiguration() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the deployment environment.",
    );
  }

  return { url: supabaseUrl.replace(/\/$/, ""), key: supabaseKey };
}

async function parseError(response: Response): Promise<RvcDataError> {
  let details: unknown;
  let message = `Conference data request failed (${response.status}).`;

  try {
    details = await response.json();
    const payload = details as Record<string, unknown>;
    const candidate = payload.message ?? payload.msg ?? payload.error_description ?? payload.error ?? payload.hint;
    if (typeof candidate === "string" && candidate.trim()) message = candidate;
  } catch {
    // Keep the status-based fallback when the response is not JSON.
  }

  const error = new Error(message) as RvcDataError;
  error.status = response.status;
  error.details = details;
  return error;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean; prefer?: string } = {},
): Promise<T> {
  const config = getConfiguration();
  const session = options.authenticated ? await getSession() : null;
  if (options.authenticated && !session) throw new Error("Please sign in to manage conference information.");

  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${session?.access_token ?? config.key}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.prefer) headers.set("Prefer", options.prefer);

  const response = await fetch(`${config.url}${path}`, { ...init, headers });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function publicSelect<T>(resourceAndQuery: string): Promise<T> {
  return request<T>(`/rest/v1/${resourceAndQuery}`);
}

export function publicInsertRows(table: string, rows: unknown | unknown[]): Promise<void> {
  return request<void>(
    `/rest/v1/${table}`,
    { method: "POST", body: JSON.stringify(rows) },
    { prefer: "return=minimal" },
  );
}

export function memberSelect<T>(resourceAndQuery: string): Promise<T> {
  return request<T>(`/rest/v1/${resourceAndQuery}`, {}, { authenticated: true });
}

export function insertRows<T>(table: string, rows: unknown | unknown[]): Promise<T> {
  return request<T>(
    `/rest/v1/${table}`,
    { method: "POST", body: JSON.stringify(rows) },
    { authenticated: true, prefer: "return=representation" },
  );
}

export function updateRows<T>(table: string, filters: string, values: unknown): Promise<T> {
  return request<T>(
    `/rest/v1/${table}?${filters}`,
    { method: "PATCH", body: JSON.stringify(values) },
    { authenticated: true, prefer: "return=representation" },
  );
}

export function deleteRows(table: string, filters: string): Promise<void> {
  return request<void>(
    `/rest/v1/${table}?${filters}`,
    { method: "DELETE" },
    { authenticated: true, prefer: "return=minimal" },
  );
}

export function rpc<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(
    `/rest/v1/rpc/${functionName}`,
    { method: "POST", body: JSON.stringify(body) },
    { authenticated: true },
  );
}

export async function invokeFunction<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(
    `/functions/v1/${functionName}`,
    { method: "POST", body: JSON.stringify(body) },
    { authenticated: true },
  );
}

export async function uploadFile(
  bucket: string,
  objectPath: string,
  file: File,
  options: { upsert?: boolean } = {},
): Promise<string> {
  const config = getConfiguration();
  const session = await getSession();
  if (!session) throw new Error("Please sign in to upload files.");

  const response = await fetch(
    `${config.url}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": options.upsert === false ? "false" : "true",
      },
      body: file,
    },
  );
  if (!response.ok) throw await parseError(response);
  return objectPath;
}

export async function createSignedStorageUrl(bucket: string, objectPath: string, expiresIn = 3600): Promise<string> {
  const config = getConfiguration();
  const session = await getSession();
  if (!session) throw new Error("Please sign in to open this file.");
  const response = await fetch(
    `${config.url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    },
  );
  if (!response.ok) throw await parseError(response);
  const payload = await response.json() as { signedURL?: string; signedUrl?: string };
  const signedPath = payload.signedURL ?? payload.signedUrl;
  if (!signedPath) throw new Error("Supabase did not return a signed file URL.");
  return signedPath.startsWith("http") ? signedPath : `${config.url}/storage/v1${signedPath}`;
}

export function publicStorageUrl(bucket: string, objectPath: string): string {
  const config = getConfiguration();
  return `${config.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}

export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Please sign in to continue.");
  return session.user.id;
}

export function toPostgrestIn(values: string[]): string {
  return `(${values.map((value) => `\"${value.replaceAll('"', '\\"')}\"`).join(",")})`;
}

export function normalizeLookupValue(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
