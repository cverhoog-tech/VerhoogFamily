# Phase 14 — Profiel / Persoon / Presence context migration

Status: 🟡 architecture + automated contract complete; live device/PWA/multi-household acceptance remains a release gate.

## Canonical ownership

- Public household identity lives in `families/{householdId}/members/{uid}`.
- Presence lives in `families/{householdId}/presence/{uid}` and is writable only by the matching authenticated UID under Database Rules.
- Personal progression remains private at `users/{uid}/private/progression/current`.
- localStorage profile/avatar keys are compatibility cache only and are not identity authority.

## ProfileContextService

`src/modules/profile/profileContextService.js`

- Captures `{uid, householdId}` through `HouseholdContext`.
- Rejects stale writes with `PROFILE_CONTEXT_CHANGED`.
- Reads household-visible member identity/presence through `HouseholdIdentityFirebaseBridge`.
- Routes own profile updates through the canonical member-profile writer.
- Never resolves active identity through `fbUser`, `fbFamilyId`, `myName`, or fixed names.

## Existing profile UI

`src/modules/profile/profileRuntimeContextBridge.js`

The premium profile screen is preserved. Its own-name save action is mirrored to the context-safe profile service. Existing localStorage updates remain compatibility cache during the legacy cleanup phase.

Avatar persistence remains owned by the existing `HouseholdIdentityFirebaseBridge` avatar event listener to avoid duplicate Firebase writes.

The legacy editable partner-name field is not treated as household identity authority. Household members come from Firebase membership.

## Person dashboard

`src/modules/tasks/personDashboardService.js` v2:

- no direct Firebase refs;
- no `fbFamilyId` or `fbUser` identity lookup;
- subscribes to the household identity bridge and rebinds on HouseholdContext changes;
- stale callbacks from a previous household are ignored;
- household-visible task statistics are UID based;
- current-user progression is read from `FamilyProgression`;
- other members' private progression is deliberately not read or reconstructed.

This preserves the privacy contract: membership/presence is household-visible, progression is UID-private unless a future explicit public progression projection is designed.

## Automated evidence

- `tests/profile-context-rebind.test.js`
- `tests/profile-context-adoption.test.js`
- both tests are part of `.github/workflows/household-session-contract.yml`.

Coverage includes current member/presence resolution, stale profile-write rejection after an account/household switch, removal of raw family-path authority from PersonDashboardService, and enforcement of current-UID-only private progression.

## Deferred cleanup / release gates

- `src/core/avatarIdentityBridge.js` still contains broad presentation compatibility for legacy name/avatar localStorage keys and fixed fallback presets. It is not persistence authorization and belongs in Phase 17 cleanup.
- `src/modules/profile/avatarStore.js` and `ProfileScreen.target.js` still write compatibility localStorage keys; canonical member identity is Firebase-backed via the runtime bridge.
- live two-device presence transitions, browser background/foreground behavior, iPhone Safari/PWA presence cleanup, and three isolated live households remain deferred acceptance gates.
