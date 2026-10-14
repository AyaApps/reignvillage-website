import { shell } from "./shell.mjs";
import { escape as e } from "./model.mjs";
const endpoint = "https://us-central1-enthusiasts-76ad0.cloudfunctions.net/submitOrganizerEvent";
const input = (name, label, type = "text", max = 300, required = true) =>
  `<label class="submission-field">${label}<input name="${name}" type="${type}" maxlength="${max}"${required ? " required" : ""}></label>`;
export function submissionPage(siteKey = "") {
  const content = `<header class="events-hero"><p class="event-eyebrow">For event organizers</p><h1>Bring your community together.</h1><p>Share your car show, meet or pop-up. Submitting is free.</p><p>Still confirming details? Leave optional fields blank. We’ll check what’s missing before listing.</p></header>
<section class="submission-policy" aria-labelledby="eligibility"><h2 id="eligibility">Good events. Responsible driving.</h2><p>Car shows, venue-approved meets and closed-course motorsport are welcome. No street takeovers, illegal racing or dangerous driving on public roads.</p><details><summary>Submission guidelines</summary><p>Include an organizer link and venue permission. Listings are reviewed and do not imply RevvRadar sponsorship.</p></details></section>
${
  siteKey
    ? `<form id="organizer-submission" class="submission-form"><fieldset><legend>1. Event details</legend><div class="submission-grid">
${input("name", "Event name")}${input("organizerName", "Organizer or club name")}${input("sourceUrl", "Public event or organizer link", "url", 2048)}${input("venueName", "Venue name")}${input("address", "Street address (optional)", "text", 300, false)}${input("city", "City")}${input("state", "State / region (e.g. WA)")}${input("countryCode", "Country code (e.g. US)")}${input("startLocal", "Starts (venue time)", "datetime-local")}${input("endLocal", "Ends (venue time, optional)", "datetime-local", 300, false)}
<label class="submission-field">Venue time zone<select name="timeZone" required><option value="">Choose venue time zone</option>${["America/Los_Angeles", "America/Denver", "America/Phoenix", "America/Chicago", "America/New_York", "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "America/Vancouver"].map((zone) => `<option value="${zone}">${zone.replaceAll("_", " ")}</option>`).join("")}<option value="other">Other — enter below</option></select></label><label class="submission-field" id="other-zone-field" hidden>Other time zone<input name="otherTimeZone" maxlength="100" placeholder="Europe/London"></label>
</div><label class="submission-field">What should visitors know? (optional)<textarea name="description" rows="4" maxlength="2000"></textarea></label><label class="submission-field">Admission and entry fees (optional)<textarea name="admissionDetails" rows="2" maxlength="2000"></textarea></label></fieldset>
<fieldset><legend>2. Flyer (optional)</legend><p>Have a flyer? Add a 4:5 portrait JPG or PNG, up to 4 MiB (e.g. 1080 × 1350 px).</p><label class="submission-field">Flyer file<input name="flyerFile" type="file" accept="image/jpeg,image/png"></label><div id="flyer-details" hidden><label class="submission-field">Flyer description<textarea name="flyerDescription" maxlength="1000" rows="2" disabled></textarea></label><label class="submission-check"><input name="flyerPermission" type="checkbox" disabled><span>I have permission for this flyer to appear in RevvRadar and on its website.</span></label></div></fieldset><fieldset><legend>3. Contact and permission</legend><label class="submission-field">Venue permission<textarea name="permissionDetails" rows="3" maxlength="2000" required placeholder="Who approved use of the venue?"></textarea></label>${input("contactEmail", "Your email (private)", "email", 254)}<label class="submission-check"><input type="checkbox" name="venueAuthorized" required><span>I’m authorized to submit this event and have venue permission.</span></label><label class="submission-check"><input type="checkbox" name="conductAccepted" required><span>This event follows the submission guidelines.</span></label><p class="submission-privacy">Private submissions are kept for 90 days; approved listings remain. <a href="/privacy.html">Privacy policy</a></p></fieldset>
<div class="cf-turnstile" data-sitekey="${e(siteKey)}" data-action="event_submission" data-callback="submissionChallengeReady" data-expired-callback="submissionChallengeExpired" data-error-callback="submissionChallengeExpired"></div><button class="button button-white" id="submission-send" type="submit" disabled>Submit for review</button><p id="submission-status" role="status" aria-live="polite"></p><noscript>Enable JavaScript to complete the spam check and submit this form.</noscript></form><section id="submission-received" class="submission-received" hidden aria-labelledby="received-heading"><p class="event-eyebrow">Sent for review</p><h2 id="received-heading" tabindex="-1">We received your event.</h2><p>We’ll review your event before publishing.</p><p id="received-event-name"></p><a class="button button-outline" href="/events/">Browse events</a></section><script src="/event-submission.js" defer></script><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>`
    : '<section class="submission-policy"><h2>Submissions are temporarily unavailable.</h2><p>Please check back later. Your event has not been submitted.</p></section>'
}
<p class="submission-policy submission-help">Need to change an event? <a href="/contact.html">Contact us</a>.</p>`;
  return shell({
    title: "Submit an Event",
    description: "Submit an authorized car event for review by RevvRadar.",
    path: "/events/submit/",
    content,
  });
}
export async function handleSubmission(request, env = {}, fetcher = fetch) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  // Both public domains share Pages; complete the challenge on its configured website hostname.
  if (["GET", "HEAD"].includes(request.method) &&
      ["revvradar.com", "www.revvradar.com"].includes(new URL(request.url).hostname))
    return new Response(null, { status: 302, headers: {
      ...headers, Location: "https://reignvillage.com/events/submit/",
    } });
  if (["GET", "HEAD"].includes(request.method))
    return new Response(
      request.method === "HEAD"
        ? null
        : submissionPage(env.EVENT_SUBMISSIONS_ENABLED === "true" ? env.EVENT_SUBMISSION_SITE_KEY : ""),
      { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
    );
  const json = (body, status) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD, POST" } });
  if (env.EVENT_SUBMISSIONS_ENABLED !== "true" || !env.EVENT_SUBMISSION_SITE_KEY)
    return json({ error: "Submissions are temporarily unavailable." }, 503);
  if (
    request.headers.get("Origin") !== new URL(request.url).origin ||
    !request.headers.get("Content-Type")?.startsWith("application/json")
  )
    return json({ error: "Invalid submission origin or format." }, 400);
  const reader = request.body?.getReader();
  let length = 0;
  const chunks = [];
  if (!reader) return json({ error: "Submission is empty." }, 400);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 5_610_000) {
        await reader.cancel();
        return json({ error: "Submission is too large." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body = new TextDecoder().decode(bytes);
    JSON.parse(body);
    const upstream = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(18000),
    });
    const result = await upstream.json();
    if (upstream.status === 202 && result.received === true)
      return json(
        {
          received: true,
          message: "Received for review. Publication and same-day review are not guaranteed.",
        },
        202,
      );
    return json(
      {
        error:
          typeof result.error === "string"
            ? result.error.slice(0, 300)
            : "Receipt is unconfirmed. Retry the same submission.",
      },
      [400, 409, 429, 503].includes(upstream.status) ? upstream.status : 503,
    );
  } catch {
    return json({ error: "Receipt is unconfirmed. Keep this page open and retry the same submission." }, 503);
  }
}
