# Legal Compliance Log — ReignVillage LLC

Tracks all compliance changes to legal pages (privacy policy, terms of service) with statutes addressed, verification status, and version history.

---

## February 11, 2026 — Privacy Policy Compliance Overhaul

**File:** `privacy.html`
**Prior Version:** `privacy-v1-nov2025.html`
**Triggered By:** Codex audit identifying 6 compliance risks

### Changes Made

| # | Severity | Finding | Fix Applied | Statute/Requirement |
|---|----------|---------|-------------|---------------------|
| 1 | P0 | CPRA opt-out paywalled ("upgrade to Pro/Premium") | Replaced with "Free of Charge" opt-out via iOS Settings + email + GPC signals | Cal. Civ. Code §1798.135, CPPA Regs §§7013/7026 |
| 2 | P0 | State rights section generic (VA/CO/CT/UT) | Added dedicated subsections per state with rights, 45-day timelines, appeal processes (60-day), AG complaint links | VA Code §59.1-577, CT Chap 743jj, CO CPA, UT UCPA |
| 3 | P0 | No "Changes to This Policy" section | Added Section 15 with 30-day material change notice, email/in-app notification, prior version requests | GDPR Art. 13(2)(e), Apple Guidelines 5.1.1 |
| 4 | P0 | Section 5 "do not sell" misleading vs "sharing" | Changed to "for monetary consideration" with clarifying note linking to CCPA sharing disclosure | CCPA/CPRA distinction |
| 5 | P2 | EU/UK supervisory authority complaint rights missing | Added Section 16 with GDPR Arts. 18, 21, 22 rights + EDPB link + ICO complaint link | GDPR Art. 13(2)(d), Art. 18, 21, 22 |
| 6 | P2 | Security section too thin, no breach notification | Added breach notification subsection (72hr GDPR, 30-day WA RCW 19.255.010) + incident response statement | GDPR Art. 33/34, WA RCW 19.255.010 |
| 7 | P2 | No GPC signal recognition | Added GPC mention in CPRA opt-out section + Colorado state section | CO CPA universal opt-out requirement |
| 8 | P3 | Ad section paywalled language | Clarified free opt-out alongside subscription benefit | CPRA §1798.135 |
| 9 | P3 | Copyright 2025 | Updated to 2026 | — |
| 10 | P3 | Last Updated stale | Updated to February 11, 2026 | — |
| 11 | — | "Other States" catch-all missing | Added OR/TX/MT/IA/IN/TN coverage paragraph | Emerging state privacy laws |
| 12 | — | Contact section numbering | Renumbered to Section 17 (was 15) | — |
| 13 | — | Sidebar navigation | Added "Changes to This Policy" + "International Users" links | — |

### Section Structure After Update

| # | Section | Status |
|---|---------|--------|
| 1-10 | (Unchanged) | Existing |
| 11 | Your Privacy Rights — now includes VA/CO/CT/UT/Other States detail | Updated |
| 12 | California Residents CCPA/CPRA — opt-out language fixed | Updated |
| 13 | Data Security — breach notification added | Updated |
| 14 | Children's Privacy | Unchanged |
| 15 | Changes to This Privacy Policy | **New** |
| 16 | International Users & EU/UK Rights | **New** |
| 17 | Contact Us | Renumbered (was 15) |

### Verification

- `curl -s https://revvradar.com/privacy | grep "Last Updated"` → confirmed `February 11, 2026`
- `curl -s https://reignvillage.com/privacy | grep "Last Updated"` → confirmed `February 11, 2026`
- Both domains serve identical content (diff confirmed, only Cloudflare email obfuscation tokens differ)

---

## February 11, 2026 — Terms of Service Compliance Fixes

**File:** `terms.html`
**Triggered By:** Legal compliance audit of ToS against updated privacy policy and Apple requirements

### Changes Made

| # | Severity | Finding | Fix Applied | Requirement |
|---|----------|---------|-------------|-------------|
| 1 | High | Missing Apple EULA third-party beneficiary clause | Added full Apple EULA language: third-party beneficiary acknowledgment, scope of license, maintenance/support, product claims, IP responsibility | Apple App Store Review Guideline 3.1.2, Apple Minimum Terms |
| 2 | High | Subscription capture limits wrong (10/25) | Updated to Pro: 20/day, Premium: 40/day | Production parity |
| 3 | High | Auto-renewal missing explicit period/price | Added "monthly basis" renewal, Apple ID charging, explicit prices ($4.99/$9.99), price change protection | Apple subscription disclosure requirements |
| 4 | High | Copyright 2025 | Updated to 2026 | — |
| 5 | High | Last Updated stale (Jan 31, 2025) | Updated to February 11, 2026 | — |
| 6 | Medium | Banned "spotting" in 3 locations | Replaced with "discovery," "capturing," "capture features" | ReignVillage brand guidelines |
| 7 | Medium | "We don't sell" oversimplified vs privacy policy | Changed to "for monetary consideration" with Privacy Policy link for ad-related opt-out | CCPA/CPRA consistency |

### Verification

- `curl -s https://revvradar.com/terms | grep "Last Updated"` → confirmed `February 11, 2026`
- `curl -s https://revvradar.com/terms | grep "third-party beneficiaries of these Terms"` → confirmed present
- `curl -s https://revvradar.com/terms | grep "captures per day"` → confirmed 20/day and 40/day

---

## Version History

| Date | File | Version | Git Commit | Summary |
|------|------|---------|------------|---------|
| Nov 3, 2025 | privacy.html | v1 | (pre-audit) | Original policy |
| Feb 11, 2026 | privacy.html | v2 (current) | `418c0db` | CPRA fix, state rights, breach notification, EU/UK rights, GPC |
| Feb 11, 2026 | privacy-v1-nov2025.html | archive | `418c0db` | Archived v1 for prior version requests (Section 15 commitment) |
| Jan 31, 2025 | terms.html | v1 | (pre-audit) | Original ToS |
| Feb 11, 2026 | terms.html | v2 (current) | `933fc11` | Apple EULA, capture limits, renewal terms, banned words, sale/share |

---

## Known Remaining Items (Not Blocking Launch)

| Item | Severity | Notes |
|------|----------|-------|
| EU representative designation (GDPR Art. 27) | Low | Monitor need as EU user base grows |
| Username reservation post-deletion vs GDPR erasure | Low | Arguably legitimate interest; add retention limit if challenged |
| Free trial / introductory offer terms | Low | Add to ToS if trials are ever offered |
| Data portability mention in ToS | Low | Covered in privacy policy Section 11 |
| ToS inactivity termination (180 days) vs privacy retention schedule | Low | Consider adding advance notice requirement |

---

## Compliance Review Cadence

- **Before each App Store submission:** Re-read both pages against current feature set
- **Quarterly:** Check for new state privacy laws taking effect
- **On material feature changes:** Update both pages if data practices change (e.g., new AI model, new ad partner, Android launch)
- **Versioning rule:** Save prior version as `{page}-v{N}-{month}{year}.html` before overwriting
