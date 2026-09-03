# FamilyApp - Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **03-09-2026**
Branch: `agent/household-rebuild-v2`

Deze statuspagina is de compacte actuele uitvoeringsbron naast:

- `FamilyApp-Schoonmaken-module-architectuur.md` - canonieke functionele/technische architectuur;
- `FamilyApp-Schoonmaken-visual-spec.md` - canonieke visuele eindrichting;
- `FamilyApp-Schoonmaken-milestone-log.md` - geaccepteerde grote milestones en regressielog;
- `FamilyApp-TODO-updated.txt` - brede FamilyApp-TODO.

## Laatst real-device geaccepteerde checkpoint

- Status: **WERKEND / GEACCEPTEERD OP IPHONE**.
- Functioneel checkpoint: `cd7a4ec77d4cc83c023942d4eb21f5af0234d6c2`.
- Geaccepteerde preview: `https://verhoog-family-e12lu3rgl-cverhoog-techs-projects.vercel.app`.
- Acceptatiedatum: **03-09-2026**.
- `main`: **niet gewijzigd**.

## Actuele fase-status

- Fase A - veilige module-shell: **AFGEROND / real-device geaccepteerd**.
- Fase 0 - architectuur/repository-fundament: **BEZIG; kerncontracten actief**.
- Fase 1 - Kamers + routines: **FUNCTIONEEL VER GEVORDERD / huidige UX real-device geaccepteerd**.
- Fase 2 - Weekplanner: **FUNCTIONEEL WERKEND / persoonlijke goedkeuring en herhaling real-device geaccepteerd**.
- Fase 3 - Taken-integratie: **HEENPROJECTIE WERKEND / real-device geaccepteerd; reverse sync nog open**.
- Fase 4 - Agenda-integratie: **HEENPROJECTIE WERKEND / real-device geaccepteerd; reverse sync nog open**.
- Fase 5 - Boodschappen / voorraad: **OPEN binnen Schoonmaken**.
- Fase 6 - Goedkeuring / overdracht: **PERSOONLIJKE PLANAPPROVAL + ROUTINEVERZOEKEN WERKEND**.
- Fase 7 - Historie / uitzonderingen: **OPEN**.
- Fase 8 - Visuele polish / slimme inzichten: **OPEN**.

## Wat nu real-device is geaccepteerd

### Kamers

- Kamers aanmaken, bewerken en veilig soft-deleten.
- Kamers staan in het Kamers-overzicht standaard ingeklapt om eindeloos scrollen te voorkomen.
- Kamer open/dicht werkt zonder de Planning-renderloop.
- Bewerken van een kamer scrollt direct naar het bewerkformulier bovenaan en focust het relevante veld.
- Huishouden kan de kamervolgorde zelf instellen met Omhoog/Omlaag.
- Kamervolgorde wordt als `sortOrder` persistent in Firebase opgeslagen en blijft na refresh/apparaatwissel behouden.
- Nieuwe kamers zonder expliciete positie vallen deterministisch achter bestaande gerangschikte kamers.

### Routines

- Meerdere routines per kamer.
- Titel, interval, geschatte minuten en prioriteit Basis / Normaal / Extra.
- Eigen routine aanmaken en bestaande routine bewerken.
- Routine direct verwijderen vanuit het uitgeklapte kameroverzicht met twee-tik bevestiging; niet eerst Bewerken nodig.
- Verwijderen blijft canoniek een veilige soft-delete.
- Bewerken/toewijzen scrollt direct naar het routineformulier en focust het relevante veld.
- Kamertype-afhankelijke snelle suggesties/templates blijven gewone canonical `CleaningRoutineItem`-records na toevoegen.
- Snelkeuze toont na Firebase-bevestiging de toast `Routine toegevoegd ✓`.
- Snelkeuze gebruikt viewport/scroll-container anchoring zodat de gebruiker op dezelfde plek in de lijst blijft.

### Routine-toewijzing aan gezinsleden

- Routineformulier bevat expliciet `Wie doet deze routine?`.
- Keuzes: automatisch eerlijk verdelen, jezelf of een ander actief householdlid.
- Toewijzen aan jezelf geldt direct.
- Toewijzen aan een ander gezinslid maakt een expliciet verzoek.
- Ontvanger ziet bovenaan Schoonmaken een duidelijke kaart met `Accepteren` en `Afwijzen`.
- Een nog niet geaccepteerde overdracht deelt niet stilzwijgend extra werk uit.
- Na acceptatie wordt toekomstige overlap bij de oude verantwoordelijke opgeschoond.

### Herhaling / weekplanning

- Routine kan `Doorlopend` of `Alleen dit weekplan` zijn.
- Doorlopende routines worden rollend meerdere weken vooruit gepland; huidige horizon is vier weken.
- Interval blijft doorlopen over weekgrenzen heen in plaats van elke maandag opnieuw te beginnen.
- Een routine kan meerdere concrete `CleaningOccurrence`-records binnen één week opleveren wanneer het interval dat vereist.
- Nieuwe routines tijdens een actieve week worden veilig in de lopende planning verwerkt.
- Persoonlijke goedkeuring blijft per toegewezen UID; accepteren en afwijzen werken.
- Plan wordt pas volledig ACTIVE wanneer alle vereiste goedkeuringen aanwezig zijn.

### Taken + Agenda projecties

- `CleaningOccurrence` blijft source of truth voor één concrete schoonmaakbeurt.
- ACTIVE occurrences worden idempotent geprojecteerd naar Taken en Agenda.
- Meerdere routines voor dezelfde kamer + dag + verantwoordelijke worden één schoonmaaktaak/Agenda-item met checklist, niet losse kaarten per routine.
- Projecties hebben deterministic/source-linked identifiers en worden niet gedupliceerd bij refresh.
- Flexibele occurrences krijgen geen verzonnen tijdstip.
- Verwijderde/missende afgeleide projecties kunnen vanuit de canonieke occurrence worden hersteld.

### Belangrijke regressiefixes die in dit checkpoint zitten

- Lege Taken-snapshot blijft niet meer hangen op `Taken synchroniseren`.
- Planning-tab heeft geen verticale renderloop meer door concurrerende UI-eigenaars.
- Snelkeuze-toast veroorzaakt geen bewuste scroll naar het formulier of naar de bovenkant.
- Room-order controls en directe routine-delete zijn render-loop veilig ingericht.

## Bewust nog niet afgerond

### Reverse sync / uitvoering

De huidige integratie is nog primair:

`CleaningOccurrence -> Task + Calendar`

Nog open voor een volgende milestone:

- checklist-item afvinken in Taken -> terugschrijven naar `CleaningOccurrence`;
- volledige schoonmaaktaak afronden -> occurrence completion + completion log;
- datum/tijd wijzigen vanuit Taken -> canonieke occurrence aanpassen;
- Agenda-item verplaatsen -> canonieke occurrence aanpassen;
- voorkomen van circulaire listenerloops bij tweerichtingssynchronisatie;
- duidelijke delete-/reschedule-semantiek waarbij Task/Agenda nooit een tweede source of truth wordt.

### Overige open Schoonmaken-onderdelen

- Benodigdheden koppelen aan routines en per kamer/taak tonen.
- Voorraad/Boodschappen-koppeling.
- Historie, uitzonderingen, overslaan/uitstellen en completere completion-flow.
- Persoonlijke weergavevoorkeur Tijd / Aantal / Beide.
- Definitieve premium visual polish conform `FamilyApp-Schoonmaken-visual-spec.md`.
- Kleine resterende tap-targets naar minimaal 44x44 waar nodig.
- Household-key-validatie en create-idempotency later afzonderlijk hardenen; niet combineren met functionele uitbreidingen.

## Guardrail voor vervolgchats

- Behandel `cd7a4ec77d4cc83c023942d4eb21f5af0234d6c2` als het laatst door de gebruiker real-device geaccepteerde **functionele** checkpoint.
- Documentatiecommits na dat checkpoint veranderen de functionele acceptatiebasis niet.
- Werk uitsluitend verder op `agent/household-rebuild-v2` zolang de gebruiker niet expliciet anders zegt.
- `main` niet aanraken of mergen zonder expliciet verzoek van de gebruiker.
- `CleaningOccurrence` blijft canonieke source of truth; Taken en Agenda blijven afgeleide projecties.
- Nieuwe functionele wijzigingen in samenhangende, testbare checkpoints uitvoeren en opnieuw via unieke preview op iPhone laten accepteren.
