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
- [-] STEP 8 — Finance: implementation complete; final premium PDF preview + iPhone verification remain.
- [ ] STEP 9 — Progression / XP / Achievements.

**Current phase: STEP 8 Finance final verification. Do not start STEP 9 until the premium two-page PDF has been verified from a fresh Vercel preview on iPhone and STEP 8 is explicitly frozen.**

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

### Accepted implementation

- [x] Household-scoped canonical Finance repository/store boundary.
- [x] UID + household context lifecycle protection.
- [x] Household-scoped transactions, recurring state, savings goals and reset semantics.
- [x] `Verse start` retained only as the intended bottom reset action; old top reset card removed.
- [x] Premium Analyse UI v2 with selected-period and comparison-period analysis.
- [x] Analysis engine for income, expenses, fixed/variable costs, savings, categories, receipts and deltas.
- [x] Data-driven FamilyApp Assistent with deterministic, explainable action recommendations.
- [x] Finance PDF export/share flow with native iOS share/WhatsApp support.
- [x] Final premium two-page A4 Finance report template implemented.
- [x] PDF report includes period/result hero, KPIs, category analysis, FamilyApp Assistent advice, comparison data, savings progress and core insights.
- [x] PDF rendered locally and visually checked for clipping/overlap.
- [x] Automated premium PDF export contract added.
- [x] Extra-strict Finance privacy/isolation contracts cover household switching, stale callbacks, logout projection clearing, rejected logged-out writes, reconnect into another household and active-household-only reset.
- [x] Household Rebuild Contracts passed for the Finance privacy/export changes.
- [x] Pre-template STEP 8 runtime/device gate accepted on real iPhone by the product owner on 2026-08-23.
- [x] Original PDF generation/share flow accepted on iPhone/WhatsApp.

### Remaining before STEP 8 closes

- [ ] Fresh Vercel READY preview containing the final premium PDF template.
- [ ] Final iPhone verification of the premium two-page PDF: generate, open both pages, inspect readability and share to WhatsApp.
- [ ] Mark STEP 8 accepted/frozen and promote STEP 9 to current phase.

## STEP 9 — Progression / XP / Achievements

**Next phase — not started.**

- [ ] Canonical UID progression store.
- [ ] Idempotent reward mutations so one event cannot grant XP twice.
- [ ] Achievement projection from canonical progression state.
- [ ] Retire legacy XP authority / retain compatibility reads only where necessary.
- [ ] Household/account-switch lifecycle protection.
- [ ] Cross-household/isolation regression tests.
- [ ] Vercel preview.
- [ ] Real iPhone device gate.

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
- Every meaningful development update must update both `docs/FAMILYAPP-CURRENT-TODO.md` and `docs/FAMILYAPP-UPDATE-LOG.md`.

## Milestone summary

- 2026-08-19 — Stable main baseline selected and rebuild branch created.
- 2026-08-20 — STEP 0, STEP 1 and STEP 2 accepted on real iPhone Safari.
- 2026-08-22 — STEP 2A/2B foundation, Brand/PWA identity and accepted UI/icon scope closed for the prototype baseline.
- 2026-08-22 — STEP 3 Tasks core accepted after isolation contracts, preview and real iPhone gate.
- 2026-08-23 — Rebuild execution advanced through STEP 8 Finance on the active branch; central cross-chat TODO/update log introduced to prevent tracker drift.
- 2026-08-23 — STEP 8 Finance Analyse polish, FamilyApp Assistent, reset placement, PDF share flow and Finance isolation contracts completed; pre-template iPhone gate accepted.
- 2026-08-23 — Final premium two-page Finance PDF implemented and automated export contract passed.
- 2026-08-24 — This tracker synchronized to the actual current execution state. STEP 8 awaits only fresh-preview + final premium-PDF iPhone verification before closure.

## Maintenance rule

When implementation progresses:
1. update the relevant checklist items;
2. append meaningful changes to `docs/FAMILYAPP-UPDATE-LOG.md`;
3. update `docs/FAMILYAPP-CURRENT-TODO.md` in the same work session;
4. never mark a functional phase accepted before its required tests/preview/device gate;
5. keep the architecture roadmap synchronized when scope/order/constraints materially change;
6. add household-isolation/lifecycle tests during each module migration rather than postponing them;
7. never use unrestricted household-content access as a shortcut for platform diagnostics.