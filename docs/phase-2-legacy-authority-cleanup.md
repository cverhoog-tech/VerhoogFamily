# Phase 17 — Legacy localStorage & direct-write cleanup

Status: 🟡 architecture/runtime cleanup substantially advanced; remaining source-level legacy and live acceptance are deferred.

## Scope of this pass

This pass removes active runtime authority from compatibility code that predates HouseholdContext and the canonical domain stores.

### Profile and avatar

- `ProfileContextService` remains authoritative for the current member profile.
- `avatarStore.js` no longer maps household identity by names such as Shane/Esra.
- Avatar writes go through `ProfileContextService.updateAvatar(...)`.
- Avatar preference metadata uses UID-scoped `familyapp-profile-v2:{uid}:...` keys.
- `avatarIdentityBridge.js` is presentation-only and contains no localStorage or Firebase identity writes.
- Profile save is intercepted before the legacy handler can write global identity keys.
- Partner name is presentation/read-only household member information, not a second local identity authority.

### Retired runtime authorities

`legacyAuthorityRetirement.js` disables the legacy family-root read/write symbols after HouseholdContext becomes available:

- `startFirebaseSync()` no longer rehydrates migrated domains from `/families/{householdId}` root snapshots.
- `syncToFirebase()` no longer writes global task/shop/calendar/progression projections back to the family root.
- any already attached legacy family-root listener is detached through `HouseholdSessionHardening.stopFirebaseSync()`.

Canonical services remain responsible for Tasks, Shopping, Calendar, Finance, Feed, Notifications, Progression, Recipes, Meals and related state.

### Obsolete XP guard

`src/core/legacyXpOverwriteGuard.js` was deleted and removed from the runtime loader. It existed only to make an older direct-write model less dangerous; once the direct-write model is retired, the guard itself becomes dead architecture.

### Global identity keys

After a valid HouseholdContext exists, the runtime removes these old global v1 identity mirrors:

- `familyapp-profile-name-v1`
- `familyapp-partner-name-v1`
- `familyapp-current-user-avatar-v1`
- `familyapp-current-user-avatar-id-v1`

UID-scoped profile-v2 compatibility/cache values may remain where needed.

## Automated evidence

- `tests/legacy-authority-retirement.test.js`
- `tests/legacy-cleanup-adoption.test.js`
- `.github/workflows/legacy-authority-cleanup.yml`

The existing household contract workflow also runs because this pass changes profile/runtime loader code.

## Preview validation

A fresh Vercel preview should be built from the current branch head before live acceptance so a partially deployed Phase 17 intermediate commit is never used as release evidence.

## Deliberate residual compatibility

Phase 17 stays 🟡 because source-level legacy is not yet zero:

1. `duoQuests.js` still contains old auth/setup/root-sync source code. Runtime household loading is superseded by Phase 1 hardening and migrated root authority is retired after boot, but the source should ultimately be decomposed.
2. `skills.js` still contains Shane/Esra/localStorage demo-era source. `SkillsProgressionBridge` replaces its persistence and current-user data at runtime. A later source cleanup can simplify the renderer without changing progression authority.
3. `householdSessionHardening.js` still contains the old family-root projection implementation for compatibility. `legacyAuthorityRetirement.js` disables that active root authority. Removing the implementation itself should happen together with legacy auth/onboarding decomposition so Phase 1 bootstrap behavior is not destabilized.
4. Legacy onboarding still exposes partner-name-era fields and old local mirrors in source. Functional household membership is not based on them, but the onboarding UI should be modernized separately.
5. Recurrence (`recurData`) has not yet been given its own canonical store. This cleanup therefore does not pretend recurrence is migrated.
6. Preference-only localStorage remains valid for device/UI settings such as theme, UI scale and similar non-domain state.

## Definition of the next cleanup pass

Before marking Phase 17 ✅:

- decompose legacy auth/onboarding out of `duoQuests.js`;
- migrate recurrence ownership;
- remove source-level Shane/Esra skills compatibility;
- remove remaining global identity mirrors from bootstrap code rather than only retiring them at runtime;
- inventory every remaining localStorage key as preference/cache/migration/invalid authority;
- prove browser/PWA account-switch behavior on real devices.
