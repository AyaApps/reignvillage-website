# ReignVillage Website Management Guide

**Last Updated:** November 3, 2025
**Website:** https://reignvillage.com
**Repository:** https://github.com/AyaApps/reignvillage-website

---

## Table of Contents

1. [Website Overview](#website-overview)
2. [File Structure](#file-structure)
3. [Common Updates](#common-updates)
4. [Image Management](#image-management)
5. [Deployment Process](#deployment-process)
6. [Domain & DNS](#domain--dns)
7. [Social Media Links](#social-media-links)
8. [Troubleshooting](#troubleshooting)

---

## Website Overview

**Tech Stack:**
- Static HTML/CSS/JavaScript
- Tailwind CSS (via CDN)
- Hosted on Cloudflare Pages
- Images hosted on Cloudflare R2

**Pages:**
- `index.html` - Homepage
- `company.html` - About ReignVillage
- `careers.html` - Job listings
- `contact.html` - Contact information
- `privacy.html` - Privacy Policy (GDPR/CCPA/COPPA compliant)
- `terms.html` - Terms of Service

**Key Features:**
- Fully responsive (mobile/tablet/desktop)
- Dark theme with purple accent colors
- Legal compliance (GDPR, CCPA, COPPA)
- Auto-deploys on git push to main branch

---

## File Structure

```
reignvillage-website/
├── index.html              # Homepage
├── company.html            # Company/About page
├── careers.html            # Careers page
├── contact.html            # Contact page
├── privacy.html            # Privacy Policy
├── terms.html              # Terms of Service
└── WEBSITE_MANAGEMENT_GUIDE.md  # This file
```

**Navigation Structure:**
- Logo: Links to `index.html`
- Nav: Home, Company, Careers, Apps
- Footer: Home, Company, Careers, Privacy, Terms, Contact
- Social: X (Twitter), Instagram

---

## Common Updates

### Update Company Information

**Location:** All pages (footer section)

```html
<!-- Find this in footer -->
<p class="text-gray-400">Building apps for passionate communities</p>
```

**Update to:**
```html
<p class="text-gray-400">Your new tagline here</p>
```

### Update Contact Emails

**Current emails:**
- `hello@reignvillage.com` - General inquiries
- `support@revvradar.com` - Support requests
- `admin@reignvillage.com` - DMCA/legal notices

**Files to update:**
- `contact.html` - Contact cards
- `privacy.html` - Contact sections
- `terms.html` - Legal contact info

### Update Social Media Links

**Current links:**
- X (Twitter): `https://x.com/ReignVillage`
- Instagram: `https://www.instagram.com/reignvillage/`

**Find and replace in all files:**
```html
<a href="https://x.com/ReignVillage" target="_blank" rel="noopener noreferrer">
```

### Update Subscription Pricing

**Current tiers:**
- Free: 3 captures/day, standard ads
- Pro: $4.99/month, 10 captures/day, reduced ads
- Premium: $9.99/month, 25 captures/day, reduced ads

**Files to update:**
1. `privacy.html` - Section 2 (Information We Collect)
2. `terms.html` - Section 6 (Subscriptions and Billing)

**⚠️ Important:** Always update BOTH files to keep them in sync!

### Add New App to Portfolio

**Files to update:**
1. `index.html` - Map-First Discovery Series section (line ~237)
2. `company.html` - Map-First Discovery Series section (line ~168)

**Current structure:**
```html
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
    <!-- RevvRadar -->
    <!-- Coming Soon -->
    <!-- Coming Soon -->
</div>
```

**To add new app, replace a "Coming Soon" card with:**
```html
<div class="relative rounded-2xl overflow-hidden border border-purple-500/50 min-h-[300px] flex items-center justify-center bg-cover bg-center" style="background-image: url('YOUR_IMAGE_URL');">
    <div class="absolute inset-0 bg-black/80"></div>
    <div class="relative z-10 text-center px-8">
        <h3 class="text-3xl font-bold text-white">Your App Name</h3>
    </div>
</div>
```

---

## Image Management

### Cloudflare R2 Storage

**R2 Bucket URL:**
```
https://pub-aef47bf47d644c55906d6ddc11228afd.r2.dev
```

**Current images:**
- iPhone Screenshot: `Simulator Screenshot - iPhone 17 Pro - 2025-11-03 at 13.29.07.png`
- RevvRadar Background: `pexels-egeardaphotos-2148533277-30652583.jpg`

### Adding New Images

1. **Upload to R2:**
   - Go to Cloudflare Dashboard → R2
   - Select your bucket
   - Click "Upload" and select images
   - Rename files without spaces (use hyphens: `my-image.jpg`)

2. **Get Image URL:**
   ```
   https://pub-aef47bf47d644c55906d6ddc11228afd.r2.dev/YOUR-IMAGE-NAME.jpg
   ```

3. **Update HTML:**
   ```html
   <img src="https://pub-aef47bf47d644c55906d6ddc11228afd.r2.dev/YOUR-IMAGE-NAME.jpg" alt="Description">
   ```

4. **For background images:**
   ```html
   style="background-image: url('https://pub-aef47bf47d644c55906d6ddc11228afd.r2.dev/YOUR-IMAGE-NAME.jpg');"
   ```

### Image Best Practices

- **Format:** Use JPG for photos, PNG for graphics with transparency
- **Size:** Optimize images before uploading (max 1920px width for backgrounds)
- **Naming:** Use lowercase, hyphens instead of spaces (`revvradar-hero.jpg`)
- **Alt text:** Always include descriptive alt text for accessibility

---

## Deployment Process

### Automatic Deployment (Default)

**Every git push to `main` branch automatically deploys:**

```bash
# Make your changes to HTML files
git add .
git commit -m "Description of changes"
git push
```

**Deployment time:** 30-60 seconds
**You'll receive:** Email notification when deployment completes

### Manual Deployment

If automatic deployment fails:

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → `reignvillage-website`
3. Click "Create deployment"
4. Select branch: `main`
5. Click "Deploy"

### Deployment Settings

**Current configuration:**
- Framework preset: **None**
- Build command: **(empty)**
- Build output directory: **/**
- Root directory: **/** (default)

**⚠️ Never change these settings** - this is a static site with no build process.

---

## Domain & DNS

### Current Setup

**Primary Domain:** `reignvillage.com`
**Cloudflare Pages URL:** `https://reignvillage-website.pages.dev`
**Nameservers:** Managed by Cloudflare

### Domain Configuration

**DNS Records (managed automatically by Cloudflare Pages):**
- `reignvillage.com` → Cloudflare Pages
- `www.reignvillage.com` → Cloudflare Pages

### Secondary Domains

**If you have `.co` or other domains:**

**Option 1: Redirect (Recommended)**
1. Go to GoDaddy → Domain Settings
2. Set up Domain Forwarding
3. Forward to `https://reignvillage.com`
4. Choose "301 Permanent Redirect"

**Option 2: Add to Cloudflare**
1. Add domain to Cloudflare
2. Update nameservers on registrar (GoDaddy)
3. Add as custom domain in Pages project
4. Wait 24-48 hours for propagation

### Checking DNS Propagation

Use: https://www.whatsmydns.net/#NS/reignvillage.com

---

## Social Media Links

### Current Accounts

| Platform | Handle | URL |
|----------|--------|-----|
| X (Twitter) | @ReignVillage | https://x.com/ReignVillage |
| Instagram | @reignvillage | https://www.instagram.com/reignvillage/ |

### Updating Social Links

**All pages have social icons in navigation. To update:**

1. Find this code in all HTML files:
```html
<a href="https://x.com/ReignVillage" target="_blank" rel="noopener noreferrer">
```

2. Update URL to new account

3. **Files to update:**
   - index.html
   - company.html
   - careers.html
   - contact.html
   - privacy.html
   - terms.html

### Adding New Social Platform

**Icons use SVG. Find icon code at:** https://simpleicons.org/

**Example adding TikTok:**
```html
<a href="https://www.tiktok.com/@reignvillage" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition">
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <!-- TikTok SVG path here -->
    </svg>
</a>
```

---

## Troubleshooting

### Site Shows 404 Error

**Cause:** Missing `index.html` in root directory

**Fix:**
1. Ensure homepage is named `index.html` (not `index-new.html`)
2. Commit and push changes
3. Wait for deployment

### Images Not Loading

**Cause:** R2 bucket not public or wrong URL

**Fix:**
1. Go to Cloudflare R2 → Your bucket
2. Enable "Public Development URL"
3. Use the provided URL in your HTML
4. Check image filename matches exactly (case-sensitive)

### Changes Not Appearing

**Cause:** Browser cache or deployment still in progress

**Fix:**
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check Cloudflare Pages dashboard for deployment status
3. Wait 1-2 minutes for CDN cache to clear

### Broken Navigation Links

**Cause:** Incorrect file references after renaming files

**Fix:**
1. Search all HTML files for old filename
2. Replace with correct filename
3. Example: Find `index-new.html`, replace with `index.html`

### SSL/HTTPS Not Working

**Cause:** DNS propagation incomplete or Cloudflare SSL not activated

**Fix:**
1. Wait 24-48 hours for DNS propagation
2. Check Cloudflare Dashboard → SSL/TLS → Overview
3. Ensure mode is set to "Full" or "Flexible"
4. Check custom domain status in Pages project

### Deployment Fails

**Cause:** Trying to use build command or wrong framework

**Fix:**
1. Go to Cloudflare Pages → Settings → Build & deployments
2. Ensure:
   - Framework preset: **None**
   - Build command: **(empty)**
   - Build output directory: **/**
3. Retry deployment

---

## Quick Reference Commands

### Git Workflow

```bash
# Check status
git status

# Stage all changes
git add .

# Commit with message
git commit -m "Your descriptive message here"

# Push to deploy
git push

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Common Updates Checklist

**When updating company info:**
- [ ] Update footer on all 6 pages
- [ ] Update contact.html cards
- [ ] Commit and push

**When updating subscription pricing:**
- [ ] Update privacy.html Section 2
- [ ] Update terms.html Section 6
- [ ] Verify both match
- [ ] Commit and push

**When adding new social account:**
- [ ] Update all 6 HTML files
- [ ] Test links open in new tab
- [ ] Verify icon displays correctly
- [ ] Commit and push

**When adding new image:**
- [ ] Optimize image size
- [ ] Rename without spaces
- [ ] Upload to R2
- [ ] Get public URL
- [ ] Update HTML with URL
- [ ] Add alt text
- [ ] Test on live site
- [ ] Commit and push

---

## Support Contacts

**Repository:** https://github.com/AyaApps/reignvillage-website
**Cloudflare Dashboard:** https://dash.cloudflare.com/
**Domain Registrar:** GoDaddy

**Questions?** Contact technical support or refer to this guide.

---

**Document Version:** 1.0
**Last Reviewed:** November 3, 2025
