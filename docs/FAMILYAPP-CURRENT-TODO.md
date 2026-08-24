# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 9 — Progression / XP / Achievements: code/contract gate complete; final real-iPhone gate open.**

STEP 8 Finance is accepted/frozen. STEP 9 now has one canonical UID + household progression authority, deterministic/idempotent served reward producers and a served-runtime audit. The next action is the real iPhone Safari/PWA smoke test. Do not start STEP 10 until that gate is accepted and STEP 9 is explicitly frozen.

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

**Status: CURRENT PHASE — implementation and automated verification complete; device acceptance pending.**

### Audit / canonical authority
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

### Deterministic/idempotent served reward producers
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
- [x] Legacy trade/duo/group/shop alternative XP paths are explicitly classified by the served-runtime audit: currently unreachable/unserved and reserved for STEP 16 cleanup rather than silently treated as live producers.

### Automated verification
- [x] `scripts/test-progression-store.js` — migration isolation, logout clear, stale callback rejection, A→B reconnect, cross-household writes, duplicate reward and duplicate achievement protection.
- [x] `scripts/test-progression-runtime.js` — canonical runtime cutover, bridge retirement, achievement evaluation, identity-safe pending reward context and task replay protection.
- [x] `scripts/test-progression-producer-keys.js` — daily/Party Quest deterministic keys and Party Quest failed-write recovery.
- [x] `scripts/test-recurring-progression-rewards.js` — recurring week/month/day keys and direct legacy XP neutralization.
- [x] `scripts/test-progression-entity-producers.js` — Feed, note, manual/imported recipe and task-template reward contexts.
- [x] `scripts/test-skills-progression-bridge.js` — skill, weekly quest, claim and ability reward paths.
- [x] `scripts/test-finance-progression-bridge.js` — deterministic Finance side rewards including both extra-income entry labels.
- [x] `scripts/test-progression-served-runtime-audit.js` — builds the actual `/api/app` served load graph, discovers served `awardXP`/direct-XP paths and fails on unexpected producers or resurrected legacy trade/duo paths.
- [x] First served-runtime audit correctly found two previously missed live producers (`recipeServerlessLinkImport.js`, `taskUidCreateBridge.js`); both were fixed rather than merely allowlisted.
- [x] Final complete Household Rebuild Contracts PASS on code commit `843cbb5f5662cfee6e9aa32164b90b1cd7aa7e18`.
- [x] Vercel deployment `dpl_AvwGkzdhsFbHUgFk3zKaMpNXWWF` reached READY for the same code commit.
- [x] Served runtime wiring is contract-verified against the actual `api/app.js` output, including cache-busted STEP 9 runtime/adapters and the final task/import fixes.

### Final STEP 9 gate
- [ ] Real iPhone Safari/PWA smoke: app/session opens normally and Home XP is visible/stable.
- [ ] Complete one normal task and confirm XP increases once.
- [ ] Reopen/uncheck/re-complete that same task where the UI allows it and confirm the same task cannot grant XP again.
- [ ] Open Achievements and confirm level/XP/unlocked state renders normally.
- [ ] Navigate across a few modules, reload, background → foreground, reload again; no freeze/white screen/WebKit crash.
- [ ] Product owner accepts the STEP 9 device gate.
- [ ] Mark STEP 9 accepted/frozen; only then open STEP 10 Notifications.

## Later roadmap phases

- [ ] STEP 10 — Notifications.
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
- STEP 8 Finance is frozen; STEP 9 may only touch Finance through narrowly scoped progression adapters that preserve accepted Finance behavior.
- Platform admin remains separate from household admin and must not imply unrestricted raw household-content access.
- STEP 9 progression identity is UID-based, not display-name based.
- Every served XP/reward mutation must have a deterministic idempotency boundary.
- Browser globals/localStorage are compatibility projections only; they are never cross-identity migration authority.
- `ProgressionRuntime.status().fallbackRewardCount` is a diagnostic fallback only, not an accepted producer design; tested served reward paths are now explicitly keyed.
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.