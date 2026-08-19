# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`
Working branch: `agent/household-rebuild-v2`
Baseline main SHA: `997eb0710f512857a3280e776ab38988a7ee5a86`

This file is the living execution tracker for the rebuild. The roadmap remains the architectural source of truth; this tracker is updated as implementation, tests, previews and device gates are completed.

## Status legend

- `[ ]` not started
- `[-]` in progress
- `[x]` completed and accepted
- `[!]` blocked / needs attention

A functional phase is only marked `[x]` after its required static/tests/preview/device gate has been completed and accepted.

## Current position

- [x] Rebuild branch created from exact stable main baseline SHA.
- [x] Architectural roadmap recorded.
- [x] Platform-admin/privacy architecture added to roadmap.
- [x] App Store / Google Play store-readiness architecture added to roadmap.
- [ ] STEP 0 baseline verification gate completed.
- [ ] STEP 1 implementation started.

**Next planned functional work:** STEP 0 baseline verification, then STEP 1 — Authenticated session / startup ownership.

## Phase checklist

### STEP 0 — Stable baseline

- [x] Baseline main SHA recorded: `997eb0710f512857a3280e776ab38988a7ee5a86`.
- [x] `agent/household-rebuild-v2` created from exact baseline.
- [ ] Syntax/static baseline checks passed.
- [ ] Existing relevant baseline tests passed.
- [ ] Vercel branch preview verified.
- [ ] Real iPhone Safari baseline smoke test accepted.

### STEP 1 — Authenticated session / startup ownership

- [ ] Canonical authenticated-session controller implemented.
- [ ] Exactly one auth-state startup owner.
- [ ] Exactly one app-reveal owner.
- [ ] Legacy localStorage 600ms app reveal retired.
- [ ] Google sign-in reduced to auth command/adapter.
- [ ] Existing-session bootstrap uses same canonical path.
- [ ] Stale async bootstrap protected by generation/session token.
- [ ] Recoverable startup failure UI implemented.
- [ ] Cleanup registry implemented.
- [ ] No startup polling/lifecycle competing owners.
- [ ] Contract/regression tests passed.
- [ ] Vercel preview passed.
- [ ] iPhone Safari device gate accepted.

### STEP 2 — HouseholdContext / UID identity / lifecycle

- [ ] Canonical read-only household/session context.
- [ ] UID + householdId context contract.
- [ ] capture/isCurrent stale-context protection.
- [ ] explicit subscription/unsubscribe contract.
- [ ] household-switch rebind contract.
- [ ] tests/preview/device gate accepted.

### STEP 2A — Platform admin identity foundation

- [ ] Platform role separated from household role.
- [ ] Platform admin tied to protected authenticated UID authority.
- [ ] No client self-elevation.
- [ ] Dedicated platform permission contract.
- [ ] Audit-event contract.
- [ ] Privacy classification enforced.
- [ ] Tests prove platform admin does not imply raw household-content access.
- [ ] tests/preview/device gate accepted where applicable.

### STEP 3 — Tasks core

- [ ] Household-scoped task repository.
- [ ] UID identity and mutation boundary.
- [ ] Realtime bind/unbind without duplicate listeners.
- [ ] Existing premium UI retained.
- [ ] tests/preview/device gate accepted.

### STEP 4 — Recipes

- [ ] Firebase shared source of truth.
- [ ] Realtime create/edit/delete.
- [ ] Household rebind/cleanup.
- [ ] tests/preview/device gate accepted.

### STEP 5 — Meals

- [ ] Household-bound meal-plan store.
- [ ] Stable recipe references.
- [ ] Realtime sync/rebind.
- [ ] tests/preview/device gate accepted.

### STEP 6 — Agenda

- [ ] Household-scoped calendar source of truth.
- [ ] Explicit rebind and cleanup.
- [ ] Meal integration after meal store is stable.
- [ ] tests/preview/device gate accepted.

### STEP 7 — Shopping

- [ ] Current stable grocery-add/freeze fix preserved.
- [ ] Household realtime shopping repository.
- [ ] Recipe/meal projection integrated safely.
- [ ] Grocery-add freeze regression test.
- [ ] tests/preview/device gate accepted.

### STEP 8 — Finance

- [ ] Shared-vs-private data classification.
- [ ] Household-scoped finance state where appropriate.
- [ ] Transaction sync.
- [ ] Reset semantics.
- [ ] tests/preview/device gate accepted.

### STEP 9 — Progression / XP / achievements

- [ ] Canonical UID progression store.
- [ ] Idempotent reward mutations.
- [ ] Achievement projection.
- [ ] Legacy XP authority retired/read-only.
- [ ] tests/preview/device gate accepted.

### STEP 10 — Notifications

- [ ] Canonical household notification store.
- [ ] Per-UID read/dismiss state.
- [ ] Domain-event projectors.
- [ ] Single scoped realtime listener with cleanup.
- [ ] Native push-compatible separation retained.
- [ ] tests/preview/device gate accepted.

### STEP 11 — Party quests

- [ ] Invites.
- [ ] Join/leave.
- [ ] Help requests.
- [ ] Completion/rewards.
- [ ] Notifications.
- [ ] Idempotency.
- [ ] tests/preview/device gate accepted.

### STEP 12 — Profile / presence / avatars

- [ ] UID profile identity.
- [ ] Household member presentation.
- [ ] Avatar sync/cache.
- [ ] Exactly one presence binding per active context.
- [ ] Exact listener cleanup.
- [ ] tests/preview/device gate accepted.

### STEP 13 — Activity / feed

- [ ] Immutable household activity events.
- [ ] Domain producers.
- [ ] Dedupe/idempotency.
- [ ] Feed presentation/interactions.
- [ ] tests/preview/device gate accepted.

### STEP 14 — Search / autocomplete

- [ ] Household-scoped index.
- [ ] Clear/rebuild on household switch.
- [ ] No stale prior-household results.
- [ ] tests/preview/device gate accepted.

### STEP 14A — Platform operations dashboard

- [ ] Dedicated sanitized platform operations projection/API.
- [ ] Household technical health/status dashboard.
- [ ] Member count/schema/migration health.
- [ ] Startup/auth/sync/error summaries.
- [ ] Notification-delivery health.
- [ ] Audit/support-case view.
- [ ] No generic raw-family read capability.
- [ ] Explicit consent/audited mechanism for any future content-level support access.
- [ ] tests/preview/device gate accepted.

### STEP 15 — Firebase Rules hardening

- [ ] Canonical path/rules matrix finalized.
- [ ] Shared collection allowlist.
- [ ] Notification/activity/FCM rules.
- [ ] Owner/member/revocation rules.
- [ ] Platform admin restricted to sanitized operations data.
- [ ] Emulator/rule tests passed.
- [ ] No production Rules deployment without explicit approval.

### STEP 16 — Legacy cleanup

- [ ] my/partner authorities retired.
- [ ] Guest-mode remnants removed.
- [ ] Unused bridges/stores/listeners removed.
- [ ] Deprecated duplicate code/assets removed after proof of non-use.
- [ ] Runtime wiring consolidated safely.
- [ ] tests/preview/device gate accepted.

### STEP 17 — Store distribution readiness

- [ ] Re-check current Apple App Store and Google Play requirements.
- [ ] Choose/validate iOS/Android shell strategy.
- [ ] Signing/bundle/build pipeline.
- [ ] App icons/launch/store assets.
- [ ] TestFlight / Google internal testing.
- [ ] Native push + deep links.
- [ ] Secure platform credential storage.
- [ ] Native background/foreground lifecycle integration.
- [ ] Apple-compliant login mix where required.
- [ ] In-app account deletion + backend deletion lifecycle.
- [ ] Privacy policy/legal/support surfaces.
- [ ] App Store privacy + Play Data Safety inventory.
- [ ] Permission/accessibility/device audit.
- [ ] Crash/stability instrumentation.
- [ ] Store reviewer/demo path.
- [ ] Final submission checklist passed.

## Store-readiness check applied to every relevant phase

For each functional phase verify:
- [ ] No unnecessary browser-only business logic introduced.
- [ ] Service/repository contracts remain callable from a future native shell.
- [ ] Data collection and permissions remain minimized.
- [ ] Push/deep-link/lifecycle entry points can be added without duplicating domain logic.
- [ ] Authenticated offline/reconnect behavior remains deterministic.

## Milestone / decision log

- 2026-08-19 — Main `997eb0710f512857a3280e776ab38988a7ee5a86` selected as last stable rebuild baseline.
- 2026-08-19 — `agent/household-rebuild-v2` created from exact baseline; old household branch retained only as reference.
- 2026-08-19 — Rebuild architecture/phase roadmap recorded.
- 2026-08-19 — Platform-admin architecture added: personal UID platform capability, privacy-first sanitized operations layer, no implicit household-content access.
- 2026-08-19 — Store-readiness made a cross-cutting architecture principle and STEP 17 added.
- 2026-08-20 — Living progress tracker added. Future completed phases and significant implementation commits will be recorded here.

## Maintenance rule

When implementation progresses:
1. update the relevant checklist items;
2. record important implementation/test commits in the milestone log;
3. never mark a functional phase complete before required automated checks + branch preview + Shane's real-device gate are accepted;
4. keep the architecture roadmap synchronized when scope/order/constraints materially change.
