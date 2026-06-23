# FamilyApp — Family RPG Systems Architecture

## Doel

FamilyApp groeit van losse premium schermen naar een samenhangend Family RPG OS.

Deze architectuur voorkomt spaghetti door alle gameplay-systemen te koppelen aan centrale engines in plaats van losse UI-logica per scherm.

---

# Kernprincipe

Niet bouwen als losse systemen:

```txt
tasks
groupQuests
weeklyQuests
mainQuests
journeys
abilities
challenges
```

Maar als één gedeelde gameplay-laag:

```txt
Quest Engine
Journey Engine
Party Engine
Ability Engine
Reward Engine
Challenge Engine
Progression Engine
Activity Engine
Avatar Engine
```

Alle schermen lezen uit deze centrale systemen.

---

# 1. Quest Engine

## Verantwoordelijk voor

* quests aanmaken
* quests wijzigen
* quests voltooien
* subtaken beheren
* solo quest omzetten naar group quest
* recurring quest beheren
* quest progress berekenen
* quest status bijhouden

## Quest types

```js
questType: "task" | "daily" | "weekly" | "monthly" | "yearly" | "main" | "goal" | "seasonal"
partyType: "solo" | "duo" | "group" | "family"
```

## Quest object

```js
quest = {
  id,
  title,
  description,
  questType,
  partyType,
  status,
  ownerId,
  assignedMemberIds,
  invitedMemberIds,
  acceptedMemberIds,
  declinedMemberIds,
  helpRequested,
  steps,
  rewards,
  abilitiesApplied,
  challengeModifiers,
  recurrence,
  journeyId,
  chapterId,
  background,
  createdAt,
  updatedAt
}
```

## Belangrijke regel

Een group quest is geen apart los object naast een normale quest.

Een bestaande quest moet kunnen veranderen van:

```js
partyType: "solo"
```

naar:

```js
partyType: "group"
helpRequested: true
invitedMemberIds: [...]
acceptedMemberIds: [...]
```

Daarna moet dezelfde quest zichtbaar zijn in:

* Taken overzicht
* Group tab
* Journeys
* Family HQ
* Activity log

---

# 2. Journey Engine

## Doel

Journeys vervangen het oude idee van alleen recurring tasks.

Journeys zijn containers voor:

* daily routines
* weekly resets
* main quests
* bucketlists
* relationship quests
* seasonal events
* life goals

## Journey types

```js
journeyType: "daily" | "weekly" | "main" | "goal" | "seasonal"
```

## Journey object

```js
journey = {
  id,
  type,
  title,
  description,
  chapters,
  milestones,
  questIds,
  participants,
  rewards,
  progress,
  season,
  background,
  createdAt,
  updatedAt
}
```

## Main Quest examples

* Word fitter
* Plan romantische date night
* Disneyland bezoeken
* Nieuwe woning organiseren
* Bucketlist afwerken

---

# 3. Party Engine

## Verantwoordelijk voor

* party aanmaken
* gezinsleden uitnodigen
* invite accepteren/weigeren
* join/leave flow
* contribution tracking
* shared XP berekenen
* party status beheren

## Party object

```js
party = {
  id,
  type,
  ownerId,
  questIds,
  members,
  invitedMembers,
  acceptedMembers,
  pendingMembers,
  sharedRewards,
  contributionMap,
  createdAt,
  updatedAt
}
```

## UI-regels

Quest cards moeten visueel tonen:

* party owner
* invited avatars
* accepted avatars
* pending avatars
* help requested status
* group quest badge
* contribution progress

---

# 4. Ability Engine

## Doel

Abilities moeten echte gameplay-impact hebben en nooit puur cosmetisch zijn.

Abilities mogen niet worden verwerkt als losse if-statements in UI-kaarten.

Niet:

```js
if (doubleXP) xp *= 2
```

Maar:

```js
AbilityEngine.applyEffects(quest, member)
```

## Ability object

```js
ability = {
  id,
  name,
  description,
  type,
  rarity,
  effectType,
  effectValue,
  cooldownHours,
  maxUses,
  charges,
  allowedQuestTypes,
  allowedPartyTypes,
  duration,
  unlockRequirement,
  icon
}
```

## Ability usage object

```js
abilityUse = {
  id,
  abilityId,
  userId,
  questId,
  effectType,
  effectValue,
  activatedAt,
  expiresAt,
  cooldownUntil
}
```

## Ability-regels

Abilities mogen:

* XP verhogen
* rewards boosten
* teamwork stimuleren
* streaks beschermen
* help calls versterken
* bonus rolls geven

Abilities mogen NIET:

* alle verantwoordelijkheden skippen
* oneindig uitstellen
* infinite XP farming mogelijk maken
* quests automatisch massaal voltooien

## Delay-regel

Geen enkele ability mag een taak langer dan 4 dagen uitstellen.

Maximaal:

```txt
24h–96h
```

afhankelijk van rarity, cooldown en quest importance.

## Voorbeeld abilities

### XP abilities

* Double XP
* Combo Bonus
* Team Multiplier

### Social abilities

* Call For Help
* Rally
* MVP Bonus

### Streak abilities

* Streak Shield
* Momentum
* Recovery

### Reward abilities

* Lucky Roll
* Treasure Hunter
* Bonus Chest

### Time abilities

* Delay 24h
* Delay 48h
* Delay 96h max
* Time Saver

---

# 5. Reward Engine

## Verantwoordelijk voor

* XP berekenen
* coins/gems berekenen
* reward modifiers toepassen
* ability effects toepassen
* group bonuses toepassen
* challenge rewards uitkeren
* unlocks triggeren

## Reward object

```js
reward = {
  id,
  type,
  amount,
  source,
  modifiers,
  claimed,
  claimedAt
}
```

## Belangrijke regel

XP/reward-logica mag niet verspreid zitten over:

* task cards
* group quest cards
* journey cards
* challenge cards

Alles loopt via Reward Engine.

---

# 6. Challenge Engine

## Doel

Weekly Family Challenges / PvP systeem voor vriendelijke competitie.

Niet toxisch, geen straffen, alleen leuke motivatie.

## Challenge object

```js
challenge = {
  id,
  type,
  title,
  description,
  season,
  startDate,
  endDate,
  leaderboard,
  rewards,
  modifiers,
  status
}
```

## Leaderboard entry

```js
leaderboardEntry = {
  memberId,
  score,
  rank,
  rewardsClaimed
}
```

## Challenge types

* meeste XP deze week
* meeste completed quests
* meeste group quest contributions
* cleaning clash
* streak battle
* parents vs kids
* teamwork challenge

## Engine verantwoordelijk voor

* wekelijkse rotatie
* auto-generated challenges
* leaderboard updates
* score calculation
* rewards uitdelen
* seasonal modifiers
* challenge reset

---

# 7. Progression Engine

## Verantwoordelijk voor

* XP
* levels
* streaks
* titles
* abilities
* achievements
* household level
* seasonal progress

## Waarom centraal?

Anders ontstaat dubbele logica in:

* Taken
* Group Quests
* Journeys
* Family HQ
* Challenges
* Achievements

---

# 8. Activity Engine

## Doel

Één centrale event source.

Alles logt events naar Activity Engine.

## Activity event

```js
activityEvent = {
  id,
  type,
  actorId,
  targetId,
  questId,
  journeyId,
  challengeId,
  abilityId,
  message,
  metadata,
  createdAt
}
```

## Voorbeelden

* quest completed
* group quest joined
* help requested
* ability used
* title unlocked
* challenge won
* journey milestone reached
* reward claimed

## Andere systemen lezen hiervan

* Feed
* Notifications
* Family HQ timeline
* Achievements
* Stats

---

# 9. Avatar Engine

## Doel

Eén centrale bron voor avatars.

Geen losse placeholders per module.

## Avatar usage

Avatars moeten consistent zijn in:

* profiel
* feed
* comments
* taken
* group quests
* quest popup cards
* notifications
* activity log
* Family HQ

## Helper richting

```js
AvatarEngine.getMemberAvatar(memberId)
```

Fallback mag initials gebruiken, maar echte gekozen profielavatar heeft altijd prioriteit.

---

# 10. Family HQ / Household Engine

## Doel

Het Familie-tabblad wordt Household HQ / Family RPG Hub.

## Tonen

* household level
* family XP
* members
* titles
* equipped abilities
* achievements
* goals
* active group quests
* funny insights
* activity timeline

---

# 11. UI-regels

## Premium feel behouden

Alle gameplay UI moet voelen als:

```txt
premium Family RPG experience
```

Niet als:

```txt
standaard checklist app
```

## Visuele eisen

* cinematic hero cards
* washed backgrounds
* readable overlays
* stacked avatars
* XP/reward glow
* glassmorphism
* smooth interactions
* geen horizontale overflow
* mobile-first spacing

---

# 12. Implementatievolgorde

## Stap 1 — Documenteren en stabiliseren

* deze architectuur vastleggen
* huidige group quest prototype behouden
* geen grote rewrite zonder testbare stappen

## Stap 2 — Unified quest model introduceren

* adapter maken tussen bestaande taskData en nieuwe quest objecten
* group quests koppelen aan overzicht
* bestaande taak kunnen omzetten naar group quest

## Stap 3 — Activity Engine toevoegen

* events loggen bij completion, join, invite, ability use

## Stap 4 — Avatar Engine toevoegen

* één avatar source voor alle kaarten

## Stap 5 — Ability Engine toevoegen

* abilities zichtbaar en bruikbaar maken op quest cards

## Stap 6 — Journeys bouwen

* Terugkerend hernoemen naar Journeys
* Daily / Weekly / Main / Goals / Seasonal

## Stap 7 — Challenge Engine bouwen

* weekly family challenges
* leaderboards
* rewards

---

# Belangrijke anti-spaghetti regel

UI mag geen gameplayregels bezitten.

UI toont data en triggert acties.

Engines bepalen:

* progress
* XP
* rewards
* ability effects
* challenge scores
* quest state
* activity events
