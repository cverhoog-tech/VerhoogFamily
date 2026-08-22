# FamilyApp — Legacy TODO audit

Date: 2026-08-22
Branch: `agent/household-rebuild-v2`

Purpose: reconcile the older May 2026 TODO lists with the current household-rebuild branch so stale items are not carried forward blindly.

Legend:
- ✅ Resolved / superseded by current architecture
- 🟡 Partially solved; keep as targeted hardening or verification
- ⬜ Still open
- 🧪 Needs real-device / cross-account verification before closing

## 1. Items that should be removed from the old generic TODO

### Feed persistence / realtime basics — ✅
The old TODO listed missing live comments, non-persistent likes and posts disappearing after refresh. The current branch now has `FeedSharedData` with household-scoped Firebase records, per-post/per-comment writes, UID-based likes/comments and realtime subscriptions. Treat the old generic feed-persistence items as resolved; keep only isolation/reconnect tests in the production-readiness tracker.

### Feed demo content — ✅
The old TODO asked to replace demo feed content. Current Feed startup no longer relies on demo posts as the authoritative source. Firebase/feedPosts is authoritative.

### Private household / invites / accounts / cloud sync as “future features” — ✅ superseded
These are no longer future concepts. Household identity, UID membership, invites, auth/session handling, FamilyDataStore and realtime module foundations exist. Remaining work belongs under hardening, security and isolation tests rather than under a generic future-feature list.

### Generic “realtime sync later” — ✅ superseded
Realtime is now implemented in multiple modules. Remaining work is module-specific production hardening, reconnect behavior and multi-household isolation.

### PWA/app icon branding — ✅
STEP 2B.5 is accepted and frozen: crest v5, manifest, Apple touch icon, favicon, maskable icon and transparent login crest are accepted on iPhone.

### Task category/detail/create icon migration — ✅
STEP 2B.6 is accepted and frozen. Do not carry old generic icon-alignment items forward unless a new regression is reported.

## 2. Old TODO items that are still relevant

### Carousel / hero reliability — 🧪
Keep as a compact regression checklist rather than an active refactor:
- iPhone Safari / Chrome mobile / desktop load consistency
- no white flashes
- no broken/over-zoomed crops
- gradients/overlays remain consistent
- Recipes / Agenda / Meals carousel smoke test

Do not start broad CSS rewrites unless a current regression is reproduced.

### Avatar system — 🟡 / 🧪
The architecture has moved toward UID/member-profile based identity, but the old cross-surface checklist remains useful:
- profile → feed
- notifications
- tasks
- comments
- activity cards
- account-switch cache safety
- upload/crop flow

Close each only after two-account testing. Cached-avatar cleanup remains a valid production-readiness concern.

### Feed UI polish — ⬜ low/medium priority
Potentially still relevant after current architecture work:
- composer spacing on small screens
- GIF alignment
- emoji-row spacing
- excessive card whitespace
- compact comment input
- floating assistant overlap

Bookmark alignment should only remain if still reproducible after the current icon work.

### Feed filtering — ⬜
Still a product feature, not a production blocker.

### Task visual polish — 🟡 / 🧪
Do not reopen the frozen 2B.6 icon baseline. Keep only separately reproducible items:
- hero/card image crops
- overlay opacity
- card spacing
- XP badge consistency
- side-quest label centering
- party-avatar overlap spacing
- delete UX beyond icon styling

### Home screen — ⬜ / 🧪
Still requires a focused current-state pass:
- greeting alignment on very small screens
- XP bar spacing
- carousel indicators
- activity compactness
- music button responsiveness
- assistant/bottom-nav overlap

### Profile — ⬜ / 🧪
Still potentially open:
- avatar selector category UX
- modal animation
- upload-photo cropper
- save feedback/toast
- partner/member edit UX

Some old naming assumptions may now be obsolete because identity is UID/household based; verify current implementation before coding.

### Navigation — 🧪
Keep as device/lifecycle tests:
- iPhone safe-area spacing
- bottom-nav spacing
- back navigation
- screen switching without unintended full-state refreshes

### Technical cleanup — ⬜
Still relevant, but should happen only after active modules are mapped:
- old/duplicate assets
- dead image/build folders
- duplicate/dead CSS
- large inline styles
- retired test/bridge modules
- cache-busting conventions

Avoid deleting files solely because they look old; verify runtime references through `api/app.js` first.

### Vercel / deployment cleanup — 🟡
Historical stale-deploy/cache issues existed. Current v5 and task work has deployed correctly, so this is no longer a broad blocker. Keep only:
- deterministic asset versioning
- cache invalidation rules
- verifying that branch commits produce the intended deployment

Do not perform a public-assets migration just because the old TODO suggested it; only do so if the current delivery architecture benefits measurably.

## 3. Current architecture work that replaces the old “future features” list

The authoritative roadmap is now `docs/MULTI-HOUSEHOLD-PRODUCTION-READINESS.md`.

Highest-value remaining work:

1. Household/Auth lifecycle hardening
   - account-switch on one device
   - removed-member access revocation
   - logout subscription/runtime cleanup
   - active household validation
   - offline/reconnect context safety

2. HouseholdContext adoption
   - central context now exists with `requireUser()`, `requireHousehold()`, scoped path helpers and lifecycle revision tokens
   - remaining modules must stop improvising household/UID resolution or silently falling back to globals

3. Multi-household isolation/security tests
   - cross-household read/write denial
   - removed-member denial
   - private UID data isolation
   - reconnect writes return to the original household only

4. Module hardening
   - Tasks
   - Shopping
   - Agenda
   - Recipes
   - Meals
   - Feed / Activity
   - Notifications
   - Finance
   - Progression
   - Profile / Presence
   - Home

5. Admin/beta operations foundation
   - platform-admin authorization separate from household roles
   - household health/diagnostics
   - beta cohorts / feature flags
   - scoped support actions and audit log

6. Legacy authority cleanup
   - inventory `localStorage`
   - inventory direct Firebase writes
   - route domain writes through central stores/services

## 4. Recommended next step

Do not jump back into broad visual polish yet.

Next implementation step should be a focused **Household/Auth lifecycle hardening pass** from the accepted 2B.5 + 2B.6 baseline, beginning with:

1. account-switch on the same device;
2. logout/listener cleanup;
3. activeHouseholdId validation;
4. removed-member access revocation;
5. tests proving no state leaks between two accounts/households.

After that, do a short visual regression sweep using the surviving UI checklist above.

## Guardrail

The accepted 2B.5 branding/PWA/login presentation and 2B.6 task icon/detail/create presentation are frozen and must not be changed by this audit or the next architecture phase unless an explicit regression is reported.
