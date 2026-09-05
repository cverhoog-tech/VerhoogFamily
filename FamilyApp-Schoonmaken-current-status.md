# FamilyApp - Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **05-09-2026**
Branch: `agent/household-rebuild-v2`
Bovenliggende roadmapstap: **STEP 14 - Schoonmaken**

Deze statuspagina is de compacte actuele uitvoeringsbron naast:

- `FamilyApp-Schoonmaken-module-architectuur.md` - canonieke functionele/technische architectuur;
- `FamilyApp-Schoonmaken-visual-spec.md` - canonieke visuele eindrichting;
- `FamilyApp-Schoonmaken-milestone-log.md` - geaccepteerde grote milestones en regressielog;
- `FamilyApp-TODO-updated.txt` - brede FamilyApp-roadmap/TODO inclusief STEP 14.

## Laatst real-device geaccepteerde checkpoint

- Status: **WERKEND / GEACCEPTEERD OP IPHONE**.
- Functioneel checkpoint: `eccec8aef1257d8777c15ff8ae66bcd7e351a0f8`.
- Geaccepteerde preview: `https://verhoog-family-2h0filnik-cverhoog-techs-projects.vercel.app`.
- Acceptatiedatum: **05-09-2026**.
- CI bij functioneel checkpoint: **Household Rebuild Contracts groen + Vercel success/READY**.
- `main`: **niet gewijzigd**.

Documentatiecommits ná dit functionele checkpoint veranderen de functionele acceptatiebasis niet.

## Actuele STEP 14 fase-status

- Fase A - veilige module-shell: **AFGEROND / real-device geaccepteerd**.
- Fase 0 - architectuur/repository-fundament: **KERN AFGEROND; gerichte hardening later afzonderlijk**.
- Fase 1 - Kamers + routines: **FUNCTIONEEL VRIJWEL AFGEROND / huidige UX real-device geaccepteerd; Tijd/Aantal/Beide nog open**.
- Fase 2 - Weekplanner: **AFGEROND / persoonlijke goedkeuring, doorlopende intervallen en rolling horizon real-device geaccepteerd**.
- Fase 3 - Taken-integratie: **GROTENDEELS AFGEROND / heen- en terugsync real-device geaccepteerd; uitzonderings-UX nog deels open**.
- Fase 4 - Agenda-integratie: **FUNCTIONEEL AFGEROND / reverse sync, pauze-hervatmarker, conflictcheck en alternatieve tijden real-device geaccepteerd**.
- Fase 5 - Boodschappen / voorraad: **FUNCTIONEEL AFGEROND / weekvoorraad, expliciete Shopping-add, aankoop-terugkoppeling en Niet kopen real-device geaccepteerd**.
- Fase 6 - Goedkeuring / notificaties: **DEELS; persoonlijke planapproval en routineverzoeken werken, tegenvoorstellen/reminders/multi-person flow nog open**.
- Fase 7 - Historie / uitzonderingen: **DEELS; completion history en pauzeflow aanwezig, bredere beschikbaarheid/historie/progressie nog open**.
- Fase 8 - Visuele polish / slimme inzichten: **DEELS; Home, live overview en slimme benodigdheden aanwezig, definitieve premium polish/insights nog open**.

## Wat nu real-device is geaccepteerd

### Kamers

- Kamers aanmaken, bewerken en veilig soft-deleten.
- Kamers staan in het Kamers-overzicht standaard ingeklapt om eindeloos scrollen te voorkomen.
- Kamer open/dicht werkt zonder de Planning-renderloop.
- Bewerken van een kamer scrollt direct naar het bewerkformulier bovenaan en focust het relevante veld.
- Huishouden kan de kamervolgorde zelf instellen met Omhoog/Omlaag.
- Kamervolgorde wordt als `sortOrder` persistent in Firebase opgeslagen en blijft na refresh/apparaatwissel behouden.
- Bij een nieuwe kamer staat **kamertype vóór naam**.
- Voor standaardkamertypes is de naam optioneel; een lege naam wordt automatisch aangemaakt.
- Dubbele standaardnamen krijgen deterministisch een volgnummer, bijvoorbeeld `Woonkamer 2`.

### Routines

- Meerdere routines per kamer.
- Titel, interval, geschatte minuten en prioriteit Basis / Normaal / Extra.
- Eigen routine aanmaken en bestaande routine bewerken.
- Routine direct verwijderen vanuit het kameroverzicht met veilige bevestiging.
- Verwijderen blijft canoniek een veilige soft-delete.
- Bewerken/toewijzen scrollt direct naar het routineformulier en focust het relevante veld.
- Kamertype-afhankelijke snelle suggesties/templates blijven gewone canonieke `CleaningRoutineItem`-records na toevoegen.
- Snelkeuze toont na Firebase-bevestiging de toast `Routine toegevoegd ✓` en behoudt de zichtbare scrollpositie.
- Bewerk/Toewijs/Verwijder-acties zijn compact via een `•••`-menu ontsloten zonder een tweede writerlaag te introduceren.

### Routine-toewijzing aan gezinsleden

- Routineformulier bevat expliciet `Wie doet deze routine?`.
- Keuzes: automatisch eerlijk verdelen, jezelf of een ander actief householdlid.
- Toewijzen aan jezelf geldt direct.
- Toewijzen aan een ander gezinslid maakt een expliciet verzoek.
- Ontvanger ziet een duidelijke kaart met `Accepteren` en `Afwijzen`.
- Een nog niet geaccepteerde overdracht deelt niet stilzwijgend extra werk uit.
- Na acceptatie wordt toekomstige overlap bij de oude verantwoordelijke opgeschoond.

### Herhaling / weekplanning

- Routine kan `Doorlopend` of `Alleen dit weekplan` zijn.
- Doorlopende routines worden rollend meerdere weken vooruit gepland; huidige horizon is **vier weken**.
- Interval blijft doorlopen over weekgrenzen heen in plaats van elke maandag opnieuw te beginnen.
- Een routine kan meerdere concrete `CleaningOccurrence`-records binnen één week opleveren wanneer het interval dat vereist.
- Nieuwe routines tijdens een actieve week worden veilig in de lopende planning verwerkt.
- Persoonlijke goedkeuring blijft per toegewezen UID; accepteren en afwijzen werken.
- Plan wordt pas volledig ACTIVE wanneer alle vereiste goedkeuringen aanwezig zijn.
- Planning toont apart of eigen akkoord nodig is, op anderen wordt gewacht of het plan actief is.
- `Planning vernieuwen` kan stale huidige planreferenties na kamer/routinewijzigingen gecontroleerd laten opschonen.

### Tijdelijke pauzes

- Een individuele routine of een hele kamer kan tijdelijk worden gepauzeerd.
- Tijdens een pauze verdwijnt het actuele schoonmaakwerk uit de actieve planning.
- Bij een eindige pauze verschijnt een aparte hervatmarker in Agenda.
- **Pauze is geen stop:** de resterende countdown naar de volgende echte beurt wordt bevroren.
- Na hervatten wordt de eerste echte schoonmaakbeurt geplaatst op basis van die resterende countdown.
- Daarna loopt `intervalDays` weer normaal door: +interval, +interval, enzovoort.
- Als de routine bij pauzeren al due was, mag de eerste echte beurt op de hervatdag vallen.
- Een pauze `Tot ik hervat` maakt geen toekomstige echte beurten totdat handmatig wordt hervat.
- Een langere kamerpauze heeft voorrang op een kortere individuele routinepauze.
- De eerder geaccepteerde verantwoordelijke blijft over de pauze heen behouden.
- Ook oudere reeds bestaande pauzes kunnen assignment continuity uit een geldige geaccepteerde niet-rollende plancontext terugvinden.
- De rolling planner gebruikt voor eindige pauzes alleen een planning-shadow; de canonieke routine blijft gedurende de pauze `paused:true`.

### Benodigdheden / voorraad / Boodschappen

- Benodigdheden kunnen direct vanuit de kamerflow worden bekeken en beheerd.
- Benodigdheden worden canoniek via `routine.supplyIds` aan routines gekoppeld; er is geen tweede room-level waarheid.
- Nieuwe benodigdheden kunnen rechtstreeks vanuit de Benodigdheden-popup worden aangemaakt en aan een routine gekoppeld.
- `Gebruikt bij` laat zien welke routines een benodigdheid gebruiken.
- Voorraad kent bewust drie statussen: `IN_STOCK`, `LOW`, `OUT`; geen hoeveelhedenadministratie naast Boodschappen.
- Slimme benodigdhedensuggesties zijn deterministisch/adviserend en schrijven niet automatisch canonieke relaties.
- Weekvoorraad kijkt naar echte actieve schoonmaakbeurten in de komende **7 dagen** en toont alleen gekoppelde benodigdheden met status Bijna op/Op.
- Toevoegen aan Boodschappen gebeurt alleen na een expliciete gebruikersactie.
- Na een afgevinkte Cleaning-aankoop kan FamilyApp expliciet voorstellen de voorraad weer op `IN_STOCK` te zetten; dit gebeurt nooit automatisch.
- Een item in Weekvoorraad kan via `Niet kopen`/`×` uit het persoonlijke weekoverzicht worden verborgen.
- Verborgen Weekvoorraad-items worden niet meegenomen bij `naar Boodschappen` en kunnen via `verborgen items · herstellen` terugkomen.
- Als exact het door Cleaning aangemaakte open Shopping-item veilig kan worden herkend, wordt dat bij `Niet kopen` ook uit de boodschappenlijst verwijderd; handmatige of onzekere items blijven beschermd.
- Supply rendering gebruikt een gecachte repository-snapshot en item-level writes voor betere performance.

### Agenda-conflicten / weekassist

- FamilyApp vergelijkt concrete getimede schoonmaakbeurten met de Agenda voor de komende 7 dagen.
- Een overlap met een andere afspraak van dezelfde expliciete persoon wordt als conflict getoond.
- Bij onzekere duur/deelnemer wordt het resultaat bewust als `MOGELIJK` behandeld in plaats van als hard conflict.
- Flexibele schoonmaakbeurten krijgen geen verzonnen tijd en worden niet als getimed conflict behandeld.
- FamilyApp stelt maximaal drie vrije alternatieve tijden op dezelfde dag voor, op een halfuurraster tussen 08:00 en 21:00.
- Er wordt nooit automatisch verplaatst.
- Alleen na een expliciete tik wordt via de bestaande canonical reverse-sync runtime de CleaningOccurrence verplaatst, waarna Taken/Agenda opnieuw volgen.

### Taken + Agenda projecties

- `CleaningOccurrence` blijft source of truth voor één concrete schoonmaakbeurt.
- ACTIVE occurrences worden idempotent geprojecteerd naar Taken en Agenda.
- Meerdere routines voor dezelfde kamer + dag + verantwoordelijke worden één schoonmaaktaak/Agenda-item met checklist, niet losse kaarten per routine.
- Projecties hebben deterministic/source-linked identifiers en worden niet gedupliceerd bij refresh.
- Flexibele occurrences krijgen geen verzonnen tijdstip.
- Verwijderde/missende afgeleide projecties kunnen vanuit de canonieke occurrence worden hersteld.

### Reverse sync / uitvoering

- Checklistregels afvinken in een geprojecteerde schoonmaaktaak schrijft terug naar het juiste checklist-item van de canonieke `CleaningOccurrence`.
- Bij een gegroepeerde kamerkaart blijven gekoppelde occurrences afzonderlijk correct; één vinkje voltooit niet automatisch alle routines.
- Wanneer alle checklistregels van een occurrence klaar zijn, wordt die occurrence canoniek `COMPLETED` en wordt een completion log opgeslagen.
- Een checklistregel opnieuw openen zet de bijbehorende occurrence weer actief zonder duplicate occurrence.
- Een volledige schoonmaaktaak afronden/hernemen volgt de canonieke checkliststatus.
- Datum/tijd aanpassen vanuit Taken schrijft terug naar de occurrence en laat het afgeleide Agenda-item meeverhuizen.
- Datum/tijd aanpassen vanuit Agenda schrijft terug naar de occurrence en laat de afgeleide Taak meeverhuizen.
- Een leeg tijdveld blijft een flexibele schoonmaakbeurt; er wordt geen tijdstip verzonnen.
- Afgeleide schoonmaaktaken en schoonmaakafspraken kunnen niet als canonieke bron vanuit Taken/Agenda worden verwijderd; beheer blijft in Schoonmaken.
- Projectiewrites lopen buiten de expliciete gebruikersmutatie-wrappers om, zodat reverse sync geen listener-loop met zichzelf maakt.
- De rules-safe writer gebruikt de geautoriseerde Cleaning-root als canonieke transactieboundary en herstelt daarna afgeleide projecties.

### Home-integratie

- De voormalige Posts-hero op Home is nu de tegel **Schoonmaken** en opent direct de Schoonmaken-module.
- De Schoonmaken-tegel telt uitsluitend open canonieke schoonmaakprojecties met een datum van vandaag of eerder.
- Toekomstige, afgeronde, geannuleerde, overgeslagen en ongedateerde schoonmaaktaken tellen niet mee op deze tegel.
- De algemene Taken-tegel telt uitsluitend open taken met een datum van vandaag of eerder.
- Een schoonmaaktaak kan terecht zowel in het algemene Taken-aantal als in de specifieke Schoonmaken-uitsplitsing zitten.
- Home gebruikt een lokale kalenderdatum voor de grens Vandaag, zodat laat op de avond geen UTC-dagverschuiving ontstaat.

### Belangrijke regressiefixes die in de huidige basis zitten

- Lege Taken-snapshot blijft niet meer hangen op `Taken synchroniseren`.
- Planning-tab heeft geen verticale renderloop meer door concurrerende UI-eigenaars.
- Approval UI blijft de enige eigenaar van de canonieke approval-copy.
- Snelkeuze-toast veroorzaakt geen bewuste scroll naar het formulier of naar de bovenkant.
- Room-order controls en directe routine-delete zijn render-loop veilig ingericht.
- Reverse sync veroorzaakt geen duplicaten bij refresh of herprojectie.
- Een oudere Task-snapshot mag een nieuwer canoniek checklistresultaat niet als projectie-authoriteit overschrijven.
- Rolling plans mogen nooit hun eigen standing consent worden.
- Eindige pauzes mogen niet als blanket-exclusion de recurrence chain afbreken.
- Pauzes genereren geen backlog van alle gemiste schoonmaakbeurten.
- WeekAssist bezit geen eigen Firebase-transactie en mag Planning approval-copy niet herschrijven.
- Conflicten en weekvoorraad blijven adviserend totdat de gebruiker expliciet handelt.

## Implementatie aanwezig maar apart blijven valideren

- Opruiming van open, afgeleide Cleaning Task/Agenda-projecties waarvan de canonieke bron door kamer/routineverwijdering niet meer actief is.
- Opruiming van open `source: cleaning` Boodschappen-items wanneer geen actieve kamer/routine de gekoppelde benodigdheid meer vereist.
- Completed historie en handmatig aangemaakte Taken/Agenda/Boodschappen-items worden daarbij bewust niet automatisch verwijderd.

Deze lifecycle-opruiming blijft conservatief: onbekende legacy-records worden niet op basis van gokwerk verwijderd. Een nieuwe vervolgchat mag dit niet ruimer maken zonder gerichte test/real-device validatie.

## Bekende technische caveat

- `ShoppingListStore.normalizeItemInput()` bewaart op dit checkpoint nog niet gegarandeerd de Cleaning-specifieke metadata `cleaningSupplyId`, `cleaningOccurrenceIds` en `cleaningRoomIds`.
- De geaccepteerde WeekAssist-flow kan daarom voor oudere/huidige Shopping-records veilig terugvallen op een **exacte unieke supplynaam**.
- Dit is functioneel geaccepteerd, maar expliciete ID-persistentie door de Shopping-store is nog een afzonderlijke toekomstige hardening en mag niet stilzwijgend als opgelost worden beschouwd.

## Bewust nog niet afgerond binnen STEP 14

- Tegenvoorstellen bij overdracht en uitgebreidere samenwerkings/multi-person flows.
- Gebundelde beperkte Cleaning-notificaties/reminders.
- Vakantie / drukke week / ziekte / tijdelijk niet beschikbaar.
- Rijkere kamer- en routinehistorie en gezamenlijke progressie.
- Expliciete uitzonderings-UX voor doorschuiven / deze week opnieuw / overslaan / overname / hulp waar nog nodig.
- Persoonlijke weergavevoorkeur Tijd / Aantal / Beide.
- Definitieve premium visual polish conform `FamilyApp-Schoonmaken-visual-spec.md`.
- Relevante feed-events en subtiele achievements.
- Data-gedreven frequentie-/planningsvoorstellen en eventuele Family Assistant-inzichten zonder automatische structurele wijzigingen.
- Kleine resterende tap-targets naar minimaal 44x44 waar nodig.
- Household-key-validatie en create-idempotency later afzonderlijk hardenen; niet combineren met functionele uitbreidingen.

## Resterende hoofdblokken van STEP 14

1. **Samenwerking afronden** - tegenvoorstellen, uitgebreidere overdracht/multi-person flows en notificaties/reminders.
2. **Uitzonderingen + historie** - vakantie, ziekte, drukke week, tijdelijke afwezigheid en rijkere historie.
3. **Laatste functionele gaten + hardening** - Tijd/Aantal/Beide, gerichte cleanup-validatie en beperkte technische hardening.
4. **Definitieve polish** - premium visual spec, microinteracties, gezamenlijke progressie/feed-events en later slimme inzichten.

## Guardrail voor vervolgchats

- Behandel `eccec8aef1257d8777c15ff8ae66bcd7e351a0f8` als het laatst door de gebruiker real-device geaccepteerde **functionele** checkpoint.
- STEP 14 = Schoonmaken; STEP 13.6 is de historische stabiele baseline waar deze workstream op is gestart.
- Reverse execution sync, pause cadence, Agenda-conflictcheck, 7-daagse Weekvoorraad en `Niet kopen` zijn real-device geaccepteerd; `CleaningOccurrence` blijft desondanks de enige canonieke source of truth.
- Documentatiecommits na dit checkpoint veranderen de functionele acceptatiebasis niet.
- Werk uitsluitend verder op `agent/household-rebuild-v2` zolang de gebruiker niet expliciet anders zegt.
- `main` niet aanraken of mergen zonder expliciet verzoek van de gebruiker.
- Taken en Agenda blijven afgeleide projecties, ook nu gebruikerswijzigingen gecontroleerd terug naar Cleaning kunnen worden vertaald.
- Nieuwe functionele wijzigingen in samenhangende, testbare checkpoints uitvoeren en opnieuw via unieke preview op iPhone laten accepteren.
