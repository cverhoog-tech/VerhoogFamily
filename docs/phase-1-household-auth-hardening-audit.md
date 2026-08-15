# Fase 1 — Household/Auth Hardening Audit

Datum: 2026-08-15
Status: gestart — blockers gevonden, codefixes nog niet gepubliceerd

## Scope
Deze audit toetst de actuele `main` op de Fase-1-eisen uit `MULTI-HOUSEHOLD-PRODUCTION-READINESS.md`: household-isolatie bij login/logout/account-switch, membership-validatie, listener cleanup, presence lifecycle en cache/runtime state.

## Belangrijkste bevindingen

### 🔴 1. Legacy family realtime listener wordt niet losgekoppeld bij logout
`startFirebaseSync()` maakt een `ref.on('value', ...)` op `families/{fbFamilyId}`, maar bewaart de ref/handler niet. `logoutUser()` zet alleen `_fbSyncActive=false`; er wordt geen `.off()` uitgevoerd.

Risico:
- oude household-listener blijft actief na logout;
- bij account-switch kan daarna óók een listener voor het nieuwe household worden gekoppeld;
- de oude listener kan globale arrays zoals `taskData`, `shopData` en `calData` blijven muteren;
- dit is een echte cross-household runtime-isolatieblocker op gedeelde browsers/toestellen.

Vereiste fix:
- centrale `stopFirebaseSync()`;
- actieve ref + handler bewaren;
- `.off('value', handler)` vóór logout, auth-switch en household-switch;
- sync-context aan UID + householdId binden;
- callback negeren als context inmiddels gewijzigd is.

### 🔴 2. Household identity bridge blijft attached als auth/household verdwijnt
`HouseholdIdentityFirebaseBridge.sync()` doet niets wanneer user of household ontbreekt, maar roept dan geen `detach()` aan. Bestaande `membersRef`/`presenceRef` en in-memory memberdata kunnen daardoor blijven bestaan nadat auth-context wegvalt.

Vereiste fix:
- `sync()` moet bij ontbrekende/mismatchende context expliciet `detach()` uitvoeren;
- auth-state/household-context events moeten detach/reattach afdwingen;
- subscribers mogen na logout geen oude memberlijst terugkrijgen.

### 🔴 3. Presence lifecycle heeft geen echte stop/cleanup
`startPresence()` voegt telkens een listener toe op `.info/connected`, maar bewaart die connected-ref/handler niet. `presenceRef.off()` verwijdert die listener niet, omdat deze op een andere ref staat.

Risico:
- meerdere connected listeners stapelen zich op;
- oude presence-context kan na household/account-switch opnieuw schrijven;
- presence van oude UID/household kan onjuist blijven of opnieuw geactiveerd worden.

Vereiste fix:
- `connectedRef` + handler bewaren;
- `stopPresence()` toevoegen;
- onDisconnect waar mogelijk annuleren/herzetten;
- huidige presence expliciet offline zetten vóór contextwissel wanneer toegestaan;
- logout/auth change koppelen aan `stopPresence()`.

### 🔴 4. `resolveHousehold()` valideert active membership niet expliciet vóór activation
De flow leest `users/{uid}` en gebruikt `activeHouseholdId || familyId`, waarna `ensureLegacyMembership()` draait en vervolgens globals/presence worden gestart. Er is geen expliciete `member.status === 'active'` gate vóór `setGlobals()`.

Risico:
- stale user pointers naar een verwijderd/inactief household worden niet schoon afgehandeld;
- removed-member scenario kan in permission errors of stale cached UI eindigen in plaats van gecontroleerde re-onboarding;
- legacy recovery en normale production membership-validatie lopen door elkaar.

Vereiste fix:
- membershiprecord expliciet valideren;
- alleen `status: active` accepteert household activation;
- stale `activeHouseholdId` veilig verwijderen wanneer membership ongeldig is;
- verwijderd lid niet automatisch opnieuw activeren;
- legacy migration alleen via een expliciet, afgebakend migratiepad.

### 🟠 5. Globale profiel-localStorage kan account-switch state mengen
`familyapp-profile-name-v1` en `familyapp-current-user-avatar-v1` zijn niet UID-scoped. Auth/profile bridges lezen en schrijven deze globale keys.

Risico:
- een tweede account op hetzelfde toestel kan tijdelijk naam/avatar van de vorige gebruiker erven;
- vooral accounts zonder eigen displayName/photo zijn gevoelig voor legacy fallback;
- nieuw memberRecord kan lokale legacy-profieldata als fallback gebruiken.

Vereiste fix:
- authenticated profile cache UID-scopen, bijvoorbeeld `familyapp-profile:{uid}:...`;
- globale keys alleen als eenmalige legacy migration bron gebruiken;
- na migration nooit meer als authority/fallback voor een andere UID gebruiken.

### 🟠 6. Oude auth/family code bestaat nog naast HouseholdPlatform overrides
`duoQuests.js` bevat nog legacy `setupNewFamily()`, `loadUserFamily()`, `startFirebaseSync()` en auth-state-logica. `householdPlatform.js` vervangt enkele functies later via runtime overrides.

Risico:
- load-order/race afhankelijk gedrag;
- twee architecturen blijven tegelijk actief;
- moeilijk aantoonbaar dat iedere auth-route dezelfde household-validatie gebruikt.

Vereiste fix:
- HouseholdPlatform/HouseholdContext wordt de enige identity-authority;
- legacy functies reduceren tot expliciete compatibility wrappers of verwijderen zodra callers gemigreerd zijn;
- één auth-state lifecycle orchestrator.

## Reeds sterke basis

- Family data is in Security Rules membership-gated.
- Private user data is UID-gated.
- FamilyDataStore cachekeys zijn voor shared data family-scoped en voor private data UID-scoped.
- Pending writes bewaren oorspronkelijke UID/familyId en flushen niet zomaar naar een andere context.
- HouseholdIdentityFirebaseBridge heeft al een bruikbare `detach()` functie; lifecycle moet hem alleen betrouwbaar aanroepen.

## Eerste implementatiepakket

1. `HouseholdSession`/lifecycle cleanup helper introduceren of lifecycle-functies centraliseren.
2. `stopFirebaseSync()` toevoegen aan legacy sync en context guard toevoegen aan callbacks.
3. `stopPresence()` toevoegen aan HouseholdPlatform.
4. `HouseholdIdentityFirebaseBridge.sync()` laten detachen wanneer context ontbreekt/wijzigt.
5. `resolveHousehold()` active-membership gate + stale-pointer handling geven.
6. UID-scoped profielcache introduceren met eenmalige legacy migration.
7. Auth-state listener bij logout/account switch alle household-runtime state laten resetten.
8. Daarna tests uitvoeren voor A→logout→B op hetzelfde toestel en removed-member relogin.

## Definition of Done voor Fase 1

Nog niet gehaald. Fase 1 wordt pas ✅ wanneer minimaal drie onafhankelijke test-households auth/join/logout/relogin kunnen doorlopen en account-switch, removed-member, offline/reconnect en listener cleanup aantoonbaar geen cross-household runtime- of datatoegang opleveren.

## Toolingnotitie
De audit is uitgevoerd op de actuele GitHub `main`. De lokale omgeving bevat momenteel geen `gh` CLI, waardoor de normale branch/commit/push/PR workflow uit de GitHub publish-skill niet veilig kan worden uitgevoerd. Daarom zijn in deze stap alleen analyse en documentatie naar de repo gepubliceerd; codefixes zijn nog niet als fasebranch/PR gepubliceerd.
