# FamilyApp - Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **01-09-2026**
Branch: `agent/household-rebuild-v2`

Deze statuspagina is de compacte actuele uitvoeringsbron naast:

- `FamilyApp-Schoonmaken-module-architectuur.md` - canonieke functionele/technische architectuur;
- `FamilyApp-Schoonmaken-visual-spec.md` - canonieke visuele eindrichting;
- `FamilyApp-Schoonmaken-milestone-log.md` - geaccepteerde grote milestones en regressielog;
- `FamilyApp-TODO-updated.txt` - brede FamilyApp-TODO, waarvan het Schoonmaken-gedeelte historisch achterloopt op deze status.

## Laatst real-device geaccepteerde checkpoint

- Status: **WERKEND / GEACCEPTEERD OP IPHONE**.
- Commit: `ea843a64f46899d63a7bb64d4adf2b5b7160e2da`.
- Preview: `https://verhoog-family-gkjbqbmqu-cverhoog-techs-projects.vercel.app`.
- `main`: niet gewijzigd.

## Fase-status

- Fase A - veilige module-shell: **AFGEROND / real-device geaccepteerd**.
- Fase 0 - architectuur/repository-fundament: **BEZIG**.
- Fase 1 - Kamers + routines: **BEZIG; milestone Kamers + Routines Foundation afgerond**.
- Fase 2 - Weekplanner: **OPEN; eerstvolgende grote functionele milestone**.
- Fase 3 - Taken-integratie: **OPEN**.
- Fase 4 - Agenda-integratie: **OPEN**.
- Fase 5 - Boodschappen / voorraad: **OPEN**.
- Fase 6 - Goedkeuring / notificaties: **OPEN**.
- Fase 7 - Historie / uitzonderingen: **OPEN**.
- Fase 8 - Visuele polish / slimme inzichten: **OPEN**.

## Afgerond en real-device geverifieerd

### Shell

- Meer -> Schoonmaken navigatie.
- Overzicht / Planning / Kamers.
- Kamers / Gepland per kamer.
- Lazy-loaded module met module-scoped CSS.

### Repository / household

- `CleaningHouseholdRepository` leest realtime het cleaning-aggregate onder het actieve HouseholdContext.
- Bind/unbind/revision lifecycle aanwezig.
- Firebase-root: `families/{householdId}/cleaning`.
- Cleaning valt onder de bestaande household-shared-data Firebase rules voor actieve household members.

### Kamers

- Aanmaken.
- Bewerken.
- Soft-delete met behoud van historie/referenties.
- Realtime Firebase echo en persistentie op iPhone geverifieerd.

### Routines

- Meerdere routines per kamer.
- Canonieke relatie uitsluitend via `CleaningRoutineItem.roomId`.
- Titel, interval, geschatte minuten en prioriteit Basis / Normaal / Extra.
- Aanmaken, bewerken en soft-delete.
- iOS numeric-validatie gefixt: 1 t/m 480 hele minuten, inclusief 10 minuten.
- Realtime Firebase echo en persistentie op iPhone geverifieerd.

### Kamertype-suggesties

- Statische editable presets per kamertype.
- Eén tik maakt een gewone canonical routine aan.
- Na toevoegen verdwijnt de suggestie op basis van realtime data.
- Na routine-delete wordt de preset opnieuw beschikbaar.
- Eigen routine blijft altijd mogelijk.

## Bewust nog niet afgerond

### Fase 0 technische schuld

- `CleaningDomain.basePath()` gebruikt nog `safeId()`; household-key-validatie moet later afzonderlijk en veilig worden gehard.
- `createRoom` en `createRoutineItem` gebruiken nog Firebase `push()`; volledige retry-idempotency is nog niet opgelost.
- Contracttests voor household-isolatie, lifecycle en idempotentie ontbreken nog.
- Een eerdere gecombineerde hardening-poging veroorzaakte door een afgekapt `cleaningDomain.js` een leeg scherm en is expliciet afgekeurd. Zie milestone-log.

### Fase 1 resterend

- Benodigdheden koppelen aan routine-items.
- Persoonlijke weergavevoorkeur Tijd / Aantal / Beide.
- Eventuele pause/nextDue semantics pas definiëren wanneer planner-contract dat nodig heeft.

### UI/polish schuld

- Huidige UI is functionele fundering, niet het definitieve design.
- Kleine acties/tap-targets moeten minimaal 44x44 worden.
- Emoji's zijn placeholders; uiteindelijke kamerkaarten volgen de canonieke premium visual spec.

## Eerstvolgende grote milestone - Weekplanner Foundation

De eerstvolgende milestone bouwt geen Task/Agenda-projecties, maar legt eerst de canonieke planninglaag vast:

1. due-semantiek voor routines definiëren;
2. bepalen welke routine-items deze week aandacht vragen;
3. routine-items per kamer bundelen tot één conceptuele `CleaningOccurrence`/checklist;
4. geschatte kamerbelasting berekenen;
5. household members en verdelingscontract vastleggen;
6. een conceptweekplan genereren zonder direct Taken of Agenda te schrijven;
7. conceptplan realtime tonen in Planning;
8. pas na real-device acceptatie doorgaan naar persoonlijke goedkeuring en projecties.

## Guardrail voor vervolgchats

- Begin vanaf de actuele branch, maar behandel `ea843a64f46899d63a7bb64d4adf2b5b7160e2da` als de laatst door de gebruiker real-device geaccepteerde functionele checkpoint vóór documentatie-only commits.
- `main` niet aanraken zonder expliciete acceptatie.
- Geen grote full-file rewrites voor kleine hardeningwijzigingen.
- Nieuwe functionele writes in microstappen implementeren en iedere stap via unieke Vercel-preview op iPhone laten accepteren.
- `CleaningOccurrence` blijft de enige source of truth voor één concrete schoonmaakbeurt; Taken en Agenda worden later alleen projecties/referenties.
