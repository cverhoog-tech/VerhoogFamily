# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: canonical in-app + Web Push client foundation implemented with green contracts; trusted sender/deployment configuration + preview/device gates remain.**

STEP 8 Finance and STEP 9 Progression are accepted/frozen. STEP 10 now has one HouseholdContext-native notification authority, deterministic/idempotent notification events, UID-specific read/dismiss state, a user-private multi-device push registry, explicit push opt-in and a Web/PWA FCM service worker/client adapter. The next code action is the trusted server-side sender and sanitized delivery-health boundary. A fresh Vercel preview is still blocked by Hobby `build-rate-limit`.

## Frozen phases

- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen 2026-08-24.

## STEP 10 — Notifications

**Status: CURRENT PHASE.**

### Audit / architecture
- [x] Read-only notification + push audit stored in `docs/step10-notifications-audit.md`.
- [x] Notification state and push delivery explicitly separated.
- [x] Legacy `addNotif(...)` remains non-authoritative.
- [x] Legacy `notifData` remains demo/compatibility state only.
- [x] Existing old FCM implementation classified as incomplete legacy code.
- [x] Audit correction: `AuthenticatedSessionController` did call legacy `setupPushNotifications()` automatically at app reveal; the new push service now overrides that entrypoint with safe `start()` behavior that never requests permission.

### Canonical in-app notification state
- [x] `NotificationHouseholdRepository v1.0.0` at `families/{householdId}/shared/notifications`.
- [x] HouseholdContext UID + household + revision binding.
- [x] Exactly one listener, exact detach, stale-callback rejection and immediate projection clear on identity loss/change.
- [x] Per-UID `readBy` / `dismissedBy` state.
- [x] Deterministic `eventKey` / `publishOnce()` transaction idempotency.
- [x] `NotificationStore v2.0.0` canonical facade; random/unkeyed publishing rejected.
- [x] `NotificationEvents v2.0.0` deterministic task-help, task-swap, Party Quest and Finance savings events.
- [x] Task/swap/Party Quest notification projectors are HouseholdContext-safe `v2.0.0`.
- [x] `NotificationActions v3.0.0`, `NotificationCenter v2.0.0` and `NotificationDelivery v2.0.0` use HouseholdContext identity.
- [x] In-app notification stack activated in actual `/api/app` served graph.

### Web Push client foundation
- [x] `PushDeviceRegistry v1.0.0` stores delivery credentials under `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Push tokens are not stored in household-shared notification state.
- [x] Registry supports multiple browser/device installations per UID and rejects writes without valid HouseholdContext.
- [x] `PushRegistrationService v1.0.0` separates startup from explicit opt-in.
- [x] `setupPushNotifications()` compatibility entrypoint is overridden to call `start()` only; no automatic permission prompt on login/app reveal.
- [x] Permission is requested only through explicit `requestEnable()` after a user interaction.
- [x] iPhone/iPad Web Push enablement requires Home Screen/standalone context before asking permission.
- [x] Account/UID switch invalidates the prior browser FCM token/Push subscription and never silently gives the next user the previous account's push registration.
- [x] Per-account local opt-in state is separate (`familyapp_push_optin_v1:{uid}`).
- [x] `firebase-messaging-sw.js` handles background data payloads and notification clicks.
- [x] Foreground FCM handling does not create a second canonical inbox event.
- [x] App badge synchronization uses browser badge APIs only when available.
- [x] `PushNotificationSettings v1.0.0` adds an explicit opt-in/disable control to the notifications screen.
- [x] `/api/push-config` exposes only public Web Push configuration; public VAPID key comes from `FAMILYAPP_WEB_PUSH_VAPID_KEY`.
- [x] Push client modules are activated in actual `/api/app` output with explicit cache versions.

### Contracts
- [x] `test-notification-household-repository.js`.
- [x] `test-notification-store-events.js`.
- [x] `test-notification-projector-lifecycle.js`.
- [x] `test-notification-presentation-identity.js`.
- [x] `test-notification-served-runtime.js` now covers in-app + Web Push client wiring and the no-auto-permission contract.
- [x] `test-push-device-registry.js` covers UID/private-path isolation and logout rejection.
- [x] `test-push-registration-service.js` covers explicit opt-in, no startup prompt, account-switch token invalidation, explicit second-user opt-in, disable and iPhone Home Screen gating.
- [x] Complete `Household Rebuild Contracts` PASS on `d89057f0b78caf4f1acb00106cd9d03f2d9ed538`.
- [x] A false-positive secret test was corrected: it had matched security wording in a source comment rather than an exposed credential; the public endpoint itself did not expose a server secret.
- [!] Vercel remains blocked by Hobby `build-rate-limit`; no fresh READY STEP 10 preview may be claimed yet.

### Trusted push sender — next
- [ ] Add trusted server-side push sender on Vercel or another approved backend boundary.
- [ ] Sender credentials/service-account material must exist only in protected server environment variables, never repo/client/public config.
- [ ] Sender authenticates/authorizes the request/event and resolves only intended recipient UID(s).
- [ ] Sender reads only enabled private device registrations for intended recipient UID(s).
- [ ] Sender delivers data-only FCM payloads carrying canonical `notificationId` / `eventKey` / route metadata.
- [ ] Push failure must not delete or mutate canonical inbox/read state.
- [ ] Add sanitized per-event/per-device delivery-health state separate from `readBy`/`dismissedBy`.
- [ ] Add sender authorization/delivery/failure contracts.
- [ ] Configure public VAPID key in Vercel environment before real device push testing.
- [ ] Configure trusted sender credential securely in Vercel environment before end-to-end delivery testing.

### Preview / device gates
- [ ] Fresh Vercel READY preview containing current STEP 10 in-app + push-client code.
- [ ] Verify deployed `/api/app`, `/api/push-config` and service worker assets.
- [ ] Cross-device inbox: A creates event for B; B sees exactly one unread inbox event.
- [ ] UID-specific read/dismiss survives reload/reconnect.
- [ ] Live in-app banner only for intended current identity.
- [ ] Actionable task-help / Party Quest notification executes canonical domain action.
- [ ] Explicit iPhone Home Screen push opt-in succeeds after VAPID/sender configuration.
- [ ] Background push opens/focuses FamilyApp notifications without duplicate inbox state.
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