# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1 through STEP 11.6 are implementation/contract complete. STEP 11.2 invite/accept passed on real device. STEP 11.4 targeted-help Test 1 passed on a real device, while recipient/broadcast follow-up and STEP 11.3 leave remain pending. The Party Quest UX patch is real-device accepted for multi-start/Arcana icons, canonical new-task handoff and explicit `Later beslissen`. STEP 11.5 real-device Tests 1 and 2 passed; its final reload/no-duplicate Test 3 is still pending. STEP 11.6 is code/contract green on a READY Preview. Its ordinary involved-Task notification and the combined Party Quest completion + XP notification have both now passed on a real device exactly as intended; one reload/replay no-duplicate smoke remains before marking 11.6 fully device-accepted. STEP 11.7 has not started and requires explicit product-owner approval.**

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
- [x] STEP 11.5 CI `33110105234`: SUCCESS; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf` READY.
- [x] STEP 11.5 real-device Test 1 PASS: linked Task completion closes the active Party Quest and awards the current participant XP.
- [x] STEP 11.5 real-device Test 2 PASS: another accepted participant later authenticated and received the durable pending Party Quest XP reward.
- [ ] STEP 11.5 real-device Test 3 pending: reload/reopen as that same participant and confirm the same Party Quest XP/reward is not granted a second time.
- [x] Product owner explicitly approved **GO STEP 11.6** on 2026-08-28; scope remained notification-event extensions only.
- [x] STEP 11.6 ordinary Task completion projection targets actual collaborators only: creator/owner, assignees and accepted ordinary helpers, excluding the completer.
- [x] STEP 11.6 suppresses the ordinary Task completion notification for Party Quest participants so one remote action does not create duplicate ordinary + Party Quest notifications.
- [x] STEP 11.6 Party Quest completion projection sends one richer targeted notification containing both completion context and the participant XP reward.
- [x] STEP 11.6 preserves causal attribution: if the technical Party Quest finalizer differs from the UID that actually completed the linked Task, the notification names the original task completer.
- [x] STEP 11.6 excludes both the event publisher and actual task completer from the Party Quest completion audience, preventing self-notification noise.
- [x] STEP 11.6 uses canonical `NotificationStore.publishToUidsOnce()` with deterministic event keys; reconnect/replay does not create a second event.
- [x] No push backend/server change was required: the frozen trusted sender already resolves canonical event audiences dynamically and excludes the canonical actor server-side.
- [x] STEP 11.6 fixed a real startup lifecycle edge case in `HouseholdDomainNotificationProjectorV2` v1.2.1: the immediate same-context `HouseholdContext.subscribe()` callback no longer wipes freshly established repository baselines and causes the first real task transition to be missed.
- [x] Runtime serves `notificationEvents.js?v=3`, `notificationExperience.js?v=2`, `householdDomainNotificationProjectorV2.js?v=2`, and `partyQuestNotificationProjector.js?v=3`.
- [x] Frozen `src/core/notificationActions.js` remains exact blob `60a48daa628bc56531395d188a0811711d82a328`; NotificationStore, push sender and ProgressionStore remain their existing authorities.
- [x] STEP 11.6 code/contract checkpoint `b067fc74931e058b9aa2507d5564501e77575114`.
- [x] Full `Household Rebuild Contract Tests` run `33124463794`: SUCCESS. Logs explicitly include `party quest STEP 11.6 involved completion + XP notifications: PASS`, STEP 11.5 exactly-once PASS, all frozen STEP 10 notification/push contracts PASS and prior Party Quest contracts PASS.
- [x] STEP 11.6 Vercel Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9`: READY, `target: null`, commit `b067fc74931e058b9aa2507d5564501e77575114`.
- [x] STEP 11.6 real-device Test 1 PASS: when account A completed an ordinary Task involving account B, account B received the intended completion notification exactly as designed.
- [x] STEP 11.6 real-device Test 2 PASS: account B received exactly the intended combined Party Quest completion + XP notification after account A completed the linked Task, without a second ordinary Task notification.
- [ ] STEP 11.6 real-device Test 3 pending: reload/reopen account B and confirm the same combined notification is not duplicated by replay/reconnect.
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
- [x] Checkpoint `6263dd5882253f78d7afa8eafa34f7757f836a3d`; CI `33110105234` SUCCESS; Preview `dpl_4hSTgd2hg8WiyBaUxGkr3hCiPxTf` READY.
- [x] Real-device Test 1 PASS: linked Task completion closes the active Party Quest and current participant receives XP.
- [x] Real-device Test 2 PASS: later-authenticated accepted participant receives pending XP.
- [ ] Real-device Test 3 pending: reload/reopen must not award the same Party Quest XP again.

### STEP 11.6 — Notification event extensions — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE 2/3 PASS
- [x] Explicit **GO STEP 11.6** received 2026-08-28.
- [x] Ordinary involved-task completion event targets relevant collaborators and suppresses self-notifications.
- [x] Party Quest participants receive one combined completion + XP notification rather than duplicate ordinary + Party Quest notifications.
- [x] Original task completer is named even when another UID technically finalizes the Party Quest.
- [x] Publisher and task completer are both excluded from the Party Quest audience where they differ.
- [x] Canonical NotificationStore idempotency and frozen trusted push sender are reused; no second notification/push authority.
- [x] Same-context startup callback can no longer wipe repository baselines and miss the first real transition.
- [x] Checkpoint `b067fc74931e058b9aa2507d5564501e77575114`; CI `33124463794` SUCCESS; Preview `dpl_BKGSBMLCSzsK55fzg7s68GbJXFA9` READY.
- [x] Real-device Test 1 PASS: ordinary involved-task completion notification behaved exactly as intended.
- [x] Real-device Test 2 PASS: combined Party Quest completion + XP notification behaved exactly as intended, with no duplicate ordinary Task notification.
- [ ] Real-device Test 3 pending: reload/reopen account B and confirm replay/reconnect does not create a second copy of the same combined notification.

### Later STEP 11 checkpoints
- [ ] STEP 11.7 — compatibility/legacy guard — explicit approval required.
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
