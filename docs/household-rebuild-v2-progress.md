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

## Current position — synced 2026-08-30

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
- [x] STEP 11 — Party quests — COMPLETE + REAL-DEVICE ACCEPTED 2026-08-30.
- [ ] STEP 12 — Profile / presence / avatars — next; explicit product-owner GO required.

**Current position:** STEP 11 is closed. The integrated STEP 11.8 candidate had full rebuild CI SUCCESS and a READY Preview, and all three bundled STEP 11.9 real-iPhone checks passed: participant leave/navigation stability, targeted+household help behavior, and no-second-XP reward idempotency after full app close/reopen. STEP 12 has not started.

**Validation cadence from 2026-08-29:** accelerate completion by bundling remaining low/medium-risk device smokes into meaningful acceptance sweeps instead of testing every subflow separately. Keep separate explicit testing for high-risk/destructive/auth-identity/security/cross-household/finance/idempotency-reward/release-blocking behavior.

## Frozen / accepted phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.
- [x] STEP 11.5 reuses frozen `ProgressionStore.awardOnce()`; no second XP authority or direct legacy `awardXP` path was introduced.

### STEP 10 — Notifications
- [x] Explicitly accepted/frozen by product owner on 2026-08-26.
- [x] Canonical household notification state, UID isolation, external iOS push and push-tap routing/de-duplication accepted.
- [x] Frozen checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] Frozen `notificationActions.js` remains exact blob `60a48daa628bc56531395d188a0811711d82a328` through accepted STEP 11.

## STEP 11 — Party quests — COMPLETE + REAL-DEVICE ACCEPTED

### STEP 11.1 — Repository foundation — COMPLETE
- [x] Canonical household path and HouseholdContext lifecycle protection.
- [x] Checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`; CI `33019925699` SUCCESS.

### STEP 11.2 — Invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical PartyQuestService + repository authority.
- [x] Transactional ownership/eligibility and occurrence-versioned reinvites.
- [x] Real-device invite/accept PASS.
- [x] Checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`; CI `33021739099` SUCCESS.

### STEP 11.3 — Leave + ActiveView — COMPLETE + REAL-DEVICE PASS
- [x] `left` semantics, deterministic status recompute and repository/service-backed ActiveView.
- [x] STEP 11.9 Check 1 PASS: account B accepted and then left a Party Quest correctly; participant state updated as intended and Home/Taken/Meldingen navigation stayed stable.
- [x] Checkpoint `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`; CI `33024009131` SUCCESS.

### STEP 11.4 — Party Quest help — COMPLETE + REAL-DEVICE PASS
- [x] Targeted + household help, eligibility/retraction/idempotency and help UI.
- [x] Earlier real-device targeted-send PASS.
- [x] STEP 11.9 Check 2 PASS: targeted recipient acceptance worked; household-broadcast decline/ignore behavior remained consistent and did not prematurely close the request; participant/helper state stayed correct realtime.
- [x] Checkpoint `51256b2506625f7421273d87d0c0f654fdbc432b`; CI `33044211179` SUCCESS.

### Party Quest UX patch — COMPLETE + REAL-DEVICE PASS
- [x] Multi-start, Arcana icons, canonical task-create handoff and **Later beslissen** all real-device PASS.
- [x] Latest checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`; CI `33052149328` SUCCESS.

### STEP 11.5 — Canonical completion + durable exactly-once rewards — COMPLETE + REAL-DEVICE PASS
- [x] Linked canonical Task is the only completion trigger; manual stop remains cancellation.
- [x] Trusted Firebase Task projection required for completion.
- [x] Deterministic participant snapshot and reward occurrence.
- [x] Frozen `ProgressionStore.awardOnce()` remains XP authority.
- [x] Later-login settlement and stale-context rejection implemented.
- [x] Device Test 1 PASS: completing linked task closed Party Quest and rewarded current participant once.
- [x] Device Test 2 PASS: later-authenticated accepted participant received durable pending reward.
- [x] STEP 11.9 Check 3 PASS: after full app close/reopen as already-rewarded participant, XP did not increase a second time and no duplicate Party Quest reward/XP toast appeared.
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS.

### STEP 11.6 — Notification event extensions — COMPLETE + REAL-DEVICE ACCEPTED
- [x] Ordinary involved-task notification + combined Party Quest completion/XP notification.
- [x] Causal attribution, self-suppression, duplicate suppression and deterministic canonical event identity.
- [x] Checkpoint `b067fc74931e058b9aa2507d5564501e77575114`.
- [x] CI `33124463794` SUCCESS; Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9` READY.
- [x] Real-device Tests 1/2/3 PASS; accepted 2026-08-29.

### STEP 11.7 — Compatibility / legacy guard — COMPLETE
- [x] Legacy name/localStorage/old-XP Party Quest authority is quarantined from served runtime and canonical modules.
- [x] No automatic migration from legacy display names to Firebase/Auth UIDs.
- [x] Frozen `PartyQuestInvites` compatibility surface remains intact for NotificationActions.
- [x] Checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`; full CI `33273125677` SUCCESS.

### STEP 11.8 — Integrated CI + Preview candidate — COMPLETE
- [x] Final served-runtime integration contract `scripts/test-party-quest-step11-8-integration.js`.
- [x] Canonical Party Quest modules and their frozen authorities are served exactly once and in safe dependency order.
- [x] Legacy Party Quest prototypes remain absent from rendered runtime.
- [x] Integrated checkpoint `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- [x] Full rebuild CI `33273749600`: SUCCESS.
- [x] Vercel Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq`: READY at `https://verhoog-family-569s2vs54-cverhoog-techs-projects.vercel.app`.
- [x] Candidate root HTTP 200; checked deployment error/fatal scan clean.

### STEP 11.9 — Bundled real-iPhone acceptance sweep — COMPLETE
- [x] Explicit **GO STEP 11.9** received.
- [x] Check 1/3 — participant leave + general navigation stability: PASS.
- [x] Check 2/3 — recipient accept + household Party Quest help behavior: PASS.
- [x] Check 3/3 — no-second-XP reward idempotency after full close/reopen: PASS.
- [x] STEP 11 closed COMPLETE + REAL-DEVICE ACCEPTED on 2026-08-30.

## Separate lifecycle / product regressions
- [ ] Owner-transfer **Gezin verlaten** real smoke test.
- [-] Google login post-auth handoff/startup follow-up remains open pending real-device resolution.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains deferred and does not reopen STEP 11.

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
- STEP 8, STEP 9 and STEP 10 remain frozen/accepted; STEP 11 is accepted/completed and must not be reopened without a demonstrated regression or explicit product decision.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Tasks, Progression and Notifications remain canonical authorities.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Accelerated validation mode: bundle non-critical device checks; keep high-risk/destructive/security/auth/idempotency/release-blocking checks explicit.
- Every meaningful update synchronizes current TODO, this tracker and update log.
