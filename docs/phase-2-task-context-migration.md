# Fase 2 — Taken/Quests contextmigratie

Datum: 2026-08-15
Branch: `agent/household-context-foundation`
PR: #23

## Doel van deze tranche

Taken/Quests laten consumeren uit de centrale `HouseholdContext`-laag zonder een big-bang rewrite van bestaande taak-UI of Firebase-persistentie.

## Uitgevoerd

### TaskContextBoundary
Nieuwe `src/modules/tasks/taskContextBoundary.js` bewaakt alle publieke `TaskSharedData` mutaties:

- `create`
- `update`
- `remove`
- `requestHelp`
- `joinHelp`
- `leaveHelp`
- `retractHelp`

Voor iedere mutatie:

1. `HouseholdContext.requireUser()` bepaalt de UID.
2. `HouseholdContext.requireHousehold()` bepaalt de household scope.
3. De `{uid, householdId}` context wordt gecaptured.
4. Voor de mutatie wordt gecontroleerd of de context nog actueel is.
5. Na de async mutatie wordt opnieuw gecontroleerd of de context nog actueel is.
6. Een account- of household-switch tijdens de operatie resulteert in `TASK_CONTEXT_CHANGED`.

Hierdoor kan een taakactie die onder Household Alpha is gestart niet stilzwijgend als Household Beta worden afgerond.

### Task create readiness v3
`taskCreateReadinessFix.js` gebruikt niet langer een eigen identity/household resolver.

Verwijderd uit de create-readinessflow:

- directe `fbUser` resolutie;
- directe `fbFamilyId` resolutie;
- eigen Firebase `onAuthStateChanged` wachtlogica;
- fallback naar `FamilyHousehold.resolve()`;
- losse household-change event race-resolutie.

De flow wacht nu uitsluitend op `HouseholdContext` met een geldige `ready` context.

## Automatische tests

### `tests/task-context-boundary.test.js`
Simuleert:

1. Alpha user + Alpha household;
2. start async taakmutatie;
3. wissel naar Beta user + Beta household terwijl de mutatie in flight is;
4. oude operatie wordt afgewezen met `TASK_CONTEXT_CHANGED`;
5. mutatie zonder household wordt geblokkeerd voordat de onderliggende taakfunctie start.

### `tests/task-context-adoption.test.js`
Contracttest die bewaakt dat:

- create-readiness `HouseholdContext` gebruikt;
- create-readiness geen `fbUser` gebruikt;
- create-readiness geen `fbFamilyId` gebruikt;
- create-readiness geen `FamilyHousehold.resolve()` gebruikt;
- `TaskContextBoundary` UID + household assertions bevat;
- de juiste runtimeversies worden geladen.

## Nog niet gemigreerd binnen Taken/Quests

Deze tranche maakt de publieke taakmutatiegrens veilig, maar `TaskSharedData` bevat intern nog legacy compatibility-code die later gericht wordt verwijderd:

- enkele directe `window.fbFamilyId` checks in legacy sync/guard code;
- legacy root-family listener voor compatibility projection;
- naam → UID mapping uitsluitend voor migratie van oude task records;
- oude `syncToFirebase` compatibility voor shop/calendar/recur data;
- `PartyQuestInvites` bouwt zijn Firebase refs nog direct op uit household globals.

Deze onderdelen moeten niet in één keer worden herschreven. De volgende taaktranche is `PartyQuestInvites` en daarna het uitfaseren van de legacy root-sync in `TaskSharedData`.

## Status

🟡 Taken/Quests migratie gestart en mutation boundary gehard.

Niet gereed zolang de resterende interne legacy contextpaden en Party Quest storage nog niet via de centrale context/data-contractlaag lopen.
