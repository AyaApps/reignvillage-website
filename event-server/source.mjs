import catalogModule from "./catalog.cjs";
import { selection } from "./selection.mjs";
const { prepareCatalog } = catalogModule;
export const TTL = 300_000;
export const database =
  "projects/enthusiasts-76ad0/databases/(default)/documents";
const fields = [
  "name",
  "description",
  "city",
  "state",
  "address",
  "venueName",
  "startDate",
  "endDate",
  "timeZone",
  "isVerified",
  "organizerName",
  "sourceUrl",
  "canonicalUrl",
  "websiteUrl",
  "ticketUrl",
  "isFree",
  "cost",
  "currency",
  "verifiedAt",
  "isCancelled",
  "isPostponed",
  "isPrivate",
  "isPrivateEvent",
  "eventType",
];
let inflight;

export function decode(value) {
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  return value.stringValue ?? null;
}
export function decodeBatch(body) {
  if (!Array.isArray(body) || body.length !== selection.length)
    throw new Error("Incomplete event response");
  const wanted = new Set(selection.map((x) => `${database}/events/${x.id}`));
  const seen = new Set(),
    documents = [];
  for (const item of body) {
    const name = item.found?.name || item.missing;
    if (!wanted.has(name) || seen.has(name))
      throw new Error("Unexpected event response");
    seen.add(name);
    if (item.found)
      documents.push({
        id: name.split("/").pop(),
        data: Object.fromEntries(
          Object.entries(item.found.fields || {})
            .filter(([key]) => fields.includes(key))
            .map(([key, value]) => [key, decode(value)]),
        ),
      });
  }
  return documents;
}
export function prepare(documents, now = new Date()) {
  const catalog = prepareCatalog(
    documents,
    selection.map((x) => x.id),
    now,
  );
  const countries = new Map(selection.map((x) => [x.id, x.countryCode]));
  catalog.events = catalog.events.map((event) => ({
    ...event,
    countryCode: countries.get(event.id),
  }));
  return catalog;
}
export async function readPublicEvents(fetcher = fetch) {
  const response = await fetcher(
    `https://firestore.googleapis.com/v1/${database}:batchGet`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: selection.map((x) => `${database}/events/${x.id}`),
        mask: { fieldPaths: fields },
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Event source unavailable");
  const raw = await response.text();
  if (raw.length > 1_000_000) throw new Error("Event response too large");
  return decodeBatch(JSON.parse(raw));
}
// Cache only the public field projection. No stale fallback: cancellation accuracy wins.
// One in-flight fetch per isolate; edge cache shares successful snapshots within a colo.
export async function loadCatalog({
  cache,
  origin,
  now = new Date(),
  fetcher = fetch,
} = {}) {
  const key = new Request(
    `${origin || "https://reignvillage.com"}/events/_cache/catalog-v1`,
  );
  let snapshot;
  if (cache) {
    try {
      const cached = await cache.match(key);
      if (cached) snapshot = await cached.json();
    } catch {
      /* A cache outage must not break origin retrieval. */
    }
  }
  const fresh = (value) =>
    value &&
    Array.isArray(value.documents) &&
    Number.isFinite(value.fetchedAt) &&
    now.getTime() >= value.fetchedAt &&
    now.getTime() - value.fetchedAt < TTL;
  if (!fresh(snapshot)) {
    if (!inflight) {
      inflight = readPublicEvents(fetcher).then((documents) => ({
        documents,
        fetchedAt: now.getTime(),
      }));
      inflight
        .finally(() => {
          inflight = undefined;
        })
        .catch(() => {});
    }
    snapshot = await inflight;
    if (cache) {
      try {
        await cache.put(
          key,
          new Response(JSON.stringify(snapshot), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          }),
        );
      } catch {
        /* Served safely; next request can try the cache again. */
      }
    }
  }
  return {
    ...prepare(snapshot.documents, now),
    fetchedAt: new Date(snapshot.fetchedAt).toISOString(),
  };
}
