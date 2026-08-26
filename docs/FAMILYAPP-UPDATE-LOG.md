# FamilyApp — Cross-chat Update Log

Branch: `agent/household-rebuild-v2`

Purpose: persistent handoff log for FamilyApp development. Read this together with `docs/FAMILYAPP-CURRENT-TODO.md`, `docs/household-rebuild-v2-progress.md`, `docs/household-rebuild-v2-roadmap.md` and `docs/FAMILYAPP-FIX-LIST.md` before changing the rebuild branch.

Historical entries through STEP 11.1 are preserved verbatim in `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.

## Logging rule
1. Record every meaningful product/code checkpoint.
2. Synchronize the central TODO and phase tracker in the same work session.
3. Never mark a device/release gate accepted without real verification.
4. Keep `main` and production Firebase Rules untouched unless explicitly approved.
5. Never put service-account private keys or push-device tokens in chat, client code or repository files.

Newest entries belong at the top.

---

## 2026-08-27 — STEP 11.2 PartyQuestService + invite/join state machine implemented

- Product owner explicitly approved **GO 11.2** only. STEP 11.3 and later checkpoints were not started.
- Added `src/modules/tasks/partyQuestService.js` v1.0.0 as the Party Quest domain authorization/state-machine layer.
- Service identity is exclusively `HouseholdContext`; it does not use `fbFamilyId`, `fbUser`, direct Firebase Auth or localStorage as identity/persistence authority.
- Party Quest persistence remains exclusively owned by `PartyQuestRepository` at `families/{householdId}/partyQuests/{partyQuestId}`.
- Upgraded `PartyQuestRepository` to v1.1.0 with context-guarded `allocateId()` plus whole-collection `mutateCollection()` transactions for atomic invite creation/duplicate protection.
- Invite creation rechecks the linked task inside the transaction. Only the current UID that is the task creator may invite for an open task.
- Self, task owner, currently assigned users, inactive members and users already pending/active for the same task are excluded from invitation eligibility.
- A declined/revoked participant can be invited again as a fresh invite occurrence. The new occurrence gets an incremented `inviteVersion` and a new deterministic `inviteOccurrenceId` (`<partyQuestId>:<uid>:v<version>`), plus occurrence timestamps.
- Invite responses are UID-authorized: only the current intended invitee can accept/decline its own pending invite. A second response after the first transition is rejected.
- Invite revocation and manual Party Quest stop are inviter-only.
- Manual stop now resolves the Party Quest to `cancelled`, never `completed`. Canonical task-driven completion remains reserved for STEP 11.5.
- Reworked `src/modules/tasks/partyQuestInvites.js` as v6.0 presentation/compatibility facade. It reads from `PartyQuestRepository` and delegates create/respond/revoke/cancel mutations to `PartyQuestService`; it no longer owns direct Party Quest Firebase transactions/listeners.
- Preserved frozen STEP 10 compatibility methods used by `NotificationActions`: `PartyQuestInvites.getById`, `.respond`, `.revokeInvite`.
- Frozen `src/core/notificationActions.js` was not modified and remains blob `60a48daa628bc56531395d188a0811711d82a328`.
- Runtime now serves `partyQuestInvites.js?v=6`, `partyQuestRepository.js?v=2` and `partyQuestService.js?v=1`; the frozen notification runtime remains downstream.
- Added `scripts/test-party-quest-service.js` with authorization, duplicate invite, double-response, wrong-recipient, non-inviter revoke, occurrence-aware reinvite and stale account/household mutation negative coverage.
- Updated the STEP 11.1 repository contract test for the v2 repository/service loader chain.
- One intermediate CI run failed because the older STEP 11.1 test still expected `partyQuestRepository.js?v=1`; that stale test expectation was corrected without rolling back product logic.
- Final code checkpoint before documentation sync: `7dd088038283a6a7cd2b66f81e1380492cff6f96`.
- `Household Rebuild Contract Tests` run `33021739099`: **SUCCESS**.
- Vercel deployment `dpl_B1rjmzGtC8Hw5rnUtHEkWSZbArbK`: **READY** on branch `agent/household-rebuild-v2` (`target: null`, Preview).
- Direct deployment URL returned HTTP 200. Served HTML was verified to contain `partyQuestInvites.js?v=6`, `householdContext.js?v=1`, `partyQuestRepository.js?v=2`, `partyQuestService.js?v=1`, `notificationActions.js?v=4`, and `partyQuestNotificationProjector.js?v=2` in the expected runtime chain.
- Stable branch Preview remains `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.
- `docs/FAMILYAPP-FIX-LIST.md` remains unchanged: all five separate product/fix backlog items remain open and were not folded into STEP 11.2.
- Separate owner-transfer **Gezin verlaten** real-device smoke remains open and is not a STEP 11 blocker.
- `main`, production Firebase Rules and production deployment were not changed. Firebase remains on Spark.
- Next approval-gated checkpoint: **STEP 11.3 — leave semantics + ActiveView lifecycle cleanup**.

---

## Frozen checkpoint reference

- STEP 8 Finance: accepted/frozen 2026-08-24.
- STEP 9 Progression: accepted/frozen 2026-08-24.
- STEP 10 Notifications: explicitly accepted/frozen 2026-08-26.
- STEP 10 frozen code checkpoint: `538a5b89ab270bfdfc2c9f3a3d97093260133641`.
- STEP 11.1 code checkpoint: `e5ce389e30ed2848e0fca5715339639f17ebd8cf`.
- Full historical log through STEP 11.1: `docs/FAMILYAPP-UPDATE-LOG-ARCHIVE-THROUGH-STEP11.1.md`.
