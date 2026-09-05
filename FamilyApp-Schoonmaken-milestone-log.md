# FamilyApp - Schoonmaken Milestone Log

Dit bestand is het doorlopende implementatielog voor grote Schoonmaken-milestones binnen **STEP 14 - Schoonmaken**. Het vult `FamilyApp-Schoonmaken-module-architectuur.md` en `FamilyApp-TODO-updated.txt` aan. Alleen een flow die expliciet op real-device is geaccepteerd mag hier als geaccepteerd worden gemarkeerd.

## Milestone 6 - Routine-overdracht, tegenvoorstellen en household-actor correctheid

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**
Datum acceptatie: **05-09-2026**
Branch: `agent/household-rebuild-v2`
Laatste geaccepteerde functionele checkpoint: `8d3527141c0f5fdebd6cc72d7c71013b31aa2cfe`
Geaccepteerde preview: `https://verhoog-family-kp38sfagv-cverhoog-techs-projects.vercel.app`
GitHub Actions: `33956995011` - Household Rebuild Contract Tests **success**.
Vercel deployment: `dpl_D3RNAea4TbdwzsPFnrkfV8YfweUE` - **READY**.
Productie/main: **niet gewijzigd**.

### Wat in deze milestone real-device is geaccepteerd

#### Routine-overdracht en tegenvoorstellen

- Een routine kan expliciet aan een ander actief householdlid worden gevraagd zonder dat de maker zelf het goedkeuringsverzoek krijgt.
- Zelftoewijzing is direct geaccepteerde vaste verantwoordelijkheid en maakt geen verzoek aan jezelf.
- Een ontvanger kan accepteren, afwijzen of een tegenvoorstel doen.
- Een tegenvoorstel aan een derde householdpersoon wordt opnieuw als expliciet verzoek naar die derde persoon gestuurd; er vindt geen stille auto-assignment plaats.
- Een tegenvoorstel terug naar een eerder geaccepteerde fallback-eigenaar kan die bestaande geaccepteerde verantwoordelijkheid veilig herstellen.
- Afwijzen herstelt de geldige fallback in plaats van blind altijd naar `AUTO` terug te vallen.
- `PENDING` en `COUNTER_PROPOSED` blokkeren rolling work voor de betrokken routine totdat geldige consent bestaat.
- Na acceptatie wordt toekomstige overlap van de oude verantwoordelijke opgeschoond en de nieuwe vaste eigenaar blijft leidend.

#### Household-actor en assignment-correctheid

- Ieder ingelogd actief gezinslid kan binnen het eigen huishouden routines aanmaken en wijzigen onder de eigen household-UID.
- Een ander gezinslid dat een routine maakt of zichzelf toewijst wordt niet impliciet als Shane/huishoudeigenaar behandeld.
- `createdByUid` blijft de oorspronkelijke maker; `updatedByUid` volgt de actuele editor via de actieve household-context.
- Een geaccepteerde vaste eigenaar is een harde assignment-constraint en mag niet door FAIR_TIME worden overschreven.
- Een nog niet geaccepteerde assignment mag niet als vrije AUTO-routine in occurrences of FAIR_TIME lekken.

#### Real-device save-order regressiefix

- De assignment-experience leest `Wie doet deze routine?` uit het bestaande formulier tijdens de repository-call.
- De Schoonmaken-UI riep eerder eerst een busy-state re-render aan en pas daarna de repository, waardoor de geïnjecteerde assignmentvelden al uit de DOM verdwenen konden zijn.
- Daardoor kon een expliciete zelf-/persoontoewijzing onbedoeld als `AUTO` worden opgeslagen en daarna door FAIR_TIME bij Shane terechtkomen.
- De repository create/update wordt nu gestart **vóór** de busy-state re-render, zodat de gekozen assignment atomair in de save-flow wordt vastgelegd.
- Een contracttest bewaakt deze volgorde om herintroductie te voorkomen.

### Regressieguards van deze milestone

- Geen hardcoded Shane- of owner-fallback voor maker/editor/toewijzing.
- Alleen actieve householdleden mogen actor/assignee zijn.
- Zelftoewijzing vraagt nooit goedkeuring aan jezelf.
- Een verzoek aan een ander is uitsluitend voor de bedoelde ontvanger.
- `PENDING` en `COUNTER_PROPOSED` creëren geen stilzwijgend nieuw werk voor de ontvanger.
- Geaccepteerd `FIXED_PERSON`-werk blijft buiten vrije FAIR_TIME-herverdeling.
- Rolling plannen bezitten nooit hun eigen standing consent.
- Canonieke Cleaning-mutaties blijven binnen de rules-safe Cleaning-boundary.
- `CleaningOccurrence` blijft de enige canonieke source of truth voor concrete schoonmaakbeurten.
- `main` blijft onaangeraakt totdat de gebruiker expliciet om merge/promotie vraagt.

## Milestone 5 - Slimme weekplanning, Weekvoorraad en Niet kopen

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**
Datum laatste acceptatie: **05-09-2026**
Branch: `agent/household-rebuild-v2`
Laatste geaccepteerde functionele checkpoint: `eccec8aef1257d8777c15ff8ae66bcd7e351a0f8`
Geaccepteerde preview: `https://verhoog-family-2h0filnik-cverhoog-techs-projects.vercel.app`
Productie/main: **niet gewijzigd**.

### Wat in deze milestone real-device is geaccepteerd

#### Agenda-conflictdetectie en alternatieve tijden

- FamilyApp vergelijkt concrete getimede schoonmaakbeurten met Agenda voor de komende zeven dagen.
- Alleen relevante overlap wordt als conflict behandeld; expliciet verschillende verantwoordelijken botsen niet met elkaar.
- Dezelfde CleaningOccurrence/projectie wordt niet met zichzelf als conflict vergeleken.
- Flexibele schoonmaakbeurten krijgen geen verzonnen tijdstip en worden niet als getimed conflict behandeld.
- Bij onzekere duur of deelnemer wordt bewust `MOGELIJK` gebruikt in plaats van een hard conflict.
- FamilyApp stelt maximaal drie vrije alternatieven op dezelfde dag voor, op een halfuurraster tussen 08:00 en 21:00.
- Er wordt nooit automatisch verplaatst.
- Verplaatsen gebeurt uitsluitend na een expliciete gebruikersactie via de bestaande `CleaningExecutionWriteRuntime`, zodat de canonieke CleaningOccurrence source of truth blijft en Taken/Agenda daarna volgen.

Geaccepteerde functionele basis voor deze flow: `cb48107597d60a297024e8eb02be7d330fbed3c8`.

#### 7-daagse Weekvoorraad

- Weekvoorraad kijkt uitsluitend naar daadwerkelijk actieve/geaccepteerde CleaningOccurrences in de komende zeven dagen.
- Benodigdheden worden via de canonieke relatie `routine.supplyIds` afgeleid.
- Alleen actieve benodigdheden met voorraadstatus `LOW` of `OUT` komen in de lijst.
- Dezelfde benodigdheid wordt over meerdere kamers/routines heen veilig gebundeld.
- Een reeds open Cleaning-item op Boodschappen wordt als `OP LIJST` herkend en niet dubbel toegevoegd.
- Toevoegen aan Boodschappen gebeurt alleen na een expliciete tik; nooit automatisch.

#### Aankoop terugkoppelen naar voorraad

- Een afgevinkt `source: cleaning` Shopping-item kan aanleiding geven tot een expliciete `Aangevuld?`-suggestie.
- De voorraad wordt nooit automatisch naar `IN_STOCK` gezet.
- Alleen na bevestiging door de gebruiker wordt `CleaningSupplyExperience.setSupplyStatus(..., IN_STOCK)` gebruikt.
- Een aankoop die ouder is dan de huidige inventory-status blijft niet opnieuw vragen om aanvullen.
- Exacte unieke supplynaam blijft een veilige backward-compatible fallback wanneer Cleaning-ID-metadata niet door de Shopping-store is bewaard.

#### Weekvoorraad-item `Niet kopen`

- Iedere zichtbare Weekvoorraad-regel heeft een eenvoudige `×`/`Niet kopen`-actie.
- De keuze verbergt alleen de persoonlijke weekaankoopsuggestie en verwijdert niet de routine of benodigdheid uit de canonieke Cleaning-structuur.
- Verborgen items worden niet meegenomen bij `naar Boodschappen`.
- Verborgen items kunnen via `verborgen item(s) · herstellen` worden teruggebracht.
- Als exact het open door Cleaning aangemaakte Shopping-item veilig kan worden herkend, wordt alleen die gekoppelde Cleaning-regel verwijderd.
- Handmatige, recept- of onzekere Shopping-items blijven beschermd.

Laatste real-device geaccepteerde checkpoint voor de volledige milestone: `eccec8aef1257d8777c15ff8ae66bcd7e351a0f8`.

### Regressieguards van deze milestone

- WeekAssist bezit geen eigen Firebase-transactie.
- Planning approval-copy blijft eigendom van de bestaande approval UI.
- Conflictdetectie en voorraadadvies blijven adviserend totdat de gebruiker expliciet handelt.
- De 7-daagse WeekAssist-horizon verandert de vierweekse rolling-planninghorizon niet.
- `CleaningOccurrence` blijft de canonieke uitvoering/source of truth.
- Geen automatische Shopping-add, geen automatische stock reset en geen stille schedule move.
- `main` blijft onaangeraakt totdat de gebruiker expliciet om merge/promotie vraagt.

### Bekende technische caveat na deze milestone

`ShoppingListStore.normalizeItemInput()` bewaart op dit checkpoint nog niet gegarandeerd `cleaningSupplyId`, `cleaningOccurrenceIds` en `cleaningRoomIds`. De geaccepteerde flow kan daarom veilig terugvallen op een exacte unieke supplynaam. Expliciete Cleaning-ID-persistentie door de Shopping-store blijft een afzonderlijke toekomstige hardening en mag niet als reeds opgelost worden behandeld.

## Milestone 4 - Uitvoering, Home, benodigdheden en tijdelijke pauzes

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**
Datum laatste acceptatie: **05-09-2026**
Branch: `agent/household-rebuild-v2`
Laatste geaccepteerde functionele checkpoint: `5d139ab81038a9cf2b1dfa8ddbfee1c02f60b255`
Geaccepteerde preview: `https://verhoog-family-ecwr7qzfk-cverhoog-techs-projects.vercel.app`
Productie/main: **niet gewijzigd**.

### Wat in deze milestone real-device is geaccepteerd

#### Reverse sync / uitvoering

- `CleaningOccurrence` blijft de canonieke source of truth voor een schoonmaakbeurt.
- Checklistregels in een geprojecteerde Taak schrijven gecontroleerd terug naar de juiste occurrence/checklistregel.
- Een volledige schoonmaaktaak afronden voltooit de gekoppelde canonieke occurrences en legt completion history vast.
- Heropenen werkt zonder duplicate occurrence.
- Datum/tijd wijzigen vanuit Taken schrijft terug naar Cleaning en laat Agenda meebewegen.
- Datum/tijd wijzigen vanuit Agenda schrijft terug naar Cleaning en laat Taken meebewegen.
- Verwijderen van een afgeleide Taak of Agenda-afspraak verwijdert de canonieke CleaningOccurrence niet.
- Reverse sync is rules-safe: canonieke mutaties gebeuren op de Cleaning-root; projectiereparatie is afgeleid en best-effort.

Geaccepteerd checkpoint: `2b0f58dae847b18350cb6f2a3cb6a83d52e182c5`.

#### Home-dashboard

- Home heeft een eigen Schoonmaken-tegel.
- Schoonmaken telt open canonieke schoonmaakprojecties die vandaag of te laat zijn.
- De algemene Taken-tegel blijft alle open taken vandaag/te laat tellen; schoonmaak kan dus terecht in beide aantallen zitten.
- Toekomstige, ongedateerde, afgeronde, geannuleerde en overgeslagen items tellen niet mee.

Geaccepteerd checkpoint: `f58c772c92df42a5762e97b425800d42dfd79d7b`.

#### Benodigdheden / slimme suggesties

- Benodigdheden worden canoniek via `routine.supplyIds` aan routines gekoppeld.
- Benodigdheden zijn direct vanuit de kamer-popup te beheren.
- Voorraad kent bewust alleen `IN_STOCK`, `LOW` en `OUT`; geen tweede hoeveelhedenadministratie.
- Slimme suggesties zijn lokaal/deterministisch en adviserend; ze schrijven niet stilzwijgend canonieke relaties.
- Toevoegen aan Boodschappen gebeurt uitsluitend expliciet door de gebruiker.
- De supply-popup gebruikt een gecachte Cleaning-snapshot en item-level writes om trage re-renders te voorkomen.

Geaccepteerd checkpoint: `23857d84959b6cbfdb57ebf7a6036e13eee549c5`.

#### Kamer/routine UX en goedkeuringsduidelijkheid

- Bij nieuwe kamers staat het kamertype vóór de naam.
- Voor standaardkamers is naam optioneel; een lege naam wordt veilig gegenereerd en duplicaten krijgen een volgnummer.
- Routine-acties zijn compact gebundeld in een `•••`-menu dat de bestaande canonieke Bewerk/Toewijs/Verwijder-acties proxyt.
- Benodigdheden kunnen vanuit dezelfde kamerflow rechtstreeks worden aangemaakt en aan routines gekoppeld.
- Planning toont duidelijk of eigen akkoord nog nodig is, op anderen wordt gewacht of het plan actief is.
- `Planning vernieuwen` verwijdert stale live-planwerk na verwijderde kamers/routines zonder de approval-copy door meerdere DOM-eigenaars te laten herschrijven.

Geaccepteerd UX-checkpoint: `a67cbe0d30eb857f5a0565c357c51b8548223e99`.

#### Tijdelijke pauze zonder verlies van intervalritme

- Een routine of hele kamer kan tijdelijk worden gepauzeerd.
- Tijdens de pauze verschijnt geen echte schoonmaakbeurt.
- Een eindige pauze heeft een aparte hervatmarker in Agenda.
- Pauzeren betekent **niet stoppen**: de resterende countdown naar `nextDueAt` wordt bevroren.
- Na hervatten wordt de eerste echte beurt op basis van die resterende countdown geplaatst en daarna loopt `intervalDays` normaal verder.
- Voorbeeld: nog 2 dagen te gaan, 2 weken pauze, interval 7 dagen -> eerste beurt 2 dagen na hervatten -> daarna +7 -> +7.
- Als een routine bij pauzeren al aan de beurt was, mag de eerste echte beurt op de hervatdag vallen.
- Een pauze `tot ik hervat` maakt bewust geen toekomstige schoonmaakbeurten totdat handmatig wordt hervat.
- Een kamerpauze heeft voorrang op een kortere individuele routinepauze.
- De eerder geaccepteerde uitvoerder blijft behouden; ook oudere reeds bestaande pauzes kunnen deze assignment continuity veilig terugvinden uit een actieve niet-rollende geaccepteerde plancontext.
- Rolling planning gebruikt alleen een planning-shadow voor eindige pauzes; de canonieke routine blijft tijdens de pauze `paused:true`.
- De vierweekse rolling horizon blijft de zichtbare toekomstgrens.

Laatste real-device geaccepteerde checkpoint: `5d139ab81038a9cf2b1dfa8ddbfee1c02f60b255`.

### Regressieguards van deze milestone

- Approval UI blijft de enige eigenaar van de canonieke Planning approval-copy.
- Rolling plans mogen nooit hun eigen standing consent worden.
- Een eindige pauze mag niet als blanket-exclusion de recurrence chain verliezen.
- Een pauze mag geen backlog van gemiste beurten genereren.
- `main` blijft onaangeraakt totdat de gebruiker expliciet om merge/promotie vraagt.

## Milestone 3 - Weekplanner, goedkeuring, projecties en kamer-UX

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**
Datum acceptatie: **03-09-2026**
Branch: `agent/household-rebuild-v2`
Laatste geaccepteerde functionele checkpoint: `cd7a4ec77d4cc83c023942d4eb21f5af0234d6c2`
Geaccepteerde preview: `https://verhoog-family-e12lu3rgl-cverhoog-techs-projects.vercel.app`
Productie/main: **niet gewijzigd**.

### Wat in deze milestone is gebouwd en geaccepteerd

#### Weekplanner en persoonlijke goedkeuring

- Een conceptweekplan kan aan het gezin worden voorgesteld.
- Ieder toegewezen gezinslid beoordeelt uitsluitend het eigen deel.
- Accepteren en afwijzen werken per canonieke household-UID.
- Het plan wordt pas `ACTIVE` wanneer alle vereiste personen akkoord zijn.
- Bij afwijzen kan de maker of beheerder het voorstel terugzetten naar concept.
- Routines met een interval korter dan zeven dagen krijgen meerdere concrete occurrences binnen dezelfde week.
- Doorlopende routines behouden hun ritme over weekgrenzen heen.
- Per routine is er een expliciete keuze tussen doorlopend plannen en alleen het huidige weekplan.
- De rollende planningshorizon houdt vier toekomstige weken beschikbaar.
- Nieuwe kamers en routines worden veilig meegenomen in een reeds actieve lopende week.

#### Taken- en Agenda-projecties

- `CleaningOccurrence` blijft de enige canonieke source of truth voor één concrete schoonmaakbeurt.
- Actieve occurrences worden idempotent naar Taken en Agenda geprojecteerd.
- Meerdere routines voor dezelfde kamer, dag en verantwoordelijke worden één taak- en agendakaart met checklist.
- Refresh, een tweede toestel of opnieuw synchroniseren maakt geen duplicaten.
- Flexibele occurrences krijgen geen verzonnen tijdstip.
- Bestaande brongekoppelde projecties worden hergebruikt en ontbrekende afgeleide projecties kunnen worden hersteld.

#### Routineverzoeken en verdeling

- Het routineformulier bevat de zichtbare keuze `Wie doet deze routine?`.
- Een routine kan automatisch worden verdeeld, aan jezelf worden gekoppeld of aan een ander gezinslid worden gevraagd.
- Een verzoek aan een ander gezinslid verschijnt als duidelijke kaart met `Accepteren` en `Afwijzen`.
- Tot acceptatie wordt geen stilzwijgend extra werk aan de ontvanger toegewezen.
- Na acceptatie wordt toekomstige overlap bij een eerdere verantwoordelijke verwijderd om dubbele taken te voorkomen.

#### Kamer- en routinebeheer

- Kamers zijn standaard ingeklapt, zodat het overzicht compact blijft.
- Een kamer kan afzonderlijk worden uit- en ingeklapt.
- Bewerken van een kamer of routine scrollt direct naar het juiste formulier en focust het relevante veld.
- Routines kunnen direct vanuit het uitgeklapte kameroverzicht worden verwijderd met twee-tik bevestiging.
- De huishoudelijke kamervolgorde kan met Omhoog/Omlaag worden ingesteld.
- De gekozen kamervolgorde wordt persistent in Firebase opgeslagen en geldt op andere apparaten en voor andere huishoudleden.
- Snelle routinekeuzes tonen na Firebase-bevestiging een toast.
- De snelkeuze bewaart de werkelijke zichtbare positie in de actieve scrollcontainer, zodat de gebruiker niet naar boven wordt verplaatst.

#### Belangrijke regressiefixes

- Een geldige lege Taken-snapshot blijft niet meer hangen op `Taken synchroniseren`.
- De Planning-tab heeft geen verticale renderlus meer door concurrerende DOM-eigenaars.
- Toekomstige rolling plans worden niet onterecht als eigen goedkeuringsbron behandeld.
- Routine-overdracht en herprojectie blijven duplicaatvrij.

### Belangrijke checkpoints binnen deze milestone

- `6736d8d558179a977dd01b4b863f5c17865a40ce` - persoonlijke weekplangoedkeuring.
- `f1297713ad57ff3037447013f63e4831fbcd8f3a` - Planning-renderlus opgelost.
- `c70a5864f1819024edcb18521cf23252af0ee5a0` - herhalende occurrences en nieuwe routines in actieve week.
- `65e7201f5d959a81df0af3575b0225960c030656` - doorlopende planning, gegroepeerde projecties, routineverzoeken en compacte kamers.
- `5402f214548044b5b8d152c16e087a584ec311ef` - snelkeuze-toast en scrollbehoud.
- `cd7a4ec77d4cc83c023942d4eb21f5af0234d6c2` - directe routine-delete, persistente kamervolgorde en definitief scrollanker; real-device geaccepteerd.

### Bewust nog open na deze milestone

- Checklist-item afvinken in Taken terugschrijven naar `CleaningOccurrence`.
- Een volledige schoonmaaktaak afronden naar occurrence completion en completion log.
- Datum/tijd wijzigen vanuit Taken of Agenda terugschrijven naar de canonieke occurrence.
- Circulaire listenerloops voorkomen bij tweerichtingssynchronisatie.
- Benodigdheden, voorraad en Boodschappen-koppeling.
- Historie, overslaan, uitstellen, carry-forward en uitzonderingen.
- Definitieve premium visual polish conform de goedgekeurde visual spec.

## Milestone 2 - Weekplanner Foundation

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**
Datum afronding: **03-09-2026**
Branch: `agent/household-rebuild-v2`
Productie/main: **niet gewijzigd**.

### Geaccepteerde checkpoints

- `aae3e1570343926865e93be4f5c6d440f2d7e6c4` - pure canonieke due-semantiek; preview `https://verhoog-family-3k1azd44h-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- `ac39b48a9f49a5e7ff8cd4b26ac81e8cbae73820` - pure weekkandidatenselectie met actieve-kamercontrole; preview `https://verhoog-family-6hznik9kv-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- `452143aaeb443751bceb2121c086a391f7f44b0f` - pure kamerbundeling en totale minutenbelasting; preview `https://verhoog-family-59g7tbaec-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- `6e0de551bf25d009802421f5b0b193cdb57ace2d` - canonieke actieve householdleden en pure `FAIR_TIME`-verdeling; preview `https://verhoog-family-6jixo08af-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- `bd282e8b8a48929e296b982d10fb99955b0eec62` - pure generatie van één immutable `DRAFT`-conceptweekplan; preview `https://verhoog-family-k6sz7rwri-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- De daaropvolgende persistence-, goedkeurings- en projectiestappen zijn als samenhangende Milestone 3 real-device geaccepteerd op 03-09-2026.

### Foundation die hiermee is vastgelegd

- Atomaire persistence van `CleaningPlan` plus de bijbehorende canonieke `CleaningOccurrence`-records onder één household-scoped cleaning-root-transactie.
- Stabiele plan-ID per week en stabiele occurrence-identiteit; opnieuw berekenen en retries maken geen duplicaten.
- `CleaningPlan` bevat occurrence-referenties en afgeleide totalen; checklist, due-data en assignment zijn eigendom van `CleaningOccurrence`.
- Realtime Planning-UI met weektotalen, verdeling op geschatte tijd en kamerchecklists.
- Regeneratie is beperkt tot `DRAFT`; vervallen draft-occurrences worden atomair geannuleerd.

## Milestone 1 - Kamers + Routines Foundation

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**
Datum acceptatie: **01-09-2026**
Branch: `agent/household-rebuild-v2`
Laatste geaccepteerde herstelcheckpoint: `ea843a64f46899d63a7bb64d4adf2b5b7160e2da`
Geaccepteerde herstelpreview: `https://verhoog-family-gkjbqbmqu-cverhoog-techs-projects.vercel.app`
Productie/main: **niet gewijzigd**.

### Wat in deze milestone is gebouwd en geaccepteerd

- Veilige lazy-loaded Schoonmaken-shell met Overzicht / Planning / Kamers.
- Subtoggle Kamers / Gepland per kamer.
- Eén HouseholdContext-scoped `CleaningHouseholdRepository` met realtime aggregate read lifecycle.
- Canonieke Firebase-root `families/{householdId}/cleaning`.
- Kamers aanmaken, bewerken en veilig soft-deleten.
- Routines per kamer aanmaken, bewerken en veilig soft-deleten.
- Canonieke relatie: `CleaningRoutineItem.roomId` is de enige autoriteit voor routine -> kamer; geen tweede `room.routineIds`-bron.
- Routinevelden: titel, interval in dagen, geschatte tijd in minuten en prioriteit Basis / Normaal / Extra.
- iOS/Safari-validatiefix: iedere hele minuut van 1 t/m 480 is geldig; o.a. 10 minuten is real-device geverifieerd.
- Kamertype-afhankelijke snelle suggesties/templates.
- Een gekozen template wordt een normale `CleaningRoutineItem` en blijft daarna volledig bewerkbaar/verwijderbaar.
- Verwijderde template-routine komt opnieuw beschikbaar als suggestie.
- Geen optimistische dubbele UI-state; de actieve kamer/routinelijst wordt uit de realtime Firebase-snapshot opgebouwd.
- Firebase household-shared-data regels zijn gecontroleerd: Cleaning valt onder dezelfde actieve-household-member afscherming als overige gedeelde household data.

### Belangrijke geaccepteerde checkpoints binnen deze milestone

- `d782392b79c4435ed009b8e9550fdb50581b78bf` - kamer toevoegen + realtime lijst.
- `a4db246b2a45aadc4786989295a86d3fb0ccd903` - kamer bewerken.
- `7507e1d840290181eb9eb0e5baeebd57467fc2d2` - kamer soft-delete.
- `ca34bb7b6c07a5d633887201742c6080e8a10d7b` - eerste routine-per-kamer flow.
- `0f67c3a34470291819cab9a4471a1d8d92d96b64` - routine edit/remove UI.
- `99a64285c16e36a18f6a4c900226b71b0f78c0d0` - iOS minutenvalidatie.
- `488ccdacf252efd5e0aaee73b19bb3645af0ccc8` - snelle suggesties/templates per kamertype.
- `ea843a64f46899d63a7bb64d4adf2b5b7160e2da` - herstelcheckpoint na afgekeurde hardening; real-device opnieuw geaccepteerd.

### Afgekeurde hardening-poging - NIET meenemen als geaccepteerde functionaliteit

De commits `749c1d211ba936bbff79459b1a1dd1f7fff24423`, `61e24fdcd0a0b1bb643088c5008db567bc2cc289` en `8b53957dc697c74bbfb61cb1453d1a8e277e4db8` waren een poging om household-key-validatie en create-idempotency te verharden.

Deze checkpoint is **AFGEKEURD** nadat op iPhone een leeg Schoonmaken-scherm ontstond. Oorzaak: `cleaningDomain.js` was tijdens de wijziging grotendeels afgekapt, waardoor de module-import faalde. De branch is daarna via normale herstelcommits teruggebracht naar de bewezen werkende functionaliteit. Geen force-reset en `main` is niet aangeraakt.

Regel voor vervolg: deze hardening niet opnieuw combineren met functionele uitbreiding. Alleen opnieuw aanpakken in een afzonderlijk, klein checkpoint met volledige bestandsintegriteitscheck en real-device gate.

### Bekende technische schuld na Milestone 1

- `CleaningDomain.basePath()` gebruikt nog `safeId()` en kan ongeldige Firebase-keytekens stil vervangen. Dit moet later veilig worden omgezet naar expliciete validatie zonder bestaande household-identiteit te wijzigen.
- `createRoom` en `createRoutineItem` gebruiken nog Firebase `push()` en zijn daardoor niet volledig retry-idempotent op transportniveau.
- Gerichte planner-persistence/idempotentietests zijn aanwezig; brede contracttests voor household-isolatie, lifecycle en create-idempotentie van kamer/routine ontbreken nog.
- Kleine tap-targets in de huidige functionele UI moeten vóór de definitieve polish minimaal 44x44 worden.
- De huidige Kamers/Routines-UI is functionele fundering en niet het definitieve visuele ontwerp.

### Visuele eindrichting blijft ongewijzigd

De goedgekeurde visuele spec blijft leidend. De uiteindelijke module wordt premium, gelaagd en mobile-first met dezelfde markup in light/dark mode, rijke hero/statuskaarten, kamerbeelden/gradients, glass/shadows/statusaccenten en de eerder vastgelegde informatiehiërarchie. De huidige functionele kaarten en emoji's zijn geen vervanging van die eindrichting.

## Continuation checkpoint voor nieuwe chats

Een nieuwe chat moet `8d3527141c0f5fdebd6cc72d7c71013b31aa2cfe` als laatst real-device geaccepteerde **functionele** STEP 14 branchcheckpoint behandelen. STEP 13.6 blijft de historische baseline waarop deze workstream begon. Documentatiecommits daarna veranderen de functionele basis niet. De afgekeurde hardening-commits blijven geen geaccepteerde basis. Werk verder op `agent/household-rebuild-v2`, raak `main` niet aan zonder expliciete toestemming en houd `CleaningOccurrence` als canonieke source of truth.
