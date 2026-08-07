# FamilyApp Beta 1 — Release Plan

## Doel
Na deze release kan FamilyApp veilig live worden getest door Shane en Esra met ieder een eigen Google-account, gekoppeld aan hetzelfde household. De release focust op betrouwbare realtime samenwerking, echte progression, premium mobiele UX en een bruikbare offline/degraded ervaring.

## Werkwijze
- Geen losse patches meer voor deze scope.
- Werk per fase op een aparte branch.
- Data-architectuur en security eerst; UI daarna.
- Bestaande gebruikersdata migreren in plaats van verwijderen.
- Gedeelde online data gebruikt Firebase als bron van waarheid; lokale opslag is cache/offline fallback waar passend.
- Privédata wordt niet alleen in de UI verborgen maar door Firebase Security Rules afgeschermd.
- Iedere fase wordt gecontroleerd voordat deze naar main gaat.
- Na alle fases volgt een twee-account/twee-device acceptatietest voordat Beta 1 als live wordt beschouwd.

## Scope

### 1. Meer-menu
Tik/klik buiten een geopend Meer-menu sluit het menu direct zonder de onderliggende pagina tegelijk te activeren.

### 2. Taken — twee premium views
- Bestaande cardweergave behouden.
- Premium compacte checklistweergave toevoegen met categorie-icoon, taaknaam, assignee-avatar, subtiele XP/deadline en checkbox.
- Beide views gebruiken exact dezelfde taakdata en completion/progression-logica.
- View-keuze per gebruiker onthouden.

### 3. Household presence
- Online-status per gezinslid.
- Laatst actief: minuten/uren/gisteren.
- Optioneel huidige hoofdmodule, bijvoorbeeld Taken of Winkelen.
- Compact family-presence entrypoint plus status op Persoon.
- Geen gedetailleerde tracking van iedere interactie.

### 4. Echte Skills/progression
- Skills krijgen echte XP, levels en progress naar volgend level.
- Centrale progression-service; geen losse XP-berekeningen per module.
- Progression wordt persistent opgeslagen aan het ingelogde Google/Firebase-account.
- Ieder household-lid heeft eigen progression.
- Taken, achievements, streaks en quests kunnen via dezelfde service skill-XP toekennen.

### 5. Household notificaties
- Persistente accountgebonden notification inbox.
- Duidelijke melding wanneer iemand een taak toewijst.
- Duidelijke melding bij hulpverzoeken.
- Avatar, afzender, type verzoek en taakcontext.
- Unread badge en deep-link naar betreffende taak/verzoek.
- Hulpverzoeken kunnen actieknoppen krijgen zoals Accepteren/Later.
- Eventlaag voorbereid voor toekomstige achievements, mentions en group-quest events.

### 6. Recepten realtime + afbeeldingen
- Receptdata wordt household-shared.
- Handmatig gewijzigde receptafbeeldingen worden centraal opgeslagen, niet alleen lokaal.
- Firebase Storage wordt gebruikt voor gedeelde recipe assets.
- Receptrecords bewaren centrale storage-path/URL.
- Wijzigingen verschijnen realtime bij andere gezinsleden.
- Storage Security Rules moeten household-toegang afdwingen.

### 7. Winkelen — meerdere lijsten
De module Boodschappen wordt breder en heet voortaan Winkelen.
- Meerdere winkellijsten kunnen worden aangemaakt en geselecteerd.
- Voorbeelden: Weekboodschappen, IKEA, Kleding, Drogist, Klusspullen, Cadeaus, Vakantie.
- Per lijst: naam, icoon/categorie, eigenaar, privacy, items en timestamps.
- Gedeelde lijsten synchroniseren realtime.
- Privélijsten zijn alleen leesbaar/schrijfbaar voor de eigenaar en worden via Security Rules beschermd.
- Architectuur blijft voorbereid op delen met geselecteerde household-leden.
- Huidige boodschappen worden gemigreerd naar een gedeelde standaardlijst.

### 8. Winkelen — rapid entry
- Na Toevoegen blijft de popup open.
- Direct duidelijke succesfeedback.
- Input wordt geleegd en krijgt opnieuw focus.
- Mobiel toetsenbord blijft waar mogelijk open.
- Duidelijke Klaar/Sluiten-knop en X.
- Popup toont aan welke actieve lijst het item wordt toegevoegd.

### 9. Winkelen — uitgebreid iconensysteem
Niet alleen supermarkticonen. Ondersteun onder andere:
- supermarkt / eten
- kleding
- huis
- elektronica
- klus
- tuin
- baby/kinderen
- huisdieren
- cadeaus
- verzorging
- sport
- auto
- boeken
- hobby
- algemene shopping

Automatische itemherkenning gebruikt een nette generieke fallback wanneer geen categorie betrouwbaar wordt herkend.

### 10. Notities — premium kladblok
De OneNote/notebook-benadering verdwijnt.
- Direct schrijven zonder notebook/sectie-hiërarchie.
- Vrije tekst en afvinkbare checklistregels in dezelfde notitie.
- Autosave.
- Recente notities als compacte premium cards.
- Zoeken en vastpinnen.
- Nieuwe notitie via duidelijke + actie.
- Per notitie Gezinsnotitie of Privé.
- Privacy wordt server-side afgedwongen.

### 11. Contextuele pagina-help
Iedere hoofdmodule krijgt een consistente subtiele ?/info-knop.
- Opent een premium bottom sheet.
- Legt uit: wat kun je hier, hoe werkt het, en hoe is deze module verbonden met andere FamilyApp-features.
- Helpcontent wordt centraal beheerd zodat feature-uitleg mee kan evolueren.
- Later uitbreidbaar met coach-marks/tips zonder dat dit voor Beta 1 vereist is.

### 12. Login help / installeren als app
Ook het loginscherm krijgt een kleine ?-knop.
- Premium uitleg over FamilyApp/login.
- Sectie "Installeer FamilyApp op je telefoon".
- iPhone: Safari > Deel > Zet op beginscherm > Voeg toe.
- Android: relevante browseractie voor Toevoegen aan startscherm / App installeren.
- Waar betrouwbaar mogelijk worden platformrelevante instructies getoond.

## Implementatiefases

### Fase 1 — Datafundament & security
Centraliseer household-shared versus user-private data. Definieer migraties, privacyregels, realtime bronnen en offline/degraded gedrag. Geen nieuwe UI mag een parallel datasysteem introduceren.

### Fase 2 — Winkelen & recepten
Migreer Boodschappen naar Winkelen, voeg meerdere gedeelde/privé lijsten, rapid entry en uitgebreid iconensysteem toe. Maak recepten en recipe images household-shared via Firebase + Storage.

### Fase 3 — Account progression
Bouw centrale progression-service en migreer Skills naar echte accountgebonden XP/levels.

### Fase 4 — Samenwerking
Presence, notification center, taaktoewijzingen en hulpverzoeken bovenop household membership/events.

### Fase 5 — Taken UX
Voeg card/checklist-toggle toe op dezelfde taakdata en progression-logica.

### Fase 6 — Notities
Vervang notebook-UX door premium autosaving kladblok met checklists en gedeeld/privé.

### Fase 7 — Help & onboarding
Voeg centrale pagina-help toe, inclusief login/help voor installatie op beginscherm.

### Fase 8 — Release hardening
Controleer mobiele overflow, safe areas, toetsenbordgedrag, touch targets, sheets, loaders, offline/degraded states en datamigraties.

## Beta 1 acceptatietest
Voor livegang minimaal testen op twee accounts en twee apparaten:
1. Shane maakt/opent household.
2. Esra joint met eigen Google-account.
3. Beide accounts kunnen opnieuw inloggen zonder household kwijt te raken.
4. Eigen avatars blijven correct.
5. Presence werkt in beide richtingen.
6. Shane maakt gedeelde winkellijst; Esra ziet deze realtime.
7. Esra vinkt item af; Shane ziet wijziging realtime.
8. Privélijst van één gebruiker is voor de andere technisch niet leesbaar.
9. Recept en receptafbeelding wijzigen; ander apparaat ontvangt de wijziging.
10. Taak toewijzen aan ander lid veroorzaakt melding.
11. Hulpverzoek veroorzaakt actiegerichte melding.
12. Taak voltooien verhoogt account-XP en juiste Skill.
13. Opnieuw inloggen behoudt progression.
14. Gedeelde notitie/checklist synchroniseert.
15. Privénotitie blijft afgeschermd.
16. Slechte/geen verbinding veroorzaakt geen infinite loader; app toont bruikbare degraded/offline state.
17. Login-help legt installeren op iPhone/Android duidelijk uit.

## Buiten Beta 1 scope
Voor deze release bewust niet uitbreiden met:
- nieuwe grote modules
- uitgebreide locatie-tracking
- complexe kinderrechten buiten de reeds voorbereide rollen
- extra externe pushinfrastructuur als dit de release vertraagt
- nieuwe gamification bovenop het betrouwbaar maken van bestaande progression

## Definition of Done
Beta 1 is pas live-ready wanneer de volledige acceptatietest slaagt, Firebase/Storage rules actief zijn, bestaande data veilig gemigreerd is en de app op mobiel geen blokkerende auth-, sync-, layout- of offlineproblemen meer heeft.
