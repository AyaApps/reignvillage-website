import { escape as e, origin, appStore, jsonScript } from "./model.mjs";
export const external = (url, label, cls = "text-link") =>
  `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} <span aria-hidden="true">↗</span></a>`;
export function appLink(
  label = "Try RevvRadar free on iOS.",
  source = "events_footer",
) {
  return `<a class="button button-white" href="${e(appStore)}" data-app-store-cta data-cta-source="${e(source)}">${e(label)} <span aria-hidden="true">↗</span></a>`;
}
export function shell({
  title,
  description,
  path,
  content,
  schema,
  breadcrumbs,
  noindex = false,
}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)} | RevvRadar</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${e(origin + path)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ""}<meta property="og:type" content="website"><meta property="og:site_name" content="RevvRadar"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(origin + path)}"><meta property="og:image" content="${origin}/assets/revvradar-og-image.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/revvradar-icon.png"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/events.css">${schema ? `<script type="application/ld+json">${jsonScript(schema)}</script>` : ""}${breadcrumbs ? `<script type="application/ld+json">${jsonScript({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })) })}</script>` : ""}</head>
<body class="events-page"><a class="skip-link" href="#main">Skip to content</a>
<header class="studio-header"><nav class="studio-nav" aria-label="ReignVillage navigation"><a class="studio-wordmark" href="/">ReignVillage</a><div class="studio-links"><a href="/">Home</a><a href="/company.html">Company</a><a href="/apps/revvradar/">Apps</a></div><button class="menu-button" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></nav></header>
<div class="mobile-menu" id="mobile-menu"><a href="/">Home</a><a href="/company.html">Company</a><a href="/apps/revvradar/">Apps</a><a href="/events/">Events</a><a href="/car-shows/">Car-show guide</a></div>
<nav class="product-nav" aria-label="RevvRadar resources"><div class="product-nav-inner"><a class="product-brand" href="/apps/revvradar/"><img src="/assets/revvradar-icon.png" alt=""><span>RevvRadar</span></a><div class="product-links"><a href="/car-identifier/">AI ID</a><a href="/events/" aria-current="page">Events</a><a href="/car-shows/">Guide</a></div>${appLink("Download", "events_nav")}</div></nav>
<main id="main" class="events-main">${content}</main>
<footer class="events-footer"><div class="events-footer-top"><a class="footer-wordmark" href="/">ReignVillage</a><nav aria-label="Footer"><a href="/company.html">About</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></nav></div><p>Event details can change. Confirm with the organizer before traveling.</p><p>© 2026 ReignVillage LLC.</p></footer>
<script src="/site.js" defer></script><script src="/events.js" defer></script></body></html>`;
}
export const appBanner = () =>
  `<section class="events-app-banner"><div><h2>Make a day of it.</h2><p>Keep event details close in RevvRadar.</p></div>${appLink()}</section>`;
