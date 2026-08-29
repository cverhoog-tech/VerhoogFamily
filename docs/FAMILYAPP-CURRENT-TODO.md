# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression, STEP 10 Notifications and STEP 11 Party Quests are accepted/completed.** STEP 10 remains frozen since 2026-08-26. STEP 11 completed real-device acceptance on 2026-08-30 after all three bundled STEP 11.9 checks passed.

**STEP 12 — Profile / presence / avatars is next and has NOT started. Explicit product-owner GO STEP 12 is required before implementation.**

**Accelerated validation mode:** from 2026-08-29 onward, remaining roadmap validation should be bundled per meaningful checkpoint where safe. Avoid micro-testing every subflow separately; keep separate real-device tests only for genuinely high-risk, destructive, identity/auth, money/finance, cross-household/security, idempotency/reward, or release-blocking behavior. Explicit GO approval for new roadmap steps remains required.

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## Latest verified state

- [x] STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] Frozen `src/core/notificationActions.js` remains exact blob `60a48daa628bc56531395d188a0811711d82a328` through the accepted STEP 11 candidate.
- [x] STEP 11.1 canonical `PartyQuestRepository` foundation complete.
- [x] STEP 11.2 invite/accept state machine complete + real-device PASS.
- [x] STEP 11.3 leave + ActiveView complete + real-device PASS in STEP 11.9 Check 1.
- [x] STEP 11.4 targeted + household help complete + real-device PASS in STEP 11.9 Check 2.
- [x] Party Quest UX patch real-device accepted: multi-start/icons, canonical task-create handoff and **Later beslissen**.
- [x] STEP 11.5 canonical completion + durable exactly-once rewards complete + all three device safety checks PASS; final reload/reopen observation confirmed no second XP and no duplicate Party Quest reward/XP toast.
- [x] STEP 11.6 notification extensions complete + real-device accepted 2026-08-29.
- [x] STEP 11.7 compatibility/legacy quarantine guard complete; checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`; full CI `33273125677` SUCCESS.
- [x] STEP 11.8 integrated runtime candidate checkpoint `3f01b3f2265c88dcc6480e7458d16cb21da2a146`; full CI `33273749600` SUCCESS.
- [x] STEP 11.8 Vercel Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq`: READY, exact runtime candidate commit `3f01b3f2265c88dcc6480e7458d16cb21da2a146`.
- [x] Exact Preview URL `https://verhoog-family-569s2vs54-cverhoog-techs-projects.vercel.app` returned HTTP 200; runtime error/fatal scan found no entries at candidate verification time.
- [x] STEP 11.9 Check 1/3 PASS on real iPhone 2026-08-30: participant leave + Home/Taken/Meldingen stability.
- [x] STEP 11.9 Check 2/3 PASS on real iPhone 2026-08-30: targeted-help acceptance + household help broadcast behavior.
- [x] STEP 11.9 Check 3/3 PASS on real iPhone 2026-08-30: already-rewarded participant received no second Party Quest XP after full app close/reopen and no duplicate reward/XP toast appeared.
- [x] STEP 11 — Party Quests — COMPLETE + REAL-DEVICE ACCEPTED 2026-08-30.
- [ ] STEP 12 — Profile / presence / avatars — not started; explicit **GO STEP 12** required.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains a separate deferred product-fix item and does not reopen STEP 11.
- [-] Google post-login/startup regression remains a separate product-fix follow-up.
- [ ] Separate lifecycle backlog: owner-transfer **Gezin verlaten** real smoke remains pending; not a STEP 11 acceptance blocker.

## STEP 11 — Party quests — COMPLETE + REAL-DEVICE ACCEPTED

Architecture rule preserved: STEP 11 builds on frozen Tasks, Progression, Notifications and HouseholdContext/Firebase Auth UID identity. It did not introduce a second task, XP, notification or identity authority.

### STEP 11.1 — Repository foundation — COMPLETE
- [x] Canonical path `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] HouseholdContext lifecycle/stale-context guards.
- [x] Checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`; CI `33019925699` SUCCESS.

### STEP 11.2 — Invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical PartyQuestService + repository authority.
- [x] Transactional eligibility and occurrence-versioned reinvites.
- [x] Checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`; CI `33021739099` SUCCESS.

### STEP 11.3 — Leave + ActiveView — COMPLETE + REAL-DEVICE PASS
- [x] `left` semantics and repository/service-backed ActiveView.
- [x] STEP 11.9 Check 1: accepted participant could leave correctly and app navigation remained stable.

### STEP 11.4 — Party Quest help — COMPLETE + REAL-DEVICE PASS
- [x] Targeted + household help, eligibility, retraction, idempotency and UI.
- [x] Earlier targeted-help send smoke PASS.
- [x] STEP 11.9 Check 2: targeted recipient acceptance worked, household-broadcast decline/ignore behavior stayed consistent as intended, and helper/participant state updated correctly realtime.

### Party Quest UX patch — COMPLETE + REAL-DEVICE PASS
- [x] Multiple Party Quests, meaningful Arcana icons, canonical new-task flow and **Later beslissen** all device PASS.

### STEP 11.5 — Completion + exactly-once rewards — COMPLETE + REAL-DEVICE PASS
- [x] Linked canonical Task is the only completion trigger.
- [x] Frozen `ProgressionStore.awardOnce()` remains XP authority.
- [x] Durable pending settlements support later-authenticated participants.
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS.
- [x] Device Test 1: current participant gets XP once on linked-task completion — PASS.
- [x] Device Test 2: later-authenticated accepted participant receives pending Party Quest XP — PASS.
- [x] STEP 11.9 Check 3: full close/reopen as already-rewarded participant caused no second XP and no duplicate Party Quest reward/XP toast — PASS.

### STEP 11.6 — Notification event extensions — COMPLETE + REAL-DEVICE ACCEPTED
- [x] Ordinary involved-task completion notifications.
- [x] One combined Party Quest completion + XP notification for relevant participants.
- [x] Causal attribution + self/duplicate suppression + deterministic NotificationStore identity.
- [x] Checkpoint `b067fc74931e058b9aa2507d5564501e77575114`; CI `33124463794` SUCCESS; Preview READY.
- [x] Real-device Tests 1/2/3 PASS; accepted 2026-08-29.

### STEP 11.7 — Compatibility / legacy guard — COMPLETE
- [x] Legacy name/localStorage/old-XP Party Quest prototype remains quarantined from served runtime and canonical modules.
- [x] No automatic migration from ambiguous legacy names to Firebase/Auth UIDs.
- [x] Frozen NotificationActions compatibility facade remains intact and delegates through PartyQuestService.
- [x] Current `duoQuests.js` remains allowed/served; it is not the dormant `groupQuests` prototype.
- [x] Test: `scripts/test-party-quest-step11-7.js`.
- [x] Checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`; CI `33273125677` SUCCESS.

### STEP 11.8 — Integrated CI + Preview candidate — COMPLETE
- [x] Added final served-runtime integration contract `scripts/test-party-quest-step11-8-integration.js`.
- [x] Canonical STEP 11 modules and their frozen authorities are served exactly once and in safe dependency order.
- [x] Legacy Party Quest prototypes remain absent from the rendered runtime.
- [x] Frozen NotificationActions exact blob remains `60a48daa628bc56531395d188a0811711d82a328`.
- [x] Candidate checkpoint `3f01b3f2265c88dcc6480e7458d16cb21da2a146`; full CI `33273749600` SUCCESS.
- [x] Preview `dpl_dfUnzTzLZtxxT2AjRLyGx74KtEBq` READY at `https://verhoog-family-569s2vs54-cverhoog-techs-projects.vercel.app`.

### STEP 11.9 — Bundled real-iPhone acceptance sweep — COMPLETE
- [x] Explicit **GO STEP 11.9** received.
- [x] Check 1/3: participant leave + general Home/Taken/Meldingen stability — PASS.
- [x] Check 2/3: recipient/household Party Quest help behavior — PASS.
- [x] Check 3/3: no-second-XP reward idempotency after full close/reopen — PASS.
- [x] STEP 11 closed as COMPLETE + REAL-DEVICE ACCEPTED on 2026-08-30.

## Next roadmap step
- [ ] STEP 12 — Profile / presence / avatars — explicit product-owner approval required before implementation.

## Running product/fix backlog
**Open main items: 7** — see `docs/FAMILYAPP-FIX-LIST.md`.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen/accepted; STEP 11 is accepted/completed and must not be reopened without a demonstrated regression or explicit product decision.
- UID/household identity comes from HouseholdContext / Firebase Auth.
- Tasks, Progression and Notifications retain their canonical authorities.
- Realtime subscriptions require exact cleanup and stale-context protection.
- Accelerated validation mode: bundle non-critical device checks; keep high-risk/destructive/security/auth/idempotency/release blockers explicit.
- Every meaningful development checkpoint synchronizes this TODO, the progress tracker and update log.
