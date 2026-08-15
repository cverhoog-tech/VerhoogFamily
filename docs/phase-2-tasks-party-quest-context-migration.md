# Phase 2 — Tasks / Party Quest context migration

Date: 2026-08-15
Branch: `agent/household-context-foundation`
PR: #23

## Goal
Remove task/Party Quest identity and storage authority from ad-hoc `fbUser`, `fbFamilyId` and direct `families/{id}/...` paths, and bind all active runtime behavior to `HouseholdContext` + `FamilyDataStore`.

## TaskSharedData
- Public task mutations are protected by `TaskContextBoundary`.
- `taskCreateReadinessFix` no longer resolves Firebase auth/household independently.
- `TaskSharedData` v1.6 captures `{ uid, householdId }` when it subscribes.
- On household/account context changes the previous subscription is explicitly detached and a new shared-task subscription is bound.
- Late callbacks from the old household are ignored.
- The old root-family `value` guard/listener was removed.
- The remaining legacy `syncToFirebase` compatibility shim cannot write task authority and only executes non-task legacy writes if the captured UID + household are still current.

## Party Quests
Canonical collection: `families/{householdId}/shared/partyQuests` through `FamilyDataStore`.

`FamilyDataContract` now contains `partyQuests`.

The active `/api/app` runtime no longer loads the old direct-Firebase `partyQuestInvites.js` or `partyQuestActiveView.js` implementations.

New runtime:
1. `partyQuestContextService.js` — sole read/write lifecycle authority.
2. `partyQuestActiveContextView.js` — active quest presentation via the service.
3. `partyQuestCompletionReward.js` v3 — reward claims via service/FDS transaction.
4. `partyQuestContextUi.js` — backwards-compatible UI/API facade.

The notification projector was also migrated to observe the context service instead of a direct Firebase partyQuests listener.

## Context safety
Party Quest create/respond/revoke/leave/end/reward operations capture the active UID + household context. If the account/household changes before completion, the operation rejects with `PARTY_QUEST_CONTEXT_CHANGED` rather than continuing in the new context.

## Automated evidence
- `task-context-boundary.test.js`
- `task-context-adoption.test.js`
- `task-shared-context-rebind.test.js`
- `party-quest-context-service.test.js`
- `party-quest-context-adoption.test.js`
- existing account-switch, pending-write, removed-member and invite-lifecycle tests remain in the same CI suite.

## Remaining scope
- Real-device/PWA acceptance remains deferred by user request.
- The non-task legacy `syncToFirebase` shim still exists temporarily for shop/calendar/recur compatibility; those domains should be migrated in their own phases before the shim is deleted entirely.
- Old Party Quest source files can be physically deleted during technical cleanup after downstream references are confirmed absent.
