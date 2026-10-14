import { approvedFlyer, decodeFlyer, selectEventArtwork } from "./media.mjs";
import catalogModule from "./catalog.cjs";
import { selection } from "./selection.mjs";
const { prepareCatalog } = catalogModule;
export const TTL = 300_000;
export const database =
  "projects/enthusiasts-76ad0/databases/(default)/documents";
const fields = [
  "organizerFlyer",
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
  "countryCode",
  "websiteApproved",
];
const inflight = new Map();

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
            .map(([key, value]) => [key, key === "organizerFlyer" ? decodeFlyer(value) : decode(value)]),
        ),
      });
  }
  return documents;
}
export function prepare(documents, now = new Date()) {
  const catalog = prepareCatalog(
    documents,
    [...new Set([...selection.map((x) => x.id), ...documents.filter(x => x.data.websiteApproved === true && /^[A-Z]{2}$/.test(x.data.countryCode)).map(x => x.id)])],
    now,
  );
  const countries = new Map([...selection.map((x) => [x.id, x.countryCode]), ...documents.filter(x => x.data.websiteApproved === true && /^[A-Z]{2}$/.test(x.data.countryCode)).map(x => [x.id, x.data.countryCode])]);
  const originals = new Map(documents.map(doc => [doc.id, doc.data]));
  catalog.events = catalog.events.map((event) => ({
    ...event,
    countryCode: countries.get(event.id),
    flyer: approvedFlyer(originals.get(event.id)?.organizerFlyer, event, now),
  }));
  return catalog;
}
export async function readPublicEvents(fetcher = fetch, includeCommunity = false) {
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
  const selected = decodeBatch(JSON.parse(raw));
  if (!includeCommunity) return selected;
  const approved = await fetcher(`https://firestore.googleapis.com/v1/${database}:runQuery`, {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({structuredQuery:{from:[{collectionId:"events"}],
      select:{fields:fields.map(fieldPath=>({fieldPath}))},
      where:{fieldFilter:{field:{fieldPath:"websiteApproved"},op:"EQUAL",value:{booleanValue:true}}},limit:201}}),
    signal: AbortSignal.timeout(10000),
  });
  if (!approved.ok) throw new Error("Approved event feed unavailable");
  const body = await approved.text();
  if (body.length > 1000000) throw new Error("Approved event feed too large");
  const rows = JSON.parse(body);
  if (!Array.isArray(rows) || rows.filter(x=>x.document).length > 200) throw new Error("Approved event feed requires pagination");
  const combined = new Map(selected.map(x=>[x.id,x]));
  for (const row of rows) {
    if (row.error) throw new Error("Incomplete approved event feed");
    if (!row.document) continue;
    if (!row.document.name.startsWith(`${database}/events/`)) throw new Error("Unexpected event document");
    const id=row.document.name.split("/").pop();
    const data=Object.fromEntries(Object.entries(row.document.fields || {}).filter(([key])=>fields.includes(key)).map(([key,value])=>[key,key === "organizerFlyer" ? decodeFlyer(value) : decode(value)]));
    if(data.websiteApproved !== true || !/^[A-Z]{2}$/.test(data.countryCode)) throw new Error("Invalid approved event");
    combined.set(id,{id,data});
  }
  return [...combined.values()];
}
// Cache only the public field projection. No stale fallback: cancellation accuracy wins.
// One in-flight fetch per isolate; edge cache shares successful snapshots within a colo.
export async function loadCatalog({
  cache,
  origin,
  now = new Date(),
  fetcher = fetch,
  includeCommunity = false,
  includeMedia = false,
} = {}) {
  const key = new Request(
    `${origin || "https://reignvillage.com"}/events/_cache/catalog-${includeCommunity ? "community-v2" : "v1"}`,
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
    const flightKey = includeCommunity ? "community" : "selected";
    if (!inflight.has(flightKey)) {
      const pending = readPublicEvents(fetcher, includeCommunity).then((documents) => ({
        documents,
        fetchedAt: now.getTime(),
      }));
      inflight.set(flightKey, pending);
      pending
        .finally(() => {
          inflight.delete(flightKey);
        })
        .catch(() => {});
    }
    snapshot = await inflight.get(flightKey);
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
  const catalog = prepare(snapshot.documents, now);
  // Media is intentionally outside the event cache so privacy changes take effect on refresh.
  if (includeMedia) {
    const candidates = catalog.events.filter(event => !event.flyer && event.status === 'ongoing').slice(0, 20);
    if (candidates.length) {
      try {
        const reply = await fetcher('https://us-central1-enthusiasts-76ad0.cloudfunctions.net/getWebsiteEventCaptures', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({eventIDs:candidates.map(event=>event.id)}), signal:AbortSignal.timeout(10000),
        });
        if (reply.ok) {
          const raw = await reply.text();
          if (raw.length > 20000) throw Error('Oversized media projection');
          const captures = JSON.parse(raw).captures;
          for (const event of candidates) event.artwork = selectEventArtwork(event.flyer, captures, event, now);
        }
      } catch { /* Artwork is optional; a media outage must not hide event details. */ }
    }
  }
  return {
    ...catalog,
    fetchedAt: new Date(snapshot.fetchedAt).toISOString(),
  };
}
