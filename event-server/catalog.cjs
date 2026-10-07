// Pure, offline preparation. This module does not read Firestore or publish files.
const text = (value) => (typeof value === "string" ? value.trim() : "");

function isoDate(value) {
  if (value instanceof Date)
    return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  if (typeof value !== "string") return null;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!parts) return null;
  const [, year, month, day, hour, minute, second] = parts.map(Number);
  const calendarDate = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() + 1 !== month ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  )
    return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function publicURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function validZone(value) {
  if (!text(value)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

/**
 * documents: decoded PUBLIC events only, [{id, data}]. Never pass candidates.
 * reviewedIds is a separate explicit website selection, not inferred from isVerified.
 * Missing/invalid selected records are reported so a publisher can refuse the batch.
 * Images deliberately require a later, independently reviewed usage-rights adapter.
 */
function prepareCatalog(documents, reviewedIds, now = new Date()) {
  if (!Array.isArray(documents) || !Array.isArray(reviewedIds))
    throw new TypeError("Expected arrays");
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()))
    throw new TypeError("Invalid clock");
  if (
    reviewedIds.some((id) => typeof id !== "string" || !id || id.includes("/"))
  )
    throw new TypeError("Invalid event ID");
  if (new Set(reviewedIds).size !== reviewedIds.length)
    throw new Error("Duplicate selection");
  const byId = new Map();
  for (const record of documents) {
    if (byId.has(record.id)) throw new Error("Duplicate event ID");
    byId.set(record.id, record.data);
  }
  const events = [],
    rejected = [];
  for (const id of reviewedIds) {
    const data = byId.get(id);
    const reject = (reason) => rejected.push({ id, reason });
    if (!data) {
      reject("missing-public-event");
      continue;
    }
    if (
      data.isPrivate === true ||
      data.isPrivateEvent === true ||
      data.isVerified !== true
    ) {
      reject("not-verified-public");
      continue;
    }
    const startDate = isoDate(data.startDate),
      endDate = isoDate(data.endDate);
    if (
      !startDate ||
      !endDate ||
      endDate <= startDate ||
      !validZone(data.timeZone)
    ) {
      reject("invalid-schedule-or-timezone");
      continue;
    }
    const sourceUrl =
      publicURL(data.sourceUrl) ||
      publicURL(data.canonicalUrl) ||
      publicURL(data.websiteUrl);
    const name = text(data.name),
      city = text(data.city),
      state = text(data.state);
    const organizerName = text(data.organizerName),
      address = text(data.address);
    if (!name || !city || !state || !address || !sourceUrl) {
      reject("missing-attribution-or-location");
      continue;
    }
    const status =
      data.isCancelled === true
        ? "cancelled"
        : data.isPostponed === true
          ? "postponed"
          : endDate <= now.toISOString()
            ? "ended"
            : startDate <= now.toISOString()
              ? "ongoing"
              : "upcoming";
    const isFree = typeof data.isFree === "boolean" ? data.isFree : null;
    // Missing/invalid price must never become a zero-dollar admission claim.
    const currency = /^[A-Z]{3}$/.test(data.currency || "")
      ? data.currency
      : null;
    const cost =
      isFree === true
        ? 0
        : isFree === false &&
            currency &&
            Number.isFinite(data.cost) &&
            data.cost > 0
          ? data.cost
          : null;
    events.push({
      id,
      name,
      description: text(data.description),
      city,
      state,
      address,
      eventType: text(data.eventType),
      venueName: text(data.venueName),
      organizerName,
      sourceUrl,
      ticketUrl: publicURL(data.ticketUrl),
      startDate,
      endDate,
      timeZone: data.timeZone,
      status,
      isFree,
      cost,
      currency,
      verifiedAt: isoDate(data.verifiedAt),
      appUrl: `https://revvradar.com/e/${encodeURIComponent(id)}`,
    });
  }
  events.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id),
  );
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    events,
    browseIds: events
      .filter((event) => ["ongoing", "upcoming"].includes(event.status))
      .map((event) => event.id),
    rejected,
  };
}

module.exports = { prepareCatalog };
