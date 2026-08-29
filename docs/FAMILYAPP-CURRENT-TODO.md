# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1 through STEP 11.7 are implementation/contract complete. STEP 11.6 is fully real-device accepted. STEP 11.7 is complete as a CI-only compatibility/legacy quarantine guard: dormant name/localStorage/legacy-XP Party Quest prototypes may remain in the repository for historical reference, but cannot become served runtime or canonical Party Quest authority. STEP 11.8 has not started and requires explicit product-owner approval.**

**Accelerated validation mode:** from 2026-08-29 onward, remaining roadmap validation should be bundled per meaningful checkpoint where safe. Avoid micro-testing every subflow separately; keep separate real-device tests only for genuinely high-risk, destructive, identity/auth, money/finance, cross-household/security, idempotency/reward, or release-blocking behavior. Explicit GO approval for new roadmap steps remains required.

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## Latest verified state

- [x] STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] Frozen `src/core/notificationActions.js` remains exact blob `60a48daa628bc56531395d188a0811711d82a328` through STEP 11.7.
- [x] STEP 11.1 canonical `PartyQuestRepository` foundation complete.
- [x] STEP 11.2 invite/accept state machine complete + real-device PASS.
- [x] STEP 11.3 leave + ActiveView implementation/contract complete; participant-leave device smoke remains for bundled STEP 11 acceptance.
- [x] STEP 11.4 targeted + household help implementation/contract complete; targeted-send device smoke PASS; recipient/broadcast follow-up remains for bundled acceptance.
- [x] Party Quest UX patch real-device accepted: multi-start/icons, canonical task-create handoff and **Later beslissen**.
- [x] STEP 11.5 canonical completion + durable exactly-once rewards implementation/contract complete; device Tests 1/2 PASS. Final no-duplicate-XP safety observation remains for bundled STEP 11 acceptance.
- [x] STEP 11.6 implementation/contract checkpoint `b067fc74931e058b9aa2507d5564501e77575114`; CI `33124463794` SUCCESS; Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9` READY.
- [x] STEP 11.6 real-device accepted 2026-08-29: ordinary involved-task notification PASS, combined Party Quest completion+XP notification PASS, no duplicate ordinary notification, reload/replay no duplicate combined notification.
- [x] Product owner explicitly approved **GO STEP 11.7** on 2026-08-29.
- [x] STEP 11.7 audit confirmed dormant legacy files (`groupQuests.js`, `groupQuestEditor.js`, `groupQuestPremium.js`, `groupQuestVault.js`) are not the current Party Quest authority; current `duoQuests.js` remains a separate active task UX module.
- [x] Added `scripts/test-party-quest-step11-7.js` as a hard anti-regression compatibility guard.
- [x] STEP 11.7 prevents dormant legacy Party Quest modules from being reintroduced through served runtime entrypoints.
- [x] STEP 11.7 prevents canonical Party Quest modules from using legacy localStorage keys, legacy name identities, hardcoded legacy member names, `GroupQuests`/editor/premium authorities or direct legacy `awardXP` paths.
- [x] STEP 11.7 preserves the frozen `PartyQuestInvites` compatibility facade (`getById`, `revokeInvite`, `respond`) while requiring mutations to delegate to `PartyQuestService`.
- [x] STEP 11.7 code/contract checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`.
- [x] Full `Household Rebuild Contract Tests` run `33273125677`: SUCCESS. Logs explicitly include `party quest STEP 11.7 legacy compatibility guard: PASS`, STEP 11.3/11.4/11.5/11.6 PASS, frozen STEP 9 progression PASS, frozen STEP 10 notification/push PASS, auth/startup PASS and toast contrast PASS.
- [x] STEP 11.7 required no runtime/product-code change, so no new Vercel Preview or isolated device smoke was necessary; the last accepted runtime Preview remains the STEP 11.6 Preview.
- [ ] STEP 11.8 — integrated CI + Preview candidate — not started; explicit **GO STEP 11.8** required.
- [-] Non-blocking Party Quest acceptance-toast visual recheck remains deferred.
- [-] Google post-login/startup regression remains a separate product-fix follow-up.
- [ ] Separate lifecycle backlog: owner-transfer **Gezin verlaten** real smoke remains pending; not a STEP 11 blocker.

## STEP 11 — Party quests — IN PROGRESS

Architecture rule: STEP 11 builds on frozen Tasks, Progression, Notifications and HouseholdContext/Firebase Auth UID identity. It must not introduce a second task, XP, notification or identity authority.

### STEP 11.1 — Repository foundation — COMPLETE
- [x] Canonical path `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] HouseholdContext lifecycle/stale-context guards.
- [x] Checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`; CI `33019925699` SUCCESS.

### STEP 11.2 — Invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical PartyQuestService + repository authority.
- [x] Transactional eligibility and occurrence-versioned reinvites.
- [x] Checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`; CI `33021739099` SUCCESS.

### STEP 11.3 — Leave + ActiveView — IMPLEMENTATION/CONTRACT COMPLETE
- [x] `left` semantics and repository/service-backed ActiveView.
- [ ] Participant-leave real-device smoke bundled into later STEP 11 acceptance sweep.

### STEP 11.4 — Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE PARTIAL PASS
- [x] Targeted + household help, eligibility, retraction, idempotency and UI.
- [x] Targeted-help send device PASS.
- [ ] Recipient accept/decline + household broadcast bundled into later STEP 11 acceptance sweep.

### Party Quest UX patch — COMPLETE + REAL-DEVICE PASS
- [x] Multiple Party Quests, meaningful Arcana icons, canonical new-task flow and **Later beslissen** all device PASS.

### STEP 11.5 — Completion + exactly-once rewards — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE 2/3 PASS
- [x] Linked canonical Task is the only completion trigger.
- [x] Frozen `ProgressionStore.awardOnce()` remains XP authority.
- [x] Durable pending settlements support later-authenticated participants.
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS.
- [x] Device Tests 1/2 PASS.
- [ ] No-second-XP reload safety observation remains; keep as high-risk idempotency gate in bundled STEP 11 acceptance sweep.

### STEP 11.6 — Notification event extensions — COMPLETE + REAL-DEVICE ACCEPTED
- [x] Ordinary involved-task completion notifications.
- [x] One combined Party Quest completion + XP notification for relevant participants.
- [x] Causal attribution + self/duplicate suppression + deterministic NotificationStore identity.
- [x] Checkpoint `b067fc74931e058b9aa2507d5564501e77575114`; CI `33124463794` SUCCESS; Preview READY.
- [x] Real-device Tests 1/2/3 PASS; accepted 2026-08-29.

### STEP 11.7 — Compatibility / legacy guard — COMPLETE
- [x] Explicit **GO STEP 11.7** received 2026-08-29.
- [x] Legacy name/localStorage/old-XP Party Quest prototype remains quarantined from served runtime and canonical modules.
- [x] No automatic migration from ambiguous legacy names to Firebase/Auth UIDs.
- [x] Frozen NotificationActions compatibility facade remains intact and delegates through PartyQuestService.
- [x] Current `duoQuests.js` remains allowed/served; it is not the dormant `groupQuests` prototype.
- [x] Test: `scripts/test-party-quest-step11-7.js`.
- [x] Checkpoint `6cdcaa9dff2d35e6176d1b0959b45d86fb65515b`; CI `33273125677` SUCCESS.
- [x] CI-only change; no runtime Preview/device gate needed for this substep.

### Later STEP 11 checkpoints
- [ ] STEP 11.8 — integrated CI + Preview candidate — explicit approval required.
- [ ] STEP 11.9 — bundled real iPhone acceptance sweep under accelerated validation mode.

## Running product/fix backlog
**Open main items: 7** — see `docs/FAMILYAPP-FIX-LIST.md`.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- UID/household identity comes from HouseholdContext / Firebase Auth.
- Tasks, Progression and Notifications retain their canonical authorities.
- Realtime subscriptions require exact cleanup and stale-context protection.
- Accelerated validation mode: bundle non-critical device checks; keep high-risk/destructive/security/auth/idempotency/release blockers explicit.
- Every meaningful development checkpoint synchronizes this TODO, the progress tracker and update log.
