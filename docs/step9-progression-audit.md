# STEP 9 — Progression / XP / Achievements audit

Date: 2026-08-24  
Branch: `agent/household-rebuild-v2`

This is the read-only authority/write-path audit required before STEP 9 changes progression behavior.

## Executive finding

The current app has a useful UID/Firebase bridge around XP, but it is not yet a canonical progression system. The effective authority is still split between browser globals/localStorage, legacy member fields and multiple wrapper layers around `awardXP()`.

The two highest-risk findings are:

1. `ProgressionUidBridge` seeds a missing Firebase member XP value from the global browser value `window.myXP` / `fam_myxp_v1`. That cache is not scoped by UID or household, so a newly bound account/household can inherit unrelated XP.
2. `AchievementUidBridge` merges Firebase achievements into `window.unlockedBadges` but does not replace/clear the projection when identity changes. A previous account's unlocked badges can therefore remain visible in memory and suppress legitimate unlocks for the next account.

STEP 9 must make Firebase progression state under the active household + UID the authority and treat browser globals/localStorage only as compatibility projections.

## Current authorities and compatibility paths

### XP

- `src/core/data.js`
  - initializes `myXP` from unscoped `localStorage['fam_myxp_v1']` with a demo/default fallback;
  - initializes partner XP from `fam_partnerxp_v1`;
  - exposes global level threshold helpers.
- `src/modules/achievements/achievements.js`
  - owns the legacy `awardXP(amount,label)` implementation;
  - directly increments global `myXP` and persists `fam_myxp_v1`;
  - `checkAchievements()` also increments `myXP` directly for badge XP rather than routing through `awardXP()`.
- `src/core/progressionUidBridge.js` v2.0
  - binds `families/{householdId}/members/{uid}/xp`;
  - mirrors remote XP into `window.myXP` and the unscoped localStorage key;
  - if remote XP is missing, seeds it from the browser's current global XP;
  - wraps `awardXP()` and increments the member XP field after the legacy local mutation.
- `src/core/legacyXpOverwriteGuard.js`
  - deliberately prevents the old whole-household sync path from writing XP back over newer XP behavior.
- `src/modules/tasks/duoQuests.js`
  - still contains legacy member-XP sync/wrapper code, although its bulk XP write is neutralized by the overwrite guard.

Conclusion: Firebase member `xp` is currently a mirror/bridge target, while local/global state still participates as authority.

### Achievements

- `src/modules/achievements/achievements.js`
  - owns `BADGES`, `unlockedBadges`, `newBadges` and the legacy rule checks;
  - mutates `myXP` directly when a badge unlocks.
- `src/modules/achievements/achievementUidBridge.js`
  - stores achievements at `families/{householdId}/members/{uid}/achievements`;
  - detects the XP delta created by legacy `checkAchievements()` and increments member XP;
  - writes each unlocked badge separately from the XP increment;
  - merges remote achievement rows into the existing global object instead of replacing it.
- `src/modules/achievements/achievementsPremium.js`
  - is primarily presentation;
  - consumes `window.myXP`, `BADGES` and `window.unlockedBadges`;
  - can remain compatible if the future canonical store projects its state into those globals during migration.

Conclusion: achievement state and its XP reward are not atomic and can race across devices.

## Reward producers found in served/current code

The following logical events currently call or can call `awardXP()` and need deterministic event keys during STEP 9:

| Source | Current reward examples | Required idempotency key shape |
| --- | --- | --- |
| Tasks | one-off task complete; recurring task complete | `task:{taskId}`; `recurring:{id}:{occurrence}` |
| Party quests | quest completion | `partyQuest:{questId}` |
| Daily bonus | daily login claim | `daily:{YYYY-MM-DD}` |
| Achievements | badge unlock XP | `achievement:{badgeId}` |
| Skills | skill log -> account XP; weekly quest/ability bonuses | `skill:{log/eventId}`; `weeklyQuest:{week}:{questId}` |
| Feed | post created; like | `feedPost:{postId}`; `feedLike:{postId}` |
| Recipes | new recipe created | `recipe:{recipeId}` |
| Notes | new note created | `note:{noteId}` |
| Finance | savings transaction, goal created/reached, one-off income/edit actions | transaction/goal based keys, especially `savingsGoalReached:{goalId}` |
| Duo quest legacy | in-memory duo quest completion | stable duo quest + cycle/event key |

Important examples of current duplicate risk:

- a one-off task can be changed back to incomplete and completed again;
- a feed like can be removed and added again;
- daily bonus idempotency is browser-local only, so another device can claim again;
- a savings goal already at/above target can trigger goal-reached XP on later deposits if the reward layer has no one-time goal key;
- achievement unlock record and XP increment are separate writes, so two devices can both award the badge XP;
- party quest already has a Firebase transaction claim, but the claim and the later XP mutation are separate, creating a possible committed-claim/lost-XP failure window.

## Skills / adjacent progression

`src/modules/skills/skills.js` is a separate legacy progression subsystem:

- state is name-based (`Shane`, `Esra`) rather than UID-based;
- state is stored in unscoped `fam_skills_v1`;
- it contains demo starter XP when no local data exists;
- skill activity also awards account XP.

STEP 9 should at minimum route account-XP rewards from this subsystem through the canonical progression API. Full canonical skill-state migration can be separated if needed, but name-based skill state must not be mistaken for the new UID progression authority.

## Current runtime/wrapper shape

The served app currently stacks global wrappers around legacy functions:

`TaskRewardBridge -> ProgressionUidBridge -> duoQuests award wrapper -> achievements.js awardXP`

There are additional bridge/guard layers for achievement sync and legacy Firebase sync. This is fragile because correctness depends on script order and wrapper installation timing.

STEP 9 should move domain mutations behind a stable service contract instead of adding another global wrapper.

## Canonical STEP 9 data contract

Proposed authority path:

`families/{householdId}/members/{uid}/progression`

Initial schema:

```text
progression
  version: 1
  xp: number
  rewards
    {safeDeterministicKey}
      key: original deterministic key
      amount: number
      reason: string
      source: string
      sourceId: string|null
      awardedAt: server timestamp
  achievements
    {badgeId}
      unlocked: true
      xp: number
      unlockedAt: server timestamp
  migration
    source: legacy-member
    migratedAt: server timestamp
  updatedAt: server timestamp
```

### Required service semantics

- bind through `HouseholdContext`, not display-name or raw `fbFamilyId` ownership;
- one exact realtime listener with deterministic unsubscribe;
- clear the prior projection immediately on logout/account/household switch;
- reject stale callbacks using `HouseholdContext.capture()/isCurrent()`;
- `awardOnce(key, amount, metadata)` runs a Firebase transaction on the canonical progression root so reward claim + XP increment are atomic;
- `unlockAchievementOnce(...)` atomically records the achievement, its reward claim and XP increment;
- canonical snapshot replaces the `unlockedBadges` compatibility projection rather than merging it;
- browser `window.myXP` / `window.unlockedBadges` can temporarily remain projections for existing UI, but are not allowed to seed another user or household.

## Legacy migration rule

When canonical progression does not yet exist:

1. read only the active UID's legacy member data from the active household (`members/{uid}/xp` and `members/{uid}/achievements`);
2. transactionally create canonical progression once;
3. never seed canonical XP or achievements from unscoped localStorage/browser globals;
4. if the active member has no legacy progression, initialize at zero;
5. keep the legacy member fields available as compatibility data until the migration/cutover is verified, then retire their authority deliberately.

This preserves legitimate existing Firebase progression without allowing another account's browser cache to leak across identity boundaries.

## Security boundary

Current Firebase Rules allow an active member to update their own member record. That is sufficient for the STEP 9 client-side prototype foundation under `members/{uid}/progression`. Stronger anti-cheat/server-authoritative validation is a separate security hardening concern and must not cause an unapproved production Rules deployment during STEP 9.

## Recommended implementation order

1. Build and contract-test `ProgressionStore` with safe same-member migration, lifecycle clearing and idempotent transaction APIs.
2. Wire the store into runtime as the canonical read/projection owner.
3. Replace the current XP bridge/achievement bridge mutation behavior with compatibility adapters to `ProgressionStore`.
4. Migrate reward producers to deterministic event keys in small domain slices.
5. Retire legacy `myXP`/localStorage/member-XP authority after all served reward producers use the canonical API.
6. Run complete contract suite, fresh Vercel preview and real iPhone gate before closing STEP 9.
