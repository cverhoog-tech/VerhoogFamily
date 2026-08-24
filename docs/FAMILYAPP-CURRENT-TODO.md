# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: implementation, trusted sender, Preview configuration and iPhone standalone Web Push opt-in are complete; real cross-device/background delivery and isolation acceptance remain.**

STEP 8 Finance and STEP 9 Progression are accepted/frozen. STEP 10 has one HouseholdContext-native notification authority, deterministic/idempotent events, UID-specific read/dismiss state, a private multi-device push registry, explicit Web Push opt-in, service-worker/FCM transport, best-effort push handoff, a trusted Vercel sender and a readiness endpoint that blocks the permission prompt until both the public VAPID key and protected sender credentials are present.

The Vercel **Preview** environment contains the public VAPID key and protected Firebase sender credentials, and the configured runtime previously returned `configured=true`, `vapidConfigured=true` and `senderConfigured=true`. The iPhone Home Screen gate has now also passed: the Preview was opened as a standalone PWA, iOS notification permission was accepted, and the notification card now reports `Pushmeldingen staan aan voor dit account op dit apparaat`. In the current registration flow that enabled state is reached only after FCM token acquisition and a successful `PushDeviceRegistry.upsert`, so the standalone registration path is accepted at runtime level. The next gate is actual PC/browser → iPhone delivery while the PWA is backgrounded/closed, followed by read/dismiss/action and account-isolation checks. Do **not** freeze STEP 10 yet.

## Frozen phases

- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen 2026-08-24.

## STEP 10 — Notifications

**Status: CURRENT PHASE — implementation/code/deployment-config/standalone opt-in gates complete; real delivery and isolation acceptance remain open.**

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
- [x] Latest code-side `Household Rebuild Contracts` PASS on `caa5df5905ad354e5b271e96f36a60bd4d7786cc`, run `32774000920`.
- [x] Vercel deployment `dpl_HcmhUXWqWasRuP1jZH5EfhbeskND` READY for the same code commit.
- [x] Deployed `/api/app` directly verified with `pushNotificationSettings.js?v=3` and the current STEP 10 runtime graph.
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
- [x] Fresh READY preview for the latest Profile/iPhone guidance fix.
- [x] Preview opened from an **iPhone Home Screen icon** rather than a normal Safari tab; push enablement became available.
- [x] Explicit iPhone Home Screen push opt-in succeeded; iOS permission was accepted and the card reports push enabled for this account/device.
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