# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1 through STEP 11.4 are implementation/contract complete. STEP 11.2 passed its first real-device invite/acceptance smoke on 2026-08-27. STEP 11.3 leave and STEP 11.4 help still have real-device smokes pending. STEP 11.5 has not started and requires explicit product-owner approval.**

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
- [x] STEP 11.4 `Household Rebuild Contract Tests` run `33044211179`: SUCCESS, including `scripts/test-party-quest-step11-4.js` PASS.
- [x] STEP 11.4 Vercel Preview `dpl_CmKCpfPHENmUwjuGzwfRQMXTii7a`: READY (`target: null`).
- [ ] STEP 11.4 real-device help smoke still pending; do not mark device acceptance until actually verified.
- [x] Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328` through STEP 11.4.
- [-] Non-blocking Party Quest acceptance-toast UI fix is implemented/contract green; product owner explicitly deferred its real-device visual verification to later.
- [ ] Separate lifecycle backlog: owner-transfer **Gezin verlaten** still needs a real smoke test; it is not a STEP 11 blocker.

## STEP 11 — Party quests — IN PROGRESS

Architecture rule: STEP 11 builds on frozen Tasks, Progression, Notifications and HouseholdContext/Firebase Auth UID identity. It must not introduce a second task, XP, notification or identity authority.

### STEP 11.1 — PartyQuestRepository foundation — COMPLETE

- [x] Canonical source remains `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] `PartyQuestRepository` owns Party Quest Firebase persistence/realtime lifecycle.
- [x] HouseholdContext UID + household + revision is the identity authority.
- [x] Exact Firebase listener teardown, projection clear and stale-callback guards are present.
- [x] Mutations reject stale account/household context.
- [x] Existing v1 Party Quest rows normalize in memory to the v2-shaped model without eager/destructive migration.
- [x] Legacy/unknown fields are preserved for compatibility.
- [x] Contract coverage includes same-household A → B, H1 → H2, exact teardown and delayed stale-write rejection.
- [x] Code checkpoint: `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- [x] Contract CI run `33019925699`: SUCCESS.
- [x] Preview `dpl_13JQpQe8MkvCy3vZKtZPycfT3WzG`: READY.

### STEP 11.2 — PartyQuestService + invite/join state machine — COMPLETE + REAL-DEVICE FUNCTIONAL PASS

- [x] Product owner approved **GO 11.2** only.
- [x] `PartyQuestService` established as Party Quest domain mutation/state-machine layer; identity is HouseholdContext and persistence is PartyQuestRepository.
- [x] Invite creation rechecks task ownership/open state and participant eligibility inside canonical transactions.
- [x] Duplicate/concurrent pending invites blocked; reinvites after decline/revoke use fresh occurrence/version data.
- [x] Only intended UID may accept/decline; double response cannot transition twice.
- [x] Only inviter can revoke/cancel; manual end resolves to `cancelled`, never `completed`.
- [x] `partyQuestInvites.js` remains the frozen-compatible presentation facade with `getById/respond/revokeInvite` available.
- [x] Code checkpoint: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- [x] Contract CI run `33021739099`: SUCCESS.
- [x] Vercel Preview `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: READY.
- [x] Real-device functional test 2026-08-27: Party Quest invitation/acceptance behaves exactly as intended.
- [-] Separate acceptance-toast visual recheck deferred by product owner.

### STEP 11.3 — Leave semantics + ActiveView lifecycle — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING

- [x] Product owner approved proceeding with STEP 11.3 after deferring the toast visual test.
- [x] `PartyQuestService v1.1.0` added canonical `leaveQuest()` through the repository.
- [x] Active invited participant leave is `left` + `leftAt`, not `declined`.
- [x] Inviter cannot participant-leave; owner manual end stays `cancelQuest()`.
- [x] Deterministic status recompute: active remains → active; only pending remains → pending; neither remains → cancelled.
- [x] `PartyQuestActiveView v6.0.0` reads via `PartyQuestRepository.subscribe()` and mutates via `PartyQuestService` only.
- [x] Direct Party Quest Firebase access, parallel auth, `fbFamilyId`, `fbUser` and name-keyed localStorage removed from ActiveView.
- [x] Exact unsubscribe, stale callback rejection and projection clear on identity changes implemented.
- [x] Owner end never writes `completed`; task-driven completion remains STEP 11.5.
- [x] `scripts/test-party-quest-step11-3.js` PASS in the current full suite.
- [x] Implementation/contract checkpoint: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- [x] CI run `33024009131`: SUCCESS.
- [x] Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7`: READY.
- [ ] Real-device participant leave smoke still pending.

### STEP 11.4 — Targeted + household Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING

- [x] Product owner explicitly approved **GO 11.4** only.
- [x] `PartyQuestService v1.2.0` adds `requestHelp`, `requestHouseholdHelp`, `respondHelp` and `retractHelp` through `PartyQuestRepository` only.
- [x] Help requests live under the canonical Party Quest `helpRequests/{occurrenceId}` map; ordinary Task-help data is not reused as Party Quest state.
- [x] Help can be targeted to one eligible household UID or broadcast to eligible household members.
- [x] Only the Party Quest inviter may create/retract a Party Quest help request.
- [x] Help can only be requested for an active Party Quest whose linked task is still open.
- [x] One open help request per Party Quest at a time; each request has a unique occurrence ID.
- [x] Eligibility excludes requester/inviter, inactive members, task creator/assignees and Party Quest pending/active participants; eligibility is rechecked transactionally on response.
- [x] Targeted accept/decline closes that occurrence. Wrong recipient and repeated responses are rejected.
- [x] Household-wide decline is occurrence-scoped per UID and keeps the broadcast open for other members.
- [x] Household-wide accept adds that UID as an active Party Quest participant but leaves the broadcast open so additional eligible helpers can still join until the inviter retracts it.
- [x] Accepted helpers retain `joinedVia: help` plus `helpOccurrenceId` provenance in their participant row.
- [x] Manual Party Quest cancel and last-participant leave auto-retract any still-open help request.
- [x] Added `src/modules/tasks/partyQuestHelpUi.js` (v1.0.1): owner gets **Hulp vragen / Hulpvraag beheren**; eligible recipients get **Hulp geven / Niet voor mij**.
- [x] Help UI reads via `PartyQuestRepository`, mutates via `PartyQuestService`, uses HouseholdContext identity, owns exact unsubscribe/generation guards and clears/rejects stale account/household projections.
- [x] Help UI hides an outstanding request if the current member later becomes assigned, inactive or otherwise ineligible.
- [x] Existing pending Party Quest invitations retain priority over help requests on the shared Party Quest tile.
- [x] Runtime loads `partyQuestService.js?v=3` and `partyQuestHelpUi.js?v=1` while frozen `notificationActions.js?v=4` and `partyQuestNotificationProjector.js?v=2` remain untouched.
- [x] New `scripts/test-party-quest-step11-4.js` covers targeted/broadcast help, wrong recipient, duplicate response, multiple helpers, retraction, cancellation cleanup, stale deferred mutation and help-UI lifecycle/eligibility.
- [x] Full CI run `33044211179`: SUCCESS; STEP 11.1–11.4 Party Quest contracts all PASS.
- [x] Code/contract checkpoint: `51256b2506625f7421273d87d0c0f654fdbc432b`.
- [x] Vercel Preview `dpl_CmKCpfPHENmUwjuGzwfRQMXTii7a`: READY.
- [ ] Real-device targeted/household help smoke not yet run/accepted.
- [x] STEP 11.5 rewards/completion and STEP 11.6 notification-event extensions were not started.

### Later STEP 11 checkpoints

- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement — explicit approval required.
- [ ] STEP 11.6 — Party Quest notification event extensions on the frozen notification layer.
- [ ] STEP 11.7 — compatibility/legacy guard.
- [ ] STEP 11.8 — integrated CI + Preview candidate.
- [ ] STEP 11.9 — real iPhone acceptance, one test action at a time.

## Separate account/household lifecycle backlog

- [ ] Owner-transfer **Gezin verlaten** real smoke test. Important, but not a STEP 11 gate.

## Running product/fix backlog

Full details: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 6**
1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task title more prominent in task-create popup.
4. Recipe → propose meal to a household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.
6. Party Quest acceptance toast: fix candidate deployed/green; real-device visual confirmation explicitly deferred to later.

## Standing guardrails

- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main stays untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- UID/household identity comes from HouseholdContext / Firebase Auth.
- Tasks, Progression and Notifications retain their frozen canonical authorities.
- Realtime subscriptions require exact cleanup and stale-context protection.
- Server secrets and push/device credentials never enter client/public repository code or chat.
- Every meaningful development checkpoint synchronizes this TODO, the progress tracker and `docs/FAMILYAPP-UPDATE-LOG.md`.