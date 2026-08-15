# Person Dashboard foundation

Status: foundation v1

## Goal

The Taken > Persoon screen becomes a UID-first read model. UI code must not infer household identity, task ownership, progression or achievements from display names.

## Authoritative sources

### Household identity + presence

Source: Firebase via `HouseholdIdentityFirebaseBridge`.

- `families/{householdId}/members/{uid}`
- `families/{householdId}/presence/{uid}`

Normalized identity fields used by the dashboard:

- `uid`
- `displayName`
- `avatar`
- `role`
- `online`
- `lastSeen`
- `area`

### Progression

Source: Firebase member record.

- `families/{householdId}/members/{uid}/xp`

The existing `ProgressionUidBridge` remains responsible for mirroring the current signed-in user's XP into legacy globals. `PersonDashboardService` reads every member's XP directly from the Firebase member records so viewing another member does not depend on `myXP`.

### Tasks

Authoritative shared source: `TaskSharedData` / Firebase shared tasks.

Participation is resolved exclusively from UID fields:

- creator: `createdByUid` / `ownerUid`
- assignee: `assignedToUids[uid]` / `assignedToUid`
- helper: `helpers[].uid|memberId|id`

Display names are not used to decide participation.

### Achievements

Source: member records in Firebase.

- `families/{householdId}/members/{uid}/achievements/{achievementId}`

The existing achievement bridge still handles the signed-in user's unlock side effects. The dashboard read model may display achievements for any household member from Firebase.

## PersonDashboardService contract

`src/modules/tasks/personDashboardService.js`

Public API:

- `PersonDashboardService.getMembers()`
- `PersonDashboardService.get(uid)`
- `PersonDashboardService.subscribe(callback)`
- `PersonDashboardService.refresh()`
- `PersonDashboardService.status()`

Per-member view model:

```text
uid
member
  uid
  displayName
  avatar
  initials
  role
  isCurrent
presence
  state
  online
  lastSeen
  area
progression
  xp
  level
  title
  previousLevelXp
  nextLevelXp
  streak
quests
  active[]
  activeCount
  completedCount
  completedThisWeek
  earnedXpThisWeek
achievements
  unlocked[]
  recent[]
  total
activity
  recent[]
capabilities
  identity
  presence
  progression
  quests
  achievements
  streak
  activity
```

## Presence states

The service exposes a presentation-neutral state:

- `online`: Firebase presence says online
- `recent`: offline, last seen <= 15 minutes
- `today`: offline, last seen <= 24 hours
- `offline`: older or unknown

The renderer is responsible for labels such as `Online · Taken` or `12 min geleden actief`.

## Deliberately not guessed

### Streak

Current streak data is still name-oriented legacy state. The service currently returns:

- `progression.streak = null`
- `capabilities.streak = false`

Do not reintroduce name matching in the new renderer. Streak must first receive a UID-backed source.

### Activity timeline

The current local `HouseholdRepository.activity` is a legacy compatibility collection and is not a safe cross-device household event source. The service currently returns:

- `activity.recent = []`
- `capabilities.activity = false`

The intended scalable source is a Firebase household event stream, for example:

`families/{householdId}/activity/{eventId}`

with a minimum contract:

```text
id
actorUid
type
entityType
entityId
timestamp
metadata
```

The Person screen should consume that stream only after event producers are centralized.

## Migration rule for personTabPremium.js

The renderer should become a pure consumer of `PersonDashboardService` and stop doing the following itself:

- reading `fam_tasks_v023` / `fam_tasks_v022`
- matching `assignedTo` against a member name
- using `myXP` for the selected member
- computing another member's progression from legacy globals
- reading streak by name

Until the renderer migration is complete, the new service can live next to the existing screen without changing current behavior.

## Next implementation phase

1. Load `personDashboardService.js` before `personTabPremium.js`.
2. Refactor `personTabPremium.js` to render from the service view model.
3. Preserve the existing working member selector and presence behavior.
4. Add the new information hierarchy: hero, adventure stats, active quests, progression, achievements, recent activity.
5. Keep unsupported modules hidden or explicitly unavailable instead of fabricating values.
6. Add UID-backed streak data.
7. Add centralized Firebase activity events and enable the activity section.
