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
  canonicalOrigin = origin,
}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)} | RevvRadar</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${e(canonicalOrigin + path)}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ""}<meta property="og:type" content="website"><meta property="og:site_name" content="RevvRadar"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(canonicalOrigin + path)}"><meta property="og:image" content="${origin}/assets/revvradar-icon-white-charcoal-20261019.png"><meta name="twitter:card" content="summary"><link rel="icon" href="/assets/revvradar-icon-white-charcoal-20261019.png"><link rel="apple-touch-icon" href="/assets/revvradar-icon-white-charcoal-20261019.png"><link rel="stylesheet" href="/site.css?v=20261116-nav"><link rel="stylesheet" href="/events.css">${schema ? `<script type="application/ld+json">${jsonScript(schema)}</script>` : ""}${breadcrumbs ? `<script type="application/ld+json">${jsonScript({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })) })}</script>` : ""}</head>
<body class="events-page product-site"><a class="skip-link" href="#main">Skip to content</a>
<header class="product-nav" aria-label="RevvRadar header">
    <nav class="product-nav-inner" aria-label="RevvRadar navigation">
      <a class="product-brand" href="/apps/revvradar/"><img src="/assets/revvradar-icon-white-charcoal-20261019.png" alt=""><span>RevvRadar</span></a>
      <div class="product-links">
        <a href="/apps/revvradar/#identify">How it works</a>
        <details class="navigation-disclosure product-events">
          <summary>Events <span aria-hidden="true">⌄</span></summary>
          <div class="product-dropdown"><a href="/events/">Browse events</a><a href="/events/submit/">Submit an event</a></div>
        </details>
        <a href="/apps/revvradar/#faq">FAQ</a>
      </div>
      <div class="product-nav-actions">
        <a class="button button-white" href="https://apps.apple.com/app/apple-store/id6756965007?pt=126925134&amp;ct=website_events&amp;mt=8" target="_blank" rel="noopener noreferrer" data-app-store-cta data-cta-source="events_nav">Download</a>
        <details class="navigation-disclosure product-menu">
          <summary aria-label="RevvRadar menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg></summary>
          <div class="product-dropdown"><a href="/apps/revvradar/#identify">How it works</a><a href="/events/">Events</a><a class="organizer-link" href="/events/submit/">Submit an event</a><a href="/apps/revvradar/#faq">FAQ</a></div>
        </details>
      </div>
    </nav>
  </header>
<main id="main" class="events-main">${content}</main>
<footer class="events-footer"><div class="events-footer-top"><a class="footer-wordmark" href="/">ReignVillage</a><nav aria-label="Footer"><a href="/company.html">About</a><a href="/careers.html">Careers</a><a href="/car-shows/">Car-show guide</a><a href="/guides/what-car-is-this/">Identification guide</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></nav></div><p>Event details can change. Confirm with the organizer before traveling.</p><p>© 2026 ReignVillage LLC.</p></footer>
<script src="/site.js?v=20261116-nav" defer></script><script src="/events.js" defer></script></body></html>`;
}
export const appBanner = () =>
  `<section class="events-app-banner"><div><h2>Make a day of it.</h2><p>Keep event details close in RevvRadar.</p></div>${appLink()}</section>`;
