# Household Rebuild v2 — Progress Tracker

Roadmap: `docs/household-rebuild-v2-roadmap.md`  
Working branch: `agent/household-rebuild-v2`  
Day-to-day execution source: `docs/FAMILYAPP-CURRENT-TODO.md`  
Cross-chat history: `docs/FAMILYAPP-UPDATE-LOG.md`  
Running product/fix backlog: `docs/FAMILYAPP-FIX-LIST.md`

This is the compact phase-level tracker. The roadmap remains the architecture/scope source; the current TODO is authoritative for the exact next action.

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
- [x] STEP 10 — Notifications — accepted/frozen 2026-08-26 after explicit product approval and completion of all functional + real-device gates.
- [-] STEP 11 — Party quests — in progress; STEP 11.1 repository foundation complete, STEP 11.2 not started.

**Current position: STEP 10 remains frozen. STEP 11 Party quests is in progress. STEP 11.1 is complete and contract-verified; STEP 11.2 requires explicit approval before work starts.**

The still-open owner-transfer **Gezin verlaten** smoke remains a separate account/household lifecycle backlog test and is not a STEP 11 blocker.

## Frozen phases

### STEP 8 — Finance
- [x] Accepted/frozen after household isolation, analysis/export and real iPhone premium PDF/share acceptance.

### STEP 9 — Progression / XP / Achievements
- [x] Accepted/frozen after canonical UID progression, deterministic/idempotent rewards, served-runtime audit and real iPhone acceptance.

### STEP 10 — Notifications
- [x] Explicitly accepted/frozen by product owner on 2026-08-26.
- [x] Canonical household notification state with HouseholdContext lifecycle protection.
- [x] Per-UID read/dismiss semantics and deterministic event IDs.
- [x] Profile → Meldingen canonical notification center.
- [x] Private multi-device FCM registry and explicit opt-in.
- [x] Account-switch push transport invalidation.
- [x] Trusted sender verifies caller/member/event actor and resolves recipients/tokens server-side.
- [x] Private delivery receipts and invalid-token cleanup.
- [x] External iOS Web Push real-device accepted on Home Screen PWA.
- [x] Push-tap routing/de-duplication real-device accepted.
- [x] UID-specific read/dismiss persistence accepted across full app close/reopen.
- [x] Intended-recipient foreground live notification accepted on real iPhone.
- [x] Targeted **Hulp geven / Afwijzen** and household **Hulp geven / Niet voor mij** real-device accepted.
- [x] Same-iPhone account switching and active Firebase identity verification accepted.
- [x] UID-scoped avatar lifecycle/account isolation accepted.
- [x] Installed PWA safe area accepted.
- [x] Home dark mode accepted.
- [x] B → A inbox/unread/banner isolation accepted.
- [x] Prior-UID push-registration isolation accepted.
- [x] Repeated close/open and background→foreground stability accepted.

### Frozen STEP 10 code / CI / Preview checkpoint
- [x] Code checkpoint `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- [x] `Household Rebuild Contracts` SUCCESS — run `32954316879`.
- [x] Vercel Preview `dpl_3FjdEX2qemXGjNFvT7Tb3TNtnVEj` READY.
- [x] Stable branch alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- [x] Main untouched; no production Firebase Rules change.

## STEP 11 — Party quests — IN PROGRESS

Roadmap scope:
- invites;
- join/leave;
- help requests;
- completion;
- rewards;
- notifications;
- idempotency.

STEP 11 builds on the frozen Tasks + Progression + Notifications contracts without reopening those authorities.

### STEP 11.1 — PartyQuestRepository foundation
- [x] Added `PartyQuestRepository v1.0.0` as the household-scoped Party Quest persistence/realtime boundary.
- [x] Source of truth remains `families/{householdId}/partyQuests/{partyQuestId}`.
- [x] HouseholdContext UID/household/revision is the identity authority; no parallel auth or legacy user/household globals.
- [x] Exact Firebase listener teardown, immediate projection clear and stale callback rejection implemented.
- [x] Mutation primitives reject stale context writes after account/household switching.
- [x] Existing Firebase Party Quest v1 rows normalize in memory to the v2-shaped read model; no eager/destructive migration.
- [x] Legacy fields remain preserved during normalization.
- [x] Repository served after HouseholdContext and before the frozen Party Quest notification projector.
- [x] Added `scripts/test-party-quest-household-repository.js` with A → B, H1 → H2 and delayed stale-write negative coverage.
- [x] Existing Party Quest UI behavior and existing mutation modules deliberately remain unchanged in STEP 11.1.
- [x] Code checkpoint `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- [x] `Household Rebuild Contract Tests` SUCCESS — run `33019925699`.
- [x] Vercel deployment `dpl_13JQpQe8MkvCy3vZKtZPycfT3WzG` READY.
- [x] Stable branch Preview HTTP 200 and served loader order verified.
- [x] Main untouched; no production Firebase Rules or production deployment changes.

### STEP 11.2 — PartyQuestService + invite/join state machine
- [ ] Not started. Requires explicit product-owner approval.
- [ ] Add domain authorization/state-machine layer over PartyQuestRepository.
- [ ] Route invite/respond/revoke behind service while preserving frozen NotificationActions compatibility facade.
- [ ] Add transactional duplicate/concurrent invite protection and occurrence-aware reinvites.

### Later STEP 11 checkpoints
- [ ] STEP 11.3 — Leave semantics + ActiveView lifecycle cleanup.
- [ ] STEP 11.4 — Party Quest targeted/household help.
- [ ] STEP 11.5 — canonical Task completion + durable exactly-once reward settlement.
- [ ] STEP 11.6 — Party Quest notification event extensions on frozen notification layer.
- [ ] STEP 11.7 — compatibility/legacy guard.
- [ ] STEP 11.8 — integrated CI + Preview candidate.
- [ ] STEP 11.9 — real iPhone acceptance, one test action at a time.

## Separate account/household lifecycle backlog

- [ ] Owner-transfer **Gezin verlaten** real smoke test. Important lifecycle coverage, but not a STEP 11 Party Quest gate.

## Running product/fix backlog

Full specification: `docs/FAMILYAPP-FIX-LIST.md`.

**Open main items: 5**

1. Home hero card backgrounds.
2. Internationalisation: NL / EN / TR / DE / FR.
3. Task name more prominent in task-create popup.
4. Recipe → propose meal to a household member with realtime accept/reject workflow.
5. Shopping → complete trip with optional receipt and failure-safe purchased-item cleanup.

These five product items stay separate from rebuild phase acceptance and were not changed by STEP 11.1.

## Prototype end-goal gate

Detailed contract: `docs/multi-family-prototype-acceptance.md`.

- [x] Multi-family readiness is an explicit prototype end goal.
- [x] Personal platform-admin capability is an explicit prototype end goal.
- [x] Privacy boundary defined: sanitized operational diagnostics by default, no generic raw household-content access.
- [ ] At least three independent households pass end-to-end isolation/lifecycle acceptance.
- [ ] Core modules prove no cross-household read/write/state leakage across the complete app.
- [ ] Removed-member behavior passes final broader-beta isolation tests.
- [ ] Sanitized platform operations/admin dashboard accepted.
- [ ] Firebase Rules + media authorization prove household isolation and admin privacy boundary.
- [ ] Broader family beta acceptance gate passed.

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
- 2026-08-19 — rebuild branch created.
- 2026-08-20 — STEP 0–2 accepted on iPhone.
- 2026-08-22 — STEP 2A/2B and STEP 3 accepted.
- 2026-08-24 — STEP 8 Finance accepted/frozen.
- 2026-08-24 — STEP 9 Progression accepted/frozen.
- 2026-08-24 — STEP 10 canonical notification + Web Push + trusted sender foundations implemented.
- 2026-08-26 — real external iOS lock-screen push accepted.
- 2026-08-26 — targeted **Afwijzen** + household **Niet voor mij** accepted on device.
- 2026-08-26 — push-tap routing/de-duplication accepted.
- 2026-08-26 — UID-specific read/dismiss persistence accepted.
- 2026-08-26 — Profile **Actief account** indicator added; A → B active Firebase identity verified on same iPhone.
- 2026-08-26 — real iPhone accepted A → B avatar isolation, installed-PWA safe-area layout, and complete Home dark mode.
- 2026-08-26 — real iPhone accepted the intended-recipient foreground notification path.
- 2026-08-26 — real iPhone accepted B → A UI/inbox notification isolation.
- 2026-08-26 — real iPhone accepted prior-UID push-registration isolation.
- 2026-08-26 — real iPhone accepted the final reload/background→foreground stability smoke.
- 2026-08-26 — **product owner explicitly approved STEP 10; Notifications is frozen.**
- 2026-08-27 — STEP 11 started; STEP 11.1 PartyQuestRepository foundation implemented, full contract CI passed, and Preview served/verified.

## Standing guardrails
- Main untouched until explicit approval.
- No production deploy or production Firebase Rules change without explicit approval.
- Firebase remains on Spark unless explicitly changed.
- STEP 8, STEP 9 and STEP 10 remain frozen.
- Notification state and push delivery remain separate layers.
- UID/household identity is HouseholdContext/Firebase Auth based.
- Realtime subscriptions require exact cleanup/stale-context protection.
- Push/device credentials are private technical data; server secrets never enter client code, repository or chat.
- Every meaningful update synchronizes the current TODO, this tracker and the update log.
