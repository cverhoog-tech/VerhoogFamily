# Phase 13 — Progression context migration

Status: architecture hardened; live device/PWA/multi-household acceptance remains deferred.

## Canonical authority

Personal progression is stored privately per Firebase UID:

`users/{uid}/private/progression/current`

`FamilyProgression` is the single persistence authority for:

- total XP and level;
- skill XP and skill logs;
- streak state;
- achievement unlock state;
- progression counters/stats;
- idempotency event keys for rewards.

`ProgressionStore` is a Promise-based facade over `FamilyProgression`; it does not maintain a second copy or persistence model.

## HouseholdContext lifecycle

Progression now captures `{uid, householdId}` from `HouseholdContext`, unsubscribes and clears runtime state on context/session changes, rebinds to the current UID private collection, and ignores stale callbacks from a previous account/household.

Writes that outlive their captured context fail with `PROGRESSION_CONTEXT_CHANGED` rather than landing in a later account.

## Reward idempotency

Task XP and skill XP support deterministic `eventId` keys. Replaying the same task completion does not award XP or skill XP twice.

## Compatibility

- `window.myXP` remains a presentation compatibility projection only.
- `unlockedBadges` remains a presentation compatibility projection only.
- `progressionUidBridge.js` routes legacy `awardXP()` calls through `ProgressionStore`.
- `achievementUidBridge.js` detects legacy badge unlocks and records them in the private progression authority.
- `skillsProgressionBridge.js` disables legacy `fam_skills_v1` writes and routes skill awards to the current UID.
- The Skills UI shows the active account's private progression; it no longer treats fixed names such as Shane/Esra as persistence identities.

## Household activity projection

An achievement unlock may emit immutable household activity type `achievement.unlocked`. This is presentation/social projection only and never becomes progression authority.

The feed renders this as an achievement card while the canonical unlocked state remains private under the user's UID.

## Automated evidence

- `tests/progression-context-rebind.test.js`
  - UID/household rebind;
  - stale callback isolation;
  - task XP idempotency;
  - skill XP idempotency.
- `tests/progression-context-adoption.test.js`
  - canonical private progression path;
  - no `fbUser`/`fbFamilyId` identity in the progression engine;
  - no direct Firebase member XP writes in compatibility bridges;
  - achievement activity projection;
  - runtime loader order.

## Deferred release gates

- real two-device progression sync;
- iPhone/PWA lifecycle;
- logout/account switch during an in-flight reward;
- three independent households;
- product QA of level-up/achievement animations and copy.

Until those gates are executed, Phase 13 remains yellow rather than fully green in the production-readiness tracker.
