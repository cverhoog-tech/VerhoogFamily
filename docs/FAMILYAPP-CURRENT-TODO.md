# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1 through STEP 11.4 are implementation/contract complete. STEP 11.2 passed its real-device invite/acceptance smoke. STEP 11.4 targeted-help Test 1 passed on a real device, while recipient/broadcast follow-up and STEP 11.3 leave remain pending. The Party Quest UX patch now has real-device PASS for multi-start/Arcana icons, canonical new-task handoff and the explicit `Later beslissen` invite flow. STEP 11.5 has not started and requires explicit product-owner approval. A separate Google post-login/startup handoff bug was observed on real device and is tracked in the fix backlog.**

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
- [x] Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328`.
- [-] Non-blocking Party Quest acceptance-toast UI fix remains contract green; product owner deferred its real-device visual verification.
- [!] Separate auth/startup bug observed on real device: after choosing a Google account, the login screen appeared frozen for roughly five seconds; closing/reopening the app revealed that the Firebase session had actually succeeded. Track as post-auth handoff/startup UI regression, not failed authentication.
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

### Later STEP 11 checkpoints
- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement — explicit approval required.
- [ ] STEP 11.6 — Party Quest notification event extensions on frozen notification layer.
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
7. Google login → successful auth session but post-account-selection UI can remain frozen on login screen until app restart; investigate/fix auth-to-household/app reveal handoff.

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