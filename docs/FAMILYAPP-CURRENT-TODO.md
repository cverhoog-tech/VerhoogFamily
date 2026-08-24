# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: implementation, trusted sender, Preview configuration and iPhone standalone Web Push opt-in are complete; an auth/household onboarding hotfix is READY and must be device-retested before the real cross-device/background delivery gate continues.**

STEP 8 Finance and STEP 9 Progression are accepted/frozen. STEP 10 has one HouseholdContext-native notification authority, deterministic/idempotent events, UID-specific read/dismiss state, a private multi-device push registry, explicit Web Push opt-in, service-worker/FCM transport, best-effort push handoff, a trusted Vercel sender and a readiness endpoint that blocks the permission prompt until both the public VAPID key and protected sender credentials are present.

The iPhone Home Screen Web Push opt-in is accepted. During setup of the second account for the PC→iPhone delivery test, the login flow exposed a served-runtime household onboarding regression: the canonical `householdPlatform.js` / Google auth adapter were not in the active `/api/app` load graph and the session controller did not explicitly recognize the canonical `HOUSEHOLD_REQUIRED` setup marker. Commit `fae24eddef6163e9ac9180792167d847381e3b6d` restores deterministic auth/household ordering, adds `HouseholdOnboardingBridge v1.0.0`, recognizes missing/inaccessible household setup markers and routes stale permission-denied household pointers into safe re-onboarding rather than a generic startup error. A separate requested profile lifecycle action is now also implemented on commit `a3b17bbff075dbe00b4f9048b76ddadb2bc84e16`: Profile contains a guarded **Gezin verlaten** flow that removes only the current membership/pointers and prevents an owner from orphaning a household. `Household Rebuild Contracts` passed for that latest code commit (run `32784256710`) and Vercel deployment `dpl_BzCAsgZyQpn1J4fF1qb24ZVa7brW` is READY. The next STEP 10 gate remains user verification that the second/wife account can reach the create/join household chooser and join via invite; only then continue the actual background push delivery test. Do **not** freeze STEP 10 yet.

## Frozen phases

- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen 2026-08-24.

## STEP 10 — Notifications

**Status: CURRENT PHASE — notification/push implementation and standalone iPhone opt-in complete; auth/join hotfix is deployed and awaits real account re-test before delivery/isolation acceptance.**

### Audit / architecture
- [x] Read-only notification + push audit stored in `docs/step10-notifications-audit.md`.
- [x] Notification state and push delivery explicitly separated.
- [x] Legacy `addNotif(...)` remains non-authoritative.
- [x] Legacy `notifData` remains demo/compatibility state only.
- [x] Existing old FCM implementation classified as incomplete legacy code.
- [x] Legacy automatic `setupPushNotifications()` startup call neutralized: current compatibility entrypoint only starts the service and never requests permission.

### Canonical in-app notification state
- [x] `NotificationHouseholdRepository v1.0.0` at `families/{householdId}/shared/notifications`.
- [x] HouseholdContext UID + household + revision binding.
- [x] Exactly one listener, exact detach, stale-callback rejection and immediate projection clear on identity loss/change.
- [x] Per-UID `readBy` / `dismissedBy` state.
- [x] Deterministic `eventKey` / `publishOnce()` transaction idempotency.
- [x] `NotificationStore v2.1.0` canonical facade; random/unkeyed publishing rejected.
- [x] Push handoff only for newly created canonical events; replay cannot double-push.
- [x] Push handoff is best-effort after canonical inbox success.
- [x] `NotificationEvents v2.0.0` deterministic task-help, task-swap, Party Quest and Finance savings events.
- [x] Task/swap/Party Quest projectors, actions, center and in-app delivery use HouseholdContext identity.
- [x] In-app notification stack activated in actual `/api/app` served graph.
- [x] Profile → Meldingen now opens the canonical `notif` screen instead of a placeholder toast.

### Web Push client / readiness foundation
- [x] `PushDeviceRegistry v1.0.0` uses `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Push tokens are never stored in household-shared notification state.
- [x] Multi-device/UID registry lifecycle is HouseholdContext-safe.
- [x] `PushRegistrationService v1.1.0` separates startup from explicit opt-in.
- [x] Permission is requested only through explicit `requestEnable()`.
- [x] iPhone/iPad requires Home Screen/standalone context before permission.
- [x] Account/UID switch invalidates the prior FCM token/browser Push subscription.
- [x] Per-account local opt-in marker is separate (`familyapp_push_optin_v1:{uid}`).
- [x] `firebase-messaging-sw.js` handles background data payloads + notification clicks.
- [x] Foreground FCM does not create a duplicate canonical inbox event.
- [x] App badge sync uses browser badge APIs only when available.
- [x] `PushNotificationSettings v1.1.1` provides explicit opt-in/disable controls, distinguishes missing Web Push vs sender configuration, and shows iPhone Home Screen guidance before generic unsupported-browser messaging.
- [x] `/api/push-config v1.1.0` returns only safe readiness booleans + public VAPID key.
- [x] `configured=true` requires **both** `vapidConfigured` and `senderConfigured`.
- [x] Sender email/private key values are never returned by `/api/push-config`.
- [x] `PushRegistrationService` checks full delivery readiness before the only `Notification.requestPermission()` call, so incomplete server config cannot trigger a misleading OS permission prompt.
- [x] Served loader uses `pushRegistrationService.js?v=2` and `pushNotificationSettings.js?v=3`.

### Auth / household onboarding blocker discovered during delivery test
- [x] Audited the PC second-account startup failure shown as generic `Opstarten mislukt`.
- [x] Restored `googleAuthMobileFix.js` and canonical `householdPlatform.js` to the actual served `/api/app` runtime before session startup.
- [x] Added `HouseholdOnboardingBridge v1.0.0` before `AuthenticatedSessionController` so `loadUserFamily`, setup and join/create onboarding are deterministic rather than dependent on DOMContentLoaded timing.
- [x] `AuthenticatedSessionController` now recognizes `HOUSEHOLD_REQUIRED` and `HOUSEHOLD_ACCESS_REQUIRED` as setup states instead of generic connection failures.
- [x] A stale/inaccessible household pointer that returns Firebase `PERMISSION_DENIED` is normalized to safe re-onboarding; no removed account is silently reactivated and a fresh invite is still required to join.
- [x] Auth startup contract now verifies served order: legacy Firebase bootstrap → Google adapter → FamilyHousehold → onboarding bridge → session controller → HouseholdContext.
- [x] Full Household Rebuild Contracts PASS on `fae24eddef6163e9ac9180792167d847381e3b6d`, run `32781652282`.
- [x] Vercel Preview `dpl_4zbDas7UbGEnoV1oiWG1UsipbBta` READY for the hotfix commit.
- [ ] Real PC/browser retest: new Google account reaches `Nieuw gezin maken / Deelnemen aan gezin` instead of generic startup error.
- [ ] Real wife-account retest: existing account either resolves the household normally or is safely offered re-onboarding and can rejoin using a fresh invite.

### Profile / household lifecycle side request
- [x] Profile contains a clear destructive action **Gezin verlaten**.
- [x] The flow first reads the active UID/household through `HouseholdContext` and rejects stale identity changes.
- [x] A normal member leaves by removing only their own `families/{householdId}/members/{uid}` membership and their own current household pointers under `users/{uid}`.
- [x] Leaving does **not** delete the household or shared tasks/boodschappen/agenda/finance/notification data.
- [x] An owner cannot orphan a household. The flow requires an active adult/admin successor, transfers `meta.ownerUid` and promotes that member to `owner` before removing the leaving owner.
- [x] An owner with no eligible adult/admin successor is blocked with guidance instead of deleting/orphaning the household.
- [x] Presence is cleared best-effort before membership removal and the canonical authenticated session is resumed afterwards so the leaving account returns to household create/join onboarding.
- [x] Existing Firebase Rules already permit the required self-membership removal and owner-managed ownership transfer; no production Rules change was made.
- [x] `scripts/test-household-leave-profile.js` guards identity, ownership transfer, non-deletion of shared household data, profile wiring and existing Rules support.
- [x] Latest full Household Rebuild Contracts PASS on `a3b17bbff075dbe00b4f9048b76ddadb2bc84e16`, run `32784256710`.
- [x] Vercel Preview `dpl_BzCAsgZyQpn1J4fF1qb24ZVa7brW` READY for the household-leave feature commit.
- [ ] Real Preview smoke test: normal member leaves and reaches onboarding without data leakage/freeze.
- [ ] Real Preview owner smoke test: ownership transfer is required and the successor retains the household.

### Trusted push sender / delivery health
- [x] `PushDeliveryBridge v1.0.0` sends only canonical `{householdId, notificationId}` identity after obtaining the current Firebase ID token.
- [x] Client bridge never submits raw recipient tokens/title/body as authority.
- [x] `api/push-send.js` Vercel POST boundary.
- [x] `firebasePushSender.js v1.0.0` verifies Firebase identity + active household membership.
- [x] Caller must be the canonical event actor.
- [x] Recipient UID(s) resolved server-side from canonical audience; actor excluded.
- [x] Only enabled private FCM devices for intended recipients are read.
- [x] FCM HTTP v1 with server-only OAuth credentials.
- [x] Data-only push payload carries canonical notification/event identity + route metadata.
- [x] Private per-device delivery health under `users/{uid}/private/pushDelivery/{notificationId}/{deviceId}`.
- [x] Delivery receipt idempotency prevents repeat FCM sends.
- [x] FCM unregistered devices are disabled.
- [x] Push failure remains independent from canonical inbox/read/dismiss state.
- [x] No sender secret is stored in client/public repository code.

### Contracts / deployment
- [x] Notification repository/store/events/projector/presentation contracts.
- [x] Private push-device registry contract.
- [x] Explicit Web Push opt-in/account-switch contract.
- [x] Trusted sender authorization/idempotency/no-token-leakage contract.
- [x] `test-push-config-readiness.js` proves: no config → not ready; VAPID only → not ready; VAPID + sender env → ready; sender values never appear in response.
- [x] Served runtime audit covers current notification + readiness-aware Web Push + trusted sender wiring.
- [x] Profile notification navigation and iPhone Home Screen guidance ordering are guarded in the served-runtime contract.
- [x] Latest full `Household Rebuild Contracts` PASS on `a3b17bbff075dbe00b4f9048b76ddadb2bc84e16`, run `32784256710`.
- [x] Latest Vercel deployment `dpl_BzCAsgZyQpn1J4fF1qb24ZVa7brW` READY for the same code commit.
- [x] Earlier post-config Preview deployment `dpl_Cgrd2UhguAs6aVWrjjjc4jGH9CLu` directly verified `/api/push-config` with `configured=true`, `vapidConfigured=true`, `senderConfigured=true`.

### Protected runtime configuration — complete
- [x] `FAMILYAPP_WEB_PUSH_VAPID_KEY` configured in Vercel **Preview**.
- [x] `FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL` configured as protected Preview environment data.
- [x] `FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY` configured as protected Preview environment data.
- [x] `FAMILYAPP_FIREBASE_SERVICE_PROJECT_ID` remains omitted because the sender default `verhoog-family` is correct.
- [x] Private key was not pasted into chat/GitHub/public config.
- [x] Fresh READY preview obtained after environment configuration.
- [x] Public readiness endpoint verified full delivery readiness on the configured Preview environment.
- [x] Standalone iPhone PWA explicit opt-in completed; UI reached enabled state only after the current registration path completed its private-device upsert.

### Preview / device gates
- [x] Preview opened from an **iPhone Home Screen icon** rather than a normal Safari tab; push enablement became available.
- [x] Explicit iPhone Home Screen push opt-in succeeded; iOS permission was accepted and the card reports push enabled for this account/device.
- [ ] Second household account can authenticate/join on PC using the hotfixed Preview.
- [ ] Cross-device inbox: PC/browser account A creates event for iPhone account B; B sees exactly one unread event.
- [ ] UID-specific read/dismiss survives reload/reconnect.
- [ ] Live in-app banner only for intended current identity.
- [ ] Actionable task-help / Party Quest notification executes canonical action.
- [ ] Background push reaches the iPhone and opens/focuses FamilyApp notifications without duplicate inbox state.
- [ ] Account switch never leaks inbox/banner/push registration from previous UID.
- [ ] Reload/background→foreground stability: no freeze/white screen/WebKit crash.
- [ ] Freeze STEP 10 only after explicit product acceptance.

## Later roadmap phases

- [ ] STEP 11 — Party quests.
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate with at least three independent households.
- [ ] STEP 17 — Store distribution readiness.

## Standing guardrails

- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- STEP 8 Finance and STEP 9 Progression remain frozen.
- Notification identity is HouseholdContext/UID-based.
- Notification state and delivery state are separate.
- Realtime subscriptions require exact teardown + stale-context protection.
- Push/device credentials are user-private technical data.
- Browser/native push adapters never become the notification domain authority.
- Server push secrets never enter client code, public config or repository files.
- Every meaningful development update must update `docs/FAMILYAPP-UPDATE-LOG.md` and this TODO in the same work session.