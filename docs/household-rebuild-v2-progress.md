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
- [-] STEP 11 — Party quests — in progress; STEP 11.1–11.4 implementation/contract complete. STEP 11.2 has a real-device invite/accept PASS. STEP 11.4 targeted-help Test 1 has a real-device PASS; remaining 11.4 recipient/broadcast actions and STEP 11.3 leave are pending. The Party Quest UX patch is implementation/contract complete. STEP 11.5 not started.

**Current position: STEP 10 remains frozen. STEP 11.4 help has a partial real-device PASS, and the approved Party Quest UX patch is contract-green on a READY Preview. The next roadmap checkpoint is STEP 11.5, but it requires explicit product-owner approval and has not started.**

The separate Party Quest acceptance-toast fix remains open because the product owner chose to defer its real-device visual verification. The STEP 11.3 participant-leave smoke, remaining STEP 11.4 help actions and Party Quest UX smoke are also not yet marked real-device accepted.

The owner-transfer **Gezin verlaten** smoke remains a separate lifecycle backlog test and is not a STEP 11 blocker.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.

### STEP 10 — Notifications
- [x] Explicitly accepted/frozen by product owner on 2026-08-26.
- [x] Canonical household notification state with HouseholdContext lifecycle protection.
- [x] Per-UID read/dismiss and deterministic event IDs.
- [x] External iOS Web Push and push-tap routing/de-duplication real-device accepted.
- [x] Intended-recipient live notification and task-help actions real-device accepted.
- [x] Same-iPhone account, avatar, inbox/unread/banner and prior-UID push-registration isolation accepted.
- [x] Installed PWA safe-area, Home dark mode and repeated resume/reload stability accepted.
- [x] Frozen code checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] Frozen `notificationActions.js` remains blob `60a48daa628bc56531395d188a0811711d82a328` through the Party Quest UX patch.

## STEP 11 — Party quests — IN PROGRESS

Roadmap scope: invites; join/leave; help requests; completion; rewards; notifications; idempotency.

STEP 11 builds on frozen Tasks + Progression + Notifications contracts and HouseholdContext UID identity.

### STEP 11.1 — PartyQuestRepository foundation — COMPLETE
- [x] `PartyQuestRepository` introduced as canonical household Party Quest persistence/realtime boundary.
- [x] Source of truth remains `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] HouseholdContext UID/household/revision is the identity authority.
- [x] Exact listener teardown, immediate projection clear and stale callback/write rejection implemented.
- [x] v1 rows normalize in memory to the v2-shaped contract without destructive migration.
- [x] Contract test covers A → B, H1 → H2 and delayed stale-write rejection.
- [x] Code checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- [x] Contract CI run `33019925699`: SUCCESS.
- [x] Vercel Preview `dpl_13JQpQe8MkvCy3vZKtZPycfT3WzG`: READY.

### STEP 11.2 — PartyQuestService + invite/join state machine — COMPLETE + REAL-DEVICE FUNCTIONAL PASS
- [x] Product owner approved GO 11.2 only.
- [x] PartyQuestService domain authorization/state-machine layer established.
- [x] Invite creation transactionally enforces task owner/open state and participant eligibility.
- [x] Pending/active duplicates blocked; declined/revoked users can be reinvited as a new occurrence.
- [x] Only intended UID can accept/decline; repeated response cannot transition twice.
- [x] Only inviter can revoke/cancel; manual end uses `cancelled`.
- [x] PartyQuestInvites frozen-compatible facade remains intact.
- [x] Code checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- [x] Contract CI run `33021739099`: SUCCESS.
- [x] Vercel Preview `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: READY.
- [x] Real-device smoke 2026-08-27: invite + accept flow works exactly as intended.
- [-] UI-only toast follow-up implemented/green; real-device visual confirmation deferred by product owner.

### STEP 11.3 — Leave semantics + ActiveView lifecycle — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING
- [x] `PartyQuestService v1.1.0` adds canonical `leaveQuest()`.
- [x] Participant leave is recorded as `left` + `leftAt`, not `declined`.
- [x] Inviter cannot participant-leave; owner manual end stays `cancelQuest()`.
- [x] Deterministic leave status recompute implemented.
- [x] `PartyQuestActiveView` reads repository and mutates service only.
- [x] Legacy direct Firebase/auth/household/localStorage ownership removed from ActiveView.
- [x] Exact unsubscribe, stale callback rejection and projection clear on identity changes implemented.
- [x] Owner end never writes `completed`.
- [x] `scripts/test-party-quest-step11-3.js` PASS in current suite.
- [x] Implementation/contract checkpoint `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- [x] CI run `33024009131`: SUCCESS.
- [x] Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7`: READY.
- [ ] Real-device participant leave smoke pending.

### STEP 11.4 — Targeted + household Party Quest help — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PARTIAL PASS
- [x] Product owner explicitly approved GO 11.4 only.
- [x] `PartyQuestService v1.2.0` adds targeted help, household help, response and retraction methods through PartyQuestRepository.
- [x] Party Quest help state is occurrence-scoped under `helpRequests` and does not reuse ordinary Task-help state.
- [x] Active Party Quest + open linked task required; inviter-only create/retract.
- [x] One open help request per Party Quest at a time.
- [x] Eligibility excludes requester/inviter, inactive members, task creator/assignees and current pending/active Party Quest participants.
- [x] Eligibility is rechecked at mutation time; stale or newly ineligible users cannot join.
- [x] Targeted accept/decline closes the request and rejects wrong-recipient/double-response attempts.
- [x] Household decline is recorded per UID and leaves broadcast open for others.
- [x] Household accept adds the helper as an active participant with `joinedVia: help` + `helpOccurrenceId` and keeps the request open for further eligible helpers.
- [x] Inviter may retract an open help request; manual cancel / last-participant close retracts it automatically.
- [x] Added `PartyQuestHelpUi v1.0.1` with owner **Hulp vragen / Hulpvraag beheren** and recipient **Hulp geven / Niet voor mij** flows.
- [x] Help UI uses HouseholdContext + PartyQuestRepository/Service only, exact unsubscribe/generation lifecycle guards and stale projection rejection.
- [x] UI no longer shows a request after recipient eligibility changes.
- [x] Existing regular Party Quest invitations retain priority over help requests on the shared Party Quest tile.
- [x] Runtime serves `partyQuestService.js?v=3` + `partyQuestHelpUi.js?v=1`; frozen notification actions/projector remain v4/v2 and unchanged.
- [x] `scripts/test-party-quest-step11-4.js` covers targeted/broadcast help, multiple helpers, rejection/idempotency, cleanup, stale mutation and UI lifecycle/eligibility.
- [x] Full contract run `33044211179`: SUCCESS; log explicitly reports `party quest STEP 11.4 targeted + household help: PASS`.
- [x] Code/contract checkpoint `51256b2506625f7421273d87d0c0f654fdbc432b`.
- [x] Vercel Preview `dpl_CmKCpfPHENmUwjuGzwfRQMXTii7a`: READY.
- [x] Real-device Test 1 PASS: the inviter can send targeted help to an eligible household member and the action changes to **Hulpvraag beheren**.
- [ ] Recipient accept/decline and household-broadcast real-device follow-up pending.
- [x] STEP 11.5 completion/reward settlement and STEP 11.6 help-notification event extensions were not started.

### Party Quest UX patch — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING
- [x] Product owner approved GO Party Quest UX patch before STEP 11.5.
- [x] Existing pending/active Party Quest state no longer removes access to **＋ Nieuwe Party Quest**.
- [x] Active Party Quest overlay also exposes **＋ Nieuwe Party Quest**, bypassing the previous single-current-quest UI trap.
- [x] The chooser exposes **Nieuwe quest maken** and delegates to canonical `TaskDetailPopup.openCreate()`.
- [x] HouseholdContext-scoped task-create handoff waits for canonical `familyapp:tasks-updated`, detects a truly new self-created task and reopens the chooser with it selected.
- [x] No second task form, persistence layer, auth authority or Party Quest mutation path was introduced.
- [x] Generic sparkle placeholders were removed from the chooser in favor of meaningful Arcana/RPG icons through canonical `TaskCategoryIcons.detect()` / `TaskCategoryIcons.icon()`.
- [x] Active Party Quest cards use the same icon family.
- [x] Runtime serves `partyQuestInvites.js?v=7` and `partyQuestActiveView.js?v=7`; frozen STEP 10 notification actions/projector remain unchanged.
- [x] Added `scripts/test-party-quest-ux-patch.js`.
- [x] Full contract run `33049748789`: SUCCESS; log explicitly reports `party quest UX patch: PASS` and all earlier Party Quest/frozen notification tests remain green.
- [x] Code/contract checkpoint `1c5b543926055ab647773b8182fa63322f83878e`.
- [x] Vercel Preview `dpl_EjBMPpzoLdKThex7nGkNbLJhjv81`: READY.
- [ ] Real-device UX smoke pending.

### Later STEP 11 checkpoints
- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement — explicit approval required.
- [ ] STEP 11.6 — notification event extensions on frozen notification layer.
- [ ] STEP 11.7 — compatibility/legacy guard.
- [ ] STEP 11.8 — integrated CI + Preview candidate.
- [ ] STEP 11.9 — real iPhone acceptance, one test action at a time.

## Separate account/household lifecycle backlog
- [ ] Owner-transfer **Gezin verlaten** real smoke test.

## Running product/fix backlog

Full specification: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 6**
1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task title more prominent in task-create popup.
4. Recipe → propose meal to a household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.
6. Party Quest acceptance toast — fix candidate green; real-device visual verification deferred/pending.

## Later roadmap phases
- [-] STEP 11 — Party quests.
- [ ] STEP 12 — Profile / presence / avatars.
- [ ] STEP 13 — Activity / feed.
- [ ] STEP 14 — Search / autocomplete.
- [ ] STEP 14A — Privacy-safe platform operations/admin dashboard.
- [ ] STEP 15 — Firebase Rules + media authorization hardening.
- [ ] STEP 16 — Legacy cleanup.
- [ ] Multi-family broader-beta acceptance gate.
- [ ] STEP 17 — Store distribution readiness.

## Milestones
- 2026-08-24 — STEP 8 Finance and STEP 9 Progression accepted/frozen.
- 2026-08-26 — STEP 10 Notifications explicitly accepted/frozen after all functional + real-device gates.
- 2026-08-27 — STEP 11.1 PartyQuestRepository foundation implemented and contract-verified.
- 2026-08-27 — STEP 11.2 PartyQuestService + invite/join state machine implemented; full CI success and READY Preview verified.
- 2026-08-27 — STEP 11.2 real-device Party Quest invite/acceptance flow functionally accepted; non-blocking toast styling issue added to fix backlog.
- 2026-08-27 — Toast root cause fixed in shared presentation layer; CI `33023131272` SUCCESS; real-device visual confirmation deferred to later.
- 2026-08-27 — STEP 11.3 leave semantics + ActiveView lifecycle implementation/contract complete; CI `33024009131` SUCCESS and Preview READY; real-device leave smoke pending.
- 2026-08-27 — STEP 11.4 targeted/household Party Quest help implementation/contract complete; CI `33044211179` SUCCESS and Preview `dpl_CmKCpfPHENmUwjuGzwfRQMXTii7a` READY.
- 2026-08-27 — STEP 11.4 targeted-help Test 1 real-device PASS: request sends successfully and owner action becomes **Hulpvraag beheren**; remaining recipient/broadcast actions pending.
- 2026-08-27 — Party Quest UX patch implementation/contract complete: multiple Party Quest starts, canonical new-task handoff and meaningful Arcana icons; CI `33049748789` SUCCESS and Preview `dpl_EjBMPpzoLdKThex7nGkNbLJhjv81` READY.

## Standing guardrails
- Work only on `agent/household-rebuild-v2` unless explicitly approved otherwise.
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Tasks, Progression and Notifications remain canonical frozen authorities.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Secrets and private push/device credentials never enter client/public repository code or chat.
- Every meaningful update synchronizes the current TODO, this tracker and the update log.