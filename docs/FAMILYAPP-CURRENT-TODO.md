# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1 through STEP 11.5 are implementation/contract complete. STEP 11.2 invite/accept passed on real device. STEP 11.4 targeted-help Test 1 passed on a real device, while recipient/broadcast follow-up and STEP 11.3 leave remain pending. The Party Quest UX patch is real-device accepted for multi-start/Arcana icons, canonical new-task handoff and explicit `Later beslissen`. STEP 11.5 real-device Tests 1 and 2 passed: linked Task completion closes the Party Quest, the current participant receives XP, and a different accepted participant who logs in later receives the durable pending XP reward correctly. One final duplicate-safety smoke remains: after reload/reopen, that same reward must not be granted again. STEP 11.6 has not started and still requires explicit product-owner approval. Desired STEP 11.6 scope has been captured: notify relevant participants when someone else completes a Task they were involved in, and notify a user when XP is granted because of another household member's action.**

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## Latest verified state

- [x] STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] STEP 11.1 canonical `PartyQuestRepository` foundation implemented with HouseholdContext lifecycle guards.
- [x] STEP 11.2 real-device functional smoke PASS: account A can send a Party Quest invitation and the accept flow behaves as intended.
- [ ] STEP 11.3 real-device leave smoke still pending.
- [x] STEP 11.4 implementation/contract complete: targeted + household Party Quest help with occurrence-scoped state, eligibility guards and help UI.
- [x] STEP 11.4 real-device Test 1 PASS: maker can send targeted help and then sees **Hulpvraag beheren**.
- [ ] STEP 11.4 remaining device help smoke: recipient accept/decline and household broadcast.
- [x] Party Quest UX Test 1 real-device PASS: additional Party Quest + Arcana icons.
- [x] Party Quest UX Test 2 real-device PASS: canonical new-task handoff.
- [x] Party Quest UX Test 3 real-device PASS: explicit **Later beslissen**.
- [x] STEP 11.5 code/contract checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`.
- [x] Full `Household Rebuild Contract Tests` run `33110105234`: SUCCESS, including `party quest STEP 11.5 completion + exactly-once rewards: PASS`, frozen STEP 9 progression contracts PASS and STEP 10 notification contracts PASS.
- [x] STEP 11.5 Vercel Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf`: READY, `target: null`, commit `6263dd5882253f78d7afa8eafa34f7757f836a3d`.
- [x] STEP 11.5 real-device Test 1 PASS on 2026-08-27: completing the linked normal Task completed/removed the active Party Quest and awarded the current participant the Party Quest XP as intended.
- [x] STEP 11.5 real-device Test 2 PASS on 2026-08-27: another accepted participant logged in after completion and correctly received the durable pending Party Quest XP reward.
- [ ] STEP 11.5 real-device Test 3 pending: reload/reopen as that same participant and confirm the same Party Quest XP/reward is not granted a second time.
- [ ] STEP 11.6 proposed notification scope, pending explicit GO: notify a user when another household member completes a Task the user was involved in; notify a user when XP is awarded because of another household member's action. Reuse frozen notification infrastructure, avoid self-notifications/duplicates, preserve deterministic event identity.
- [x] Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328` after STEP 11.5.
- [-] Non-blocking Party Quest acceptance-toast UI fix remains contract green; product owner deferred its real-device visual verification.
- [-] Google post-login/startup regression remains a separate product-fix follow-up.
- [ ] Separate lifecycle backlog: owner-transfer **Gezin verlaten** still needs a real smoke test; not a STEP 11 blocker.

## STEP 11 — Party quests — IN PROGRESS

Architecture rule: STEP 11 builds on frozen Tasks, Progression, Notifications and HouseholdContext/Firebase Auth UID identity. It must not introduce a second task, XP, notification or identity authority.

### STEP 11.1 — PartyQuestRepository foundation — COMPLETE
- [x] Canonical source: `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] Repository owns Party Quest Firebase persistence/realtime lifecycle.
- [x] HouseholdContext UID + household + revision is identity authority.
- [x] Exact listener teardown and stale callback/write guards.

### STEP 11.2 — PartyQuestService + invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical domain service + repository authority.
- [x] Transactional ownership/eligibility and occurrence-versioned reinvites.
- [x] Recipient-only accept/decline; inviter-only revoke/cancel; manual stop never `completed`.

### STEP 11.3 — Leave semantics + ActiveView lifecycle — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING
- [x] `leaveQuest()` records `left` + `leftAt`; inviter cannot participant-leave.
- [ ] Real-device participant leave smoke pending.

### STEP 11.4 — Targeted + household Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PARTIAL PASS
- [x] Targeted/household help, occurrence-scoped state, eligibility guards, retraction and cleanup implemented.
- [x] Real-device Test 1 PASS: targeted request sends and owner sees **Hulpvraag beheren**.
- [ ] Recipient accept/decline and household broadcast follow-up pending.

### Party Quest UX patch — IMPLEMENTATION/CONTRACT COMPLETE; REAL-DEVICE PASS
- [x] Existing Party Quest does not block **＋ Nieuwe Party Quest**.
- [x] **Nieuwe quest maken** delegates to canonical `TaskDetailPopup.openCreate()` and returns with the new task preselected.
- [x] Meaningful Arcana/RPG icons reuse canonical `TaskCategoryIcons`.
- [x] Explicit **Later beslissen** keeps invitation pending and suppresses same-session auto-reprompt only.

### STEP 11.5 — Canonical completion + durable exactly-once rewards — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE 2/3 PASS
- [x] Linked canonical Task completion is the only completion trigger; manual Party Quest stop remains cancellation, never fake completion.
- [x] Completion is accepted only from the trusted live Firebase Task projection, not cache/local fallback state.
- [x] Deterministic completion occurrence records the inviter and active participants at completion.
- [x] Frozen `ProgressionStore.awardOnce()` remains the only XP mutation authority.
- [x] XP is never preclaimed; failed writes remain retryable and post-XP/pre-ack crashes converge without duplicate XP.
- [x] Offline participants retain pending work and can settle on a later authenticated session.
- [x] Household/account lifecycle stale work is rejected.
- [x] Runtime serves `partyQuestService.js?v=4` and `partyQuestCompletionReward.js?v=4`; frozen notification projector/actions and ProgressionStore runtime keys remain unchanged.
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf` READY.
- [x] Real-device Test 1 PASS: linked Task completion closes the active Party Quest and current participant receives XP.
- [x] Real-device Test 2 PASS: later-authenticated accepted participant receives pending XP.
- [ ] Real-device Test 3 pending: reload/reopen must not award the same Party Quest XP again.

### STEP 11.6 — Notification event extensions — NOT STARTED; PRODUCT SCOPE PROPOSED
- [ ] Requires explicit **GO STEP 11.6** before code changes.
- [ ] Notify relevant users when another household member completes a Task they were involved in.
- [ ] Notify a user when XP is awarded because of another household member's action, including delayed/offline Party Quest settlement.
- [ ] Prefer one rich combined notification when the same action both completes the related Task and causes XP, rather than two noisy notifications.
- [ ] Do not create self-notifications for the triggering actor.
- [ ] Reuse frozen NotificationStore/projector/push infrastructure and deterministic occurrence IDs.

### Later STEP 11 checkpoints
- [ ] STEP 11.7 — compatibility/legacy guard.
- [ ] STEP 11.8 — integrated CI + Preview candidate.
- [ ] STEP 11.9 — real iPhone acceptance, one test action at a time.

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
- Every meaningful development checkpoint synchronizes this TODO, the progress tracker and update log.
