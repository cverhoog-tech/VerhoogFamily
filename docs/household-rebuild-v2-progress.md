# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`  
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

## Status legend
- `[ ]` not started
- `[-]` in progress
- `[x]` accepted/completed
- `[!]` blocked / needs attention

## Current position — synced 2026-08-27

- [x] STEP 0 — Stable baseline.
- [x] STEP 1 — Authenticated session / startup ownership.
- [x] STEP 2 — HouseholdContext / UID identity / lifecycle.
- [x] STEP 2A — Platform-admin identity foundation.
- [x] STEP 2B — Person/UI identity modernization and Brand/PWA/icon scope.
- [x] STEP 3 — Tasks core.
- [x] STEP 4 — Recipes.
- [x] STEP 5 — Meals.
- [x] STEP 6 — Agenda.
- [x] STEP 7 — Shopping.
- [x] STEP 8 — Finance — accepted/frozen 2026-08-24.
- [x] STEP 9 — Progression — accepted/frozen 2026-08-24.
- [x] STEP 10 — Notifications — accepted/frozen 2026-08-26.
- [-] STEP 11 — Party quests — in progress.

**Current position:** STEP 11.1–11.4 are implementation/contract complete. STEP 11.2 invite/accept passed on real device. STEP 11.4 targeted-help Test 1 passed. The Party Quest UX patch is now real-device accepted for all three targeted UX checks: multi-start + Arcana icons, canonical new-task handoff, and explicit **Later beslissen**. STEP 11.5 has not started and still requires explicit approval.

Fix #7 (Google login post-auth freeze) is reopened: the earlier fix candidate at checkpoint `f10e198fd144caa62427c78609f1295780707ef4` did not resolve the real-device 5-10s freeze. Phase 1 — AuthTiming instrumentation (T0-T13 marks across the full login critical path, lifecycle listeners, and a preview/debug-only `?authdebug=1` on-screen viewer with a "Kopieer timings" button) is now code/contract green at checkpoint `a4778172fad1590069e431236467ef2c2527009d`. Local `scripts/test-*.js` suite: 65/65 PASS. Vercel Preview `dpl_HtSNyHnMXNJKKRp9YKDsipJatncm` READY. Status: **instrumentation/code green — root cause investigation pending real-device timing**. This does not reopen or re-accept STEP 1/2 architecture; `AuthenticatedSessionController` remains the sole session authority and `HouseholdContext`/Firebase Auth UID remains the identity authority.

The separate Party Quest acceptance-toast visual recheck, STEP 11.3 participant-leave smoke and remaining STEP 11.4 recipient/broadcast help smokes remain pending.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.

### STEP 10 — Notifications
- [x] Explicitly accepted/frozen by product owner on 2026-08-26.
- [x] Canonical household notification state, UID isolation, external iOS push and push-tap routing/de-duplication accepted.
- [x] Frozen checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] Frozen `notificationActions.js` remains blob `60a48daa628bc56531395d188a0811711d82a328` through the current Party Quest UX follow-up.

## STEP 11 — Party quests — IN PROGRESS

### STEP 11.1 — Repository foundation — COMPLETE
- [x] Canonical household path and HouseholdContext lifecycle protection.
- [x] Checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- [x] CI `33019925699` SUCCESS.

### STEP 11.2 — Invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical PartyQuestService + repository authority.
- [x] Transactional ownership/eligibility and occurrence-versioned reinvites.
- [x] Real-device invite/accept PASS.
- [x] Checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`; CI `33021739099` SUCCESS.

### STEP 11.3 — Leave + ActiveView — IMPLEMENTATION/CONTRACT COMPLETE
- [x] `left` semantics, deterministic status recompute and repository/service-backed ActiveView.
- [x] Checkpoint `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`; CI `33024009131` SUCCESS.
- [ ] Real-device participant leave smoke pending.

### STEP 11.4 — Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE PARTIAL PASS
- [x] Targeted + household help, eligibility/retraction/idempotency and help UI.
- [x] Real-device Test 1 PASS: targeted help sends and owner sees **Hulpvraag beheren**.
- [ ] Recipient accept/decline and household-broadcast device checks pending.
- [x] Checkpoint `51256b2506625f7421273d87d0c0f654fdbc432b`; CI `33044211179` SUCCESS.

### Party Quest UX patch — IMPLEMENTATION/CONTRACT COMPLETE; REAL-DEVICE PASS
- [x] Additional Party Quest start available even with existing pending/active Party Quest.
- [x] **Nieuwe quest maken** delegates to canonical `TaskDetailPopup.openCreate()` and returns with the new task preselected.
- [x] Meaningful Arcana/RPG icons reuse canonical `TaskCategoryIcons`.
- [x] UX Test 1 real-device PASS: multi-start + Arcana icons.
- [x] UX Test 2 real-device PASS: canonical new-task handoff.
- [x] Explicit **Later beslissen** added to single and multiple incoming invite UI.
- [x] Deferral is session-only presentation state; invitation remains `pending`; no PartyQuestService mutation or Firebase status write.
- [x] Deferred occurrence does not auto-reopen in the same runtime session, but manual Party Quest tile access still works.
- [x] New/reinvite occurrence may prompt again via occurrence/version keying.
- [x] Runtime: `partyQuestInvites.js?v=8`, `partyQuestActiveView.js?v=7`; frozen notification layer unchanged.
- [x] Latest checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`.
- [x] Full CI `33052149328` SUCCESS; `party quest UX patch: PASS`.
- [x] Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF` READY.
- [x] UX Test 3 real-device PASS on 2026-08-27: explicit **Later beslissen** behaves as intended.

### Later STEP 11 checkpoints
- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement — explicit approval required.
- [ ] STEP 11.6 — Party Quest notification event extensions on frozen notification layer.
- [ ] STEP 11.7 — compatibility/legacy guard.
- [ ] STEP 11.8 — integrated CI + Preview candidate.
- [ ] STEP 11.9 — real iPhone acceptance, one test action at a time.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Fix #7 — Google login post-auth handoff freeze: reopened after the earlier fix candidate (checkpoint `f10e198fd144caa62427c78609f1295780707ef4`) did not resolve the real-device 5-10s freeze. Phase 1 AuthTiming instrumentation (T0-T13, lifecycle listeners, `?authdebug=1` viewer with copy button) is code/contract green at checkpoint `a4778172fad1590069e431236467ef2c2527009d`; local suite 65/65 PASS; Preview `dpl_HtSNyHnMXNJKKRp9YKDsipJatncm` READY. Status: instrumentation/code green — root cause investigation pending real-device timing. Phase 2 (root cause + fix) blocked on a real iPhone/PWA `?authdebug=1` timing capture.

## Running product/fix backlog
**Open main items: 7** — see `docs/FAMILYAPP-FIX-LIST.md`.

## Later roadmap phases
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate.
- [ ] STEP 17 — Store distribution readiness.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Tasks, Progression and Notifications remain canonical authorities.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Every meaningful update synchronizes current TODO, this tracker and update log.
