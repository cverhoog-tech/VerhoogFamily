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
- [x] STEP 0 baseline verification gate completed.
- [x] STEP 1 authenticated session / startup ownership completed.
- [x] STEP 2 HouseholdContext / UID identity / lifecycle completed.
- [ ] STEP 2A platform-admin identity foundation paused until STEP 2B is complete.
- [-] STEP 2B Person/UI identity modernization in progress.

**Current functional work:** STEP 2B.4A — Global FamilyApp Icon System foundation + Person-tab migration plan.

## Phase checklist

### STEP 0 — Stable baseline
- [x] Baseline main SHA recorded: `997eb0710f512857a3280e776ab38988a7ee5a86`.
- [x] `agent/household-rebuild-v2` created from exact baseline.
- [x] Syntax/static baseline checks accepted for unchanged stable baseline.
- [x] Existing relevant baseline behavior accepted from stable main baseline.
- [x] Vercel branch preview verified READY/success.
- [x] Real iPhone Safari baseline smoke test accepted by Shane on 2026-08-20.

### STEP 1 — Authenticated session / startup ownership
- [x] Canonical authenticated-session controller implemented.
- [x] Exactly one auth-state startup owner.
- [x] Exactly one app-reveal owner.
- [x] Legacy localStorage 600ms app reveal retired from served runtime.
- [x] Google sign-in reduced to auth command/adapter.
- [x] Existing-session bootstrap uses same canonical path.
- [x] Stale async bootstrap protected by generation/session token.
- [x] Recoverable startup failure UI implemented.
- [x] Cleanup registry implemented and legacy household listener bound to exact cleanup.
- [x] No startup polling/lifecycle competing owners in migrated paths.
- [x] Ownership contract/regression test added and accepted.
- [x] Vercel preview READY/success.
- [x] iPhone Safari device gate accepted by Shane on 2026-08-20.

### STEP 2 — HouseholdContext / UID identity / lifecycle
- [x] Canonical read-only household/session context implemented.
- [x] UID + householdId context contract implemented.
- [x] capture/isCurrent stale-context protection implemented.
- [x] explicit subscription/unsubscribe contract implemented.
- [x] household-switch rebind contract implemented.
- [x] identity bridge migrated away from polling/focus lifecycle ownership.
- [x] lifecycle/adoption regression tests added and accepted.
- [x] Vercel preview READY/success.
- [x] iPhone Safari device gate accepted by Shane on 2026-08-20.

### STEP 2A — Platform admin identity foundation
- [ ] Paused while STEP 2B is completed and device-validated.
- [ ] Platform role separated from household role.
- [ ] Platform admin tied to protected authenticated UID authority.
- [ ] No client self-elevation.
- [ ] Dedicated platform permission contract.
- [ ] Audit-event contract.
- [ ] Privacy classification enforced.
- [ ] Tests prove platform admin does not imply raw household-content access.
- [ ] tests/preview/device gate accepted where applicable.

### STEP 2B — Person/UI identity modernization

#### STEP 2B.1 — Backdrop foundation
- [x] Canonical hero backdrop preset catalog.
- [x] Canonical backdrop resolver separate from avatar/portrait media.
- [x] Default preset contract: `fantasy-castle-night`.
- [x] Premium fantasy castle night WebP added as a real app asset.
- [x] PersonDashboardService exposes member hero backdrop preference.
- [x] PersonTabV2 renders backdrop independently from character portrait.
- [x] Resolver/catalog regression contract added.
- [x] Vercel preview accepted.
- [x] iPhone Safari visual/device gate accepted by Shane on 2026-08-20.

#### STEP 2B.2 — Preset picker
- [x] Small edit-pencil action on own hero card.
- [x] Premium bottom sheet / picker UI.
- [x] Preset selection and default reset.
- [x] UID/household-safe member hero background repository.
- [x] Only current member can edit own backdrop in first version.
- [x] Realtime persistence/re-render.
- [x] Contract test added and Vercel preview READY.
- [x] iPhone Safari device gate accepted by Shane on 2026-08-20: picker works perfectly.

#### STEP 2B.3 — Upload support
- [ ] Image-only upload service.
- [ ] Size/type validation and compression/resize boundary.
- [ ] Household/UID scoped Firebase Storage path.
- [ ] Upload preview and confirm flow.
- [ ] Persist uploaded backdrop metadata to member profile.
- [ ] tests/preview/device gate accepted.

#### STEP 2B.4 — Global FamilyApp Icon System
- [-] STEP 2B.4A foundation/design contract opened.
- [ ] Central semantic icon registry.
- [ ] Central icon renderer/component boundary.
- [ ] Shared icon tokens: size, tone, glow, light/dark behavior.
- [ ] Production SVG asset set in approved premium light-fantasy style.
- [ ] Explicit exclusion contract: bottom navigation/lint icons remain unchanged.
- [ ] Explicit exclusion contract: More-menu icons remain unchanged.
- [ ] Person tab migrated first; generic emoji/content icons retired there.
- [ ] Contract/regression tests prove excluded nav/more icons are untouched.
- [ ] Vercel preview accepted.
- [ ] iPhone Safari device gate accepted.

#### STEP 2B.5 — App Brand / Logo / PWA Identity System
- [ ] Canonical FamilyApp crest/family-shield production asset created from approved design direction.
- [ ] Crest is a standalone brand mark, not a crop from the concept sheet.
- [ ] Brand asset registry separates app identity from normal UI icons.
- [ ] Production logo variants created for app/login/header/favicon contexts.
- [ ] PWA `192x192`, `512x512`, maskable and Apple touch variants created.
- [ ] Manifest/favicon/apple-touch references migrated to crest assets.
- [ ] PWA icon safe-area and small-size legibility validated.
- [ ] Existing bottom-nav and More-menu iconography remains unchanged.
- [ ] Vercel preview accepted.
- [ ] iPhone Safari “Add to Home Screen” device gate accepted.

#### STEP 2B.6 — Tasks icon migration
- [ ] Task cards/content icons moved to canonical registry.
- [ ] Party quest/help/join/status icons moved to canonical registry.
- [ ] Task detail/create content icons moved where appropriate.
- [ ] Bottom-nav/lint remains excluded.
- [ ] tests/preview/device gate accepted.

#### STEP 2B.7 — Shopping / Recipes / Meals icon migration
- [ ] Shopping/category/item icons moved to canonical registry.
- [ ] Recipe/ingredient/meal content icons moved to canonical registry.
- [ ] Generic emoji fallbacks reduced to explicit semantic fallback only.
- [ ] tests/preview/device gate accepted.

#### STEP 2B.8 — Feed / Notifications / Agenda / Finance / Achievements icon migration
- [ ] Feed/activity content icons migrated.
- [ ] Notification content/status icons migrated.
- [ ] Agenda/time content icons migrated.
- [ ] Finance content icons migrated.
- [ ] Achievement/badge/progression content icons migrated.
- [ ] tests/preview/device gate accepted.

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
- 2026-08-20 — Living progress tracker added.
- 2026-08-20 — STEP 0 baseline accepted on real iPhone Safari by Shane.
- 2026-08-20 — STEP 1 canonical session/startup ownership accepted on real iPhone Safari by Shane.
- 2026-08-20 — STEP 2 HouseholdContext/UID/lifecycle accepted on real iPhone Safari by Shane.
- 2026-08-20 — STEP 2A paused after Person-tab visual regressions surfaced. Person tab rebuilt as V2 with separate character portrait presentation.
- 2026-08-20 — STEP 2B opened for scalable Person/UI presentation work.
- 2026-08-20 — STEP 2B.1 premium castle backdrop + separate portrait composition accepted on iPhone Safari.
- 2026-08-20 — STEP 2B.2 own-card preset picker/persistence accepted by Shane: works perfectly.
- 2026-08-20 — Global FamilyApp icon visual direction approved: premium light-fantasy custom set across app content; existing bottom navigation/lint and More-menu icons explicitly remain unchanged.
- 2026-08-20 — Family crest/family-shield design direction approved as canonical app logo and future PWA/home-screen icon; production-safe standalone asset required.
- 2026-08-20 — STEP 2B.4 Global Icon System and STEP 2B.5 Brand/PWA Identity added before broader module icon migrations.

## Maintenance rule
When implementation progresses:
1. update the relevant checklist items;
2. record important implementation/test commits in the milestone log;
3. never mark a functional phase complete before required automated checks + branch preview + Shane's real-device gate are accepted;
4. keep the architecture roadmap synchronized when scope/order/constraints materially change.
