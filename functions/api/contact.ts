interface Env {
  GOOGLE_SCRIPT_CONTACT_URL: string;
  CONTACT_FORM_SECRET: string;
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

interface RelayResponse {
  ok?: boolean;
  error?: string;
  sender?: string;
}

const EXPECTED_RELAY_SENDER = "website@rvc-il.com";

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
      "X-Content-Type-Options": "nosniff",
    },
  });

const isStringWithin = (value: unknown, min: number, max: number) =>
  typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

const isEmail = (value: unknown) =>
  typeof value === "string" &&
  value.trim().length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const configuredHttpsUrl = (value: string | undefined) => {
  try {
    const url = new URL((value || "").trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

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
    !Object.prototype.hasOwnProperty.call(SUBJECT_LABELS, subject) ||
    (school !== undefined && school !== null && !isStringWithin(school, 0, 160)) ||
    typeof turnstileToken !== "string" ||
    turnstileToken.length < 1 ||
    turnstileToken.length > 2_048
  ) {
    return jsonResponse({ error: "Please check the form and try again." }, 400);
  }

  const relayUrl = configuredHttpsUrl(env.GOOGLE_SCRIPT_CONTACT_URL);
  if (!relayUrl || !env.CONTACT_FORM_SECRET || !env.TURNSTILE_SECRET) {
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

  let relayResponse: Response;
  try {
    relayResponse = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "rvc-contact",
        secret: env.CONTACT_FORM_SECRET,
        name: cleanName,
        email: cleanEmail,
        school: cleanSchool,
        subject: cleanSubject,
        subjectLabel: SUBJECT_LABELS[cleanSubject],
        message: cleanMessage,
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("Google Apps Script relay request failed.", error);
    return jsonResponse({ error: "We could not send your message. Please try again." }, 502);
  }

  let relayResult: RelayResponse | null = null;
  try {
    relayResult = (await relayResponse.json()) as RelayResponse;
  } catch {
    relayResult = null;
  }

  if (
    !relayResponse.ok ||
    relayResult?.ok !== true ||
    relayResult?.sender?.toLowerCase() !== EXPECTED_RELAY_SENDER
  ) {
    console.error("Google Apps Script relay is not on the current RVC sender deployment.", {
      status: relayResponse.status,
      error: relayResult?.error,
      sender: relayResult?.sender,
    });
    return jsonResponse(
      { error: "The RVC email relay needs to be redeployed. Please try again shortly." },
      502,
    );
  }

  return jsonResponse({ success: true });
};
