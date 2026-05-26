interface Env {
  API_ORIGIN: string;
}

const SAFE_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "authorization",
  "x-requested-with",
  "cache-control",
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const apiOrigin = context.env.API_ORIGIN;

  if (!apiOrigin) {
    return new Response(
      JSON.stringify({ error: "API_ORIGIN environment variable is not configured." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const url = new URL(context.request.url);
  const targetUrl = `${apiOrigin}${url.pathname}${url.search}`;

  const incomingHeaders = context.request.headers;
  const forwardedHeaders = new Headers();

  for (const header of SAFE_HEADERS) {
    const value = incomingHeaders.get(header);
    if (value) {
      forwardedHeaders.set(header, value);
    }
  }

  const cookie = incomingHeaders.get("cookie");
  if (cookie) {
    forwardedHeaders.set("cookie", cookie);
  }

  const hasBody =
    context.request.method !== "GET" && context.request.method !== "HEAD";

  const upstreamResponse = await fetch(targetUrl, {
    method: context.request.method,
    headers: forwardedHeaders,
    body: hasBody ? context.request.body : undefined,
    redirect: "follow",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};
