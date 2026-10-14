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

## October 7 — Workers asset upload correction

Founder-supplied CI log confirms automatic Wrangler setup installed node_modules inside the root asset directory, then tried to upload workerd (129 MiB), exceeding the 25 MiB per-asset limit. The inferred Worker name was correct; earlier name-mismatch suspicion is superseded. Added root `.assetsignore` using Cloudflare's documented gitignore syntax to omit dependencies, Git/cache/config files, server source, tests and internal Markdown. Public HTML/CSS/JS, media, fonts, redirects and `.well-known` remain assets. Pages functions stay in place and this does not migrate hosting or change dashboard settings. Workers remains the existing secondary static deployment; production dynamic events are served by Pages.

Validation: 19 tests pass; explicit-assets Wrangler dry-run uses the existing deployment date. Production build checks must confirm the upload after push.

## October 14 — organizer submissions and phone event navigation

Founder authorized the public website release and then source review/commit to preserve
it. This source update exactly matches the tested live organizer overlay deployed as
Pages c7dfdf51-1316-4e45-b397-e8e340377bca, based on remote main 835dbce. Original dirty
website checkout is preserved; use the committed remote source for later deployments.

- Visible Explore events / Submit an event shortcuts on phones, desktop/menu Submit
  entry, and corrected event-directory links on the RevvRadar product page.
- Private organizer intake proxy, spam-check widget, concise conduct guidelines and
  same-page receipt. No automatic event publication. Optional flyer, description,
  admission details, street address and end time; event basics, start time, source,
  contact and venue/conduct permission still required. Supplied flyers still need
  valid format/size/ratio, description and display permission in the backend.
- Public event projection excludes private contact/review evidence. Approved supplied
  artwork validates the event occurrence; linked-capture fallback is prepared but
  disabled in production. Listings can appear without artwork.
- Unconfirmed receipts preserve the request ID and payload for retry; malformed,
  cross-origin and oversized requests fail before proxy transport.

Validation: all 30 Node tests pass, exact 16-file live-overlay hashes match, and Pages
Worker compilation passes. Git index/secret/CI-dependency safety check is required
before commit and outgoing history is checked before push. Earlier live checks verified
public shortcuts/form/redirect/client and invalid/guest request rejection; no new
production submissions or emails are needed for source persistence. Phone DOM at 320px
was checked; actual-device visual acceptance remains founder-owned. No iOS build.

Existing production Pages bindings remain EVENT_SUBMISSIONS_ENABLED=true, matching
EVENT_SUBMISSION_SITE_KEY, EVENT_WEBSITE_MEDIA_ENABLED=false. Backend intake/email are
active while EVENT_SUBMISSION_PUBLICATION_ENABLED=false. No settings/credentials are
added to source, and no event publication gate is changed by this commit.
Signed-in Retool review and its latest local source sync remain pending. Social media
work is paused. Future automatic/static deployments must retain this source; dynamic
Events still run through the existing Pages Functions, not the secondary static Worker.
