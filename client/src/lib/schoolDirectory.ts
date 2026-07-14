import { getSession } from "@/lib/supabaseAuth";
import beecherLogo from "@assets/Beecher High School Logo.png";
import centralLogo from "@assets/Clifton Central Logo.png";
import donovanLogo from "@assets/Donovan Logo.png";
import gswLogo from "@assets/Gardener South Wilmington Logo.png";
import graceLogo from "@assets/Grace Christian Academy Logo.png";
import grantParkLogo from "@assets/Grant Park Logo.png";
import illinoisLutheranLogo from "@assets/Illinois Lutheran Logo.png";
import momenceLogo from "@assets/Momence Logo.png";
import stAnneLogo from "@assets/St Anne Logo.png";
import triPointLogo from "@assets/Tri Point Logo.png";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

const bundledSchoolLogos: Record<string, string> = {
  beecher: beecherLogo,
  central: centralLogo,
  donovan: donovanLogo,
  "gardner-south-wilmington": gswLogo,
  "grace-christian-academy": graceLogo,
  "grant-park": grantParkLogo,
  "illinois-lutheran": illinoisLutheranLogo,
  momence: momenceLogo,
  "st-anne": stAnneLogo,
  "tri-point": triPointLogo,
};

const SCHOOL_SELECT = [
  "id",
  "slug",
  "name",
  "short_name",
  "mascot",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "phone",
  "superintendent_name",
  "principal_name",
  "athletic_director_name",
  "website_url",
  "athletics_url",
  "ihsa_url",
  "livestream_url",
  "livestream_platform",
  "mission_statement",
  "logo_path",
  "latitude",
  "longitude",
  "is_active",
  "display_order",
  "updated_at",
].join(",");

export interface SchoolProfile {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  mascot: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  superintendent_name: string | null;
  principal_name: string | null;
  athletic_director_name: string | null;
  website_url: string | null;
  athletics_url: string | null;
  ihsa_url: string | null;
  livestream_url: string | null;
  livestream_platform: string | null;
  mission_statement: string | null;
  logo_path: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  display_order: number;
  updated_at: string;
}

export type SchoolProfileUpdate = Partial<
  Pick<
    SchoolProfile,
    | "name"
    | "short_name"
    | "mascot"
    | "address_line1"
    | "address_line2"
    | "city"
    | "state"
    | "postal_code"
    | "phone"
    | "superintendent_name"
    | "principal_name"
    | "athletic_director_name"
    | "website_url"
    | "athletics_url"
    | "ihsa_url"
    | "livestream_url"
    | "livestream_platform"
    | "mission_statement"
    | "logo_path"
  >
>;

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

async function parseError(response: Response): Promise<Error> {
  try {
    const payload = await response.json();
    const message = payload?.message ?? payload?.error_description ?? payload?.error ?? payload?.hint;
    return new Error(typeof message === "string" ? message : "School directory request failed.");
  } catch {
    return new Error(`School directory request failed (${response.status}).`);
  }
}

async function restRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const config = getConfiguration();
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData) && !(init.body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${config.url}/rest/v1/${path}`, { ...init, headers });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function listPublicSchools(): Promise<SchoolProfile[]> {
  return restRequest<SchoolProfile[]>(
    `schools?select=${SCHOOL_SELECT}&is_active=eq.true&order=display_order.asc,name.asc`,
  );
}

export async function getPublicSchool(identifier: string): Promise<SchoolProfile | null> {
  const field = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    identifier,
  )
    ? "id"
    : "slug";
  const rows = await restRequest<SchoolProfile[]>(
    `schools?select=${SCHOOL_SELECT}&${field}=eq.${encodeURIComponent(identifier)}&is_active=eq.true&limit=1`,
  );
  return rows[0] ?? null;
}

export async function updateSchoolProfile(
  schoolId: string,
  changes: SchoolProfileUpdate,
): Promise<SchoolProfile> {
  const session = await getSession();
  if (!session) throw new Error("Your session has expired. Sign in again before saving.");

  const rows = await restRequest<SchoolProfile[]>(
    `schools?id=eq.${encodeURIComponent(schoolId)}&select=${SCHOOL_SELECT}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(changes),
    },
    session.access_token,
  );

  if (!rows[0]) {
    throw new Error("The school profile was not updated. Confirm that your account is assigned to this school.");
  }
  return rows[0];
}

export function getSchoolLogoUrl(
  logoPath: string | null | undefined,
  schoolSlug?: string | null,
): string | null {
  if (!logoPath) return schoolSlug ? bundledSchoolLogos[schoolSlug] ?? null : null;
  if (/^https?:\/\//i.test(logoPath)) return logoPath;
  const config = getConfiguration();
  const encodedPath = logoPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${config.url}/storage/v1/object/public/school-logos/${encodedPath}`;
}

export async function uploadSchoolLogoFile(school: SchoolProfile, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a PNG, JPG, WEBP, or SVG image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("The school logo must be smaller than 5 MB.");

  const session = await getSession();
  if (!session) throw new Error("Your session has expired. Sign in again before uploading.");

  const config = getConfiguration();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const objectPath = `${school.slug}/logo-${Date.now()}.${extension}`;
  const encodedPath = objectPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const response = await fetch(`${config.url}/storage/v1/object/school-logos/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  });

  if (!response.ok) throw await parseError(response);
  return objectPath;
}

export function formatSchoolAddress(school: SchoolProfile): string {
  return [
    school.address_line1,
    school.address_line2,
    [school.city, school.state, school.postal_code].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}
