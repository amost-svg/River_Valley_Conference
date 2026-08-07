interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_EMAIL_API_TOKEN: string;
  CONTACT_FROM_EMAIL: string;
  CONTACT_RECIPIENT: string;
  TURNSTILE_SECRET: string;
}

type ContactSubject = "schedules" | "membership" | "rules" | "general" | "other";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  school?: unknown;
  subject?: unknown;
  message?: unknown;
  turnstileToken?: unknown;
}

interface TurnstileVerification {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

interface CloudflareEmailResponse {
  success: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  result?: {
    delivered?: string[];
    queued?: string[];
    permanent_bounces?: string[];
  } | null;
}

const SUBJECT_LABELS: Record<ContactSubject, string> = {
  schedules: "Schedules & Results",
  membership: "Membership Inquiry",
  rules: "Rules & Regulations",
  general: "General Question",
  other: "Other",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const isStringWithin = (value: unknown, min: number, max: number) =>
  typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

const isEmail = (value: unknown) =>
  typeof value === "string" &&
  value.trim().length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host) {
        return jsonResponse({ error: "Request origin is not allowed." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Request origin is not allowed." }, 403);
    }
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 16_000) {
    return jsonResponse({ error: "Message is too large." }, 413);
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  const { name, email, school, subject, message, turnstileToken } = payload;

  if (
    !isStringWithin(name, 2, 120) ||
    !isEmail(email) ||
    !isStringWithin(message, 10, 4_000) ||
    typeof subject !== "string" ||
    !(subject in SUBJECT_LABELS) ||
    (school !== undefined && school !== null && !isStringWithin(school, 0, 160)) ||
    typeof turnstileToken !== "string" ||
    turnstileToken.length < 1 ||
    turnstileToken.length > 2_048
  ) {
    return jsonResponse({ error: "Please check the form and try again." }, 400);
  }

  if (
    !env.CLOUDFLARE_ACCOUNT_ID ||
    !env.CLOUDFLARE_EMAIL_API_TOKEN ||
    !env.CONTACT_FROM_EMAIL ||
    !env.CONTACT_RECIPIENT ||
    !env.TURNSTILE_SECRET
  ) {
    console.error("Contact form environment is incomplete.");
    return jsonResponse({ error: "The contact form is temporarily unavailable." }, 503);
  }

  let verification: TurnstileVerification;
  try {
    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET,
          response: turnstileToken,
          remoteip: request.headers.get("CF-Connecting-IP") || undefined,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!verificationResponse.ok) {
      throw new Error(`Siteverify returned ${verificationResponse.status}`);
    }

    verification = (await verificationResponse.json()) as TurnstileVerification;
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    return jsonResponse({ error: "Verification failed. Please try again." }, 503);
  }

  if (
    !verification.success ||
    verification.action !== "rvc-contact" ||
    verification.hostname !== requestUrl.hostname
  ) {
    console.warn("Turnstile rejected a contact submission.", {
      hostname: verification.hostname,
      action: verification.action,
      errorCodes: verification["error-codes"],
    });
    return jsonResponse({ error: "Verification failed. Please try again." }, 403);
  }

  const cleanName = (name as string).trim();
  const cleanEmail = (email as string).trim().toLowerCase();
  const cleanSchool = typeof school === "string" ? school.trim() : "";
  const cleanSubject = subject as ContactSubject;
  const cleanMessage = (message as string).trim();
  const subjectLabel = SUBJECT_LABELS[cleanSubject];

  const plainText = [
    "New message from the River Valley Conference website",
    "",
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `School/Organization: ${cleanSchool || "Not provided"}`,
    `Subject: ${subjectLabel}`,
    "",
    "Message:",
    cleanMessage,
  ].join("\n");

  const html = `
    <h2>New message from the River Valley Conference website</h2>
    <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
    <p><strong>School/Organization:</strong> ${escapeHtml(cleanSchool || "Not provided")}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subjectLabel)}</p>
    <hr />
    <p style="white-space: pre-wrap">${escapeHtml(cleanMessage)}</p>
  `;

  let emailResponse: Response;
  try {
    emailResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/email/sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: {
            address: env.CONTACT_FROM_EMAIL,
            name: "River Valley Conference Website",
          },
          to: env.CONTACT_RECIPIENT,
          reply_to: {
            address: cleanEmail,
            name: cleanName,
          },
          subject: `[RVC Website] ${subjectLabel}`,
          text: plainText,
          html,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch (error) {
    console.error("Cloudflare Email Service request failed.", error);
    return jsonResponse({ error: "We could not send your message. Please try again." }, 502);
  }

  let emailResult: CloudflareEmailResponse | null = null;
  try {
    emailResult = (await emailResponse.json()) as CloudflareEmailResponse;
  } catch {
    // The HTTP status still gives us a reliable failure signal if the body is not JSON.
  }

  if (!emailResponse.ok || !emailResult?.success) {
    console.error("Cloudflare Email Service rejected a contact message.", {
      status: emailResponse.status,
      errors: emailResult?.errors,
    });
    return jsonResponse({ error: "We could not send your message. Please try again." }, 502);
  }

  return jsonResponse({ success: true });
};
