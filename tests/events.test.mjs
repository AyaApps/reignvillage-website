import { test } from "node:test";
import assert from "node:assert/strict";
import { handleEvents } from "../event-server/handler.mjs";
import {
  loadCatalog,
  decodeBatch,
  prepare,
  TTL,
  database,
} from "../event-server/source.mjs";
import { selection } from "../event-server/selection.mjs";
import { inPeriod, cityPath, listing } from "../event-server/model.mjs";
const now = new Date("2026-10-07T01:00:00Z");
const fixture = {
  id: selection[0].id,
  data: {
    name: "Example <script>alert(1)</script>",
    description: "Safe text </script><img src=x onerror=alert(1)>",
    city: "Tacoma",
    state: "WA",
    countryCode: "US",
    address: "123 Example Street",
    timeZone: "America/Los_Angeles",
    isVerified: true,
    startDate: "2026-10-10T16:00:00Z",
    endDate: "2026-10-10T19:00:00Z",
    sourceUrl: "https://example.com/",
    isFree: false,
  },
};
const catalog = (changes = {}) => ({
  ...prepare([{ ...fixture, data: { ...fixture.data, ...changes } }], now),
  fetchedAt: now.toISOString(),
});
const request = (route, changes = {}, opts = {}) =>
  handleEvents(new Request("https://reignvillage.com" + route, opts), {
    now,
    loader: async () => catalog(changes),
  });
const providerBody = () =>
  selection.map(({ id }, i) =>
    i
      ? { missing: `${database}/events/${id}` }
      : {
          found: {
            name: `${database}/events/${id}`,
            fields: Object.fromEntries(
              Object.entries(fixture.data).map(([k, v]) => [
                k,
                typeof v === "boolean"
                  ? { booleanValue: v }
                  : { stringValue: v },
              ]),
            ),
          },
        },
  );

test("SSR directory and detail have content, canonicals, encoded text and matching structured data", async () => {
  const response = await request("/events/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Events to explore/);
  assert.match(html, /Example &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  const detail = await (await request(`/events/event/${fixture.id}/`)).text();
  const schema = JSON.parse(
    detail.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
  );
  assert.equal(schema.name, fixture.data.name);
  assert.equal(schema.location.address.streetAddress, fixture.data.address);
  assert.doesNotMatch(detail, /<img src=x/);
  assert.match(detail, /Check organizer|check organizer/);
  assert.equal(schema.offers, undefined);
});
test("query, city, date and pagination preserve filters and exact city identity", () => {
  const c = catalog();
  const url = new URL(
    "https://reignvillage.com/events/?q=Tacoma&when=weekend&page=999",
  );
  const model = listing(c, url, now);
  assert.equal(model.total, 1);
  assert.equal(model.page, 1);
  assert.notEqual(
    cityPath(c.events[0]),
    cityPath({ ...c.events[0], state: "ME" }),
  );
  assert.equal(
    listing(c, new URL("https://reignvillage.com/events/us/wa/tacoma/"), now)
      .total,
    1,
  );
  assert.equal(
    listing(c, new URL("https://reignvillage.com/events/us/wa/unknown/"), now),
    null,
  );
  assert.equal(
    listing(c, new URL("https://reignvillage.com/events/?q=not-found"), now)
      .total,
    0,
  );
});
test("weekend uses venue calendar including Sunday and excludes next Monday", () => {
  const event = catalog().events[0];
  assert.equal(inPeriod(event, "weekend", now), true);
  assert.equal(
    inPeriod(
      {
        ...event,
        startDate: "2026-10-12T18:00:00Z",
        endDate: "2026-10-12T20:00:00Z",
      },
      "weekend",
      now,
    ),
    false,
  );
  assert.equal(
    inPeriod(
      {
        ...event,
        startDate: "2026-10-11T18:00:00Z",
        endDate: "2026-10-11T20:00:00Z",
      },
      "weekend",
      new Date("2026-10-11T17:00:00Z"),
    ),
    true,
  );
});
test("cancelled/ended/postponed leave listings and sitemap but details retain accurate status", async () => {
  for (const changes of [
    { isCancelled: true },
    { isPostponed: true },
    { startDate: "2026-10-01T00:00:00Z", endDate: "2026-10-02T00:00:00Z" },
  ]) {
    assert.equal(catalog(changes).browseIds.length, 0);
    const sitemap = await (
      await request("/events/sitemap.xml", changes)
    ).text();
    assert.doesNotMatch(sitemap, /\/event\//);
    const detail = await (
      await request(`/events/event/${fixture.id}/`, changes)
    ).text();
    assert.match(detail, /cancelled|postponed|has ended/);
  }
});
test("missing and removed records return 404, upstream error returns 503 without stale content", async () => {
  assert.equal((await request("/events/event/missing/")).status, 404);
  assert.equal((await request("/events/_cache/catalog-v1/")).status, 404);
  const r = await handleEvents(
    new Request("https://reignvillage.com/events/"),
    {
      loader: async () => {
        throw new Error("offline");
      },
    },
  );
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("Retry-After"), "60");
  assert.match(await r.text(), /temporarily unavailable/);
});
test("routing handles HEAD, trailing slash and blocks mutation verbs", async () => {
  assert.equal((await request("/events")).status, 308);
  assert.equal((await request("/events/", {}, { method: "POST" })).status, 405);
  assert.equal(
    await (await request("/events/", {}, { method: "HEAD" })).text(),
    "",
  );
});
test("provider adapter rejects incomplete, duplicate, unexpected documents and keeps only selected fields", () => {
  assert.throws(() => decodeBatch([]), /Incomplete/);
  const body = providerBody();
  body[0].found.fields.internalSecret = { stringValue: "never copied" };
  assert.equal(decodeBatch(body)[0].data.internalSecret, undefined);
  body[1] = body[0];
  assert.throws(() => decodeBatch(body), /Unexpected/);
});
test("cache shares concurrent loads, expires after five minutes and retries after failure", async () => {
  let calls = 0,
    cached;
  const cache = {
    match: async () => cached?.clone(),
    put: async (_key, response) => {
      cached = response.clone();
    },
  };
  const fetcher = async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return new Response(JSON.stringify(providerBody()));
  };
  const options = { cache, now, fetcher, origin: "https://reignvillage.com" };
  await Promise.all([loadCatalog(options), loadCatalog(options)]);
  assert.equal(calls, 1);
  await loadCatalog(options);
  assert.equal(calls, 1);
  await loadCatalog({ ...options, now: new Date(now.getTime() + TTL) });
  assert.equal(calls, 2);
  const later = { ...options, now: new Date(now.getTime() + 2 * TTL) };
  await assert.rejects(() =>
    loadCatalog({
      ...later,
      fetcher: async () => new Response("", { status: 500 }),
    }),
  );
  await loadCatalog(later);
  assert.equal(calls, 3);
});
test("multi-day details show distinct dates, timezone and daily-hours caveat", async () => {
  const html = await (
    await request(`/events/event/${fixture.id}/`, {
      endDate: "2026-10-12T00:00:00Z",
    })
  ).text();
  assert.match(html, /Daily hours may vary/);
  assert.match(html, /PDT/);
  assert.match(html, /Starts/);
  assert.match(html, /Ends/);
});

test("legacy event share route redirects web visitors to stable event details", async () => {
  const { onRequest } = await import("../functions/e/[id].js");
  const response = onRequest({
    request: new Request("https://revvradar.com/e/example"),
    params: { id: "id?with#reserved" },
  });
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("Location"),
    "https://reignvillage.com/events/event/id%3Fwith%23reserved/",
  );
});


test("search metadata lists visible events, empty cities are noindex and breadcrumbs match navigation", async () => {
  const html = await (await request("/events/")).text();
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema["@type"], "CollectionPage");
  assert.equal(schema.mainEntity.itemListElement[0].url, `https://reignvillage.com/events/event/${fixture.id}/`);
  assert.doesNotMatch(html, /name="robots"/);
  assert.match(await (await request("/events/us/wa/tacoma/", {isCancelled: true})).text(), /noindex,follow/);
  const detail = await (await request(`/events/event/${fixture.id}/`)).text();
  const schemas = [...detail.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(x=>JSON.parse(x[1]));
  assert.equal(schemas[1]["@type"], "BreadcrumbList");
  assert.equal(schemas[1].itemListElement[2].item, `https://reignvillage.com/events/event/${fixture.id}/`);
  assert.match(detail, /Tacoma, WA/);
});
