# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`

This tracker is the compact phase-level view of the rebuild. The roadmap remains the architecture/scope source of truth; the current TODO is authoritative for the exact next action.

## Status legend

- `[ ]` not started
- `[-]` in progress
- `[x]` completed / accepted or deliberately closed by product decision
- `[!]` blocked / needs attention

## Current position — synced 2026-08-24

- [x] STEP 0 — Stable baseline.
- [x] STEP 1 — Authenticated session / startup ownership.
- [x] STEP 2 — HouseholdContext / UID identity / lifecycle.
- [x] STEP 2A — Platform-admin identity foundation.
- [x] STEP 2B — Person/UI identity modernization and accepted Brand/PWA/icon scope.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance — accepted/frozen on 2026-08-24.
- [x] STEP 9 — Progression / XP / Achievements — accepted/frozen on 2026-08-24.
- [-] STEP 10 — Notifications — in-app + Web Push + trusted sender + readiness gating implemented and contract-green; protected Vercel config and device acceptance remain.

**Current phase: STEP 10 Notifications. The notification/inbox authority, Web Push registration lifecycle, trusted sender and permission-readiness gate are implemented and code/contract-green. The latest readiness code is awaiting a fresh Vercel build after a Hobby rate-limit; protected VAPID/sender configuration and real cross-device/iPhone acceptance remain. Do not claim operational push or freeze STEP 10 before those gates pass.**

## Prototype end-goal gate

Detailed contract: `docs/multi-family-prototype-acceptance.md`.

- [x] Multi-family readiness is an explicit prototype end goal.
- [x] Personal platform-admin capability is an explicit prototype end goal.
- [x] Privacy boundary defined: sanitized operational diagnostics by default, no generic raw household-content access.
- [x] Admin authority tied to the product owner's authenticated personal UID via server-verifiable authorization.
- [ ] At least three independent households pass end-to-end isolation/lifecycle acceptance.
- [ ] Core modules prove no cross-household read/write/state leakage across the complete app.
- [ ] Removed-member behavior passes final broader-beta isolation tests.
- [ ] Sanitized platform operations/admin dashboard accepted.
- [ ] Firebase Rules + media authorization prove household isolation and admin privacy boundary.
- [ ] Broader family beta acceptance gate passed.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen on 2026-08-24 after contracts, READY preview and real iPhone premium PDF gate.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen on 2026-08-24 after canonical UID progression, idempotent rewards, served-runtime audit and real iPhone gate.

## STEP 10 — Notifications

**Current phase — implementation/code gate complete; protected deployment configuration and device acceptance remain.**

### Canonical notification state
- [x] `NotificationHouseholdRepository v1.0.0` on household-scoped notification path.
- [x] HouseholdContext UID/household/revision identity.
- [x] Exact listener cleanup, immediate projection clear and stale-callback rejection.
- [x] Per-UID read/dismiss semantics.
- [x] Deterministic event keys / `publishOnce` idempotency.
- [x] Canonical `NotificationStore v2.1.0`.
- [x] Push handoff occurs only for newly created canonical events; duplicate event writes cannot double-send.
- [x] Push failure cannot mutate or invalidate canonical inbox success.
- [x] Deterministic `NotificationEvents v2.0.0`.
- [x] HouseholdContext-safe task/swap/Party Quest projectors.
- [x] HouseholdContext-safe actions, notification center and in-app live banner.
- [x] Canonical notification stack activated in actual `/api/app` load graph.

### Web Push client/device foundation
- [x] Private multi-device registry: `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Push credentials removed from household-shared design.
- [x] `PushRegistrationService v1.1.0`: explicit opt-in; startup never requests notification permission.
- [x] Legacy startup `setupPushNotifications()` auto-call neutralized by a safe start-only compatibility override.
- [x] Per-account opt-in marker; account switch invalidates prior browser transport.
- [x] iPhone/iPad enable flow requires Home Screen/standalone context before permission prompt.
- [x] FCM service worker for background data payload + notification click routing.
- [x] Foreground FCM copy does not create duplicate canonical inbox state.
- [x] `PushNotificationSettings v1.1.0` explicit UI differentiates missing VAPID vs missing trusted sender readiness.
- [x] `/api/push-config v1.1.0` returns only safe readiness booleans + public VAPID key.
- [x] Full `configured=true` requires VAPID and sender credentials; sender values are never returned.
- [x] Delivery readiness is checked before the only `Notification.requestPermission()` call.
- [x] Push client modules activated in served runtime with cache versions `pushRegistrationService.js?v=2` and `pushNotificationSettings.js?v=2`.

### Trusted sender / delivery health
- [x] `PushDeliveryBridge v1.0.0` sends only canonical notification identity to the backend.
- [x] Vercel `api/push-send.js` trusted POST boundary.
- [x] Server-only `firebasePushSender.js v1.0.0` using FCM HTTP v1.
- [x] Firebase ID-token verification + active household membership check.
- [x] Canonical event actor authorization prevents replay by another household member.
- [x] Recipient UIDs resolved server-side from canonical audience; actor excluded.
- [x] Enabled device registry read limited to intended recipient UIDs.
- [x] Data-only push payload linked to canonical notification/event identity.
- [x] Sanitized private delivery receipt separate from notification read/dismiss state.
- [x] Per-device receipt idempotency suppresses repeat push delivery.
- [x] FCM unregistered devices disabled in private registry.
- [x] Server credentials are environment-only and absent from client/public repository code.

### Contracts / deployment
- [x] Notification repository lifecycle/isolation/idempotency.
- [x] Notification store v2.1 + deterministic event + one-time push handoff contract.
- [x] Notification projector lifecycle.
- [x] Notification presentation/action identity.
- [x] Private push-device registry isolation.
- [x] Explicit Web Push opt-in / account-switch cleanup.
- [x] Trusted sender authorization/idempotency/no-token-leakage contract.
- [x] Push config readiness contract: no config → not ready; VAPID only → not ready; VAPID + protected sender env → ready; no sender value exposure.
- [x] Served runtime audit covers in-app + readiness-aware Web Push + trusted sender wiring and no-auto-permission behavior.
- [x] Latest full Household Rebuild Contracts PASS on `9b99e95f50e4cd79b5ebdef50e28e855abd30b44`, run `32760089951`.
- [!] Latest readiness-hardening Vercel build blocked by Hobby `build-rate-limit` after the rapid commit sequence.
- [x] Previous complete trusted-sender deployment `dpl_3z8j32rjZDG3x41LSNMuPuLUhT2G` remains READY on commit `6c616aea701175ae6d9e8039c5f33574ba37c9c7`.
- [x] That READY deployment's `/api/app` was directly inspected and confirmed the complete trusted-sender runtime before the final readiness v1.1 changes.
- [ ] Fresh READY deployment required for the latest v1.1 readiness-aware registration/settings code.

### Protected runtime configuration — open
- [ ] Confirm/configure `FAMILYAPP_WEB_PUSH_VAPID_KEY` in the Vercel Preview environment.
- [ ] Confirm/configure `FAMILYAPP_FIREBASE_SERVICE_CLIENT_EMAIL` in protected Vercel environment variables.
- [ ] Confirm/configure `FAMILYAPP_FIREBASE_SERVICE_PRIVATE_KEY` in protected Vercel environment variables.
- [ ] Optional project ID may stay omitted because the sender defaults to `verhoog-family`.
- [ ] Never put the private key in chat/GitHub/public config.
- [ ] Create/verify a fresh READY deployment after environment configuration.
- [ ] Verify explicit PWA push registration creates a real private device record.

### Device acceptance — open
- [ ] Cross-device in-app notification/read/dismiss/action test.
- [ ] Real iPhone Home Screen push opt-in + background delivery test.
- [ ] Background push opens/focuses notification screen without duplicate canonical inbox state.
- [ ] Account-switch push/inbox isolation test.
- [ ] Reload/background→foreground stability test.
- [ ] STEP 10 frozen only after explicit product acceptance.

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

- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8 and STEP 9 remain frozen.
- Notification identity is HouseholdContext/UID-based.
- Notification state and push delivery are separate layers.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Push/device credentials are private technical data.
- Browser/native delivery adapters never become notification domain authority.
- Server secrets never enter client code/public config/repository.
- Every meaningful development update updates both central TODO and update log.

## Milestone summary

- 2026-08-19 — rebuild branch created from stable baseline.
- 2026-08-20 — STEP 0–2 accepted on real iPhone.
- 2026-08-22 — STEP 2A/2B and STEP 3 accepted.
- 2026-08-24 — STEP 8 Finance accepted/frozen.
- 2026-08-24 — STEP 9 Progression accepted/frozen.
- 2026-08-24 — STEP 10 notification/push audit completed.
- 2026-08-24 — canonical in-app notification runtime implemented and contract-green.
- 2026-08-24 — Web Push client/device foundation implemented; startup permission regression neutralized.
- 2026-08-24 — trusted Vercel FCM sender + private delivery-health/idempotency implemented; full contracts green and sender-complete preview READY.
- 2026-08-24 — push readiness gate hardened so incomplete VAPID/sender config cannot trigger OS permission; latest contracts green, fresh readiness preview waiting on Vercel Hobby rate-limit.

## Maintenance rule

When implementation progresses:
1. update relevant checklist items;
2. append meaningful changes to `docs/FAMILYAPP-UPDATE-LOG.md`;
3. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
4. never mark a functional phase accepted before required tests/preview/device gate;
5. keep roadmap synchronized when scope/order/constraints materially change;
6. add lifecycle/isolation tests during each module migration;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.