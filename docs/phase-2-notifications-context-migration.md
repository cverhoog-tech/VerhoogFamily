# Phase 11 — Notifications context migration

Status: 🟡 architecture and automated isolation green; live device/PWA acceptance deferred.

## Canonical ownership

Notifications are household-shared records under:

`families/{householdId}/shared/notifications/{notificationId}`

`NotificationStore` is the sole persistence boundary for notification records. Domain modules publish through `NotificationEvents`; UI actions run through `NotificationActions`; `NotificationCenter` is presentation only.

## Context contract

NotificationStore v2.0 captures `{ uid, householdId }` from `HouseholdContext` and:

- unsubscribes and clears runtime state on household/account switches;
- rejects stale callbacks from a previous household;
- writes `householdId` on every new notification;
- only exposes notifications whose audience includes the current UID or the whole household;
- stores read/dismiss state per UID;
- validates context before and after async writes;
- throws `NOTIFICATION_CONTEXT_CHANGED` for stale actions/writes.

## Actionable notification flows

Current action routes include:

- task help requested → recipient can join help;
- Party Quest received invitation → recipient can accept/decline;
- Party Quest invitation sent → inviter can revoke the individual invitation;
- informational task/quest/finance notifications → read-only detail.

Actions always resolve current domain state before displaying buttons. Notification records do not become a second source of truth for task or Party Quest status.

## Domain event identity

`NotificationEvents` now resolves the actor UID/name from `HouseholdContext` + household membership rather than `fbUser`, `fbFamilyId`, `myName`, or hardcoded identities.

## Deferred presentation cleanup

`NotificationCenter` still contains a legacy Firebase/global UID lookup used only to choose read/unread presentation. It does not authorize writes or domain actions. This can be removed in the broader legacy cleanup phase without changing notification persistence or security behavior.

## Tests

- `tests/notification-context-rebind.test.js`
- `tests/notification-context-adoption.test.js`

These verify account/household rebind, stale callback rejection, canonical `notifications` writes, actor/household metadata, inclusion of `partyQuest.invitation.sent`, and HouseholdContext adoption in Store/Events/Actions.

## Deferred live gates

- two-device notification delivery/read state;
- account switch while notification detail is open;
- Party Quest invite accept/decline/revoke on real clients;
- task-help notification action on real clients;
- reconnect/PWA reload;
- three independent live households.
