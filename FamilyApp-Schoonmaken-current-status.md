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
- Functioneel checkpoint: `f58c772c92df42a5762e97b425800d42dfd79d7b`.
- Geaccepteerde preview: `https://verhoog-family-6t8322644-cverhoog-techs-projects.vercel.app`.
- Acceptatiedatum: **03-09-2026**.
- `main`: **niet gewijzigd**.

## Actuele fase-status

- Fase A - veilige module-shell: **AFGEROND / real-device geaccepteerd**.
- Fase 0 - architectuur/repository-fundament: **BEZIG; kerncontracten actief**.
- Fase 1 - Kamers + routines: **FUNCTIONEEL VER GEVORDERD / huidige UX real-device geaccepteerd**.
- Fase 2 - Weekplanner: **FUNCTIONEEL WERKEND / persoonlijke goedkeuring en herhaling real-device geaccepteerd**.
- Fase 3 - Taken-integratie: **HEEN- EN TERUGSYNC FUNCTIONEEL WERKEND / real-device geaccepteerd**.
- Fase 4 - Agenda-integratie: **HEEN- EN TERUGSYNC VOOR PLANNING WERKEND / real-device geaccepteerd**.
- Fase 5 - Boodschappen / voorraad: **OPEN binnen Schoonmaken**.
- Fase 6 - Goedkeuring / overdracht: **PERSOONLIJKE PLANAPPROVAL + ROUTINEVERZOEKEN WERKEND**.
- Fase 7 - Historie / uitzonderingen: **DEELS; completion logs aanwezig, bredere historie/uitzonderingen nog open**.
- Fase 8 - Visuele polish / slimme inzichten: **DEELS; Home-integratie geaccepteerd, definitieve Schoonmaken-polish nog open**.

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

### Reverse sync / uitvoering

- Checklistregels afvinken in een geprojecteerde schoonmaaktaak schrijft terug naar het juiste checklist-item van de canonieke `CleaningOccurrence`.
- Bij een gegroepeerde kamerkaart blijven de gekoppelde occurrences afzonderlijk correct; één vinkje voltooit niet automatisch alle routines.
- Wanneer alle checklistregels van een occurrence klaar zijn, wordt die occurrence canoniek `COMPLETED` en wordt een completion log opgeslagen.
- Een checklistregel opnieuw openen zet de bijbehorende occurrence weer actief zonder een nieuwe duplicate occurrence te maken.
- Een volledige schoonmaaktaak afronden/hernemen volgt de canonieke checkliststatus.
- Datum/tijd aanpassen vanuit Taken schrijft terug naar de occurrence en laat het afgeleide Agenda-item meeverhuizen.
- Datum/tijd aanpassen vanuit Agenda schrijft terug naar de occurrence en laat de afgeleide Taak meeverhuizen.
- Een leeg tijdveld blijft een flexibele schoonmaakbeurt; er wordt geen tijdstip verzonnen.
- Afgeleide schoonmaaktaken en schoonmaakafspraken kunnen niet als canonieke bron vanuit Taken/Agenda worden verwijderd; beheer blijft in Schoonmaken.
- Projectiewrites lopen buiten de expliciete gebruikersmutatie-wrappers om, zodat de reverse sync geen listener-loop met zichzelf maakt.
- De rules-safe writer gebruikt de geautoriseerde Cleaning-root als canonieke transactieboundary en herstelt daarna de afgeleide projecties.

### Home-integratie

- De voormalige Posts-hero op Home is nu de tegel **Schoonmaken** en opent direct de Schoonmaken-module.
- De Schoonmaken-tegel telt uitsluitend open canonieke schoonmaakprojecties met een datum van vandaag of eerder.
- Toekomstige, afgeronde, geannuleerde, overgeslagen en ongedateerde schoonmaaktaken tellen niet mee op deze tegel.
- De algemene Taken-tegel telt uitsluitend open taken met een datum van vandaag of eerder.
- Toekomstige, afgeronde, geannuleerde, overgeslagen en ongedateerde taken tellen niet mee op de Taken-tegel.
- Een schoonmaaktaak kan terecht zowel in het algemene Taken-aantal als in de specifieke Schoonmaken-uitsplitsing zitten.
- Home gebruikt een lokale kalenderdatum voor de grens Vandaag, zodat laat op de avond geen UTC-dagverschuiving ontstaat.

### Belangrijke regressiefixes die in de huidige basis zitten

- Lege Taken-snapshot blijft niet meer hangen op `Taken synchroniseren`.
- Planning-tab heeft geen verticale renderloop meer door concurrerende UI-eigenaars.
- Snelkeuze-toast veroorzaakt geen bewuste scroll naar het formulier of naar de bovenkant.
- Room-order controls en directe routine-delete zijn render-loop veilig ingericht.
- Reverse sync veroorzaakt geen duplicaten bij refresh of herprojectie.
- Een oudere Task-snapshot mag een nieuwer canoniek checklistresultaat niet als projectie-authoriteit overschrijven.

## Bewust nog niet afgerond

### Overige Schoonmaken-onderdelen

- Benodigdheden koppelen aan routines en per kamer/taak tonen.
- Voorraad/Boodschappen-koppeling.
- Uitgebreidere historie, overslaan, uitstellen, carry-forward en uitzonderingsflows.
- Persoonlijke weergavevoorkeur Tijd / Aantal / Beide.
- Definitieve premium visual polish conform `FamilyApp-Schoonmaken-visual-spec.md`.
- Kleine resterende tap-targets naar minimaal 44x44 waar nodig.
- Household-key-validatie en create-idempotency later afzonderlijk hardenen; niet combineren met functionele uitbreidingen.

## Guardrail voor vervolgchats

- Behandel `f58c772c92df42a5762e97b425800d42dfd79d7b` als het laatst door de gebruiker real-device geaccepteerde **functionele** checkpoint.
- Reverse execution sync is real-device geaccepteerd; behandel `CleaningOccurrence` desondanks nog steeds als de enige canonieke source of truth.
- Documentatiecommits na dit checkpoint veranderen de functionele acceptatiebasis niet.
- Werk uitsluitend verder op `agent/household-rebuild-v2` zolang de gebruiker niet expliciet anders zegt.
- `main` niet aanraken of mergen zonder expliciet verzoek van de gebruiker.
- Taken en Agenda blijven afgeleide projecties, ook nu gebruikerswijzigingen gecontroleerd terug naar Cleaning kunnen worden vertaald.
- Nieuwe functionele wijzigingen in samenhangende, testbare checkpoints uitvoeren en opnieuw via unieke preview op iPhone laten accepteren.
