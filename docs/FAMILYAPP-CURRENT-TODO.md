# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these four files before continuing development on the rebuild branch.

## Current phase

**STEP 8 — Finance: final verification after premium PDF implementation.**
Do not start STEP 9 until the premium two-page PDF report is verified in a fresh Vercel preview/on iPhone and STEP 8 is explicitly accepted/frozen.

## STEP 8 — Finance

### Implemented
- [x] Household-scoped canonical Finance repository/store boundary.
- [x] Shared Finance state and transaction synchronization foundation.
- [x] Reset semantics through FinanceStore/FinanceRuntimeShell.
- [x] Old large top `Verse start` card removed; reset action belongs at page bottom only.
- [x] Premium Analyse UI v2 with selected-period comparison.
- [x] Calm `Periode overzicht` hero direction.
- [x] Richer card/button depth without turning Analyse into an image-heavy page.
- [x] Analysis engine for income, expenses, fixed/variable spend, savings, categories, receipts and period comparisons.
- [x] PDF export/share foundation from Analyse.
- [x] Data-driven `FamilyApp Assistent` recommendations.
- [x] Advisor duplicate-install protection for runtime stability.
- [x] Final premium Finance PDF report template implemented as a two-page A4 report.
- [x] Premium PDF page 1: branded period/result hero, income/expense/savings KPIs, category bars and the live FamilyApp Assistent recommendation.
- [x] Premium PDF page 2: fixed/variable/savings/receipt summary, category comparison table, savings progress and core insights.
- [x] PDF layout rendered and visually QA'd locally with no clipping/overlap; PDF preflight opens as a valid two-page non-encrypted PDF.
- [x] Added automated `test-finance-analysis-export.js` contract for two-page structure, report sections, advisor projection and retirement of placeholder template copy.
- [x] Legacy phase tracker synchronized on 2026-08-24; it no longer incorrectly reports STEP 4 as current.

### Final STEP 8 checklist
- [x] Confirm latest advisor changes in a fresh Vercel READY preview — verified on 2026-08-23; deployed asset serves `FinanceAnalysisAdvisor v1.0.1`.
- [x] Real iPhone Safari/PWA smoke gate on the pre-template complete STEP 8 runtime accepted by product owner on 2026-08-23.
- [x] Finance navigation/interactions/reload/background-foreground behavior verified working on iPhone; no reported freeze/white screen/WebKit crash in the accepted test.
- [x] Top `Verse start` card remains absent; bottom reset action remains available.
- [x] FamilyApp Assistent behavior accepted in the iPhone test.
- [x] Original PDF generation on iPhone accepted.
- [x] Original native share flow / WhatsApp PDF sharing accepted.
- [x] Design and implement the final premium PDF report template.
- [ ] Confirm the new premium PDF template in a fresh Vercel READY preview.
- [ ] Final iPhone check of the new premium two-page PDF: open/render, scroll both pages, share to WhatsApp, confirm readable output.
- [x] Extra-strict Finance privacy/isolation regression check — automated contracts cover household A→B switching, stale callbacks, household-scoped writes, active-household-only reset, logout projection clear, rejected logged-out writes, stale callback after logout, and reconnect into another household; Household Rebuild Contracts passed on 2026-08-23.
- [x] Update legacy `docs/household-rebuild-v2-progress.md` so it reflects STEP 8 as the current phase.
- [ ] Mark STEP 8 accepted/frozen after the premium PDF verification is complete.

## STEP 9 — Progression / XP / Achievements

**Next phase — not started yet.**

Planned scope:
- [ ] Canonical UID progression store.
- [ ] Idempotent reward mutations (same event cannot award XP twice).
- [ ] Achievement projection from canonical progression state.
- [ ] Retire legacy XP state as authority / keep only compatibility read where required.
- [ ] Household/account switch lifecycle protection.
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

## Standing product decisions / guardrails

- Main stays untouched until explicit approval.
- Current working branch is `agent/household-rebuild-v2`.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless a new product decision changes that.
- Current accepted icon scope and Brand/PWA identity remain frozen unless a concrete regression/redesign is requested.
- Finance Analyse should be premium and dimensional but primarily readable/data-first, not a picture festival.
- Platform admin remains separate from household admin and must not imply unrestricted raw household-content access.
- Every meaningful development update must append to `docs/FAMILYAPP-UPDATE-LOG.md` and update this TODO in the same work session.