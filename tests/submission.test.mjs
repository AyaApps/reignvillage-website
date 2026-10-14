import { test } from "node:test";
import assert from "node:assert/strict";
import { handleSubmission, submissionPage } from "../event-server/submission.mjs";
import { prepare, readPublicEvents, database } from "../event-server/source.mjs";
import { selection } from "../event-server/selection.mjs";
const env = { EVENT_SUBMISSIONS_ENABLED: "true", EVENT_SUBMISSION_SITE_KEY: "public-key" };
const request = (body = "{}", origin = "https://reignvillage.com") =>
  new Request("https://reignvillage.com/events/submit/", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body,
  });
test("RevvRadar domain opens the form on the configured challenge hostname", async () => {
  for (const domain of ["revvradar.com", "www.revvradar.com"])
    for (const method of ["GET", "HEAD"]) {
      const response = await handleSubmission(new Request(`https://${domain}/events/submit/`, { method }), env);
      assert.equal(response.status, 302);
      assert.equal(response.headers.get("Location"), "https://reignvillage.com/events/submit/");
      assert.equal(response.headers.get("Cache-Control"), "no-store");
    }
  assert.match(await (await handleSubmission(new Request("https://reignvillage.com/events/submit/"), env)).text(),
    /id="organizer-submission"/);
});
test("disabled intake fails closed and form explains conduct and review limits", async () => {
  assert.equal((await handleSubmission(request())).status, 503);
  assert.match(submissionPage(), /temporarily unavailable/);
  const html = submissionPage('a"<script>');
  assert.match(html, /street takeovers/);
  assert.match(html, /Listings are reviewed/);
  assert.match(html, /id="submission-received"[^>]*hidden/);
  assert.match(html, /kept for 90 days/);
  assert.match(html, /a&quot;&lt;script&gt;/);
  assert.match(html, /Your email \(private\)/);
  for (const name of ["description", "address", "endLocal", "admissionDetails", "flyerFile", "flyerDescription", "flyerPermission"])
    assert.doesNotMatch(html, new RegExp(`<(?:input|textarea)[^>]*name="${name}"[^>]*required`));
  for (const name of ["name", "contactEmail", "sourceUrl", "startLocal", "venueAuthorized"])
    assert.match(html, new RegExp(`<input[^>]*name="${name}"[^>]*required`));
  assert.match(html, /Leave optional fields blank/);
  assert.match(html, /Flyer \(optional\)/);
  assert.match(html, /id="flyer-details" hidden/);
});
test("intake proxy rejects cross-origin, oversized and malformed bodies before transport", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    throw Error();
  };
  assert.equal((await handleSubmission(request("{}", "https://evil.example"), env, fetcher)).status, 400);
  assert.equal((await handleSubmission(request("x".repeat(5_610_001)), env, fetcher)).status, 413);
  assert.equal((await handleSubmission(request("{"), env, fetcher)).status, 503);
  assert.equal(calls, 0);
});
test("intake reports success only with confirmed receipt; failures stay retryable", async () => {
  const okay = await handleSubmission(request(), env, async () =>
    Response.json({ received: true }, { status: 202 }),
  );
  assert.equal(okay.status, 202);
  assert.equal((await okay.json()).received, true);
  const bad = await handleSubmission(request(), env, async () =>
    Response.json({ received: false }, { status: 200 }),
  );
  assert.equal(bad.status, 503);
});
test("dynamic feed reads only public allowlist and makes reviewed submissions discoverable", async () => {
  const data = {
    name: "Example",
    description: "Description",
    city: "Tacoma",
    state: "WA",
    countryCode: "US",
    address: "1 Main St",
    timeZone: "America/Los_Angeles",
    isVerified: true,
    websiteApproved: true,
    startDate: "2026-10-20T17:00:00Z",
    endDate: "2026-10-20T19:00:00Z",
    sourceUrl: "https://example.com",
    contactEmail: "private@example.com",
  };
  let calls = 0;
  const fetcher = async (url, opts) => {
    calls++;
    if (calls === 1) return Response.json(selection.map((x) => ({ missing: `${database}/events/${x.id}` })));
    assert(!opts.body.includes("contactEmail"));
    return Response.json([
      {
        document: {
          name: `${database}/events/organizer-example`,
          fields: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [
              k,
              typeof v === "boolean" ? { booleanValue: v } : { stringValue: v },
            ]),
          ),
        },
      },
    ]);
  };
  const docs = await readPublicEvents(fetcher, true);
  assert.equal(docs[0].data.contactEmail, undefined);
  assert.equal(prepare(docs, new Date("2026-10-11")).events[0].countryCode, "US");
});
