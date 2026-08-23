# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`

New chats/agents should read these three files before continuing development on the rebuild branch.

## Current phase

**STEP 8 — Finance: in final verification/polish.**
Do not start STEP 9 until STEP 8 is explicitly accepted after the final preview/device/export checks below.

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

### Still required before STEP 8 can close
- [x] Confirm latest advisor changes in a fresh Vercel READY preview — verified on 2026-08-23; deployed asset serves `FinanceAnalysisAdvisor v1.0.1`.
- [ ] Real iPhone Safari/PWA smoke gate on the complete latest STEP 8 runtime:
  - cold load;
  - Finance tab open;
  - Maandplan / Transacties / Analyse / Sparen navigation;
  - multiple Analyse interactions;
  - reload;
  - background -> foreground;
  - second reload;
  - no freeze / white screen / WebKit crash;
  - top `Verse start` card remains absent;
  - bottom reset action remains available.
- [ ] Verify FamilyApp Assistent advice changes correctly when selected period/comparison or Finance data changes.
- [ ] Verify PDF generation on iPhone.
- [ ] Verify native share sheet and WhatsApp sharing of the PDF.
- [ ] Design and implement the final premium PDF report template after Analyse UI is visually accepted.
- [x] Extra-strict Finance privacy/isolation regression check — automated contracts cover household A→B switching, stale callbacks, household-scoped writes, active-household-only reset, logout projection clear, rejected logged-out writes, stale callback after logout, and reconnect into another household; Household Rebuild Contracts passed on 2026-08-23.
- [ ] Update legacy `docs/household-rebuild-v2-progress.md` so it no longer incorrectly reports STEP 4 as the current phase.
- [ ] Mark STEP 8 accepted/frozen only after the required verification above.

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