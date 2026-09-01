# FamilyApp - Module-architectuur Schoonmaken

Status: implementatie gestart; Fase A shell real-device geaccepteerd op iPhone; Fase 0 architectuurfundament BEZIG.

## 1. Doel van de module

Schoonmaken is de huishoudelijke routine- en planningsengine van FamilyApp. De module helpt een huishouden om kamers en schoonmaakroutines vast te leggen, periodiek te bepalen wat aan de beurt is, het werk eerlijk voor te stellen en na goedkeuring door te zetten naar de bestaande Taken- en Agenda-modules.

Belangrijk uitgangspunt: Schoonmaken wordt geen tweede Taken-module.

- Schoonmaken beheert kamers, routines, intervallen, benodigdheden en de schoonmaakplanning.
- Taken beheert concrete uitvoerbare opdrachten.
- Agenda beheert wanneer geaccepteerde schoonmaakbeurten plaatsvinden.
- Boodschappen beheert producten die moeten worden aangeschaft.
- Notificaties beheert voorstellen, overdrachten, tegenvoorstellen en reminders.

Een concrete schoonmaakbeurt is één gedeeld object dat vanuit meerdere modules wordt weergegeven; er mogen geen losse kopieën per module ontstaan.

## 2. Hoofdnavigatie

De module krijgt drie primaire tabs:

1. Overzicht
2. Planning
3. Kamers

Binnen Kamers staat de subtoggle Kamers / Gepland per kamer.

Voorraad, historie en instellingen zijn contextueel bereikbaar en krijgen in eerste instantie geen eigen hoofdtab.

## 3. Overzicht

Doel: antwoord geven op de vraag: "Hoe staat ons huis ervoor en wat moet er binnenkort gebeuren?"

### Hero / huisstatus

- Huisstatus: Op schema / Binnenkort aandacht / Aandacht nodig
- Weekprogressie
- Aantal ruimtes of schoonmaakbeurten die nog aandacht vragen
- Primaire actie: Weekplan bekijken

### Deze week

Compact overzicht van eerstvolgende schoonmaakbeurten met:

- kamer
- toegewezen persoon/personen
- geplande dag of flexibel tijdvak
- geschatte duur en/of aantal beurten volgens persoonlijke weergavevoorkeur
- goedkeuringsstatus

### Kamers

Visuele kamerkaarten met:

- naam + icoon/illustratie
- status
- aantal routineonderdelen op schema
- eerstvolgende beurt

### Benodigdheden

Alleen zichtbaar wanneer actie nodig is, bijvoorbeeld producten met status Bijna op of Op die nodig zijn voor komende schoonmaakbeurten.

### Gezamenlijke progressie

Subtiele huishoudprogressie, bijvoorbeeld weekpercentage, aantal afgeronde schoonmaakbeurten en gezamenlijke streaks. Geen competitief leaderboard tussen gezinsleden.

## 4. Kamers en routines

### Kamer

Een kamer/zone bevat:

- naam
- type
- icoon/illustratie
- actieve schoonmaakroutine-items
- optioneel voorkeursmoment
- verdelingsmethode
- status
- historie

Voorbeelden: woonkamer, keuken, badkamer, toilet, slaapkamer, kinderkamer, hal, wasruimte, balkon/tuin en eigen ruimte.

Algemene huishoudtaken die niet logisch aan een schoonmaakzone hangen, zoals vuilnis buitenzetten, blijven in de bestaande Taken-module.

### Routine-item

Elk schoonmaakonderdeel is zelfstandig configureerbaar:

- titel
- interval/frequentie
- geschatte duur
- prioriteit: Basis / Normaal / Extra
- gekoppelde benodigdheden
- laatst uitgevoerd
- volgende vervaldatum
- actief/gepauzeerd

Voorbeeld Badkamer:

- wastafel reinigen - wekelijks
- spiegel schoonmaken - wekelijks
- toilet reinigen - wekelijks
- douche ontkalken - iedere 2 weken
- putje reinigen - maandelijks

De kamer heeft dus niet één vaste frequentie. FamilyApp verzamelt alleen de routine-items die in een bepaalde cyclus aan de beurt zijn.

## 5. Concrete schoonmaakbeurt

Wanneer meerdere routine-items uit dezelfde kamer aan de beurt zijn, worden ze gebundeld tot één schoonmaakbeurt.

Voorbeeld:

Badkamer schoonmaken - 4 onderdelen - circa 25 minuten.

In Taken verschijnt één taak met een interne checklist, niet vier losse microtaken.

Dezelfde beurt is zichtbaar in:

- Schoonmaken: kamercontext, routine en voortgang
- Taken: uitvoerbare taak + checklist
- Agenda: dag/tijd/flexibel blok

Afronden of wijzigen synchroniseert tussen deze weergaven.

## 6. Nieuwe kamer aanmaken

Setup in maximaal drie stappen:

### Stap 1 - Kamer

Kies kamertype of maak een eigen ruimte.

### Stap 2 - Routine

FamilyApp stelt per kamertype een template voor. Gebruiker kan:

- onderdelen in-/uitschakelen
- frequentie wijzigen
- tijd aanpassen
- eigen onderdeel toevoegen
- voorgestelde benodigdheden aanpassen

Templates zijn alleen een startpunt en nooit verplicht.

### Stap 3 - Planning

Instellen van:

- voorkeursmoment: geen voorkeur / doordeweeks / weekend / specifieke dag
- verdelingsmethode: eerlijk / om de beurt / vaste persoon / handmatig

## 7. Weekplanner

De weekplanner maakt eerst een concept en nooit direct definitieve taken.

### Canonieke due-semantiek (Weekplanner Foundation checkpoint 1)

Due-bepaling is pure domeinlogica en schrijft niets naar Firebase, Taken of Agenda.

- Een planningsvenster is halfopen: `[startAt, endAt)`. Een routine exact op `endAt` hoort dus bij het volgende venster en kan niet dubbel in twee weken vallen.
- Een inactieve of gepauzeerde routine wordt uitgesloten.
- Een routine zonder canonieke `roomId` wordt uitgesloten; routine-naar-kamer blijft uitsluitend via `CleaningRoutineItem.roomId` lopen.
- De due-datum komt eerst uit expliciete `nextDueAt`.
- Ontbreekt `nextDueAt`, dan geldt `lastCompletedAt + intervalDays` als backward-compatible afleiding.
- Een nooit uitgevoerde routine gebruikt `createdAt` als eerste due-moment. Ontbreekt ook `createdAt`, dan wordt deze bij de start van het gevraagde planvenster voor het eerst due; er wordt daarbij geen synthetische datum opgeslagen.
- `dueAt < startAt` is `OVERDUE`; `startAt <= dueAt < endAt` is `DUE_IN_WINDOW`; `dueAt >= endAt` is `FUTURE`.
- Alleen `OVERDUE` en `DUE_IN_WINDOW` zijn kandidaten voor die week. Bundeling, bestaande-occurrence-deduplicatie en verdeling volgen in afzonderlijke checkpoints.

Dit contract staat geïsoleerd in `src/modules/cleaning/cleaningPlannerContract.js`. De toekomstige completion-write moet `nextDueAt` volgens de lokale kalenderdag van het huishouden berekenen; de huidige milliseconde-afleiding vanuit `lastCompletedAt` is uitsluitend de fallback voor bestaande records zonder expliciete `nextDueAt`.

### Weekkandidaten (Weekplanner Foundation checkpoint 2)

De planner selecteert weekkandidaten rechtstreeks uit de canonieke `rooms`- en `routines`-snapshot van `CleaningHouseholdRepository`.

- Alleen `OVERDUE` en `DUE_IN_WINDOW` worden kandidaat.
- De gekoppelde kamer moet bestaan en actief zijn. Routines van een soft-deleted kamer worden expliciet uitgesloten.
- De selector maakt geen tweede routine- of kamerautoriteit en muteert de repository-snapshot niet.
- Bij Firebase-map snapshots is de database-key canoniek; een eventueel afwijkend embedded `id`-veld mag de relatie niet omleiden.
- Iedere kandidaat bevat alleen de plannerdata die de volgende stap nodig heeft: `routineId`, `roomId`, titel, due-informatie, geschatte minuten en prioriteit.
- De uitkomst is deterministisch gesorteerd op due-moment, daarna Basis / Normaal / Extra en daarna routine-ID.
- Uitgesloten routines blijven met een expliciete reden in de pure selectoruitkomst beschikbaar voor tests en diagnose.
- Bundeling per kamer, occurrence-deduplicatie en verdeling zijn bewust nog niet onderdeel van deze checkpoint.

### Generatie

FamilyApp kijkt naar:

- vervallen of binnenkort vervallende routine-items
- geschatte duur
- prioriteit
- kamer- en gebruikersvoorkeuren
- eerdere verdeling
- tijdelijke beschikbaarheid
- relevante Agenda-beschikbaarheid

### Verdelingsmethodes

- Eerlijk verdelen - standaard
- Om de beurt
- Vaste persoon
- Handmatig

Standaard eerlijk verdelen gebruikt geschatte tijd als maatstaf, niet alleen aantallen.

### Planning

Een beurt kan zijn:

- Gepland: concrete dag en optioneel tijdstip
- Flexibel: bijvoorbeeld deze week of dit weekend

FamilyApp mag geschikte momenten uit Agenda voorstellen, maar zet nooit zonder toestemming automatisch harde tijden vast.

## 8. Persoonlijke weergavevoorkeur

Iedere gebruiker kiest zelf hoe werkbelasting wordt weergegeven:

- Tijd
- Aantal taken/schoonmaakbeurten
- Beide

Deze voorkeur geldt in Schoonmaken en relevante schoonmaakweergaven in Taken/Agenda.

Belangrijk: deze presentatievoorkeur staat los van de verdelingslogica. De planner gebruikt standaard geschatte tijd voor een eerlijke verdeling.

## 9. Goedkeuring en samenwerking

Een gegenereerd weekplan is eerst een voorstel.

Iedere gebruiker beoordeelt zijn/haar eigen deel in één keer:

- Alles accepteren
- Individuele beurt aanpassen
- Overdracht aanvragen
- Tegenvoorstel doen
- Afwijzen waar relevant

Regel: ieder verzoek dat geaccepteerd kan worden, moet ook geweigerd kunnen worden.

Na acceptatie wordt de schoonmaakbeurt actief in Taken en, indien gepland, Agenda.

### Wijzigingen

- Eigen dag/tijd wijzigen: geen nieuwe goedkeuring nodig.
- Verantwoordelijke wijzigen: ontvanger moet accepteren.
- Tegenvoorstel: oorspronkelijke partij kan accepteren of afwijzen.
- Bij afwijzing blijft de bestaande verantwoordelijkheid intact totdat een nieuwe afspraak is gemaakt.

## 10. Agenda-integratie

Schoonmaken beheert de routine; Agenda beheert het moment.

Na goedkeuring kan een beurt in Agenda verschijnen als:

- concreet tijdsblok
- flexibel schoonmaakitem zonder vast tijdstip

Agenda kan conflicten signaleren en alternatieve momenten voorstellen.

Bij verplaatsen vanuit Agenda moet onderscheid worden gemaakt tussen:

- Alleen deze beurt wijzigen
- Vaste voorkeursdag van de routine aanpassen

## 11. Taken-integratie

Na goedkeuring verschijnt een schoonmaakbeurt als één concrete taak in Taken.

Vanuit Taken mag de gebruiker:

- checklist openen en afvinken
- datum/tijd van de eigen beurt aanpassen
- hulp vragen
- overname aanvragen
- taak afronden

Structurele wijzigingen aan frequentie, routine, benodigdheden of kamersettings worden in Schoonmaken beheerd.

## 12. Benodigdheden en Boodschappen

Benodigdheden horen primair bij een routine-item.

Voorraadstatus blijft bewust eenvoudig:

- Op voorraad
- Bijna op
- Op

Wanneer een weekplan producten nodig heeft die Bijna op of Op staan, bundelt FamilyApp dit tot één actie:

"2 benodigdheden aanvullen" -> Toevoegen aan boodschappenlijst.

Na aankoop kan Boodschappen voorstellen de voorraadstatus terug op Op voorraad te zetten.

Geen automatische toevoeging aan boodschappen zonder bevestiging.

## 13. Uitvoeren en afronden

Tijdens een schoonmaakbeurt wordt de checklist realtime bijgewerkt.

Als niet alles is voltooid bij afronden:

- Doorschuiven naar volgende beurt
- Deze week opnieuw plannen als kleine vervolgtaak
- Deze cyclus overslaan / toch afronden

Een eenmalige keuze mag de vaste routine niet stilzwijgend wijzigen.

## 14. Historie en voortgang

Per kamer/routine wordt vastgelegd:

- datum
- geplande persoon/personen
- feitelijke uitvoerder(s)
- uitgevoerde checklist-items
- overgeslagen/doorgeschoven items
- werkelijke afrondstatus

Historie is bedoeld voor inzicht en slimmere planning, niet voor controle of competitie.

## 15. Rechten

Rollen:

### Beheerder

Mag kamers, routines, intervallen, benodigdheden, verdelingsregels en structurele instellingen beheren.

### Gezinslid

Mag eigen voorstellen beoordelen, eigen beurten verplaatsen, overdrachten aanvragen, uitvoeren en voorraadstatus bijwerken binnen toegestane grenzen.

### Beperkt profiel

Kan toegewezen schoonmaaktaken zien, accepteren, uitvoeren en hulp vragen, maar geen structurele routines of planning van anderen wijzigen.

Een schoonmaakbeurt kan aan één of meerdere personen worden toegewezen. Gezamenlijke taken blijven één gedeelde taak met realtime checklist.

## 16. Tijdelijke uitzonderingen

### Huishoudniveau

- Vakantie
- Drukke week
- Schoonmaakplanning pauzeren

### Persoonsniveau

- Tijdelijk niet beschikbaar
- Ziek / minder beschikbaar

### Routineniveau

- Individuele routine pauzeren
- Kamer tijdelijk pauzeren

### Losse beurt

- Uitstellen
- Overslaan
- Deze week opnieuw plannen

Een vakantie of pauze mag nooit leiden tot een enorme backlog. Bij hervatten genereert FamilyApp een passend herstartvoorstel.

Bij een drukke week kan FamilyApp op basis van Basis / Normaal / Extra een lichte schoonmaakweek voorstellen.

## 17. Notificaties

### Push + notificatiecentrum

Alleen wanneer actie nodig is:

- nieuw schoonmaakvoorstel
- overdracht
- tegenvoorstel
- relevante reminder voor geaccepteerde beurt

### Alleen notificatiecentrum/feed

- plan geaccepteerd
- planning gewijzigd
- beurt afgerond

### Alleen in Schoonmaken

- voortgang
- historie
- volgende vervaldatum
- lichte voorraadstatus

Reminderbeleid: maximaal één normale reminder per geplande schoonmaakbeurt, tenzij gebruiker dit later zelf anders instelt.

## 18. Slimme inzichten - latere fase

Pas na voldoende historie kan FamilyApp voorstellen doen zoals:

- frequentie lijkt te hoog/laag
- taak wordt structureel doorgeschoven
- betere verdeling op basis van werkelijke belasting
- gunstiger moment op basis van Agenda

AI of assistent mag voorstellen doen, maar nooit zelfstandig structurele routines wijzigen.

## 19. Technische kernobjecten

Canonieke conceptuele objecten:

- CleaningRoom
- CleaningRoutineItem
- CleaningSupply
- CleaningInventoryState
- CleaningPlan
- CleaningOccurrence
- CleaningAssignment
- CleaningApprovalRequest
- CleaningCompletionLog
- CleaningAvailabilityOverride
- CleaningUserPreferences

Belangrijk: `CleaningOccurrence` is de enige bron van waarheid voor één concrete schoonmaakbeurt en krijgt vaste referenties naar eventuele Task- en Calendar-projecties.

Canonieke Firebase-root:

`families/{householdId}/cleaning`

Subcollecties/paden:

- `rooms`
- `routines`
- `supplies`
- `inventory`
- `plans`
- `occurrences`
- `approvals`
- `completionLogs`
- `availability`
- `preferences`

Deze contracten zijn vastgelegd in `src/modules/cleaning/cleaningDomain.js` en `src/modules/cleaning/cleaningRepositoryContract.js`.

## 20. Statusmodellen

### Weekplan

DRAFT -> PROPOSED -> PARTIALLY_ACCEPTED -> ACTIVE -> COMPLETED / EXPIRED

### Toewijzing

PROPOSED -> ACCEPTED -> ACTIVE -> COMPLETED

Alternatieve paden:

- PROPOSED -> DECLINED
- PROPOSED -> COUNTER_PROPOSED
- ACTIVE -> SKIPPED
- ACTIVE -> CARRIED_FORWARD
- ACTIVE -> RESCHEDULED

### Concrete schoonmaakbeurt

DRAFT -> PROPOSED -> SCHEDULED / FLEXIBLE -> IN_PROGRESS -> COMPLETED

Alternatieve paden:

- IN_PROGRESS / SCHEDULED / FLEXIBLE -> SKIPPED
- IN_PROGRESS / SCHEDULED / FLEXIBLE -> CARRIED_FORWARD
- DRAFT / PROPOSED -> CANCELLED

## 21. Gefaseerd bouwplan

### Fase 0 - Architectuurfundament

- Datamodel en Firebase-paden definiëren.
- Eén source-of-truth voor CleaningOccurrence vastleggen.
- Integratiecontracten met Tasks, Calendar, Grocery en Notifications bepalen.
- Rollen/rechten controleren tegen bestaand household/member-model.
- Feature flag voor Schoonmaken toevoegen.

### Fase 1 - Kamers + routines (MVP-basis)

- Kamers CRUD.
- Kamertemplates.
- Routine-items met interval, duur en prioriteit.
- Benodigdheden koppelen.
- Kamerdetail en routinebeheer.
- Persoonlijke weergavevoorkeur Tijd / Aantal / Beide.

### Fase 2 - Weekplanner + voorstellen

- Bepalen wat per week aan de beurt is.
- Bundelen per kamer tot schoonmaakbeurt.
- Eerlijke verdeling op geschatte tijd.
- Verdelingsmethodes toevoegen.
- Conceptweekplan en persoonlijke beoordeling.

### Fase 3 - Taken-integratie

- Geaccepteerde CleaningOccurrence als taak tonen.
- Gedeelde checklist synchroniseren.
- Afronden, overslaan, doorschuiven en vervolgtaak ondersteunen.
- Hulp/overname aansluiten op bestaand Taken-patroon.

### Fase 4 - Agenda-integratie

- Geplande en flexibele schoonmaakbeurten tonen.
- Dag/tijd wijzigen vanuit beide modules.
- Agenda-conflicten signaleren.
- Optionele voorgestelde momenten op basis van beschikbaarheid.

### Fase 5 - Boodschappen + lichte voorraad

- Voorraadstatus Op voorraad / Bijna op / Op.
- Benodigdheden van komende week bundelen.
- Bevestigde toevoeging aan boodschappenlijst.
- Na aankoop voorraad bijwerken.

### Fase 6 - Goedkeuringen + notificaties

- Weekvoorstelmeldingen.
- Overdracht en tegenvoorstel.
- Accepteren + afwijzen verplicht als paar.
- Gebundelde reminders zonder spam.

### Fase 7 - Historie + uitzonderingen

- Completion logs.
- Vakantie, drukke week, ziek/niet beschikbaar.
- Pauzeren en herstartplan.
- Gezamenlijke voortgang en subtiele achievements.

### Fase 8 - Visuele polish + slimme inzichten

- Premium FamilyApp-design.
- Animaties/microinteracties.
- Feed-events waar relevant.
- Data-gedreven frequentie- en planningsvoorstellen.
- Eventuele Family Assistant-inzichten.

## 22. MVP-afbakening

Voor de eerste bruikbare release hoeven nog niet alle slimme functies mee.

Minimaal nodig:

1. Kamers.
2. Routine-items met eigen interval.
3. Benodigdheden koppelen.
4. Weekplan genereren.
5. Verdeling + goedkeuring.
6. Eén CleaningOccurrence zichtbaar in Schoonmaken + Taken.
7. Agenda-koppeling voor geaccepteerde beurten.
8. Afronden + historie.
9. Persoonlijke Tijd / Aantal / Beide-weergave.

Daarna: voorraad, vakantie/drukke week, slimme inzichten en uitgebreidere gamification.

## 23. Engineering guardrails / schaalbaarheid

Deze module wordt alleen gebouwd op duurzame integratiepunten. Tijdelijke monkeypatches of parallelle bronnen van waarheid zijn niet toegestaan.

### Verplicht

- Gebruik bestaande FamilyApp household-, member-, task-, calendar-, grocery-, notification- en activity-contracten waar die canoniek zijn.
- Gebruik één duidelijke `CleaningHouseholdRepository`-grens in plaats van Firebase-reads/writes verspreid door UI-code of meerdere overlappende repositories.
- Houd `CleaningOccurrence` canoniek; Taken en Agenda zijn projecties/weergaven, geen tweede opslagautoriteit.
- Schrijf mutaties idempotent waar retries of meerdere clients mogelijk zijn.
- Gebruik stabiele IDs en expliciete foreign-key/referencevelden tussen Cleaning, Tasks, Calendar, Grocery en Activity.
- Houd businesslogica uit view/CSS-lagen; UI consumeert services/state en bezit niet de domeinwaarheid.
- Realtime listeners moeten een expliciete lifecycle hebben: bind, unbind en opnieuw binden bij household/account-wissel.
- Rechten en household-scoping moeten server/Firebase-regels en repositorycontracten volgen; geen client-only beveiliging.
- Nieuwe velden en statusmodellen moeten backward-compatible/migreerbaar worden ontworpen.
- Integraties krijgen contracttests voor idempotentie, cross-module synchronisatie en account/household-isolatie.
- Tijdens de huidige rebuild wordt in kleine, afzonderlijk te accepteren commits op `agent/household-rebuild-v2` gebouwd. `main` blijft onaangeraakt totdat de gebruiker expliciet accepteert.
- Vercel/CI en relevante real-device tests vormen gates voordat een fase als afgerond wordt gemarkeerd.

### Niet toegestaan

- Geen inline JavaScript-overrides om bestaande handlers achteraf te vervangen.
- Geen dubbele event listeners als workaround voor lifecycleproblemen.
- Geen dubbele Firebase-paden of localStorage-state als tijdelijke tweede source of truth.
- Geen CSS `!important`-stapels of duplicate selectors als structurele fix.
- Geen hardcoded gebruikersnamen, UIDs, householdIds of demo-data in productiecode.
- Geen silent fallback naar oude data wanneer de canonieke repository faalt.
- Geen directe cross-module DOM-manipulatie om Taken/Agenda/Boodschappen te synchroniseren.
- Geen globale state-mutaties buiten de daarvoor bedoelde service/repository.

### Definition of Done per onderdeel

Een TODO-item mag pas van open naar afgerond wanneer:

1. de canonieke implementatie op de ontwikkelbranch staat;
2. relevante contract/unit-tests groen zijn;
3. bestaande modules geen regressie tonen;
4. cross-module synchronisatie aantoonbaar werkt waar van toepassing;
5. iPhone/PWA-test is uitgevoerd voor gebruikersflow-impact;
6. architectuur- en TODO-documenten dezelfde status tonen;
7. tijdelijke debugcode, adapters of compatibiliteitscode expliciet is verwijderd of als technische schuld is gedocumenteerd.

## 24. Documentatie als levende bron

`FamilyApp-Schoonmaken-module-architectuur.md` is de functionele en technische bron voor de Schoonmaken-module. `FamilyApp-TODO-updated.txt` is de uitvoeringsstatus.

Bij iedere geaccepteerde implementatiestap worden beide documenten bijgewerkt met:

- huidige fase/status;
- afgeronde onderdelen;
- resterende acceptatiechecks;
- eventuele bewuste afwijkingen van het ontwerp;
- nieuw ontdekte technische schuld;
- relevante branch/PR of checkpoint wanneer nuttig.

Een ontwerpwijziging wordt eerst in deze architectuur verwerkt voordat een volgende fase daarop voortbouwt.

## 25. Implementatiestatus 31-08-2026

### Geaccepteerde Fase A / veilige module-shell

Real-device geaccepteerd op iPhone:

- Schoonmaken-entry in Meer;
- leeg navigabel `#screen-cleaning`;
- module-shell met primaire tabs Overzicht / Planning / Kamers;
- subtoggle Kamers / Gepland per kamer;
- dark/light shell via uitsluitend onder `#screen-cleaning` gescopete CSS;
- lazy loading: Schoonmaken-code/styles worden pas geladen bij openen van de module;
- geen wijziging aan login/auth, app-shell, UI-scale of globale CSS.

Geaccepteerde checkpoints lopen vanaf de stabiele STEP 13.6-baseline via de commits `774d464`, `567df025` en `a11a785`.

### Fase 0 - BEZIG

Afgerond in het architectuurfundament:

- canonieke cleaning-root `families/{householdId}/cleaning` vastgelegd;
- vaste subpaden voor rooms, routines, supplies, inventory, plans, occurrences, approvals, completion logs, availability en preferences;
- `CleaningOccurrence` expliciet als source of truth vastgelegd;
- domeinstatussen en normalizers vastgelegd in `cleaningDomain.js`;
- één toekomstig `CleaningHouseholdRepository`-contract vastgelegd in `cleaningRepositoryContract.js`;
- localStorage alleen toegestaan als disposable UID+household read-cache, nooit als tweede bron van waarheid.

Nog open binnen Fase 0:

- echte `CleaningHouseholdRepository` implementeren met HouseholdContext bind/unbind/revision lifecycle;
- Firebase rules/rechtenmodel aansluiten op bestaande household/memberrollen;
- feature-flagged data-activatie bepalen;
- expliciete integratiecontracten voor Tasks, Calendar, Grocery en Notifications toevoegen;
- contracttests voor household-isolatie, lifecycle en idempotentie toevoegen.
