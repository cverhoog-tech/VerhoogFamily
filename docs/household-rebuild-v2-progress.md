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
- [x] STEP 2A — Platform-admin identity foundation. Production activation remains a separate explicitly approved action.
- [x] STEP 2B — Person/UI identity modernization and accepted Brand/PWA/icon scope.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance — accepted/frozen on 2026-08-24.
- [-] STEP 9 — Progression / XP / Achievements — canonical foundation active; deterministic producer migration in progress.

**Current phase: STEP 9 Progression / XP / Achievements. Canonical store/runtime are active on the rebuild branch. Continue migrating every served XP producer to deterministic event keys before final preview/iPhone acceptance.**

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

- [x] Household-scoped canonical Finance repository/store boundary.
- [x] UID + household context lifecycle protection.
- [x] Household-scoped transactions, recurring state, savings goals and reset semantics.
- [x] `Verse start` retained only as intended bottom reset action; top reset card removed.
- [x] Premium Analyse UI v2 and comparison engine.
- [x] Data-driven FamilyApp Assistent with deterministic recommendations.
- [x] Native PDF export/share flow.
- [x] Final premium two-page A4 Finance report template.
- [x] Finance privacy/isolation and logout/reconnect contracts.
- [x] Household Rebuild Contracts passed.
- [x] Fresh Vercel READY preview contains `FinanceAnalysisExport v2.0.0`.
- [x] Final premium PDF iPhone verification accepted by the product owner on 2026-08-24.

## STEP 9 — Progression / XP / Achievements

**Current phase — canonical foundation implemented; reward-producer migration continues.**

### Audit
- [x] Inventory currently served progression/XP/achievement files and bootstrap wiring.
- [x] Inventory current XP/reward mutation call sites and source events.
- [x] Map Firebase, local cache and legacy paths acting as progression authority/compatibility data.
- [x] Map achievement projection/render dependencies.
- [x] Identify duplicate reward/race risks and display-name/unscoped-cache identity risks.
- [x] Detailed audit stored in `docs/step9-progression-audit.md`.

### Canonical foundation
- [x] Canonical UID + household progression path: `families/{householdId}/members/{uid}/progression`.
- [x] `ProgressionStore v1.0.0` with exact bind/unbind, stale-context rejection and compatibility projection clearing.
- [x] Same-member Firebase legacy XP/achievement migration only; unscoped localStorage is not migration authority.
- [x] Atomic deterministic reward ledger via `awardOnce`.
- [x] Atomic achievement unlock + badge XP transaction.
- [x] `ProgressionRuntime v1.0.0` owns served `awardXP`/`checkAchievements` mutation behavior.
- [x] Legacy `ProgressionUidBridge` and `AchievementUidBridge` retired as mutation/data authorities; compatibility-only adapters remain.
- [x] Achievement UI can consume canonical projection without redesign.
- [x] Logout/login/account/household switch protection and stale callback rejection covered by contracts.
- [x] Cross-household/isolation contract coverage.
- [x] Duplicate-reward/idempotency contract coverage.
- [x] Existing active-member Firebase progression preserved during migration.

### Deterministic producer migration
- [x] One-off tasks: `task:{taskId}`.
- [x] Achievement rewards: `achievement:{badgeId}`.
- [x] Daily bonus: `daily:{YYYY-MM-DD}`.
- [x] Party Quest completion: `partyQuest:{questId}` with failed-write retry behavior.
- [ ] Recurring task occurrences.
- [ ] Feed post / reaction rewards.
- [ ] Recipe creation rewards.
- [ ] Note creation rewards.
- [ ] Skills / weekly quests / abilities.
- [ ] Finance XP side rewards, preserving frozen Finance product behavior.
- [ ] Legacy trade/duo/group paths that remain served.
- [ ] No fallback reward calls during final served-runtime smoke path.

### Verification
- [x] `scripts/test-progression-store.js`.
- [x] `scripts/test-progression-runtime.js`.
- [x] `scripts/test-progression-producer-keys.js`.
- [x] Full Household Rebuild Contracts green at code checkpoint `b81b936c8b7185b461268a663098f85339e4d2bd`.
- [x] Vercel branch deployment for that code checkpoint READY.
- [ ] Final complete contract run after all producer migrations.
- [ ] Fresh final Vercel READY preview with served asset/version verification.
- [ ] Real iPhone Safari/PWA STEP 9 gate accepted.
- [ ] STEP 9 frozen only after product acceptance.

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

## Standing decisions / guardrails

- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- STEP 2B.3 unsigned Cloudinary upload remains prototype-only and must be replaced by an authorized/signed media boundary before broader beta.
- Platform admin remains separate from household admin and must not imply generic raw household-content access.
- Current accepted Brand/PWA/icon scope remains frozen unless a concrete regression or redesign is requested.
- STEP 8 Finance is frozen; STEP 9 work must not casually refactor it.
- STEP 9 progression identity is UID-based.
- STEP 9 reward mutations must be idempotent and event-keyed.
- Browser XP/achievement globals/localStorage are compatibility projections only, never cross-identity migration authority.
- Every meaningful development update must update both `docs/FAMILYAPP-CURRENT-TODO.md` and `docs/FAMILYAPP-UPDATE-LOG.md`.

## Milestone summary

- 2026-08-19 — Stable main baseline selected and rebuild branch created.
- 2026-08-20 — STEP 0, STEP 1 and STEP 2 accepted on real iPhone Safari.
- 2026-08-22 — STEP 2A/2B foundation, Brand/PWA identity and accepted UI/icon scope closed for the prototype baseline.
- 2026-08-22 — STEP 3 Tasks core accepted after isolation contracts, preview and real iPhone gate.
- 2026-08-23 — Rebuild execution advanced through STEP 8 Finance on the active branch; central cross-chat TODO/update log introduced to prevent tracker drift.
- 2026-08-23 — STEP 8 Finance Analyse polish, FamilyApp Assistent, reset placement, PDF share flow and Finance isolation contracts completed.
- 2026-08-23 — Final premium two-page Finance PDF implemented and automated export contract passed.
- 2026-08-24 — Fresh Vercel preview verified with `FinanceAnalysisExport v2.0.0`.
- 2026-08-24 — Final premium PDF iPhone test accepted; STEP 8 closed/frozen and STEP 9 opened.
- 2026-08-24 — STEP 9 audit completed; canonical UID progression store/runtime activated with first deterministic task/daily/achievement/Party Quest reward paths and green contracts.

## Maintenance rule

When implementation progresses:
1. update the relevant checklist items;
2. append meaningful changes to `docs/FAMILYAPP-UPDATE-LOG.md`;
3. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
4. never mark a functional phase accepted before its required tests/preview/device gate;
5. keep the architecture roadmap synchronized when scope/order/constraints materially change;
6. add household-isolation/lifecycle tests during each module migration rather than postponing them;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.