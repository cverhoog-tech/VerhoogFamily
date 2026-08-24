# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: canonical in-app notification state, Web Push client and trusted sender are code/contract-green; runtime configuration + real-device gates remain.**

STEP 8 Finance and STEP 9 Progression are accepted/frozen. STEP 10 now has one HouseholdContext-native notification authority, deterministic/idempotent events, UID-specific read/dismiss state, a private multi-device push registry, explicit Web Push opt-in, a service-worker/FCM client adapter, a best-effort push handoff and a trusted Vercel server-side FCM sender. Latest complete code commit `6c616aea701175ae6d9e8039c5f33574ba37c9c7` has both `Household Rebuild Contracts` and Vercel green. Deployment `dpl_3z8j32rjZDG3x41LSNMuPuLUhT2G` is READY and its `/api/app` output was directly verified to contain the current STEP 10 runtime. Do **not** freeze STEP 10 yet: VAPID/service credential configuration and real cross-device/iPhone delivery remain to be proven.

## Frozen phases

- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen 2026-08-24.

## STEP 10 — Notifications

**Status: CURRENT PHASE — implementation/code gate complete; runtime config + device acceptance open.**

### Audit / architecture
- [x] Read-only notification + push audit stored in `docs/step10-notifications-audit.md`.
- [x] Notification state and push delivery explicitly separated.
- [x] Legacy `addNotif(...)` remains non-authoritative.
- [x] Legacy `notifData` remains demo/compatibility state only.
- [x] Existing old FCM implementation classified as incomplete legacy code.
- [x] Audit correction: `AuthenticatedSessionController` did call legacy `setupPushNotifications()` automatically at app reveal; the new push service overrides that entrypoint with safe `start()` behavior that never requests permission.

### Canonical in-app notification state
- [x] `NotificationHouseholdRepository v1.0.0` at `families/{householdId}/shared/notifications`.
- [x] HouseholdContext UID + household + revision binding.
- [x] Exactly one listener, exact detach, stale-callback rejection and immediate projection clear on identity loss/change.
- [x] Per-UID `readBy` / `dismissedBy` state.
- [x] Deterministic `eventKey` / `publishOnce()` transaction idempotency.
- [x] `NotificationStore v2.1.0` canonical facade; random/unkeyed publishing rejected.
- [x] New canonical events hand off to push only when the event was newly created; duplicate/replayed `publishOnce` calls cannot double-push.
- [x] Push handoff is best-effort and occurs after canonical inbox success, so push failure cannot redefine notification state.
- [x] `NotificationEvents v2.0.0` deterministic task-help, task-swap, Party Quest and Finance savings events.
- [x] Task/swap/Party Quest notification projectors are HouseholdContext-safe `v2.0.0`.
- [x] `NotificationActions v3.0.0`, `NotificationCenter v2.0.0` and `NotificationDelivery v2.0.0` use HouseholdContext identity.
- [x] In-app notification stack activated in actual `/api/app` served graph.

### Web Push client foundation
- [x] `PushDeviceRegistry v1.0.0` stores delivery credentials under `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Push tokens are not stored in household-shared notification state.
- [x] Registry supports multiple browser/device installations per UID and rejects writes without valid HouseholdContext.
- [x] `PushRegistrationService v1.0.0` separates startup from explicit opt-in.
- [x] `setupPushNotifications()` compatibility entrypoint calls `start()` only; no automatic permission prompt on login/app reveal.
- [x] Permission is requested only through explicit `requestEnable()` after a user interaction.
- [x] iPhone/iPad Web Push enablement requires Home Screen/standalone context before asking permission.
- [x] Account/UID switch invalidates the prior browser FCM token/Push subscription.
- [x] Per-account local opt-in state is separate (`familyapp_push_optin_v1:{uid}`).
- [x] `firebase-messaging-sw.js` handles background data payloads and notification clicks.
- [x] Foreground FCM handling does not create a second canonical inbox event.
- [x] App badge synchronization uses browser badge APIs only when available.
- [x] `PushNotificationSettings v1.0.0` provides explicit opt-in/disable controls.
- [x] `/api/push-config` exposes only public Web Push configuration; public VAPID key comes from `FAMILYAPP_WEB_PUSH_VAPID_KEY`.
- [x] Push client modules are activated in actual `/api/app` output with explicit cache versions.

### Trusted push sender / delivery health
- [x] `PushDeliveryBridge v1.0.0` sends only canonical `{householdId, notificationId}` identity to `/api/push-send` after obtaining the current Firebase ID token.
- [x] Client bridge never submits raw recipient tokens/title/body as delivery authority.
- [x] `api/push-send.js` is the Vercel server-side POST boundary.
- [x] `src/server/firebasePushSender.js v1.0.0` verifies Firebase identity and active household membership.
- [x] Sender requires the caller to be the canonical event actor, preventing another member from replaying someone else's event.
- [x] Sender resolves intended recipient UID(s) from the canonical event audience server-side and excludes the actor.
- [x] Sender reads only enabled private FCM device registrations for those intended recipients.
- [x] Sender uses FCM HTTP v1 with server-only OAuth credentials from protected environment variables.
- [x] FCM payload is data-only and carries canonical notification/event identity + route metadata.
- [x] Per-device delivery health is stored privately under `users/{uid}/private/pushDelivery/{notificationId}/{deviceId}` and does not contain the device token.
- [x] Delivery receipt idempotency suppresses a second push to the same device for the same canonical event.
- [x] Unregistered FCM devices are disabled in the private registry.
- [x] Push failure remains independent from canonical `readBy` / `dismissedBy` / inbox state.
- [x] No server credential is stored in client code, public config or repository files.

### Contracts / deployment
- [x] `test-notification-household-repository.js`.
- [x] `test-notification-store-events.js` covers `NotificationStore v2.1.0`, deterministic events and one-time push handoff.
- [x] `test-notification-projector-lifecycle.js`.
- [x] `test-notification-presentation-identity.js`.
- [x] `test-notification-served-runtime.js` covers in-app + Web Push + trusted sender runtime wiring and no-auto-permission behavior.
- [x] `test-push-device-registry.js`.
- [x] `test-push-registration-service.js`.
- [x] `test-push-server-sender.js` covers sender authorization, canonical recipient resolution, data-only FCM, private receipt idempotency and no token leakage.
- [x] Complete `Household Rebuild Contracts` PASS on `6c616aea701175ae6d9e8039c5f33574ba37c9c7` (run `32759246722`).
- [x] Vercel status SUCCESS for the same commit.
- [x] Deployment `dpl_3z8j32rjZDG3x41LSNMuPuLUhT2G` is READY for that exact commit.
- [x] Deployed `/api/app` directly verified and contains `notificationStore.js?v=3`, `pushDeviceRegistry.js?v=1`, `pushRegistrationService.js?v=1`, `pushDeliveryBridge.js?v=1` and `pushNotificationSettings.js?v=1`.
- [ ] Direct runtime verification of `/api/push-config` and `/firebase-messaging-sw.js` still open: Vercel preview SSO redirected those isolated connector fetches, so do not infer environment configuration from the READY build alone.

### Runtime configuration — next gate
- [ ] Confirm/set `FAMILYAPP_WEB_PUSH_VAPID_KEY` in the Vercel Preview environment.
- [ ] Confirm/set `FAMILYAPP_FIREBASE_SERVICE_PROJECT_ID` if the default project ID should not be used.
- [ ] Confirm/set `FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL` in protected Vercel environment variables.
- [ ] Confirm/set `FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY` in protected Vercel environment variables.
- [ ] Do not paste the private key into chat or commit it to GitHub.
- [ ] After configuration, create a fresh READY preview so the serverless runtime receives the variables.
- [ ] Verify push settings reports configured and an explicit opt-in can register a real iPhone PWA token.

### Preview / device gates
- [x] Fresh Vercel READY preview containing current STEP 10 code.
- [x] Deployed `/api/app` runtime wiring verified.
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