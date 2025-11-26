# Waitlist Email Collection Setup

Firebase infrastructure for collecting email signups from reignvillage.com website.

## Overview

**Zero-Investment Strategy**: Uses Firebase free tier only (Firestore + Cloud Functions)

**Features**:
- Email validation via Firestore security rules
- Client-side rate limiting (1 submission per minute)
- Source tracking (homepage, company, contact)
- Admin-only read access to email list
- Optional auto-reply confirmation (currently disabled to stay on free tier)

## Architecture

```
Website Form → Firebase Firestore → Cloud Function Trigger → Stats Update
     ↓                                      ↓
 waitlist.js                        (Optional: Email confirmation)
```

## Setup Instructions

### 1. Deploy Firestore Security Rules

The security rules enforce:
- Email format validation
- Required fields (email, timestamp, source)
- Public write (create only)
- Admin-only read access

```bash
cd /Users/clintnursejr/Downloads/Enthusiast-main
firebase deploy --only firestore:rules
```

### 2. Deploy Cloud Functions

```bash
cd /Users/clintnursejr/Downloads/Enthusiast-main/functions
npm run deploy
```

This deploys:
- `onWaitlistSignup`: Triggered on new waitlist entry, updates stats
- `getWaitlistStats`: Callable function for admins to view stats

### 3. Add to Website HTML

Add to any page where you want the waitlist form (e.g., `index.html`):

```html
<!-- Firebase SDK (before closing </body>) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- Waitlist integration -->
<script src="waitlist.js"></script>

<!-- Waitlist form -->
<form id="waitlist-form">
  <input
    type="email"
    id="waitlist-email"
    placeholder="Enter your email"
    required
  >
  <button type="submit">Join Waitlist</button>
  <div id="waitlist-message"></div>
</form>

<!-- Basic styling for messages -->
<style>
  #waitlist-message {
    display: none;
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
  }
  .success-message {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
</style>
```

### 4. Test the Integration

**Manual Test**:
1. Open website in browser
2. Enter email in form
3. Submit
4. Check Firebase Console → Firestore → `waitlist` collection

**Test Email**: Use `test@example.com` or your own email

### 5. View Waitlist Emails (Admin Only)

**Option A: Firebase Console**
1. Go to Firebase Console: https://console.firebase.google.com/project/enthusiast-c3c4a
2. Navigate to Firestore Database
3. Open `waitlist` collection
4. View all entries with email, timestamp, source

**Option B: UI Bakery Dashboard** (recommended for production)
1. Create read-only query: `SELECT * FROM waitlist ORDER BY timestamp DESC`
2. Add table component showing email, timestamp, source
3. Add export button for CSV download

**Option C: Cloud Function** (admin access from iOS app)
```swift
// Call from admin panel in iOS app
let functions = Functions.functions()
functions.httpsCallable("getWaitlistStats").call { result, error in
    if let data = result?.data as? [String: Any] {
        let totalSignups = data["totalSignups"] as? Int ?? 0
        let sources = data["sources"] as? [String: Int] ?? [:]
        print("Total signups: \(totalSignups)")
        print("By source: \(sources)")
    }
}
```

## Firestore Schema

### Collection: `waitlist`

```typescript
{
  email: string;          // Validated email address (lowercase, trimmed)
  timestamp: Timestamp;   // Server timestamp when submitted
  source: string;         // Page where signup occurred (homepage, company, contact)
}
```

**Example Document**:
```json
{
  "email": "user@example.com",
  "timestamp": "2025-11-19T12:34:56.789Z",
  "source": "homepage"
}
```

### Collection: `waitlist_stats`

Document ID: `global`

```typescript
{
  totalSignups: number;              // Total count of all signups
  lastUpdated: Timestamp;            // Last time stats were updated
  sources: {                         // Breakdown by source page
    homepage: number;
    company: number;
    contact: number;
  }
}
```

## Security & Privacy

**Data Collection**:
- Only email address is stored
- No analytics tracking on website
- No user authentication required
- Compliant with privacy policy

**Rate Limiting**:
- Client-side: 1 submission per minute (localStorage)
- Firestore rules: Email format validation
- Future: Server-side rate limiting via Cloud Functions (if spam becomes issue)

**Access Control**:
- Public: Can only create new entries
- Users: Cannot read any entries (privacy)
- Admins: Full read access via Firebase Admin SDK

## Cost Analysis (Firebase Free Tier)

**Firestore**:
- Writes: 20K/day free (1 write per signup = 20K signups/day)
- Reads: 50K/day free (admin views only)
- Storage: 1GB free (emails are tiny)

**Cloud Functions**:
- Invocations: 2M/month free
- Compute time: 400K GB-seconds/month free
- Network egress: 5GB/month free

**Estimated Capacity**: 600K signups/month before hitting free tier limits

**Cost if Exceeds Free Tier**:
- $0.06 per 100K document writes
- $0.02 per 100K document reads
- Essentially free for realistic pre-launch volume

## Optional Enhancements (Future)

### Email Confirmation (Requires Paid Service)

**Option 1: SendGrid** (Free tier: 100 emails/day)
```bash
firebase ext:install sendgrid/firebase-send-email
```

**Option 2: Mailchimp** (Free tier: 500 emails/month)
```bash
# Configure via Cloud Function HTTP trigger
```

**Option 3: Firebase Extensions - Trigger Email**
```bash
firebase ext:install firebase/firestore-send-email
```

### Export to CSV (Admin Function)

Add to `waitlistFunctions.ts`:
```typescript
export const exportWaitlist = onCall(async (data, context) => {
  // Check admin
  if (!context.auth?.token.admin) throw new HttpsError(...);

  // Query all waitlist entries
  const snapshot = await firestore.collection('waitlist')
    .orderBy('timestamp', 'desc')
    .get();

  // Convert to CSV
  const csv = snapshot.docs.map(doc => {
    const data = doc.data();
    return `${data.email},${data.timestamp.toDate()},${data.source}`;
  }).join('\n');

  return { csv: `email,timestamp,source\n${csv}` };
});
```

### Duplicate Email Prevention

Update security rules to check for existing email (requires composite index):
```javascript
allow create: if
  // ... existing validation ...
  && !exists(/databases/$(database)/documents/waitlist/$(request.resource.data.email));
```

Note: This would require using email as document ID instead of auto-generated ID.

## Deployment Checklist

- [ ] Deploy Firestore security rules
- [ ] Deploy Cloud Functions
- [ ] Add Firebase SDK scripts to website HTML
- [ ] Add `waitlist.js` to website
- [ ] Add waitlist form to desired pages
- [ ] Test email submission
- [ ] Verify data appears in Firebase Console
- [ ] Set up admin dashboard view (UI Bakery)
- [ ] Add waitlist export functionality (optional)
- [ ] Configure email confirmations (optional, post-launch)

## Troubleshooting

**Error: "Permission denied"**
- Check Firestore rules deployed correctly
- Verify email format is valid
- Check browser console for security rule violations

**Error: "Please wait X seconds"**
- Client-side rate limiting active
- Wait 60 seconds between submissions from same browser
- Clear localStorage to reset: `localStorage.removeItem('waitlist_last_submit')`

**Emails not appearing in Firestore**
- Check browser console for JavaScript errors
- Verify Firebase SDK loaded correctly
- Check network tab for failed API calls
- Ensure firebaseConfig matches your project

**Stats not updating**
- Check Cloud Functions logs in Firebase Console
- Verify `onWaitlistSignup` function deployed successfully
- Check for errors in function execution logs

## Files Modified/Created

**iOS App Repository** (`/Users/clintnursejr/Downloads/Enthusiast-main/`):
- `firestore.rules` - Added waitlist security rules
- `functions/src/waitlistFunctions.ts` - New Cloud Functions
- `functions/src/index.ts` - Export waitlist functions

**Website Repository** (`/Users/clintnursejr/Desktop/reignvillage-website/`):
- `waitlist.js` - Client-side integration
- `WAITLIST_SETUP.md` - This documentation

## Next Steps

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Deploy Cloud Functions: `cd functions && npm run deploy`
3. Copy `waitlist.js` to website (already in `/Users/clintnursejr/Desktop/reignvillage-website/`)
4. Add form + scripts to `index.html` or create dedicated landing page
5. Test submission
6. Push website changes to GitHub (auto-deploys to Cloudflare Pages)
7. Monitor Firebase Console for signups
