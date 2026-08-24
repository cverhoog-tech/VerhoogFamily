# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 10 — Notifications: opened after accepted STEP 9 device gate; read-only audit is the next action.**

STEP 8 Finance and STEP 9 Progression / XP / Achievements are accepted/frozen. Do not start notification implementation by guessing at the current state. First audit the actually served notification runtime, current `addNotif`/producer paths, read/dismiss behavior, household/UID scoping, listener ownership and existing push/FCM code. Notification state and push delivery must remain separate architectural concerns.

## STEP 8 — Finance

**Status: ACCEPTED / FROZEN on 2026-08-24.**

### Accepted implementation
- [x] Household-scoped canonical Finance repository/store boundary.
- [x] Shared Finance state and transaction synchronization foundation.
- [x] Reset semantics through FinanceStore/FinanceRuntimeShell.
- [x] Old large top `Verse start` card removed; reset action belongs at page bottom only.
- [x] Premium Analyse UI v2 with selected-period comparison.
- [x] Calm `Periode overzicht` hero direction.
- [x] Richer card/button depth without turning Analyse into an image-heavy page.
- [x] Analysis engine for income, expenses, fixed/variable spend, savings, categories, receipts and period comparisons.
- [x] Data-driven `FamilyApp Assistent` recommendations.
- [x] Advisor duplicate-install protection for runtime stability.
- [x] PDF export/share flow from Analyse.
- [x] Final premium Finance PDF report template implemented as a two-page A4 report.
- [x] Premium PDF page 1: branded period/result hero, income/expense/savings KPIs, category bars and the live FamilyApp Assistent recommendation.
- [x] Premium PDF page 2: fixed/variable/savings/receipt summary, category comparison table, savings progress and core insights.
- [x] PDF layout rendered and visually QA'd locally with no clipping/overlap; PDF preflight opens as a valid two-page non-encrypted PDF.
- [x] Automated `test-finance-analysis-export.js` contract covers two-page structure, report sections, advisor projection and retirement of placeholder template copy.
- [x] Extra-strict Finance privacy/isolation regression contracts cover household A→B switching, stale callbacks, household-scoped writes, active-household-only reset, logout projection clear, rejected logged-out writes, stale callback after logout and reconnect into another household.
- [x] Household Rebuild Contracts passed for Finance privacy/export changes.
- [x] Fresh Vercel READY preview verified with deployed `FinanceAnalysisExport v2.0.0`.
- [x] Final real-iPhone verification of the premium two-page PDF accepted by the product owner on 2026-08-24, including the tested render/share flow.
- [x] Legacy phase tracker synchronized so STEP 4 is no longer incorrectly reported as current.
- [x] STEP 8 accepted/frozen.

## STEP 9 — Progression / XP / Achievements

**Status: ACCEPTED / FROZEN on 2026-08-24.**

### Accepted authority / implementation
- [x] Audit currently served progression, XP and achievement files/write paths.
- [x] Detailed authority audit stored in `docs/step9-progression-audit.md`.
- [x] Canonical path defined at `families/{householdId}/members/{uid}/progression`.
- [x] `ProgressionStore v1.0.0` owns XP, deterministic reward ledger, achievements and migration metadata.
- [x] Binding uses `HouseholdContext`; exact listener cleanup and stale-context rejection are enforced.
- [x] Logout/account/household switch immediately clears previous XP/achievement compatibility projections.
- [x] Safe migration reads only the active member's Firebase legacy `xp`/`achievements`; unscoped `fam_myxp_v1`/browser globals never seed another identity.
- [x] `awardOnce(key, amount, metadata)` makes reward claim + XP increment one canonical transaction.
- [x] `unlockAchievementOnce(...)` makes badge unlock + badge XP one canonical transaction.
- [x] `ProgressionRuntime v1.1.0` owns served `awardXP` / `checkAchievements` mutation behavior while retaining compatible UI entry points.
- [x] `ProgressionUidBridge v3.0.0` and `AchievementUidBridge v2.0.0` are compatibility-only; neither remains a Firebase progression authority.
- [x] Existing achievement UI consumes canonical projections without a redesign.

### Accepted deterministic/idempotent served rewards
- [x] One-off task completion: `task:{taskId}` across both legacy toggle and shared UID popup/update path.
- [x] Recurring task completion: task + week/month occurrence key.
- [x] Recurring task day completion: task + week + day occurrence key; old direct `myXP += 2` is neutralized/rerouted canonically.
- [x] Achievement XP: `achievement:{badgeId}`.
- [x] Daily bonus: `daily:{YYYY-MM-DD}`.
- [x] Party Quest completion: `partyQuest:{questId}`; failed XP persistence leaves the quest recoverable instead of silently closing it.
- [x] Feed post: `feedPost:{postId}`.
- [x] Feed reaction/like: `feedLike:{postId}`; unlike/re-like cannot farm XP.
- [x] Manual recipe creation: `recipe:{recipeId}`.
- [x] Recipe link import: direct `recipe:{savedRecipeId}` reward; importer does not leave a second manual-create reward context.
- [x] Note creation: `note:{noteId}`.
- [x] Task-template activation: template + activation batch/first-task ID.
- [x] Skills account-XP side rewards: deterministic skill log sequence keys; local/name-based skill state is not treated as account progression authority.
- [x] Weekly quest bonus/claim rewards: week + quest ID keys.
- [x] Ability XP paths: deterministic copycat/auto-done/triple-use keys; old Triple-XP direct `myXP += 4` is neutralized/rerouted canonically.
- [x] Finance XP side rewards use FinanceStore record/goal/update IDs without changing accepted STEP 8 Finance calculations/UI/data behavior.
- [x] Legacy trade/duo/group/shop alternative XP paths are explicitly classified by the served-runtime audit as currently unreachable/unserved and reserved for STEP 16 cleanup.

### Accepted verification / device gate
- [x] `scripts/test-progression-store.js`.
- [x] `scripts/test-progression-runtime.js`.
- [x] `scripts/test-progression-producer-keys.js`.
- [x] `scripts/test-recurring-progression-rewards.js`.
- [x] `scripts/test-progression-entity-producers.js`.
- [x] `scripts/test-skills-progression-bridge.js`.
- [x] `scripts/test-finance-progression-bridge.js`.
- [x] `scripts/test-progression-served-runtime-audit.js`.
- [x] Final complete Household Rebuild Contracts PASS on code commit `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`.
- [x] Vercel deployment `dpl_6FfiZeywGvDMz9nZtHrmQCXib97n` READY for the same code commit.
- [x] Served HTML/runtime wiring verified with the current cache-busted STEP 9 assets/adapters.
- [x] Real iPhone Safari/PWA smoke accepted by the product owner on 2026-08-24: app/session/Home XP normal, normal-task reward path works, duplicate completion cannot farm the same task reward, Achievements renders, multi-module navigation/reload/background→foreground remains stable with no freeze/white screen/crash.
- [x] STEP 9 accepted/frozen.

## STEP 10 — Notifications

**Status: CURRENT PHASE — audit not yet completed.**

### Required first action: read-only notification audit
- [ ] Inventory the actually served notification modules and bootstrap/runtime wiring.
- [ ] Find all current `addNotif`/notification creation producers and classify their source domain/event.
- [ ] Identify current notification data authority: globals/localStorage/Firebase/member/household paths.
- [ ] Map read, unread, dismiss/delete and `Alles gelezen` behavior.
- [ ] Map current household/UID scoping and identify any display-name/global-state leakage risk.
- [ ] Identify listener/subscription owners and cleanup behavior across logout/account/household switch.
- [ ] Inventory existing browser push / FCM registration, token storage, service-worker hooks and delivery code separately from in-app notification state.
- [ ] Persist the audit in a dedicated STEP 10 architecture/audit document before mutation work starts.

### Target architecture from the rebuild roadmap
- [ ] One canonical household notification store.
- [ ] Per-UID read/dismiss state.
- [ ] Domain-event projection rather than ad-hoc UI-only notification mutation.
- [ ] Exactly one household notification listener with explicit cleanup/unsubscribe.
- [ ] Household/account switch clears stale notification projection and stale callbacks cannot repopulate prior household data.
- [ ] Push delivery remains separate from canonical notification state.
- [ ] Notification domain/repository contract remains platform-neutral so later APNs/FCM/native notification actions can attach without rewriting notification state.
- [ ] Add notification isolation/lifecycle/idempotency contract tests before device gate.
- [ ] Fresh Vercel branch preview + real iPhone Safari/PWA gate before STEP 11.
- [ ] Freeze STEP 10 only after product acceptance.

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
- Current accepted icon scope and Brand/PWA identity remain frozen unless a concrete regression/redesign is requested.
- STEP 8 Finance and STEP 9 Progression are frozen; STEP 10 must not casually refactor them.
- Platform admin remains separate from household admin and must not imply unrestricted raw household-content access.
- Notifications must be household-scoped where shared and UID-scoped where user-specific.
- Notification state and push delivery are separate layers; a delivery failure must not redefine canonical notification state.
- Realtime notification subscriptions require explicit teardown and stale-context protection.
- New notification architecture must remain callable from a future native shell and must not depend on web-only notification APIs for domain correctness.
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.