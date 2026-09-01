# FamilyApp - Schoonmaken Milestone Log

Dit bestand is het doorlopende implementatielog voor grote Schoonmaken-milestones. Het vult `FamilyApp-Schoonmaken-module-architectuur.md` en `FamilyApp-TODO-updated.txt` aan. Alleen een flow die expliciet op real-device is geaccepteerd mag hier als geaccepteerd worden gemarkeerd.

## Milestone 2 - Weekplanner Foundation

Status: **BEZIG**
Branch: `agent/household-rebuild-v2`
Productie/main: **niet gewijzigd**.

### Geaccepteerde checkpoints

- `aae3e1570343926865e93be4f5c6d440f2d7e6c4` - pure canonieke due-semantiek; preview `https://verhoog-family-3k1azd44h-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- `ac39b48a9f49a5e7ff8cd4b26ac81e8cbae73820` - pure weekkandidatenselectie met actieve-kamercontrole; preview `https://verhoog-family-6hznik9kv-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.
- `452143aaeb443751bceb2121c086a391f7f44b0f` - pure kamerbundeling en totale minutenbelasting; preview `https://verhoog-family-59g7tbaec-cverhoog-techs-projects.vercel.app`; real-device geaccepteerd op 01-09-2026.

### Huidige checkpoint ter acceptatie

- Pure selectie van actieve householdleden op canonieke UID.
- Standaard `FAIR_TIME`-verdeling op totale geschatte minuten.
- Nog geen conceptplan-/occurrence-writes, Taken-/Agenda-projecties of zichtbare Planning-UI.

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
- Contracttests voor household-isolatie, lifecycle en idempotentie ontbreken nog.
- Kleine tap-targets in de huidige functionele UI moeten vóór de definitieve polish minimaal 44x44 worden.
- De huidige Kamers/Routines-UI is functionele fundering en niet het definitieve visuele ontwerp.

### Visuele eindrichting blijft ongewijzigd

De goedgekeurde visuele spec blijft leidend. De uiteindelijke module wordt premium, gelaagd en mobile-first met dezelfde markup in light/dark mode, rijke hero/statuskaarten, kamerbeelden/gradients, glass/shadows/statusaccenten en de eerder vastgelegde informatiehiërarchie. De huidige functionele kaarten en emoji's zijn geen vervanging van die eindrichting.

### Wat hierna nog moet gebeuren

- Fase 0 verder afronden: harde repository/domain safety zonder regressie, expliciete integratiecontracten en contracttests.
- Fase 1 resterend: benodigdheden op routine-itemniveau en persoonlijke weergavevoorkeur Tijd / Aantal / Beide.
- Fase 2: weekplanner foundation - bepalen wat aan de beurt is, routines per kamer bundelen, belasting berekenen, eerlijk verdelen en een conceptplan voorstellen.
- Daarna: Taken-projectie, Agenda-projectie, goedkeuring/overdracht/notificaties, voorraad/Boodschappen, historie/uitzonderingen en uiteindelijke visuele polish.

### Continuation checkpoint voor nieuwe chats

Een nieuwe chat moet `452143aaeb443751bceb2121c086a391f7f44b0f` als laatst real-device geaccepteerde branchcheckpoint behandelen. De afgekeurde hardening-commits blijven geen geaccepteerde basis. Voor nieuwe wijzigingen eerst de actuele branch-tip en blobs ophalen en alleen kleine, afzonderlijk testbare wijzigingen maken.
