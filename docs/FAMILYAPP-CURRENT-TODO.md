# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 9 — Progression / XP / Achievements: canonical foundation active; producer-key migration in progress.**

STEP 8 Finance is accepted/frozen. STEP 9 now has a canonical UID + household progression store and runtime; remaining work is to migrate every served XP producer to deterministic event keys, eliminate transitional fallback rewards, then perform the full preview/device gate.

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

**Status: CURRENT PHASE — canonical foundation implemented, idempotent producer migration in progress.**

### Audit / authority map
- [x] Audit the currently served progression, XP and achievements runtime and identify current authority/write paths.
- [x] Map Firebase/local/legacy paths and current modules that award or mutate XP/progression.
- [x] Identify current achievement projection/rendering dependencies and compatibility requirements.
- [x] Identify duplicate reward/race risks and display-name/localStorage progression risks.
- [x] Persist detailed audit in `docs/step9-progression-audit.md`.

### Canonical foundation
- [x] Define canonical UID progression data contract at `families/{householdId}/members/{uid}/progression`.
- [x] Implement `ProgressionStore v1.0.0` with one household/UID binding, exact listener cleanup and stale-context rejection.
- [x] Safe one-time migration reads only the active member's Firebase `xp`/`achievements`; unscoped browser/localStorage XP is never migration authority.
- [x] Logout/account/household switch clears XP and achievement compatibility projections immediately.
- [x] Canonical reward ledger supports atomic `awardOnce(key, amount, metadata)` mutations.
- [x] Canonical achievement unlock supports atomic achievement record + XP reward mutation.
- [x] `ProgressionRuntime v1.0.0` replaces legacy `awardXP` / `checkAchievements` mutation behavior while preserving existing UI entry points.
- [x] `ProgressionUidBridge v3.0.0` is compatibility-only; it owns no Firebase XP listener or local XP seeding.
- [x] `AchievementUidBridge v2.0.0` is compatibility-only; it owns no legacy achievement listener or XP increment.
- [x] Existing achievement UI reads canonical projections without needing a redesign.
- [x] Transitional reward calls without a deterministic key remain canonical but are counted/warned via `ProgressionRuntime.status().fallbackRewardCount`; STEP 9 cannot freeze until served producers are keyed.

### Deterministic reward producers completed
- [x] One-off task completion uses `task:{taskId}` and cannot farm XP by reopen/re-complete.
- [x] Achievement rewards use `achievement:{badgeId}` atomically.
- [x] Daily bonus uses `daily:{YYYY-MM-DD}`; a second device/handler call reuses the same canonical key.
- [x] Party Quest completion uses `partyQuest:{questId}`.
- [x] Party Quest completion does not end the quest if canonical XP persistence fails, allowing retry/repair after reconnect.

### Reward producers still to migrate before STEP 9 freeze
- [ ] Recurring task occurrence rewards: stable task + occurrence/week key.
- [ ] Feed post and like rewards: stable post/reaction keys.
- [ ] Recipe creation rewards: stable recipe ID key.
- [ ] Note creation rewards: stable note ID key.
- [ ] Skills / weekly quests / ability reward paths: stable log/week/action keys and UID-safe account XP routing.
- [ ] Finance reward call sites still using legacy two-argument `awardXP`: stable transaction/goal/action keys without changing accepted Finance behavior.
- [ ] Legacy trade/duo/group-quest reward paths that are still served: stable event/cycle keys or explicit retirement if proven unused.
- [ ] Drive `ProgressionRuntime.status().fallbackRewardCount` to zero during the final served-runtime smoke path.

### Tests / gates
- [x] `scripts/test-progression-store.js`: migration isolation, logout clear, stale callback rejection, A→B reconnect, cross-household write isolation, duplicate reward and duplicate achievement protection.
- [x] `scripts/test-progression-runtime.js`: canonical runtime cutover, legacy bridge retirement, canonical achievement evaluation and deterministic one-off task reward.
- [x] `scripts/test-progression-producer-keys.js`: daily/Party Quest deterministic keys and Party Quest failed-write recovery behavior.
- [x] Household Rebuild Contracts green at STEP 9 checkpoint (`b81b936c8b7185b461268a663098f85339e4d2bd`).
- [x] Vercel branch deployment for the same checkpoint is READY.
- [ ] After all served producers are keyed, rerun complete Household Rebuild Contracts.
- [ ] Verify final served runtime assets/version wiring in a fresh READY preview.
- [ ] Pass real iPhone Safari/PWA STEP 9 smoke test: login/session, Home XP, task reward once, achievements, reload, background/foreground, no freeze/white screen.
- [ ] Freeze STEP 9 only after product acceptance.

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
- STEP 8 Finance is frozen; do not casually redesign or refactor it during STEP 9 unless a concrete regression is found.
- Platform admin remains separate from household admin and must not imply unrestricted raw household-content access.
- STEP 9 progression identity must be UID-based, not display-name based.
- Every XP/reward mutation introduced in STEP 9 must have a deterministic idempotency boundary.
- Browser globals/localStorage may remain temporary presentation caches only; they must never seed another UID/household's canonical progression.
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.