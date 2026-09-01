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
- Commit: `bd282e8b8a48929e296b982d10fb99955b0eec62`.
- Preview: `https://verhoog-family-k6sz7rwri-cverhoog-techs-projects.vercel.app`.
- `main`: niet gewijzigd.

## Fase-status

- Fase A - veilige module-shell: **AFGEROND / real-device geaccepteerd**.
- Fase 0 - architectuur/repository-fundament: **BEZIG**.
- Fase 1 - Kamers + routines: **BEZIG; milestone Kamers + Routines Foundation afgerond**.
- Fase 2 - Weekplanner: **BEZIG; pure conceptgeneratie real-device geaccepteerd, persistente conceptplanning + realtime Planning-UI ter acceptatie**.
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

### Weekplanner - pure contractlaag

- Halfopen weekvenster, due-semantiek, weekselectie en uitsluitingsredenen.
- Routines van dezelfde actieve kamer worden één immutable conceptuele checklist.
- Geschatte minuten worden exact per kamerbundel en voor het hele plan opgeteld.
- Actieve householdleden komen uitsluitend uit de canonieke identity bridge en worden via UID gebruikt.
- `FAIR_TIME` verdeelt standaard deterministisch op geschatte tijd.
- Eén immutable `DRAFT`-conceptweekplan zonder Firebase-write of Taken-/Agenda-projectie.

## Bewust nog niet afgerond

### Fase 0 technische schuld

- `CleaningDomain.basePath()` gebruikt nog `safeId()`; household-key-validatie moet later afzonderlijk en veilig worden gehard.
- `createRoom` en `createRoutineItem` gebruiken nog Firebase `push()`; volledige retry-idempotency is nog niet opgelost.
- Gerichte planner-persistence/idempotentietests zijn aanwezig; brede contracttests voor household-isolatie, lifecycle en create-idempotentie van kamer/routine ontbreken nog.
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

1. due-semantiek voor routines definiëren - **GEACCEPTEERD OP IPHONE (`aae3e157`)**;
2. bepalen welke routine-items deze week aandacht vragen - **GEACCEPTEERD OP IPHONE (`ac39b48a`)**;
3. routine-items per kamer bundelen tot één conceptuele `CleaningOccurrence`/checklist - **GEACCEPTEERD OP IPHONE (`452143aa`)**;
4. geschatte kamerbelasting berekenen - **GEACCEPTEERD OP IPHONE (`452143aa`)**;
5. actieve household members en verdelingscontract vastleggen - **GEACCEPTEERD OP IPHONE (`6e0de551`)**;
6. standaard eerlijk verdelen op geschatte tijd - **GEACCEPTEERD OP IPHONE (`6e0de551`)**;
7. een conceptweekplan genereren zonder direct Taken of Agenda te schrijven - **GEACCEPTEERD OP IPHONE (`bd282e8`)**;
8. conceptplan atomair opslaan en realtime tonen in Planning - **GEÏMPLEMENTEERD; acceptatie open**;
9. nog geen Taken- of Agenda-items aanmaken - **GEBORGD IN CONTRACT EN UI; acceptatie open**;
10. pas na real-device acceptatie doorgaan naar persoonlijke goedkeuring en projecties.

### Actuele checkpoint binnen Weekplanner Foundation

- Pure `CleaningPlannerContract` toegevoegd; geen Firebase-, Taken-, Agenda- of UI-writes.
- Halfopen weekvenster voorkomt overlap tussen aangrenzende weken.
- Inactief, gepauzeerd en ontbrekende `roomId` worden expliciet uitgesloten.
- Due-bronvolgorde: `nextDueAt`, fallback `lastCompletedAt + intervalDays`, eerste keer via `createdAt` of vensterstart.
- Overdue en binnen het weekvenster zijn de enige due-kandidaten.
- Contracttest dekt grenzen, fallbacks en uitsluitingen.
- Weekkandidatenselector toegevoegd bovenop dezelfde pure contractlaag.
- Alleen routines met een bestaande actieve kamer worden geselecteerd; routines van soft-deleted kamers worden uitgesloten.
- Kandidaten worden stabiel gesorteerd op due-moment, prioriteit en routine-ID.
- Kandidaten worden per kamer tot één immutable conceptuele checklist gebundeld.
- Totale geschatte minuten zijn exact de som van de gebundelde routine-items.
- Actieve householdleden worden uitsluitend via hun canonieke UID geselecteerd.
- `FAIR_TIME` verdeelt grootste kamerbundels eerst naar de laagste minutenbelasting.
- Eén kamerbundel blijft één ondeelbare voorgestelde toewijzing.
- De geaccepteerde plannerstappen worden nu puur samengevoegd tot één immutable `DRAFT`-conceptweekplan.
- Iedere kamerbundel wordt één tijdelijke `occurrenceDraft` met checklist, belasting en voorgestelde UID.
- Conceptdrafts hebben nog geen plan-/occurrence-ID, planningstijd, approval-record of projectie.
- Plansamenvatting en uitsluitingsdiagnostiek worden deterministisch uit dezelfde snapshots afgeleid.
- De nieuwe persistence-grens kent stabiele week- en kamer-ID's toe en schrijft `CleaningPlan` plus `CleaningOccurrence` atomair onder dezelfde cleaning-root.
- `CleaningPlan` bewaart alleen occurrence-referenties en afgeleide samenvatting; checklist, due-data en voorgestelde assignment staan canoniek op `CleaningOccurrence`.
- Opnieuw berekenen is alleen toegestaan zolang plan en occurrences `DRAFT` zijn; retries maken geen duplicaten en vervallen draft-occurrences worden atomair `CANCELLED`.
- Planning toont het concept realtime met weektotalen, householdverdeling en kamerchecklists en schrijft uitsluitend via `CleaningHouseholdRepository`.
- De huidige weekgrens gebruikt de lokale kalender van het device; een expliciet household-timezonecontract volgt vóór automatische scheduling/completion.
- Er worden nog geen approval-, Taken- of Agenda-records gemaakt.

## Guardrail voor vervolgchats

- Begin vanaf de actuele branch, maar behandel `bd282e8b8a48929e296b982d10fb99955b0eec62` als de laatst door de gebruiker real-device geaccepteerde functionele checkpoint.
- `main` niet aanraken zonder expliciete acceptatie.
- Geen grote full-file rewrites voor kleine hardeningwijzigingen.
- Nieuwe functionele writes in afzonderlijk testbare checkpoints implementeren en iedere stap via unieke Vercel-preview op iPhone laten accepteren; samenhangende verticale checkpoints mogen groter wanneer dat expliciet is afgesproken.
- `CleaningOccurrence` blijft de enige source of truth voor één concrete schoonmaakbeurt; Taken en Agenda worden later alleen projecties/referenties.
