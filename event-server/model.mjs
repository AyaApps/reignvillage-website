export const origin = "https://reignvillage.com";
export const appStore =
  "https://apps.apple.com/app/apple-store/id6756965007?pt=126925134&ct=website_events&mt=8";
export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (x) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        x
      ],
  );
export const jsonScript = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
export const slug = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const cityPath = (event) =>
  `/events/${event.countryCode.toLowerCase()}/${slug(event.state)}/${slug(event.city)}/`;
export const eventPath = (event) =>
  `/events/event/${encodeURIComponent(event.id)}/`;
export function format(event, value, options) {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: event.timeZone,
  }).format(new Date(value));
}
export const dateLabel = (event) =>
  format(event, event.startDate, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
export const localDay = (value, zone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export const timeLabel = (event) =>
  format(event, event.startDate, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
export const multiday = (event) =>
  localDay(event.startDate, event.timeZone) !==
  localDay(event.endDate, event.timeZone);
export const schedule = (event) =>
  multiday(event)
    ? `${dateLabel(event)} – ${format(event, event.endDate, { month: "short", day: "numeric" })}`
    : `${dateLabel(event)} · ${timeLabel(event)}`;
export function price(event) {
  if (event.isFree === true) return "Free admission";
  if (event.cost !== null && event.currency)
    return `${new Intl.NumberFormat("en-US", { style: "currency", currency: event.currency }).format(event.cost)} admission`;
  return event.isFree === false
    ? "Paid admission · check organizer"
    : "Check organizer for admission";
}
export function inPeriod(event, period, now) {
  if (period === "any") return true;
  const today = localDay(now, event.timeZone);
  const start = localDay(event.startDate, event.timeZone),
    end = localDay(event.endDate, event.timeZone);
  if (period === "today") return start <= today && end >= today;
  const anchor = new Date(`${today}T12:00:00Z`);
  if (period === "weekend") {
    const day = anchor.getUTCDay();
    anchor.setUTCDate(
      anchor.getUTCDate() + (day === 0 ? -1 : (6 - day + 7) % 7),
    );
    const saturday = anchor.toISOString().slice(0, 10);
    anchor.setUTCDate(anchor.getUTCDate() + 1);
    return start <= anchor.toISOString().slice(0, 10) && end >= saturday;
  }
  anchor.setUTCDate(anchor.getUTCDate() + 30);
  return start <= anchor.toISOString().slice(0, 10) && end >= today;
}
export function listing(catalog, url, now) {
  const browse = catalog.events.filter((event) =>
    ["upcoming", "ongoing"].includes(event.status),
  );
  const cities = [
    ...new Map(browse.map((event) => [cityPath(event), event])).values(),
  ].sort(
    (a, b) =>
      (a.state === "WA" ? 0 : 1) - (b.state === "WA" ? 0 : 1) ||
      a.city.localeCompare(b.city),
  );
  const city =
    url.pathname === "/events/"
      ? null
      : catalog.events.find((event) => cityPath(event) === url.pathname);
  if (url.pathname !== "/events/" && !city) return null;
  const query = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const requestedPeriod = url.searchParams.get("when");
  const period = ["today", "weekend", "month"].includes(requestedPeriod)
    ? requestedPeriod
    : "any";
  const matches = browse.filter(
    (event) =>
      (!city || cityPath(event) === cityPath(city)) &&
      `${event.name} ${event.city} ${event.state} ${event.venueName}`
        .toLocaleLowerCase("en-US")
        .includes(query.toLocaleLowerCase("en-US")) &&
      inPeriod(event, period, now),
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / 8));
  const page = Math.min(
    pageCount,
    Math.max(1, Number.parseInt(url.searchParams.get("page"), 10) || 1),
  );
  return {
    city,
    cities,
    query,
    period,
    total: matches.length,
    page,
    pageCount,
    events: matches.slice((page - 1) * 8, page * 8),
  };
}
