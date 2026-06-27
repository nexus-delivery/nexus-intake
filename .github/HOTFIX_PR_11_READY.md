# HOTFIX PR #11 — Ready for Review

**PR:** https://github.com/nexus-delivery/nexus-intake/pull/11
**Branch:** `copilot/hotfix-wire-booking-buttons`
**Status:** ✅ READY FOR REVIEW

## Summary

Wires merchant dashboard buttons to the unified `/portal/intake` booking flow.

### Changes
- ✅ Added "Create Job" CTA button to merchant portal dashboard
- ✅ Renamed sidebar "Document Upload" → "New Booking" with PlusCircle icon
- ✅ Removed broken 404 routes: "/portal/upload", "/portal/drafts"
- ✅ All booking entry points now route to `/portal/intake`

### Files Changed
1. `src/app/portal/page.tsx` — Added dashboard CTA button
2. `src/lib/merchantNavigation.ts` — Updated navigation structure
3. `src/components/MerchantSidebar.tsx` — Added PlusCircle icon

### Verification
- ✅ Build passing
- ✅ Lint passing  
- ✅ No schema changes
- ✅ No duplicates
- ✅ Mergeable: `clean` status
- ✅ All required checks passing

## How to Review

1. View PR: https://github.com/nexus-delivery/nexus-intake/pull/11
2. Test Vercel preview if available
3. Approve when ready
4. Merge to `main`

## Test Checklist

- [ ] Dashboard loads without errors
- [ ] "Create Job" button visible in header
- [ ] Click "Create Job" → navigates to `/portal/intake` ✓
- [ ] Sidebar "New Booking" item is highlighted with PlusCircle icon ✓
- [ ] Click "New Booking" → navigates to `/portal/intake` ✓
- [ ] BookingMethodSelector appears with "Upload Document" and "Enter Job Details" ✓
- [ ] Upload Document path works ✓
- [ ] Enter Job Details path works ✓
