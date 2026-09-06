# FamilyApp - Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **06-09-2026**
Branch: `agent/household-rebuild-v2`
Roadmapstap: **STEP 14 - Schoonmaken**

Dit bestand is de compacte actuele waarheid voor nieuwe chats/agents. Historische geaccepteerde milestones blijven in `FamilyApp-Schoonmaken-milestone-log.md`; de functionele architectuur staat in `FamilyApp-Schoonmaken-module-architectuur.md` en de definitieve visuele richting in `FamilyApp-Schoonmaken-visual-spec.md`.

## Huidige status

**STEP 14 is FUNCTIONEEL AFGEROND EN REAL-DEVICE GEACCEPTEERD OP IPHONE.**

Laatste geaccepteerde functionele checkpoint:
`e3f7c2dd0ca9acf2ddc8f105f6b4b701a0f6ce0c`

Geaccepteerde preview:
`https://verhoog-family-e2ccknp0s-cverhoog-techs-projects.vercel.app`

Validatie op deze checkpoint:
- Household Rebuild Contracts: **SUCCESS** — run `34023670522`.
- Vercel deployment: **READY** — `dpl_HhhqznzgLskBqEEBXDbxdm8Fknbt`.
- Real-device: **GEACCEPTEERD OP IPHONE**.
- `scripts/test-cleaning-functional-closeout.js`: groen.
- `scripts/test-cleaning-permissions.js`: groen.
- `scripts/test-cleaning-runtime-reachability.js`: bewaakt de volledige Cleaning-runtimeketen inclusief permissions.
- `main`: **niet gewijzigd**.

De gebruiker heeft na de laatste rolcorrectie expliciet bevestigd dat de flow werkt. Daarmee is de functionele STEP 14-close-out geaccepteerd.

## Productbeslissing rollen / rechten

De Cleaning-permissions zijn generiek voor ieder FamilyApp-huishouden; er zijn geen persoonsgebonden uitzonderingen.

Bestaande householdrollen worden gemapt als:
- `owner` / `admin` → **Beheerder**;
- `adult` / `member` → **Gezinslid**;
- `child` / `limited` / `restricted` → **Beperkt profiel**.

### Beheerder
- Volledige Cleaning-functionaliteit.
- Kamers/routines aanmaken, wijzigen en verwijderen.
- Planning, assignments, household-brede availability/pauzes en supplies.

### Gezinslid
- Kamers **aanmaken en bewerken**.
- Routines **aanmaken en bewerken**.
- Weekplanning maken/vernieuwen.
- Routine-overdracht / tegenvoorstel initiëren.
- Supplies en voorraad beheren.
- Eigen availability beheren.
- Eigen geaccepteerde vaste routine pauzeren.
- Uitvoering, request responses en hulp.
- Definitief verwijderen van kamers/routines en household-brede beheeracties blijven beheerder-only.

### Beperkt profiel
- Toegewezen werk uitvoeren.
- Requests accepteren/afwijzen.
- Hulp vragen/gebruiken binnen toegewezen uitvoering.
- Eigen Tijd/Aantal/Beide preference.
- Geen structureel kamer/routinebeheer, plan-generatie, assignment-initiation, supplies of householdbeheer.

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
- Zowel Beheerder als volwassen Gezinslid kan normale kamers/routines beheren.

### Planning
- Weekplanberekening en conceptplan.
- Persoonlijke approval.
- FAIR_TIME-verdeling.
- Doorlopende intervallen en rolling horizon.
- Planning-persoonsfilter zonder canonieke mutation.
- Tijd/Aantal/Beide als per-user preference.
- Actieve-plan reconciler houdt rekening met availability.

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
- Nieuwe Cleaning Shopping-items bewaren stabiele Cleaning-ID-metadata.
- Legacy naamfallback blijft backward compatible.

### Historie / activity / cleanup
- Kamer- en routinehistorie wordt read-only uit `completionLogs` afgeleid.
- Completed Cleaning work projecteert exact-once naar de gezamenlijke household activity-feed.
- Open derived Task/Agenda-records zonder geldige canonieke context worden conservatief opgeschoond.
- Open Cleaning Shopping-items worden alleen verwijderd wanneer de context veilig herkenbaar is.
- Completed/manual history wordt niet automatisch verwijderd.

### Notifications / Action Inbox
- Gebundelde Cleaning collaboration-notifications + dagelijkse reminder.
- Action Inbox is de centrale beslisplek voor Cleaning help/overdracht/tegenvoorstel.
- Inbox is uitsluitend read/projection/action-routing en geen request-database of tweede writer.
- Productbeslissing: ✉️ Inbox = actionable requests; 🔔 Meldingen = informatieve updates.

## Release-security grens

De huidige `database.rules.json` heeft onder de generieke household `$sharedData`-boundary nog brede write-toegang voor ieder actief householdlid. De Cleaning rolpolicy is daarom nu product/client enforcement, niet de uiteindelijke server-side security boundary.

Voor publieke release blijft apart nodig:
- Firebase Rules role-enforcement migratie;
- testen in veilige rules-omgeving;
- daarna pas productie-rules deployen met expliciete toestemming.

**Production Firebase Rules zijn in STEP 14 niet gewijzigd of gedeployed.**

## Volgende fase: definitieve premium visual polish

Functioneel bouwen aan STEP 14 is gesloten. Volgende werkstroom is uitsluitend de visuele/eind-UX-fase, tenzij tijdens real use een regressie wordt gevonden.

Open voor polish:
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
