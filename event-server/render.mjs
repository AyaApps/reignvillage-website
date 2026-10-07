import {
  escape as e,
  origin,
  cityPath,
  eventPath,
  format,
  dateLabel,
  schedule,
  price,
  multiday,
  listing,
} from "./model.mjs";
import { shell, external, appLink, appBanner } from "./shell.mjs";
const icon = (name) =>
  `<svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${name === "pin" ? '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>' : name === "clock" ? '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>' : '<path d="m3 12 9-9h8v8l-9 9-8-8Z"/><circle cx="16" cy="7" r="1"/>'}</svg>`;
function dateTile(event) {
  return `<div class="event-date" aria-hidden="true"><span>${e(format(event, event.startDate, { month: "short" }))}</span><strong>${e(format(event, event.startDate, { day: "numeric" }))}</strong><small>${e(format(event, event.startDate, { weekday: "short" }))}</small></div>`;
}
function card(event) {
  return `<a class="event-card" href="${e(eventPath(event))}" data-event-link data-event-id="${e(event.id)}">${dateTile(event)}<div class="event-card-body">${event.status === "ongoing" ? '<span class="event-live">Happening now</span>' : ""}<h3>${e(event.name)}</h3><p>${icon("pin")}<span>${e(event.city)}, ${e(event.state)}</span></p><p>${icon("clock")}<span>${e(schedule(event))}</span></p><p>${icon("ticket")}<span>${e(price(event))}</span></p></div><span class="event-arrow" aria-hidden="true">→</span></a>`;
}
const freshness = (fetchedAt) =>
  `<div class="event-freshness" data-fetched-at="${e(fetchedAt)}"><span>Times shown at the venue.</span><span data-refresh-note hidden>Check for changes before you go.</span><a href="" data-refresh>Refresh listings</a></div>`;
export function renderListing(catalog, url, now) {
  const model = listing(catalog, url, now);
  if (!model) return unavailable(url.pathname, 404);
  const { city, cities, query, period, total, page, pageCount, events } = model;
  const title = city
    ? `Car events in ${city.city}, ${city.state}.`
    : "Find your next car event.";
  const description = city
    ? `Explore car shows and meets in ${city.city}, ${city.state}. Find dates, venue details and organizer links.`
    : "Car shows, weekend meets, and Cars & Coffee. Find the details, then make a plan.";
  const searchTitle = city
    ? `Car Shows & Meets in ${city.city}, ${city.state}`
    : "Car Shows, Meets & Local Car Events";
  const filters = `<form class="event-filters" method="get" action="${e(url.pathname)}" role="search"><div class="event-field"><label for="event-query">Event or city</label><input id="event-query" name="q" type="search" placeholder="Search events or cities" value="${e(query)}" maxlength="100"></div><div class="event-field"><label for="event-when">Time</label><select id="event-when" name="when">${[
    ["any", "Any time"],
    ["today", "Today"],
    ["weekend", "This weekend"],
    ["month", "Next 30 days"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${period === value ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></div><button class="button button-white" type="submit">Browse events <span aria-hidden="true">→</span></button></form>`;
  const cityLink = (event) =>
    `<a href="${e(cityPath(event))}" ${city && cityPath(city) === cityPath(event) ? 'aria-current="page"' : ""}>${e(event.city)}, ${e(event.state)}</a>`;
  const cityNav = `<nav class="event-cities" aria-label="Browse cities"><a href="/events/" ${!city ? 'aria-current="page"' : ""}>All cities</a>${cities.slice(0, 3).map(cityLink).join("")}${cities.length > 3 ? `<details><summary>All ${cities.length} cities</summary><div class="event-city-menu">${cities.map(cityLink).join("")}</div></details>` : ""}</nav>`;
  const pagination =
    pageCount > 1
      ? `<nav class="event-pagination" aria-label="Event pages">${Array.from(
          { length: pageCount },
          (_, i) => {
            const href = new URL(url);
            href.searchParams.set("page", String(i + 1));
            return `<a href="${e(href.pathname + href.search)}" ${page === i + 1 ? 'aria-current="page"' : ""}>${i + 1}</a>`;
          },
        ).join("")}</nav>`
      : "";
  const content = `${city ? '<a class="text-link event-back" href="/events/">← All events</a>' : ""}<section class="events-hero"><h1>${e(title)}</h1><p>${e(description)}</p></section>${filters}${cityNav}
<section class="event-results" aria-labelledby="results-heading"><div class="event-section-heading"><h2 id="results-heading">${query || period !== "any" ? "Search results" : "Events to explore"}</h2><span>${total} ${total === 1 ? "event" : "events"}${city ? " in " + e(city.city) : " listed"}</span></div>${freshness(catalog.fetchedAt)}${events.length ? `<div class="event-grid">${events.map(card).join("")}</div>` : `<div class="event-empty"><h3>No events match this search.</h3><p>Try another city or a wider date range. New listings are added as they’re reviewed.</p><a class="button button-outline" href="/events/">Browse all events</a></div>`}${pagination}</section>${appBanner()}`;
  return {
    status: 200,
    html: shell({
      title: searchTitle,
      description,
      path: url.pathname,
      content,
      schema: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: searchTitle,
        url: origin + url.pathname,
        description,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: events.map((event, i) => ({
            "@type": "ListItem",
            position: (page - 1) * 8 + i + 1,
            name: event.name,
            url: origin + eventPath(event),
          })),
        },
      },
      noindex: url.search.length > 0 || url.origin !== origin || total === 0,
    }),
  };
}
export function renderDetail(catalog, event, url) {
  const notice = {
    cancelled: "This event has been cancelled.",
    postponed:
      "This event has been postponed. Check the organizer for a new date.",
    ended: "This event has ended.",
    ongoing:
      "This event is underway. Check the daily schedule before traveling.",
  }[event.status];
  const normalizedAddress = event.address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  const locality = `${event.city} ${event.state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  const locationLabel = normalizedAddress.includes(locality)
    ? event.address
    : [event.address, event.city, event.state].join(", ");
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`;
  const sourceName = new URL(event.sourceUrl).hostname.replace(/^www\./, "");
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description,
    url: origin + eventPath(event),
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: `https://schema.org/${event.status === "cancelled" ? "EventCancelled" : event.status === "postponed" ? "EventPostponed" : "EventScheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venueName || event.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address,
        addressLocality: event.city,
        addressRegion: event.state,
        addressCountry: event.countryCode,
      },
    },
    ...(event.organizerName
      ? { organizer: { "@type": "Organization", name: event.organizerName } }
      : {}),
    ...(event.isFree !== null ? { isAccessibleForFree: event.isFree } : {}),
  };
  const related = catalog.events
    .filter(
      (item) =>
        item.id !== event.id &&
        cityPath(item) === cityPath(event) &&
        ["upcoming", "ongoing"].includes(item.status),
    )
    .slice(0, 2);
  const time = multiday(event)
    ? `<p><strong>Starts</strong> ${e(format(event, event.startDate, { dateStyle: "full" }))}<br>${e(format(event, event.startDate, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }))}</p><p><strong>Ends</strong> ${e(format(event, event.endDate, { dateStyle: "full" }))}<br>${e(format(event, event.endDate, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }))}</p><p class="event-muted">Daily hours may vary. Check the organizer’s schedule.</p>`
    : `<p>${e(format(event, event.startDate, { dateStyle: "full" }))}</p><p>${e(format(event, event.startDate, { hour: "numeric", minute: "2-digit" }))} – ${e(format(event, event.endDate, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }))}</p>`;
  const content = `<nav class="event-breadcrumb" aria-label="Breadcrumb"><a href="/events/">Events</a><span aria-hidden="true">/</span><a href="${e(cityPath(event))}">${e(event.city)}, ${e(event.state)}</a></nav><header class="events-hero event-detail-hero"><h1>${e(event.name)}</h1><p>${e([event.venueName, `${event.city}, ${event.state}`].filter(Boolean).join(" · "))}</p></header>${notice ? `<p class="event-notice">${e(notice)}</p>` : ""}
<div class="event-detail-layout"><article class="event-about"><h2>About this event</h2>${
    event.description
      ? event.description
          .split(/\n+/)
          .map((p) => `<p>${e(p)}</p>`)
          .join("")
      : "<p>Visit the organizer’s website for the full event details.</p>"
  }<div class="event-source"><h2>${event.organizerName ? "Organized by " + e(event.organizerName) : "Event source"}</h2>${external(event.sourceUrl, `Visit ${sourceName}`)}<p>Event information comes from the linked source. Confirm dates, admission and availability before traveling.</p>${event.ticketUrl && !["cancelled", "postponed", "ended"].includes(event.status) ? external(event.ticketUrl, "Tickets & registration") : ""}</div></article>
<aside class="event-details" aria-label="Plan your visit"><div class="event-details-date">${dateTile(event)}<div><h2>Plan your visit</h2>${time}</div></div><div class="event-detail-field"><h3>Location</h3><p>${e(locationLabel)}</p>${external(directions, "Get directions")}</div><div class="event-detail-field"><h3>Admission</h3><p>${e(price(event))}</p><p class="event-muted">Registration, entry categories and fees may differ.</p></div><div class="event-actions"><a class="button button-white" href="${e(event.appUrl)}" data-open-app data-event-id="${e(event.id)}">Open in RevvRadar <span aria-hidden="true">↗</span></a>${appLink("Get the iOS app", "event_detail")}<button class="button button-outline" type="button" data-copy-link="${e(origin + eventPath(event))}" hidden>Copy event link</button><p class="event-copy-status" role="status" aria-live="polite"></p></div></aside></div>${freshness(catalog.fetchedAt)}<section class="event-related"><h2>More to explore</h2>${related.length ? `<div class="event-grid">${related.map(card).join("")}</div>` : `<p>Find another reason to get out and explore.</p><a class="text-link" href="/events/">Browse all events →</a>`}</section>`;
  return {
    status: 200,
    html: shell({
      title: `${event.name} — ${event.city}, ${event.state}`,
      description:
        event.description.slice(0, 155) ||
        `Event details for ${event.name} in ${event.city}.`,
      path: eventPath(event),
      content,
      schema,
      breadcrumbs: [
        { name: "Car events", url: origin + "/events/" },
        {
          name: `${event.city}, ${event.state}`,
          url: origin + cityPath(event),
        },
        { name: event.name, url: origin + eventPath(event) },
      ],
      noindex: url.origin !== origin,
    }),
  };
}
export function unavailable(path, status = 503) {
  const missing = status === 404;
  const content = `<section class="events-hero event-error"><h1>${missing ? "This listing is unavailable." : "Events are temporarily unavailable."}</h1><p>${missing ? "The event may have been removed or its details may be under review." : "We couldn’t check the latest event details. Please try again in a moment."}</p><div class="hero-actions"><a class="button button-white" href="${missing ? "/events/" : e(path)}">${missing ? "Browse events" : "Try again"}</a><a class="button button-outline" href="/car-shows/">Car-show guide</a></div></section>`;
  return {
    status,
    html: shell({
      title: missing ? "Event unavailable" : "Events temporarily unavailable",
      description: "Find car events with RevvRadar.",
      path,
      content,
      noindex: true,
    }),
  };
}
