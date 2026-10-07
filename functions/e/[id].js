// Preserve the native /e/{id} Universal Link while giving web visitors event details.
export function onRequest({ request, params }) {
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://reignvillage.com/events/event/${encodeURIComponent(params.id)}/`,
      "Cache-Control": "no-store",
    },
  });
}
