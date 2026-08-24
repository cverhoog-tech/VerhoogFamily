# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications remains the current phase. Notification/Web Push implementation and iPhone opt-in are complete; real second-account/cross-device delivery and isolation acceptance remain open.**

STEP 8 Finance and STEP 9 Progression are accepted/frozen. Main and production Firebase Rules remain untouched.

The latest side-request checkpoint also hardens account/session UX needed for the STEP 10 cross-device test: Profile and Meer now expose canonical Firebase **Uitloggen**, `Verse start` is removed from the served Meer runtime, and authenticated Profile name/partner values are UID-scoped so a new browser account cannot inherit another account's `Shane` / `Esra` local profile defaults. The earlier **Gezin verlaten** normal-member flow has been real-tested by the product owner and accepted; owner-transfer smoke testing remains open.

Latest code checkpoint:
- commit `2ff8ecf2500702ca835531ff1c3f5c95ce9a1486`
- `Household Rebuild Contracts` SUCCESS, run `32787576487`
- Vercel Preview `dpl_FDvW1mNDW5yC5RHidRVTzQTL1YDM` READY
- deployed `/api/app` directly verified with `sessionActions.js?v=1` before Profile/Navigation and **without** `freshStartReset.js`

Do **not** freeze STEP 10 yet.

## Frozen phases

- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen 2026-08-24.

## STEP 10 — Notifications

### Canonical notification state — complete
- [x] `NotificationHouseholdRepository v1.0.0` at `families/{householdId}/shared/notifications`.
- [x] HouseholdContext UID + household + revision identity.
- [x] Exact listener teardown, immediate projection clear and stale-callback rejection.
- [x] Per-UID `readBy` / `dismissedBy` state.
- [x] Deterministic `eventKey` / `publishOnce()` idempotency.
- [x] `NotificationStore v2.1.0`; unkeyed publishing rejected.
- [x] Push handoff only for newly created canonical events.
- [x] Push failure cannot undo canonical inbox success.
- [x] Deterministic Task / Swap / Party Quest / Finance notification events and projectors.
- [x] Notification actions, center and live in-app delivery use HouseholdContext identity.
- [x] Profile → Meldingen routes to the canonical notification screen.

### Web Push client / sender — complete in code/config
- [x] Private multi-device registry at `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Explicit opt-in only; startup never requests Notification permission.
- [x] iPhone requires Home Screen / standalone context before opt-in.
- [x] Account/UID switch invalidates previous browser push transport.
- [x] FCM service worker handles background delivery + click routing.
- [x] Foreground FCM does not create duplicate canonical inbox events.
- [x] `/api/push-config` requires both VAPID and trusted sender readiness.
- [x] Sender credentials remain server-only and are never returned publicly.
- [x] Vercel trusted sender verifies Firebase identity, household membership and canonical event actor.
- [x] Server resolves intended recipients and enabled private devices; client cannot choose raw recipient tokens/title/body.
- [x] Private per-device delivery receipts provide idempotency and delivery health.
- [x] Preview environment has required VAPID + protected Firebase sender credentials.
- [x] Runtime readiness previously verified `configured=true`, `vapidConfigured=true`, `senderConfigured=true`.
- [x] Real iPhone Home Screen opt-in accepted; device reached enabled push-registration state.

### Auth / household onboarding blocker — fixed, real retest open
- [x] `HOUSEHOLD_REQUIRED` and `HOUSEHOLD_ACCESS_REQUIRED` route to household onboarding rather than generic network/startup failure.
- [x] Canonical served order: Google auth adapter → FamilyHousehold → onboarding bridge → AuthenticatedSessionController → HouseholdContext.
- [x] A stale/inaccessible household pointer is offered safe re-onboarding; no membership is silently restored.
- [ ] Real PC/browser retest: alternate Google account reaches **Nieuw gezin maken / Deelnemen aan gezin**.
- [ ] Join alternate account to the existing household using a fresh invite.
- [ ] Existing second household account retest; inspect actual membership/pointer state if it still fails.

### Profile / account lifecycle side requests
- [x] Profile → **Gezin verlaten** implemented with HouseholdContext/stale-identity protection.
- [x] Normal member leave removes only own membership + own household pointers; shared household data remains intact.
- [x] Owner leave requires an eligible successor and transfers ownership before removal.
- [x] Existing Rules support the leave/owner-transfer writes; no production Rules change was needed.
- [x] **Real normal-member Gezin verlaten test accepted by product owner on 2026-08-25.**
- [ ] Real owner-transfer leave smoke test remains open.
- [x] Added `FamilySessionActions v1.1.0` as the explicit Firebase sign-out boundary; it creates no second auth observer.
- [x] Profile contains **Uitloggen** and delegates to `FamilySessionActions.signOut()`.
- [x] Meer contains **Uitloggen** and survives dynamic More-menu rerenders.
- [x] Uitloggen only signs out the Firebase account; it does not leave the household, delete the account or delete shared data. `AuthenticatedSessionController` owns return to the login screen.
- [x] `Verse start` is removed from the actual served `/api/app` runtime / Meer menu; the old source file remains dormant only.
- [x] Authenticated Profile names use UID-scoped `familyapp-profile-name-v2:{uid}` storage.
- [x] Authenticated partner names use UID-scoped `familyapp-partner-name-v2:{uid}` storage and default to blank/optional instead of `Esra`.
- [x] A new authenticated account no longer reads the previous browser account's unscoped `Shane` / `Esra` Profile values.
- [x] `scripts/test-profile-session-actions.js` guards logout ownership, served load order, removal of Verse start and UID-scoped Profile fields.
- [ ] Real Preview test: Profile → Uitloggen returns to login screen and relogin works.
- [ ] Real Preview test: Meer → Uitloggen returns to login screen and relogin works.
- [ ] Real Preview test: alternate/new account Profile shows its own identity and blank partner instead of Shane / Esra.

### Latest contracts / deployment
- [x] Household leave contract remains green after Profile cache cutover.
- [x] Profile/session action contract added.
- [x] Full `Household Rebuild Contracts` SUCCESS on `2ff8ecf2500702ca835531ff1c3f5c95ce9a1486`, run `32787576487`.
- [x] Vercel deployment `dpl_FDvW1mNDW5yC5RHidRVTzQTL1YDM` READY for the same code commit.
- [x] Deployed `/api/app` verified with `src/core/sessionActions.js?v=1` before `profile.legacy.js` / `navigation.js`.
- [x] Deployed `/api/app` verified with no `src/app/freshStartReset.js` script.

### Remaining STEP 10 device acceptance
- [ ] Second household account authenticates and joins from PC/browser.
- [ ] PC/browser account A creates a targeted event for iPhone account B; B sees exactly one canonical unread inbox item.
- [ ] Background/closed-PWA OS push reaches the iPhone.
- [ ] Tapping push opens/focuses FamilyApp notifications without duplicate canonical inbox state.
- [ ] UID-specific read/dismiss survives reload/reconnect.
- [ ] Live in-app banner is visible only for the intended current identity.
- [ ] Actionable Task-help / Party Quest notification executes the canonical action.
- [ ] Account switch/logout never leaks inbox/banner/push registration from the previous UID.
- [ ] Reload/background→foreground remains stable: no freeze/white screen/WebKit crash.
- [ ] Freeze STEP 10 only after explicit product acceptance.

## Later roadmap phases

- [ ] STEP 11 — Party quests.
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta gate with at least three independent households.
- [ ] STEP 17 — Store distribution readiness.

## Standing guardrails

- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8 and STEP 9 remain frozen.
- UID/household identity comes from HouseholdContext / Firebase Auth, not browser-global demo defaults.
- Realtime subscriptions require exact cleanup + stale-context protection.
- Notification state and push delivery remain separate layers.
- Push/device credentials remain private technical user data.
- Server secrets never enter client/public repository code.
- Every meaningful development update updates both this TODO and `docs/FAMILYAPP-UPDATE-LOG.md` in the same work session.
