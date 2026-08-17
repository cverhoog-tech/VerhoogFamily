# Phase 10 — Feed context migration

Status: 🟡 architecture/automated contract green pending final CI and deferred live device/PWA gates.

## Canonical model

Social posts are household-shared records under:

`families/{householdId}/shared/feed/{postId}`

Immutable domain activity events remain separate under:

`families/{householdId}/shared/activity/{eventId}`

Feed presentation merges both models chronologically. Feed does not publish domain activity events itself.

## FeedSharedData v2

`src/modules/feed/feedSharedData.js` is the sole persistence boundary for social posts, comments and likes.

- HouseholdContext is the active identity source.
- Subscription is bound to `{uid, householdId}`.
- `stop()` removes the listener and clears the compatibility projection.
- `rebind()` runs on `familyapp:household-context-changed`.
- `familyapp:session:cleared` immediately clears feed state.
- Stale callbacks are ignored after account/household changes.
- Mutations assert the captured context before and after async writes.
- Stale operations fail with `FEED_CONTEXT_CHANGED`.

## UID ownership and interactions

New posts contain `householdId` and `authorUid`.

- Post deletion is allowed by the client domain layer only when `authorUid === current uid`.
- Likes are stored under `likes/{uid}`.
- Comments contain `authorUid` and are written to a post-specific comments path.
- Display names and avatars are presentation data, not authorization data.

`feedContextIdentity.js` projects the current UID/member display name from HouseholdContext for the existing UI without making names an authorization mechanism.

## Legacy migration

`feedPosts` is retained only as migration input. If canonical `shared/feed` is empty, old record-based posts can be copied once into the canonical collection. New writes never target `feedPosts`.

The older renderer still contains compatibility/presentation helpers and avatar fallbacks. These are not persistence or authorization authority and belong to the later legacy/UI cleanup phase.

## Activity integration

`feedActivityPresentation.js` is presentation-only and consumes ActivityService/HouseholdActivity events. It never writes activity data.

Current premium activity cards include:
- task created
- task completed
- meal planned
- grocery/shopping completed

Receipt amounts are not present in the activity payload.

## Automated evidence

- `tests/feed-context-rebind.test.js`
  - Alpha subscription and projection
  - Alpha → Beta rebind/unsubscribe
  - stale Alpha snapshot rejection
  - Beta post actor/household metadata
  - UID-keyed likes
  - UID-authored comments
- `tests/feed-context-adoption.test.js`
  - canonical `feed` collection
  - HouseholdContext adoption
  - lifecycle hooks
  - no `fbUser` / `fbFamilyId` authority in FeedSharedData
  - Activity presentation remains consumer-only

These checks run in `.github/workflows/household-session-contract.yml`.

## Deferred live gates

Before ✅ production-ready status:
- two-device realtime post/comment/like/delete acceptance
- real account/household switching while Feed is open
- offline/reconnect and PWA reload
- media/GIF behavior on real mobile clients
- three independent live households with no cross-household data exposure

Until those gates are completed, Phase 10 remains 🟡.
