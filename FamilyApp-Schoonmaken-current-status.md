# FamilyApp - Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **06-09-2026**
Branch: `agent/household-rebuild-v2`
Roadmapstap: **STEP 14 - Schoonmaken**

Dit bestand is de compacte actuele waarheid voor nieuwe chats/agents. Historische geaccepteerde milestones blijven in `FamilyApp-Schoonmaken-milestone-log.md`; de functionele architectuur staat in `FamilyApp-Schoonmaken-module-architectuur.md` en de definitieve visuele richting in `FamilyApp-Schoonmaken-visual-spec.md`.

## Huidige status

**STEP 14 is FUNCTIONEEL EEN CLOSE-OUT KANDIDAAT.**

De functionele kern, integraties en technische hardening zijn gebouwd en CI-groen. De enige nieuwe laag die nog een gerichte real-device smoke nodig heeft voordat STEP 14 functioneel kan worden gesloten is de rol/capability-handhaving.

Laatste functionele kandidaat vóór documentatie-only commits:
`cabf639382be4f0bd5a8a2c540855b914dbedffa`

Validatie op deze kandidaat:
- Household Rebuild Contracts: **SUCCESS** — run `34000853880`.
- Vercel: **SUCCESS**.
- `scripts/test-cleaning-functional-closeout.js`: onderdeel van de groene suite.
- `scripts/test-cleaning-permissions.js`: onderdeel van de groene suite.
- `scripts/test-cleaning-runtime-reachability.js`: bewaakt nu **42** vereiste Cleaning-modules inclusief `cleaningPermissions.js`.
- `main`: **niet gewijzigd**.

## Reeds real-device geaccepteerde basis

### Runtime-wiring recovery
- Checkpoint: `c0e799fdcb3cb447d4bf6af7c9759073825bbc06`.
- Preview: `https://verhoog-family-nsbvodlso-cverhoog-techs-projects.vercel.app`.
- Datum: 05-09-2026.
- Status: **GEACCEPTEERD OP IPHONE**.

### Functionele eindfase vóór rolpolicy
De gebruiker heeft daarna op real device bevestigd dat de nieuwe functionele eindblokken werken, waaronder:
- Tijd / Aantal / Beide;
- expliciete incomplete-work keuzes;
- hulp aanvragen;
- tijdelijke beschikbaarheid / vakantie / drukke week / planningpauze;
- historie;
- reminders/notificaties;
- Cleaning → Shopping;
- overige toen geteste eindfasefunctionaliteit.

De Action Inbox is daarna eveneens expliciet real-device geaccepteerd:
- ✉️ Inbox = actionable verzoeken;
- 🔔 Meldingen = informatieve updates;
- geaccepteerde preview: `https://verhoog-family-ks84yij7s-cverhoog-techs-projects.vercel.app`;
- functionele Action Inbox contractcommit: `6fd4c0cefceca0e957800a71ca5614a983ec1ae3`.

## Functioneel afgerond in STEP 14

### Fundament / source of truth
- `families/{householdId}/cleaning` blijft de canonieke Cleaning-root.
- `CleaningOccurrence` is de enige canonieke waarheid voor een concrete schoonmaakbeurt.
- Taken en Agenda zijn derived projections.
- Reverse sync vanuit Taken/Agenda schrijft gecontroleerd terug naar Cleaning.
- Geen parent-`families/{householdId}` Cleaning-transacties.
- HouseholdContext guards beschermen tegen stale UID/household writes.
- Room/routine create-retries zijn idempotent gehard.

### Kamers en routines
- Kamers CRUD + veilige soft-delete.
- Kamervolgorde persistent.
- Routine-items met interval, minuten, prioriteit en templates.
- Routine CRUD + veilige soft-delete.
- Benodigdheden via `routine.supplyIds`.
- Routine zelf/ander toewijzen.
- Accept/decline/tegenvoorstel met consent.
- Fixed-person assignment blijft harde constraint.

### Planning
- Weekplanberekening en conceptplan.
- Persoonlijke approval.
- FAIR_TIME-verdeling.
- Doorlopende intervallen en rolling horizon.
- Planning-persoonsfilter zonder canonieke mutation.
- Tijd/Aantal/Beide als per-user preference.
- Actieve-plan reconciler houdt ook rekening met availability.

### Uitvoering / Taken / Agenda
- CleaningOccurrence projecteert naar Taken en Agenda.
- Checklist reverse sync.
- Afronden/heropenen + completionLogs.
- Datum/tijd reverse sync.
- Incomplete-work flow:
  - later deze week;
  - volgende normale beurt;
  - rest overslaan;
  - hulp vragen.
- Hulpverzoeken zijn vanuit Action Inbox te accepteren/afwijzen via dezelfde canonieke Cleaning-runtime.

### Availability / pauzes
- Ziek / tijdelijk niet beschikbaar.
- Drukke week.
- Vakantie.
- Planningpauze.
- Persoonlijke vaste routines gebruiken cadence-preserving pause/resume.
- Bestaand werk wordt nooit stil aan iemand anders overgedragen.
- Geen backlog van gemiste beurten na hervatten.

### Benodigdheden / voorraad / Boodschappen
- Voorraad: `IN_STOCK` / `LOW` / `OUT`.
- Weekvoorraad uit echte actieve occurrences.
- Shopping-add uitsluitend na expliciete gebruikersactie.
- Voorraad na aankoop uitsluitend na expliciete gebruikersactie.
- `Niet kopen` / herstel.
- Nieuwe Cleaning Shopping-items bewaren:
  - `cleaningSupplyId`;
  - `cleaningOccurrenceIds`;
  - `cleaningRoomIds`;
  - `cleaningRoutineIds`.
- Legacy naamfallback blijft backward compatible.

### Historie / activity / cleanup
- Richere kamer- en routinehistorie wordt read-only uit `completionLogs` afgeleid.
- Completed Cleaning work kan exact-once naar de gezamenlijke household activity-feed worden geprojecteerd.
- Open derived Task/Agenda-records zonder geldige canonieke context worden conservatief opgeschoond.
- Open Cleaning Shopping-items worden alleen verwijderd wanneer de context veilig herkenbaar is.
- Completed/manual history wordt niet automatisch verwijderd.

### Notifications / Action Inbox
- Gebundelde Cleaning collaboration-notifications + dagelijkse reminder.
- Action Inbox is de centrale beslisplek voor Cleaning help/overdracht/tegenvoorstel.
- Inbox is uitsluitend read/projection/action-routing en geen request-database of tweede writer.

## Rollen / rechten — nieuw in de close-out kandidaat

`src/modules/cleaning/cleaningPermissions.js` is de centrale client-side capability policy.

Bestaande householdrollen worden zonder nieuw accountmodel gemapt:
- `owner` / `admin` → **Beheerder**;
- `adult` / `member` → **Gezinslid**;
- `child` / `limited` / `restricted` → **Beperkt profiel**.

### Beheerder
- Volledige structurele kamer/routine-acties.
- Planning en assignments.
- Household weekmodus / kamerpauses.
- Supplies/voorraad.
- Uitvoering en request responses.

### Gezinslid
- Weekplan maken/vernieuwen.
- Routine-overdracht / tegenvoorstel initiëren.
- Supplies en voorraad beheren.
- Eigen availability beheren.
- Eigen geaccepteerde vaste routine pauzeren.
- Uitvoering, request responses en hulp.
- **Geen structurele kamer/routine-inhoud wijzigen.**

### Beperkt profiel
- Toegewezen werk uitvoeren.
- Request accepteren/afwijzen.
- Hulp gebruiken/vragen binnen toegewezen uitvoering.
- Eigen Tijd/Aantal/Beide preference.
- **Geen structurele wijzigingen, plan-generatie, assignment-initiation, supplies of availability-initiation.**

De policy schrijft zelf niets naar Firebase en bewaakt zowel publieke mutation-API's als de zichtbare Cleaning-acties.

## Belangrijke release-security grens

De huidige `database.rules.json` heeft onder de generieke household `$sharedData`-boundary nog brede write-toegang voor ieder actief householdlid. Daardoor is de nieuwe rolpolicy op dit moment **product/client enforcement**, maar nog niet de uiteindelijke server-side security boundary.

Voor een publieke release is daarom nog nodig:
- aparte Firebase Rules role-enforcement migratie;
- testen in een veilige rules-omgeving;
- pas daarna productie-rules deployen met expliciete toestemming.

**Production Firebase Rules worden in deze STEP 14 close-out bewust niet gewijzigd of gedeployed.**

## Nog te doen vóór functionele STEP 14-acceptatie

Alleen een compacte real-device rol/regressieronde:
1. Beheerder: bestaande kamer/routine/planning/availability/supplies flows blijven werken.
2. Gezinslid: structurele kamer/routine-controls zijn niet beschikbaar, terwijl planning/overdracht/supplies/eigen availability nog wel werken.
3. Beperkt profiel indien beschikbaar: managementacties ontbreken; toegewezen taak en accept/decline/help blijven werken.
4. Action Inbox blijft verzoeken correct afhandelen.
5. Geen regressie in Taken/Agenda reverse sync.

Na expliciete real-device acceptatie kan STEP 14 functioneel worden gesloten.

## Daarna: definitieve premium visual polish

Nog bewust open voor de volgende fase:
- volledige toepassing van `FamilyApp-Schoonmaken-visual-spec.md`;
- light + dark premium uitvoering;
- definitieve hero/background assets;
- hiërarchie, spacing, cards, shadows/glass, motion en microinteractions;
- alle resterende touch targets minimaal 44×44;
- premium Overzicht / Planning / Kamers / Gepland per kamer;
- definitieve empty/loading/error states;
- eventuele slimme frequentie/planningssuggesties uitsluitend adviserend en zonder nieuwe autoriteit.

## Niet onderhandelen

- Werk uitsluitend op `agent/household-rebuild-v2`.
- `main` niet aanraken zonder expliciete toestemming.
- `CleaningOccurrence` blijft SOT.
- Taken/Agenda blijven projections.
- Action Inbox blijft projection/action-routing.
- Shopping-add en voorraad-reset blijven expliciet.
- Pauze/availability maakt nooit gemiste-backlog.
- Geen productie Firebase Rules/deployment zonder expliciete toestemming.
