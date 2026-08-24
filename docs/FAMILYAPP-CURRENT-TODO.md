# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: canonical in-app notification stack implemented/served in code with green contracts; push-delivery foundation is next.**

STEP 8 Finance and STEP 9 Progression / XP / Achievements are accepted/frozen. STEP 10 now has a HouseholdContext-native notification repository, deterministic notification events, UID-safe read/dismiss state, HouseholdContext-safe projectors/actions/presentation and a served-runtime contract. The latest code-side checkpoint is green in `Household Rebuild Contracts`; Vercel is temporarily blocked by the Hobby `build-rate-limit`, so the fresh preview/iPhone in-app gate remains open. Push notifications are part of STEP 10 but remain a separate delivery layer over the same canonical notification state.

## Frozen phases

### STEP 8 — Finance
**Status: ACCEPTED / FROZEN on 2026-08-24.**
- [x] Household-scoped canonical Finance store/repository, isolation/lifecycle protection and reset semantics.
- [x] Premium Analyse UI + deterministic FamilyApp Assistent.
- [x] Premium two-page PDF + native iOS/WhatsApp share flow.
- [x] Finance contract suite, fresh preview and real-iPhone gate accepted.

### STEP 9 — Progression / XP / Achievements
**Status: ACCEPTED / FROZEN on 2026-08-24.**
- [x] Canonical `families/{householdId}/members/{uid}/progression` authority.
- [x] Atomic/idempotent rewards and achievement unlocks.
- [x] Served XP producers moved to deterministic event keys.
- [x] Account/household/logout lifecycle and stale-callback protection.
- [x] Served-runtime audit and complete contract suite green.
- [x] Real iPhone Safari/PWA gate accepted.

## STEP 10 — Notifications

**Status: CURRENT PHASE — canonical in-app foundation code/contract gate complete; push layer + preview/device verification remain.**

### Read-only audit
- [x] Inventory actual served notification modules/runtime wiring.
- [x] Inventory `addNotif`, typed notification producers and legacy demo state.
- [x] Map notification authority, read/unread/dismiss behavior and Firebase paths.
- [x] Map household/UID identity, listener and stale-context risks.
- [x] Audit browser push/FCM/token/service-worker/sender state separately from in-app notification state.
- [x] Persist findings in `docs/step10-notifications-audit.md`.
- [x] Confirm legacy `addNotif(...)` is intentionally non-authoritative.
- [x] Confirm old FCM code is only an incomplete registration stub; reliable push was not operational at STEP 10 start.

### Canonical in-app notification foundation
- [x] Added `NotificationHouseholdRepository v1.0.0` on `families/{householdId}/shared/notifications`.
- [x] Repository identity is `HouseholdContext` UID + household + revision; exactly one listener is owned by the repository.
- [x] Same-household account switch, household switch and logout detach the exact listener and clear stale projection.
- [x] Captured stale callbacks/writes are rejected with `HouseholdContext.capture()/isCurrent()`.
- [x] Per-UID `readBy` / `dismissedBy` semantics retained; callers cannot mark state for another UID.
- [x] Added deterministic notification `eventKey` / `publishOnce()` transaction semantics so one transition cannot create duplicate inbox events across devices/tabs.
- [x] `NotificationStore v2.0.0` is the canonical facade over the repository; random/unkeyed notification creation is rejected.
- [x] `NotificationEvents v2.0.0` uses deterministic keys for task help, task swap, Party Quest and Finance savings events.
- [x] Task/swap/Party Quest projectors are `v2.0.0`, HouseholdContext-bound and stale-callback safe.
- [x] `NotificationActions v3.0.0` uses HouseholdContext identity and delegates real mutations to canonical task/Party Quest services.
- [x] `NotificationCenter v2.0.0` uses HouseholdContext and clears open detail state on identity changes.
- [x] `NotificationDelivery v2.0.0` remains in-app live-banner presentation only and clears queue/banner state on identity changes.
- [x] Notification stack is activated in actual `/api/app` output after HouseholdContext and before progression runtime.
- [x] Cache-busted served versions are explicit for repository/store/events/actions/center/delivery/projectors.

### Automated contracts
- [x] `scripts/test-notification-household-repository.js` — bind/unbind, same-household UID switch, cross-household isolation, stale callbacks, logout clear, per-UID markers and duplicate publish protection.
- [x] `scripts/test-notification-store-events.js` — store/events contract, deterministic keys, targeted visibility, read/dismiss and typed event identity.
- [x] `scripts/test-notification-projector-lifecycle.js` — task/swap/Party Quest projector HouseholdContext lifecycle and stale-callback rejection.
- [x] `scripts/test-notification-presentation-identity.js` — actions/center/delivery cannot restore legacy `fbUser`/Firebase-auth identity ownership.
- [x] `scripts/test-notification-served-runtime.js` — validates actual `/api/app` load order, cache versions and absence of legacy notification identity in the served stack.
- [x] Complete `Household Rebuild Contracts` PASS on code commit `15ca6bca994ea5852815cad7f3e811261a783152`.
- [!] Vercel preview for that checkpoint is currently blocked only by Hobby `build-rate-limit`; do not claim a fresh READY preview until a later branch build succeeds.

### In-app verification still required
- [ ] Fresh Vercel READY preview containing the active STEP 10 notification stack.
- [ ] Verify deployed `/api/app` serves all current notification asset versions.
- [ ] Cross-device inbox test: user A creates an event for user B; B receives exactly one inbox item/unread badge.
- [ ] Read state is UID-specific and survives reload/reconnect.
- [ ] Dismiss state hides only for the current UID.
- [ ] Live in-app banner appears only for the intended recipient/current identity.
- [ ] Task-help / Party Quest actionable notification executes the current canonical domain action.
- [ ] Account/household switch never shows the previous identity's inbox/banner/detail.

### Push delivery — part of STEP 10, separate layer
- [ ] Add a user-private multi-device push registry, logically `users/{uid}/private/pushDevices/{deviceId}`.
- [ ] Keep push/device tokens out of household-shared notification state.
- [ ] Define a platform-neutral push registration/delivery contract for web now and native iOS/Android later.
- [ ] Add deliberate user opt-in/permission flow; do not request notification permission opportunistically during startup.
- [ ] Add Web/PWA service worker + FCM registration/foreground/background handling.
- [ ] Add token refresh/revocation/logout/account-switch lifecycle handling.
- [ ] Add trusted server-side sender; client must never contain FCM server/service-account credentials.
- [ ] Evaluate Vercel server-side delivery boundary first while Firebase remains on Spark.
- [ ] Push delivery failure must never remove/corrupt canonical notification inbox state.
- [ ] Add sanitized delivery-health status separately from read/dismiss state.

### Final STEP 10 gates
- [ ] Full Household Rebuild Contracts after push implementation.
- [ ] Fresh Vercel preview with in-app + push wiring verified.
- [ ] Real iPhone Safari/PWA STEP 10 gate: inbox, unread/read/dismiss, cross-device incoming event, actionable notification, push opt-in/delivery where supported, reload/background→foreground stability.
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

## Standing product decisions / guardrails

- Main stays untouched until explicit approval.
- Current working branch is `agent/household-rebuild-v2`.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- STEP 8 Finance and STEP 9 Progression are frozen; STEP 10 must not casually refactor them.
- Platform admin remains separate from household admin and must not imply unrestricted raw household-content access.
- Notification identity is HouseholdContext/UID based.
- Notification state and push delivery are separate layers; a delivery failure must not redefine canonical notification state.
- Realtime notification subscriptions require exact teardown and stale-context protection.
- Push/device credentials are user-private technical data, never household-shared content.
- New notification architecture must remain callable from a future native shell and must not depend on web-only notification APIs for domain correctness.
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.