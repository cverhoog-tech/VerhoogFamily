# FamilyApp — Current TODO / Execution State

Branch: `agent/household-rebuild-v2`
Roadmap source: `docs/household-rebuild-v2-roadmap.md`
Phase tracker: `docs/household-rebuild-v2-progress.md`
Update history: `docs/FAMILYAPP-UPDATE-LOG.md`
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

New chats/agents should read these files before changing the rebuild branch.

## Current phase

**STEP 8 Finance, STEP 9 Progression and STEP 10 Notifications are accepted/frozen.** STEP 10 was explicitly accepted on 2026-08-26 and must not be reopened except for a clearly demonstrated regression.

**STEP 11 — Party quests is in progress. STEP 11.1, STEP 11.2 and STEP 11.3 are implementation/contract complete. STEP 11.2 passed its first real-device invite/acceptance smoke on 2026-08-27. STEP 11.3 still has a real-device leave smoke pending. STEP 11.4 has not started and requires explicit product-owner approval.**

`main`, production Firebase Rules and production deployment remain untouched. Firebase remains on Spark.

## Latest verified state

- [x] STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] STEP 10 real-device acceptance includes external iOS push, push-tap de-duplication, UID-specific notification state, account/push/avatar isolation, PWA safe-area, Home dark mode and repeated resume/reload stability.
- [x] STEP 11.1 canonical `PartyQuestRepository` foundation implemented with HouseholdContext lifecycle guards.
- [x] STEP 11.2 `PartyQuestService` invite/join state machine implemented and full contract CI green.
- [x] STEP 11.2 real-device functional smoke PASS: account A can send a Party Quest invitation and the accept flow behaves as intended.
- [x] STEP 11.3 implementation/contract complete: distinct `left` semantics and repository/service-backed ActiveView lifecycle.
- [x] STEP 11.3 contract checkpoint: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- [x] STEP 11.3 `Household Rebuild Contract Tests` run `33024009131`: SUCCESS.
- [x] STEP 11.3 Vercel Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7`: READY.
- [ ] STEP 11.3 real-device leave smoke still pending; do not mark device acceptance until actually verified.
- [-] Non-blocking Party Quest acceptance-toast UI fix is implemented as a Preview candidate; product owner explicitly deferred its real-device visual verification to later.
- [x] Root cause of the white toast identified: baseline `.toast` used `background: var(--c-text)` while dark themes intentionally make `--c-text` near-white, creating white text on a white/near-white surface.
- [x] Shared `showToast()` now forces a contrast-safe dark translucent surface, white text, mobile wrapping, iOS bottom safe-area spacing and polite live-region semantics without touching Party Quest or frozen notification domain logic.
- [x] Toast contrast contract CI run `33023131272`: SUCCESS.
- [x] Frozen `src/core/notificationActions.js` remains unchanged at blob `60a48daa628bc56531395d188a0811711d82a328`.
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
- [x] Added `src/modules/tasks/partyQuestService.js` as the Party Quest domain mutation/state-machine layer.
- [x] Service identity is exclusively HouseholdContext; persistence is exclusively PartyQuestRepository.
- [x] `PartyQuestRepository` upgraded to v1.1.0 with guarded `allocateId()` and whole-collection `mutateCollection()` transaction support.
- [x] Invite creation rechecks task ownership/open state inside the canonical transaction.
- [x] Self, task owner, currently assigned users, inactive members and pending/active duplicates are not eligible invitees.
- [x] Duplicate/concurrent pending invites are transactionally blocked.
- [x] Reinvites after decline/revoke create a fresh occurrence with incremented `inviteVersion` and `inviteOccurrenceId`.
- [x] Only the invited UID may accept/decline its own pending invite.
- [x] Double accept/decline cannot apply the transition twice.
- [x] Only the inviter can revoke a pending invite or manually stop the Party Quest.
- [x] Manual stop resolves to `cancelled`, never `completed`; canonical task-driven completion stays reserved for STEP 11.5.
- [x] `partyQuestInvites.js` is presentation/compatibility facade v6.0 and routes create/respond/revoke/cancel through PartyQuestService.
- [x] Frozen compatibility methods remain available: `PartyQuestInvites.getById`, `.respond`, `.revokeInvite`.
- [x] Frozen `NotificationActions` was not modified.
- [x] `scripts/test-party-quest-service.js` covers authorization, duplicate/double-tap behavior, occurrence-aware reinvite and stale-context negative cases.
- [x] Code checkpoint before documentation sync: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- [x] `Household Rebuild Contract Tests` run `33021739099`: SUCCESS.
- [x] Vercel Preview `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: READY.
- [x] Real-device functional test 2026-08-27: Party Quest invitation/acceptance behaves exactly as intended.
- [-] Acceptance-toast UI polish candidate is implemented and contract-verified; product owner deferred the iPhone visual recheck to later.
- [x] No `main`, production Firebase Rules or production deployment change.

### STEP 11.3 — Leave semantics + ActiveView lifecycle — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING

- [x] Product owner approved proceeding with **STEP 11.3 only** after choosing to defer the toast visual test.
- [x] `PartyQuestService v1.1.0` adds canonical `leaveQuest(questId)` through `PartyQuestRepository.mutateOne()`.
- [x] An active invited participant leaving is stored as `invitees/{uid}.status = left`, with `leftAt`; leaving is no longer represented as `declined`.
- [x] The inviter/owner cannot use participant leave semantics; owner manual end remains the separate `cancelQuest()` action.
- [x] Quest status recomputes deterministically after a leave: active participant remaining → `active`; only pending invitee remaining → `pending`; no active/pending invitees → `cancelled`.
- [x] Last-participant leave records an ended reason and does not create a fake `completed` state.
- [x] `PartyQuestActiveView v6.0.0` reads Party Quest state only via `PartyQuestRepository.subscribe()` and routes mutations only through `PartyQuestService`.
- [x] ActiveView no longer owns direct Firebase Database refs/updates and no longer uses `firebase.auth`, `fbFamilyId`, `fbUser` or name-keyed localStorage identity/avatar fallback.
- [x] ActiveView owns exact repository unsubscribe, generation-based stale callback rejection and immediate projection/overlay clear on account or household lifecycle changes.
- [x] Owner **Beëindigen** delegates to `PartyQuestService.cancelQuest()` and never writes `completed`; canonical task completion remains reserved for STEP 11.5.
- [x] `scripts/test-party-quest-step11-3.js` covers leave status, double-leave rejection, inviter restriction, status recompute, stale deferred leave, context clear, stale old-household callback, service delegation and exact unsubscribe.
- [x] Runtime cache-busts `partyQuestActiveView.js?v=6` and `partyQuestService.js?v=2`.
- [x] Final implementation/contract checkpoint before docs sync: `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- [x] `Household Rebuild Contract Tests` run `33024009131`: SUCCESS.
- [x] Vercel Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7`: READY (`target: null`).
- [ ] Real-device leave smoke not yet run/accepted.
- [x] STEP 11.4, STEP 11.5 and later scopes were not started.

### Later STEP 11 checkpoints

- [ ] STEP 11.4 — Party Quest targeted/household help — requires explicit approval.
- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement.
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