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
- [-] STEP 11 — Party quests — in progress; STEP 11.1, 11.2 and 11.3 implementation/contract complete. STEP 11.2 has a real-device invite/accept PASS; STEP 11.3 leave smoke is still pending. STEP 11.4 not started.

**Current position: STEP 10 remains frozen. STEP 11.3 is implementation/contract complete with canonical `left` semantics and a repository/service-backed ActiveView. The next roadmap checkpoint is STEP 11.4, but it requires explicit product-owner approval.**

The separate Party Quest acceptance-toast fix remains open because the product owner chose to defer its real-device visual verification. The code fix and contract gate are green, but it must not be marked visually accepted yet.

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
- [x] Frozen `notificationActions.js` remains blob `60a48daa628bc56531395d188a0811711d82a328` through STEP 11.3.

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
- [x] PartyQuestRepository v1.1.0 provides guarded ID allocation and whole-collection transactions.
- [x] Invite creation transactionally enforces task owner/open state and participant eligibility.
- [x] Pending/active duplicates are blocked; declined/revoked users can be reinvited as a new occurrence.
- [x] Reinvite occurrence uses incrementing `inviteVersion` plus `inviteOccurrenceId`.
- [x] Only the intended UID can accept/decline; repeated response cannot transition twice.
- [x] Only inviter can revoke/cancel.
- [x] Manual end uses `cancelled`; `completed` remains reserved for canonical task completion in STEP 11.5.
- [x] `PartyQuestInvites v6.0` is presentation/compatibility facade and delegates mutations to the service.
- [x] Frozen facade methods `getById/respond/revokeInvite` remain available to NotificationActions.
- [x] Frozen NotificationActions implementation remains unchanged.
- [x] Code checkpoint `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- [x] `Household Rebuild Contract Tests` run `33021739099`: SUCCESS.
- [x] Vercel Preview `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: READY.
- [x] Real-device smoke 2026-08-27: Party Quest invite + accept flow works exactly as intended.
- [-] UI-only toast follow-up implemented/green; real-device visual confirmation explicitly deferred by product owner.
- [x] Main, production Firebase Rules and production deployment untouched.

### STEP 11.3 — Leave semantics + ActiveView lifecycle — IMPLEMENTATION/CONTRACT COMPLETE; DEVICE SMOKE PENDING
- [x] Product owner approved STEP 11.3 only after deferring the toast test.
- [x] `PartyQuestService v1.1.0` adds `leaveQuest()` through the canonical repository.
- [x] Active invited participant leave is recorded as `left` + `leftAt`, not `declined`.
- [x] Inviter cannot use participant leave; owner manual end stays `cancelQuest()`.
- [x] Leave status recompute is deterministic: active remains → active; only pending remains → pending; neither remains → cancelled.
- [x] Last-participant leave can close the Party Quest as `cancelled` without fabricating completion.
- [x] `PartyQuestActiveView v6.0.0` reads through `PartyQuestRepository.subscribe()` and mutates through `PartyQuestService` only.
- [x] Direct Party Quest Firebase DB ownership, parallel auth, `fbFamilyId`, `fbUser` and name-keyed localStorage fallback removed from ActiveView.
- [x] Exact repository unsubscribe, subscription-generation stale callback rejection and projection clear on account/household switches implemented.
- [x] Owner end delegates to `cancelQuest()` and never writes `completed`.
- [x] `scripts/test-party-quest-step11-3.js` covers leave rules, stale mutation, context clear, stale callbacks, delegation and exact unsubscribe.
- [x] Runtime serves `partyQuestActiveView.js?v=6` and `partyQuestService.js?v=2`.
- [x] Final implementation/contract checkpoint `b1c04cfc4433590d41fd2d902fa2ae2a7c07bae7`.
- [x] `Household Rebuild Contract Tests` run `33024009131`: SUCCESS.
- [x] Vercel Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7`: READY.
- [ ] Real-device participant leave smoke still pending.

### Later STEP 11 checkpoints
- [ ] STEP 11.4 — Party Quest targeted/household help — explicit approval required.
- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement.
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
- 2026-08-27 — STEP 11.3 leave semantics + ActiveView lifecycle implementation/contract complete; CI `33024009131` SUCCESS and Preview `dpl_VunmExXR5aYyhvC2YWoAWjiFc3e7` READY; real-device leave smoke pending.

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