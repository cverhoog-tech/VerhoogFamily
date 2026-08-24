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
- [-] STEP 10 — Notifications — canonical in-app stack implemented/served in code with green contracts; push-delivery foundation + preview/device gates remain.

**Current phase: STEP 10 Notifications. In-app notification state is now HouseholdContext/UID-safe and deterministic. Next build the separate user-private push delivery layer while waiting for a fresh Vercel READY preview of the active in-app stack.**

## Prototype end-goal gate

Detailed contract: `docs/multi-family-prototype-acceptance.md`.

- [x] Multi-family readiness is an explicit prototype end goal.
- [x] Personal platform-admin capability is an explicit prototype end goal.
- [x] Privacy boundary defined: sanitized operational diagnostics by default, no generic raw household-content access.
- [x] Admin authority must be tied to the product owner's authenticated personal UID via server-verifiable authorization.
- [ ] At least three independent households pass end-to-end isolation/lifecycle acceptance.
- [ ] Core modules prove no cross-household read/write/state leakage across the complete app.
- [ ] Removed-member behavior passes final broader-beta isolation tests.
- [ ] Sanitized platform operations/admin dashboard accepted.
- [ ] Firebase Rules + media authorization prove household isolation and admin privacy boundary.
- [ ] Broader family beta acceptance gate passed.

## STEP 8 — Finance

**Status: accepted/frozen on 2026-08-24.**

- [x] Household-scoped canonical Finance source of truth and lifecycle isolation.
- [x] Premium Analyse + deterministic FamilyApp Assistent.
- [x] Premium two-page PDF/native share flow.
- [x] Contract suite + fresh preview + iPhone gate accepted.

## STEP 9 — Progression / XP / Achievements

**Status: accepted/frozen on 2026-08-24.**

- [x] Canonical UID + household progression authority.
- [x] Atomic/idempotent reward/achievement mutations.
- [x] Deterministic served reward producers.
- [x] Logout/account/household switch and stale-callback isolation.
- [x] Served-runtime audit and complete contract suite.
- [x] Real iPhone Safari/PWA gate accepted.

## STEP 10 — Notifications

**Current phase — canonical in-app foundation code/contract checkpoint complete; push delivery next.**

### Audit
- [x] Current served notification/runtime wiring inventoried.
- [x] Notification producers, legacy `addNotif` and demo state classified.
- [x] Read/unread/dismiss semantics mapped.
- [x] Identity/listener/stale-context risks mapped.
- [x] Push/FCM/token/service-worker/server-sender state audited separately.
- [x] Detailed audit stored in `docs/step10-notifications-audit.md`.

### Canonical in-app notification state
- [x] `NotificationHouseholdRepository v1.0.0` on `families/{householdId}/shared/notifications`.
- [x] HouseholdContext UID + household + revision binding.
- [x] Exact listener detach and stale-callback rejection.
- [x] Immediate projection clear on logout/account/household switch.
- [x] Per-UID `readBy` / `dismissedBy` semantics retained.
- [x] Deterministic `eventKey` / `publishOnce` idempotency.
- [x] `NotificationStore v2.0.0` canonical facade; random/unkeyed publishing rejected.
- [x] `NotificationEvents v2.0.0` deterministic task/swap/Party Quest/Finance event keys.
- [x] Task/swap/Party Quest notification projectors upgraded to HouseholdContext-safe `v2.0.0`.
- [x] `NotificationActions v3.0.0` uses HouseholdContext identity.
- [x] `NotificationCenter v2.0.0` clears stale detail presentation on identity change.
- [x] `NotificationDelivery v2.0.0` is in-app banner delivery only and clears stale queue/banner state on identity change.
- [x] Canonical notification stack activated in actual `/api/app` served graph.

### Verification checkpoint
- [x] Notification household repository lifecycle/isolation/idempotency contract.
- [x] Notification store + deterministic events contract.
- [x] Notification projector lifecycle contract.
- [x] Notification presentation/action identity contract.
- [x] Served notification runtime audit against actual `/api/app` output.
- [x] Complete Household Rebuild Contracts green on code commit `15ca6bca994ea5852815cad7f3e811261a783152`.
- [!] Latest Vercel build for this checkpoint blocked by Hobby `build-rate-limit`; fresh READY preview not yet available.
- [ ] Cross-device in-app inbox/unread/read/dismiss verification.
- [ ] Actionable task-help / Party Quest notification verification.
- [ ] Real iPhone reload/background→foreground stability verification for active notification runtime.

### Push delivery
- [ ] User-private multi-device push-device registry.
- [ ] Platform-neutral web/native registration and delivery contract.
- [ ] Deliberate user opt-in/permission flow.
- [ ] Web/PWA service worker + FCM foreground/background adapter.
- [ ] Token refresh/revocation/logout/account-switch lifecycle.
- [ ] Trusted server-side sender; no client-side server/service-account credentials.
- [ ] Push failure independent from canonical inbox state.
- [ ] Sanitized delivery-health state separate from read/dismiss.

### Final STEP 10 gate
- [ ] Complete in-app + push contract suite.
- [ ] Fresh Vercel preview containing all final STEP 10 assets.
- [ ] Real iPhone Safari/PWA STEP 10 acceptance.
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

## Standing decisions / guardrails

- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- Platform admin remains separate from household admin and must not imply generic raw household-content access.
- STEP 8 Finance and STEP 9 Progression are frozen.
- STEP 10 notification identity is HouseholdContext/UID based.
- Notification state and push delivery are separate layers.
- Realtime notification subscriptions require exact cleanup and stale-context protection.
- Push/device credentials are user-private technical data.
- Browser/native delivery adapters must never become the notification domain authority.
- Every meaningful development update must update both `docs/FAMILYAPP-CURRENT-TODO.md` and `docs/FAMILYAPP-UPDATE-LOG.md`.

## Milestone summary

- 2026-08-19 — Stable main baseline selected and rebuild branch created.
- 2026-08-20 — STEP 0, STEP 1 and STEP 2 accepted on real iPhone Safari.
- 2026-08-22 — STEP 2A/2B foundation and STEP 3 Tasks accepted.
- 2026-08-23/24 — STEP 8 Finance completed and accepted.
- 2026-08-24 — STEP 9 canonical progression completed and real-iPhone accepted.
- 2026-08-24 — STEP 10 notification/push audit completed.
- 2026-08-24 — STEP 10 canonical in-app notification repository/store/events/projectors/presentation implemented and activated in the served loader; full contracts green, fresh Vercel preview waiting on Hobby build-rate limit.

## Maintenance rule

When implementation progresses:
1. update the relevant checklist items;
2. append meaningful changes to `docs/FAMILYAPP-UPDATE-LOG.md`;
3. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
4. never mark a functional phase accepted before its required tests/preview/device gate;
5. keep the architecture roadmap synchronized when scope/order/constraints materially change;
6. add household-isolation/lifecycle tests during each module migration rather than postponing them;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.