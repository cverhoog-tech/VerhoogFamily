# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1 through STEP 11.5 are implementation/contract complete. STEP 11.2 passed its real-device invite/acceptance smoke. STEP 11.4 targeted-help Test 1 passed on a real device, while recipient/broadcast follow-up and STEP 11.3 leave remain pending. The Party Quest UX patch has real-device PASS for multi-start/Arcana icons, canonical new-task handoff and the explicit `Later beslissen` invite flow. STEP 11.5 now has canonical task-driven completion plus durable exactly-once participant reward settlement through the frozen ProgressionStore; real-device Test 1 passed for task completion + maker reward, while the later-login/offline participant reward smoke is still pending. STEP 11.6 has not started and requires explicit product-owner approval. The separate Google post-login/startup regression has a contract-green fix candidate on this branch; real-device PWA verification is still required before closing that product fix.**

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## Latest verified state

- [x] STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] STEP 10 real-device acceptance includes external iOS push, push-tap de-duplication, UID-specific notification state, account/push/avatar isolation, PWA safe-area, Home dark mode and repeated resume/reload stability.
- [x] STEP 11.1 canonical `PartyQuestRepository` foundation implemented with HouseholdContext lifecycle guards.
- [x] STEP 11.2 `PartyQuestService` invite/join state machine implemented and full contract CI green.
- [x] STEP 11.2 real-device functional smoke PASS: account A can send a Party Quest invitation and the accept flow behaves as intended.
- [x] STEP 11.3 implementation/contract complete: distinct `left` semantics and repository/service-backed ActiveView lifecycle.
- [ ] STEP 11.3 real-device leave smoke still pending.
- [x] STEP 11.4 implementation/contract complete: targeted + household Party Quest help with occurrence-scoped state, eligibility guards and help UI.
- [x] STEP 11.4 code/contract checkpoint: `51256b2506625f7421273d87d0c0f654fdbc432b`.
- [x] STEP 11.4 `Household Rebuild Contract Tests` run `33044211179`: SUCCESS.
- [x] STEP 11.4 Vercel Preview `dpl_CmKCpfPHENmUwjuGzwfRQMXTii7a`: READY.
- [x] STEP 11.4 real-device Test 1 PASS: maker can send targeted help and then sees **Hulpvraag beheren**.
- [ ] STEP 11.4 remaining device help smoke: recipient accept/decline and household broadcast.
- [x] Party Quest UX base checkpoint `1c5b543926055ab647773b8182fa63322f83878e`: additional Party Quest starts, canonical new-task handoff and meaningful Arcana task icons.
- [x] Party Quest UX Test 1 real-device PASS: an existing Party Quest no longer blocks a new Party Quest and the chooser shows meaningful Arcana icons.
- [x] Party Quest UX Test 2 real-device PASS: **Nieuwe quest maken** opens the canonical task creator and returns to the Party Quest chooser with the new task preselected.
- [x] Invite defer follow-up: single/multiple invite UI exposes **Later beslissen**; state remains `pending`, deferral is runtime-session presentation state only, and manual Party Quest tile access still reopens the invitation.
- [x] Invite defer occurrence guard uses invite occurrence/version so a genuinely new/reinvite occurrence can prompt again.
- [x] Invite defer follow-up code/contract checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`.
- [x] Full CI run `33052149328`: SUCCESS, including `party quest UX patch: PASS` and prior STEP 11/frozen notification contracts.
- [x] Vercel Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF`: READY (`target: null`).
- [x] Party Quest UX Test 3 real-device PASS on 2026-08-27: product owner confirmed the explicit **Later beslissen** flow works.
- [x] Product owner explicitly approved **GO STEP 11.5** on 2026-08-27; scope remained completion + reward settlement only.
- [x] STEP 11.5 `PartyQuestService` v1.3.0 completes an active Party Quest only from the linked Task's trusted canonical Firebase projection; cache-only task state cannot finalize a Party Quest.
- [x] STEP 11.5 completion occurrence is deterministic and records inviter + currently active Party Quest participants; pending invitations and open Party Quest help are closed cleanly at completion.
- [x] STEP 11.5 stores durable per-UID `rewardSettlements` as pending work/diagnostics only. XP authority remains the frozen `ProgressionStore.awardOnce()` path.
- [x] STEP 11.5 removes the old preclaim-before-XP failure mode. A failed XP mutation leaves the settlement pending; a crash after XP but before acknowledgement is safe because the deterministic ProgressionStore reward key rejects duplicate XP and the settlement can converge later.
- [x] STEP 11.5 supports offline participants: their pending settlement remains household-scoped and is awarded exactly once when that UID later has an authenticated session.
- [x] STEP 11.5 worker uses HouseholdContext lifecycle guards and PartyQuestRepository/PartyQuestService only; no direct Firebase Party Quest write, legacy `awardXP`, `rewardsClaimed`, `fbFamilyId`, `fbUser` or localStorage authority remains in the worker.
- [x] STEP 11.5 code/contract checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`.
- [x] Full `Household Rebuild Contract Tests` run `33110105234`: SUCCESS. Logs explicitly report `party quest STEP 11.5 completion + exactly-once rewards: PASS`, frozen STEP 9 progression contracts PASS, STEP 10 notification contracts PASS and prior Party Quest contracts PASS.
- [x] STEP 11.5 Vercel Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf`: READY, `target: null`, commit `6263dd5882253f78d7afa8eafa34f7757f836a3d`.
- [x] STEP 11.5 real-device Test 1 PASS on 2026-08-27: completing the linked normal Task completed/removed the active Party Quest and awarded the maker the Party Quest XP once as intended.
- [ ] STEP 11.5 real-device Test 2 pending: later authenticated participant must receive their durable pending Party Quest reward exactly once.
- [x] Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328` after STEP 11.5.
- [-] Non-blocking Party Quest acceptance-toast UI fix remains contract green; product owner deferred its real-device visual verification.
- [x] Google post-login fix candidate implemented within the existing auth/session authority: successful `signInWithPopup()` hands `result.user` directly to `AuthenticatedSessionController`, and same-UID popup/observer bootstraps share one in-flight household resolution.
- [x] Google post-login code/contract checkpoint `f10e198fd144caa62427c78609f1295780707ef4`; full CI run `33069878758` SUCCESS; Vercel commit status SUCCESS.
- [-] Google post-login real-device PWA verification pending: confirm that account selection proceeds directly through **Gezin laden...** to household/Home without closing/reopening the app.
- [ ] Separate lifecycle backlog: owner-transfer **Gezin verlaten** still needs a real smoke test; not a STEP 11 blocker.

## STEP 11 — Party quests — IN PROGRESS

Architecture rule: STEP 11 builds on frozen Tasks, Progression, Notifications and HouseholdContext/Firebase Auth UID identity. It must not introduce a second task, XP, notification or identity authority.

### STEP 11.1 — PartyQuestRepository foundation — COMPLETE
- [x] Canonical source: `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] Repository owns Party Quest Firebase persistence/realtime lifecycle.
- [x] HouseholdContext UID + household + revision is identity authority.
- [x] Exact listener teardown and stale callback/write guards.
- [x] Checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`; CI `33019925699` SUCCESS; Preview READY.

### STEP 11.2 — PartyQuestService + invite/join state machine — COMPLETE + REAL-DEVICE PASS
- [x] Canonical domain service + repository authority.
- [x] Ownership/open-state/eligibility rechecked transactionally.
- [x] Duplicate pending/active protection and occurrence-versioned reinvites.
- [x] Recipient-only accept/decline; inviter-only revoke/cancel; manual stop never `completed`.
- [x] Frozen-compatible `PartyQuestInvites.getById/respond/revokeInvite` facade retained.
- [x] Checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`; CI `33021739099` SUCCESS; device invite/accept PASS.

### STEP 11.3 — Leave semantics + ActiveView lifecycle — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING
- [x] `leaveQuest()` records `left` + `leftAt`; inviter cannot participant-leave.
- [x] ActiveView reads repository and mutates service only; stale lifecycle guards present.
- [x] Manual end never writes `completed`.
- [x] Checkpoint `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`; CI `33024009131` SUCCESS; Preview READY.
- [ ] Real-device participant leave smoke pending.

### STEP 11.4 — Targeted + household Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PARTIAL PASS
- [x] Targeted/household help, occurrence-scoped state, eligibility guards, retraction and cleanup implemented.
- [x] Help UI uses HouseholdContext + repository/service only; pending regular invites retain priority.
- [x] Checkpoint `51256b2506625f7421273d87d0c0f654fdbc432b`; CI `33044211179` SUCCESS; Preview READY.
- [x] Real-device Test 1 PASS: targeted request sends and owner sees **Hulpvraag beheren**.
- [ ] Recipient accept/decline and household broadcast follow-up pending.

### Party Quest UX patch — IMPLEMENTATION/CONTRACT COMPLETE; REAL-DEVICE PASS
- [x] Existing Party Quest does not block **＋ Nieuwe Party Quest**.
- [x] **Nieuwe quest maken** delegates to canonical `TaskDetailPopup.openCreate()` and returns after `familyapp:tasks-updated` with new task preselected.
- [x] Meaningful Arcana/RPG icons reuse `TaskCategoryIcons.detect()` / `.icon()`.
- [x] UX Test 1 device PASS: multi-start + Arcana icons.
- [x] UX Test 2 device PASS: create new quest → save → chooser returns with task selected.
- [x] Invite UX follow-up adds explicit **Later beslissen** for single and multi-invite prompts.
- [x] `Later beslissen` performs no PartyQuestService mutation; invitation remains `pending`.
- [x] Automatic re-prompt is suppressed only for that invite occurrence during the current runtime session; manual tile access remains available.
- [x] Runtime serves `partyQuestInvites.js?v=8` and keeps `partyQuestActiveView.js?v=7`; frozen notification actions/projector unchanged.
- [x] Latest UX/defer checkpoint `0ef7274feea7ddadc86919843bf0a24891214e33`; full CI `33052149328` SUCCESS; Preview `dpl_8Fnv9FbHyDdhLauFQ4ntTvA8BSwF` READY.
- [x] Real-device **Later beslissen** smoke PASS on 2026-08-27.

### STEP 11.5 — Canonical completion + durable exactly-once rewards — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PARTIAL PASS
- [x] Linked canonical Task completion is the only completion trigger; manual Party Quest stop remains cancellation, never fake completion.
- [x] Completion is accepted only from the trusted live Firebase Task projection, not household-cache/local fallback state.
- [x] Deterministic completion occurrence records the inviter and active participants at completion.
- [x] Per-UID reward settlement is durable household data but is not progression authority.
- [x] Frozen `ProgressionStore.awardOnce()` remains the only XP mutation authority and keeps deterministic per-UID idempotency.
- [x] XP is never preclaimed. Failed writes remain retryable; post-XP/pre-ack crashes converge without duplicate XP.
- [x] Offline participants retain pending work and can settle on a later authenticated session.
- [x] Household/account lifecycle stale work is rejected.
- [x] Runtime serves `partyQuestService.js?v=4` and `partyQuestCompletionReward.js?v=4`; frozen notification projector/actions and ProgressionStore runtime keys remain unchanged.
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf` READY (`target: null`).
- [x] Real-device Test 1 PASS: linked Task completion closes the active Party Quest and the maker receives the completion XP once.
- [ ] Real-device Test 2 pending: a participant who was not the current UID at completion must receive the pending Party Quest reward when they later authenticate, exactly once.

### Later STEP 11 checkpoints
- [ ] STEP 11.6 — Party Quest notification event extensions on frozen notification layer — explicit approval required.
- [ ] STEP 11.7 — compatibility/legacy guard.
- [ ] STEP 11.8 — integrated CI + Preview candidate.
- [ ] STEP 11.9 — real iPhone acceptance, one test action at a time.

## Separate account/household lifecycle backlog
- [ ] Owner-transfer **Gezin verlaten** real smoke test.

## Running product/fix backlog

Full details: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 7**
1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task title more prominent in task-create popup.
4. Recipe → propose meal to a household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.
6. Party Quest acceptance toast: fix candidate deployed/green; real-device visual confirmation deferred.
7. Google login → code/contract fix candidate green; real-device PWA confirm that successful Google auth immediately completes household/app reveal without app restart.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- UID/household identity comes from HouseholdContext / Firebase Auth.
- Tasks, Progression and Notifications retain their canonical authorities.
- Realtime subscriptions require exact cleanup and stale-context protection.
- Server secrets and push/device credentials never enter client/public repository code or chat.
- Every meaningful development checkpoint synchronizes this TODO, the progress tracker and update log.
