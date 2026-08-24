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
- [-] STEP 10 — Notifications — canonical in-app + Web Push client foundation implemented with green contracts; trusted sender/configuration/preview/device gates remain.

**Current phase: STEP 10 Notifications. The canonical inbox and Web Push client/device lifecycle are built. Next is the trusted server-side delivery boundary; do not claim operational push until server credentials/public VAPID deployment config and real-device delivery are verified.**

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

**Current phase — in-app + Web Push client code/contract checkpoint complete.**

### Canonical notification state
- [x] `NotificationHouseholdRepository v1.0.0` on household-scoped notification path.
- [x] HouseholdContext UID/household/revision identity.
- [x] Exact listener cleanup, immediate projection clear and stale-callback rejection.
- [x] Per-UID read/dismiss semantics.
- [x] Deterministic event keys / `publishOnce` idempotency.
- [x] Canonical `NotificationStore v2.0.0`.
- [x] Deterministic `NotificationEvents v2.0.0`.
- [x] HouseholdContext-safe task/swap/Party Quest projectors.
- [x] HouseholdContext-safe actions, notification center and in-app live banner.
- [x] Canonical notification stack activated in actual `/api/app` load graph.

### Web Push client/device foundation
- [x] Private multi-device registry: `users/{uid}/private/pushDevices/{deviceId}`.
- [x] Push credentials removed from household-shared design.
- [x] Explicit opt-in registration service; startup never requests notification permission.
- [x] Legacy startup `setupPushNotifications()` auto-call neutralized by a safe start-only compatibility override.
- [x] Per-account opt-in marker; account switch invalidates prior browser transport.
- [x] iPhone/iPad enable flow requires Home Screen/standalone context before permission prompt.
- [x] FCM service worker for background data payload + notification click routing.
- [x] Foreground FCM copy does not create duplicate canonical inbox state.
- [x] Explicit notification-screen push settings UI.
- [x] Public Web Push config endpoint uses only public VAPID configuration.
- [x] Push client modules activated in actual served runtime.

### Contracts
- [x] Notification repository lifecycle/isolation/idempotency.
- [x] Notification store + deterministic event contract.
- [x] Notification projector lifecycle.
- [x] Notification presentation/action identity.
- [x] Private push-device registry isolation.
- [x] Explicit Web Push opt-in / account-switch cleanup.
- [x] Served runtime audit covers in-app + push client wiring and no-auto-permission behavior.
- [x] Full Household Rebuild Contracts PASS on `d89057f0b78caf4f1acb00106cd9d03f2d9ed538`.
- [!] Vercel fresh build still blocked by Hobby `build-rate-limit`.

### Trusted push sender / delivery health — open
- [ ] Trusted server-side FCM sender.
- [ ] Server-only credential configuration; no secret in repo/client/public endpoint.
- [ ] Authorized recipient resolution from canonical notification audience.
- [ ] Enabled private device lookup for intended recipient UIDs only.
- [ ] Data-only push payload linked to canonical notification ID/event key.
- [ ] Delivery failure independent from canonical inbox state.
- [ ] Sanitized delivery-health record separate from read/dismiss.
- [ ] Sender authorization/delivery/failure contracts.
- [ ] Public VAPID key configured in deployment environment.
- [ ] Trusted sender credentials configured in deployment environment.

### Preview / device acceptance — open
- [ ] Fresh READY Vercel preview containing all current STEP 10 code.
- [ ] Deployed asset/config/service-worker verification.
- [ ] Cross-device in-app notification/read/dismiss/action tests.
- [ ] Real iPhone Home Screen push opt-in + background delivery test.
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
- 2026-08-24 — Web Push client/device foundation implemented; startup permission regression neutralized; complete contracts green; trusted sender and real-device delivery remain.

## Maintenance rule

When implementation progresses:
1. update relevant checklist items;
2. append meaningful changes to `docs/FAMILYAPP-UPDATE-LOG.md`;
3. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
4. never mark a functional phase accepted before required tests/preview/device gate;
5. keep roadmap synchronized when scope/order/constraints materially change;
6. add lifecycle/isolation tests during each module migration;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.