import { loadCatalog } from "./source.mjs";
import { origin, eventPath, cityPath, escape as e, listing } from "./model.mjs";
import { renderListing, renderDetail, unavailable } from "./render.mjs";
export async function handleEvents(
  request,
  { loader = loadCatalog, cache, now = new Date() } = {},
) {
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  const url = new URL(request.url);
  // Never expose the private cache key as an endpoint or accept arbitrary deep paths.
  if (!/^\/events(?:\/|$)/.test(url.pathname) || url.pathname.length > 400)
    return new Response("Not found", { status: 404 });
  const xml = url.pathname === "/events/sitemap.xml";
  if (!xml && !url.pathname.endsWith("/")) {
    url.pathname += "/";
    return Response.redirect(url.href, 308);
  }
  const recognized =
    url.pathname === "/events/" ||
    /^\/events\/event\/[^/]+\/$/.test(url.pathname) ||
    /^\/events\/[a-z]{2}\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(url.pathname) ||
    xml;
  if (!recognized) {
    const result = unavailable(url.pathname, 404);
    return new Response(request.method === "HEAD" ? null : result.html, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  try {
    const catalog = await loader({ cache, origin: url.origin, now });
    if (xml) {
      const active = catalog.events.filter((event) =>
        ["ongoing", "upcoming"].includes(event.status),
      );
      const paths = [
        ...new Set([
          "/events/",
          ...active.flatMap((event) => [cityPath(event), eventPath(event)]),
        ]),
      ];
      return new Response(
        request.method === "HEAD"
          ? null
          : `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${e(origin + path)}</loc></url>`).join("")}</urlset>`,
        {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }
    let result;
    if (url.pathname.startsWith("/events/event/")) {
      let id;
      try {
        id = decodeURIComponent(url.pathname.split("/")[3]);
      } catch {
        id = null;
      }
      const event = catalog.events.find((item) => item.id === id);
      result = event
        ? renderDetail(catalog, event, url)
        : unavailable(url.pathname, 404);
    } else result = renderListing(catalog, url, now);
    return new Response(request.method === "HEAD" ? null : result.html, {
      status: result.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch {
    if (xml)
      return new Response(null, {
        status: 503,
        headers: { "Retry-After": "60", "Cache-Control": "no-store" },
      });
    const result = unavailable(url.pathname);
    return new Response(request.method === "HEAD" ? null : result.html, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
      },
    });
  }
}
