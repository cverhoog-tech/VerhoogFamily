# Phase 9 — Central Activity/Event Layer migration

Status: 🟡 architecture + automated contracts complete; live multi-device gates deferred.

## Canonical authority

Household activity is stored only under the canonical shared collection:

`families/{householdId}/shared/activity/{eventId}`

`activityEvents` is legacy migration input only and is no longer a write target.

## ActivityService v2

`src/platform/activity/householdActivity.js` now exposes `window.ActivityService` and keeps `window.HouseholdActivity` only as a compatibility alias for existing consumers.

Every publish captures `HouseholdContext` and requires:

- `householdId`
- `actorUid`
- `type`
- `entityType`
- `entityId`
- deterministic `idempotencyKey`
- `occurredAt`
- household visibility

A context switch during publish fails with `ACTIVITY_CONTEXT_CHANGED`.

Realtime activity subscriptions are detached and rebound on household changes. Stale callbacks from a previous household cannot update the current activity projection.

## Idempotency

Event IDs are deterministically derived from the idempotency key. `mutateSharedRecord` preserves an existing event instead of overwriting it, so repeated producer calls for the same domain occurrence produce one immutable activity record.

## Initial domain producers

`src/platform/activity/activityDomainProducers.js` translates successful domain mutations into activity events without any Feed knowledge:

- task create -> `task.created`
- task completion -> `task.completed`
- meal planning -> `meal.planned`
- successful shopping receipt finance projection -> `grocery.receipt_uploaded`

Activity publication is best-effort after the domain mutation. An ActivityService failure never rolls back or marks the original task/meal/shopping action as failed.

The producer adapter is intentionally transitional. Domain modules can later emit native domain events without changing ActivityService, Feed, or the canonical event schema.

## Privacy rule for shopping receipts

Shopping activity never publishes receipt totals or monetary amounts. ActivityService also strips common amount fields defensively even when a producer accidentally supplies them.

Feed copy therefore remains semantic (for example `BOODSCHAPPEN GEDAAN` / `Voorraad aangevuld`) and does not expose the receipt amount.

## Feed boundary

`FeedActivityPresentation` is a presentation-only consumer. It merges household activity with social posts at render time and never publishes activity records.

Runtime order is:

1. ActivityService
2. ActivityDomainProducers
3. FeedActivityPresentation

This prevents modules from depending directly on Feed.

## Automated evidence

- `tests/activity-context-service.test.js`
  - deterministic idempotency
  - UID/household attribution
  - Alpha -> Beta subscription detach
  - stale Alpha callback rejection
  - receipt amount stripping
- `tests/activity-context-adoption.test.js`
  - canonical `activity` collection
  - HouseholdContext authority
  - required entity/idempotency fields
  - no `fbUser` / `fbFamilyId` identity resolution
  - Tasks / Meals / Shopping producer coverage
  - Feed remains consumer-only
  - loader ordering

The household-session CI workflow runs both tests together with all prior isolation and Firebase Rules regression tests.

## Deferred live gates

Before ✅ production-ready status:

- two-device verification that the same activity appears live in the household Feed
- rapid account/household switching while events are created
- offline/reconnect and PWA reload behavior
- three isolated real households producing concurrent events
- broader producer rollout for achievements and later event types

Until those gates are proven, Phase 9 remains 🟡.
