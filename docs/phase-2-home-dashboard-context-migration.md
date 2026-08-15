# Phase 15 — Home dashboard context migration

## Status
Architecture and automated contract coverage: 🟡

Live browser/device/PWA and three-household acceptance remain release gates.

## Goal
Home is a presentation/composition surface only. It must not own or persist parallel task, shopping, feed, activity, profile or progression state.

## Canonical inputs
`HomeDashboardService` composes a read model from existing authorities:

- `HouseholdContext` — active UID + household scope
- `ProfileContextService` — current member display identity
- `ProgressionStore` / `FamilyProgression` — current UID private progression
- `TaskSharedData` projection (`taskData`) — household task projection
- `ShoppingLists` — active household/private shopping list projection
- `FeedSharedData` — household social feed
- `ActivityService` — canonical household activity events

Home performs no Firebase writes and has no direct Firebase path access.

## Migration changes
- Added `src/modules/home/homeDashboardService.js`.
- `home.js` is presentation-only and consumes `HomeDashboardService.get()`.
- Greeting no longer depends on `myName`.
- XP card no longer depends on `myXP` or legacy `updateHomeXP()`.
- Home stats no longer directly calculate from `shopData` / `feedData` legacy globals.
- Recent activity no longer renders local `activityData`; it renders canonical household ActivityService events.
- Home rerenders when the composed service emits `familyapp:home-dashboard-updated`.
- Loader places `homeDashboardService.js` before `home.js`.

## Context lifecycle
A Home snapshot always carries the currently captured `{uid, householdId}`. On HouseholdContext/profile/progression/tasks/feed/activity changes the read model is recomputed. Old snapshots can be checked with `HomeDashboardService.isCurrent(snapshot.context)` and are not an authority for writes.

## Privacy
Home only reads the authenticated user's private progression through ProgressionStore. It does not read other users' private progression documents.

## Automated proof
- `tests/home-context-rebind.test.js`
  - Alpha and Beta snapshots remain distinct
  - profile and progression switch with UID/household
  - old context is recognized as stale
- `tests/home-context-adoption.test.js`
  - service depends on canonical context/services
  - no raw Firebase/fbUser/fbFamilyId authority
  - renderer no longer uses legacy Home identity/XP/activity/stat authorities
  - loader order is enforced

Dedicated workflow: `.github/workflows/home-context-contract.yml`.

## Residual legacy debt
- Generic global helpers in `src/core/utils.js` still contain old `updateStats()` and name-tag compatibility logic. Home v2 no longer calls that authority; source cleanup belongs to Phase 17.
- `achievements.js` still defines legacy `updateHomeXP()` for compatibility with old callers. Home v2 no longer invokes it; cleanup belongs to Phase 17.
- Some upstream stores still publish window projections (`taskData`, etc.) as compatibility read models. Home never persists them and their canonical stores remain authoritative.

## Deferred live gates
- account switch on a real browser/device while Home is visible
- logout/login and PWA reopen
- offline/reconnect
- two-device updates
- at least three isolated households
