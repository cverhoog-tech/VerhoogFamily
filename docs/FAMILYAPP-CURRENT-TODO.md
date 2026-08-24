# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 9 — Progression / XP / Achievements: opened on 2026-08-24.**

STEP 8 Finance is accepted/frozen. The next implementation work must start with a read-only audit of the current progression/XP/achievement authorities before introducing the canonical STEP 9 store.

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

**Status: CURRENT PHASE — implementation not started yet.**

### First action
- [ ] Audit the currently served progression, XP and achievements runtime and identify every current authority/write path before changing behavior.
- [ ] Map current Firebase/local/legacy paths and all modules that award or mutate XP/progression.
- [ ] Identify current achievement projection/rendering dependencies and compatibility requirements.

### Planned implementation scope
- [ ] Define canonical UID progression data contract and household relationship where relevant.
- [ ] Implement canonical progression repository/store.
- [ ] Make reward mutations idempotent so the same domain event cannot award XP twice.
- [ ] Project achievements from canonical progression state.
- [ ] Retire legacy XP state as authority; keep compatibility reads/projection only where required during migration.
- [ ] Protect logout/login/account-switch/household-switch lifecycle and reject stale callbacks.
- [ ] Add cross-household/isolation regression tests.
- [ ] Add duplicate-reward/idempotency tests.
- [ ] Verify migration behavior without resetting valid existing user progression unexpectedly.
- [ ] Run Household Rebuild Contracts.
- [ ] Obtain fresh Vercel branch preview.
- [ ] Pass real iPhone Safari/PWA device gate.
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
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.