# October 7, 2026 — event directory and App Store preview

Founder authorized commit/push/publication in the website-events chat. Release is based on remote 979be32, preserving its analytics and identification-guide changes. Excludes unrelated local edits, deleted map artwork, Finder files and Wrangler cache. The source website checkout remains dirty; use this commit as the release source of truth.

## Delivered

- Neutral shared marketing palette; no brand accent color has been selected.
- Public event directory, exact-city pages and stable event details; 17 reviewed public IDs read on demand, five-minute cache, no database writes or credentials. New IDs require selection review and deployment.
- Event/city sitemap in robots.txt; server-rendered Event, CollectionPage/ItemList and BreadcrumbList markup; canonical URLs; noindex for filter/preview/empty pages; retryable 503 instead of stale source data.
- Optimized version of founder-provided `revvradar-discover-local-car-scene-app-preview29s.mp4`: 720×1560, ~30 seconds, 9.13 MB (source 41.32 MB), matching poster, native controls, muted autoplay only without reduced-motion/data-saving preference, pause when tab hidden. VideoObject metadata uses this website publication date. Native Play remains available if autoplay is blocked.
- `/e/{id}` web fallback to canonical details. Installed-device Universal Link behavior still needs physical-device verification; standalone App Store links remain available.

## Design review, October 7

1. Directory: healthy. Compact date tiles and two-column text cards make dates/admission easy to scan; city/date search is immediately available.
2. Seattle city: healthy with limited inventory. One real listing is shown honestly; no invented popularity or coverage counters.
3. Seattle detail: healthy. Strong heading, source attribution and a practical visit panel; narrow view puts logistics first. Fixed duplicate city text in full addresses.
4. App preview: plays and pauses using native controls, correct video dimensions and duration confirmed.

Ryvve reference uses red/gold accents, prominent aggregate counts and image-led event cards; GetOutGarage uses persistent side navigation, dense social/attendance panels and a flyer thumbnail. Our neutral/date-led layout, typography and information priority differ. Shared conventions (city browsing, dates, directions) are useful industry patterns. No competitor copy/assets were imported. Reviewed current browser screenshots; capture tools returned inline images, not saved local artifacts, so this is a bounded visual review, not a complete formal accessibility audit.

References: https://www.ryvve.app/events ; https://www.getoutgarage.com/events/auto-shows-expos/WA/seattle/seattle-international-auto-show-2026 . The latter lists conflicting Seattle dates; the organizer https://www.seattleautoshow.com/ confirms November 13–15, matching our data. Do not copy competitor dates.

## Validation / limits

19 Node tests cover data projection, caching, status/expiry, route errors, filters, metadata and JSON serialization. Local Cloudflare runtime compiles and serves live public data. Desktop directory→city→detail checked; narrow detail at measured 384px inner width/364px document had no horizontal overflow. Native video pause checked. No physical iPhone, VoiceOver, full browser matrix or separate audio-caption audit performed. Rich results/ranking/indexing are not guaranteed. Event image/offer metadata is intentionally absent when unverified; do not invent it for SEO.

Future captures: stable event ID is the join key; add a paginated, moderated public projection with privacy/deletion invalidation and occurrence boundaries. No user capture data is part of this release.

## Run / rollback

`npm test` uses Node's built-in runner; no framework dependencies. Cloudflare Pages builds `functions/`. `_routes.json` invokes only event/share paths. Cloudflare Workers static-assets autoconfig is a separate integration: verify the actual production domain after Pages deployment, not only GitHub check success. Revert this release commit to roll back; preserve later commits. No Firestore rollback is needed.
