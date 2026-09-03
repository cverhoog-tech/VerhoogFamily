# FamilyApp - Schoonmaken Milestone Log

Dit bestand is het doorlopende implementatielog voor grote Schoonmaken-milestones. Het vult `FamilyApp-Schoonmaken-module-architectuur.md` en `FamilyApp-TODO-updated.txt` aan. Alleen een flow die expliciet op real-device is geaccepteerd mag hier als geaccepteerd worden gemarkeerd.

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

Een nieuwe chat moet `cd7a4ec77d4cc83c023942d4eb21f5af0234d6c2` als laatst real-device geaccepteerde **functionele** branchcheckpoint behandelen. Documentatiecommits daarna veranderen de functionele basis niet. De afgekeurde hardening-commits blijven geen geaccepteerde basis. Werk verder op `agent/household-rebuild-v2`, raak `main` niet aan zonder expliciete toestemming en houd `CleaningOccurrence` als canonieke source of truth.
