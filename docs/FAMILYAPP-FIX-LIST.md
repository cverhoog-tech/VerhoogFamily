# FamilyApp — Lopende fixlijst

Branch: `agent/household-rebuild-v2`

Dit document bewaart de doorlopende product/fixlijst die door de product owner is aangeleverd. Rebuild-acceptanceblockers worden afzonderlijk bijgehouden in `docs/FAMILYAPP-CURRENT-TODO.md`; visuele/productproblemen die niet blokkeren blijven hier als losse backlog staan.

## 1. Home — Hero card backgrounds

- High-quality hero card backgrounds toevoegen aan de Home-cards:
  - Taken
  - Boodschappen
  - Posts / Feed
- De benodigde afbeeldingen zijn al gegenereerd.
- De gegenereerde afbeeldingen nog als assets in de app verwerken.
- De juiste afbeelding aan de juiste Home-card koppelen.
- Positionering/cropping per card finetunen.
- Ze moeten goed leesbaar blijven in zowel lichte als donkere modus.
- Tekst en iconen moeten voldoende contrast houden boven de afbeeldingen.

## 2. Talen / Internationalisatie

FamilyApp moet de volgende talen ondersteunen:

- Nederlands
- Engels
- Turks
- Duits
- Frans

Technische eisen:

- Centrale schaalbare i18n/translation-structuur maken.
- UI-teksten niet verspreid hardcoded laten staan.
- Gebruiker moet zelf een taal kunnen kiezen.
- Taalkeuze moet worden onthouden.
- Nieuwe talen moeten later eenvoudig toegevoegd kunnen worden.

## 3. Taken — Taaknaam prominenter in taak-aanmaken pop-up

- In de kaart/pop-up voor het aanmaken van een taak moet de taaknaam/titel duidelijk groter worden weergegeven.
- De taaknaam moet visueel zwaarder en prominenter zijn dan secundaire informatie.
- De belangrijkste informatie van de taak moet daardoor direct de aandacht krijgen.

## 4. Recepten — Maaltijd voorstellen aan gezinslid

- Vanuit een receptkaart moet een recept als maaltijd kunnen worden voorgesteld.
- Bij het voorstellen kies je:
  - gezinslid
  - dag/datum
- Het voorstel krijgt een eigen status:
  - Openstaand
  - Geaccepteerd
  - Geweigerd
- Het betreffende gezinslid ontvangt een duidelijke melding.
- Die melding bevat:
  - Accepteren
  - Weigeren
- Bij accepteren wordt het recept automatisch als maaltijd ingepland op de gekozen dag.
- Bij weigeren wordt niets ingepland.
- De status van het voorstel moet zichtbaar blijven.
- Statuswijzigingen moeten realtime tussen gezinsleden synchroniseren.
- Het voorstel moet gekoppeld blijven aan:
  - het recept
  - de voorgestelde datum
  - de verzender
  - de ontvanger

## 5. Boodschappen — Boodschappen afronden

- Op het Boodschappen-scherm komt een duidelijke knop **Boodschappen afronden**.
- Na indrukken opent een bevestigingsvenster met de vraag of de gebruiker een bon wil toevoegen.
- De gebruiker krijgt twee routes:
  - Bon toevoegen
  - Zonder bon afronden

### Bon toevoegen

- Bon invoeren/uploaden.
- Daarna de boodschappenronde afronden.
- De bon wordt gekoppeld aan dezelfde afgeronde boodschappenronde.

### Zonder bon

- Boodschappenronde direct afronden zonder bon.

### Na afronden

- De boodschappenronde registreren als afgerond.
- De afronding kan worden gebruikt voor de gezinsactiviteit/feed.
- Alle items die op dat moment in **Gekocht** staan worden verwijderd uit het gekochte mandje.
- Items die nog onder **Te kopen** staan blijven behouden.
- De gekochte items pas verwijderen nadat de afronding succesvol is opgeslagen.
- Bij een Firebase/netwerkfout mogen gekochte items niet verloren gaan.
- Boodschappen afronden behandelen als één consistente workflow/transactie.

## 6. Party Quest / notificaties — acceptatie-toast visueel herstellen

Status: **fix candidate deployed/contract green — real-device visual verification door product owner uitgesteld tot later**.

- Na het accepteren van een Party Quest-uitnodiging werkt de actie functioneel correct.
- Op de real-device test verscheen daarna echter een vrijwel lege **witte toast/balk**; het handshake-icoon bleef wel zichtbaar.
- Root cause bevestigd: de gedeelde `.toast`-achtergrond gebruikte `var(--c-text)`, terwijl donkere thema's deze token bijna wit maken. De toasttekst was eveneens wit en werd daardoor onleesbaar.
- De gedeelde `showToast()`-presentatie gebruikt nu een vaste donkere transparante surface met witte tekst, subtiele border/shadow, mobiele tekst-wrapping en iOS safe-area spacing.
- Party Quest-state, frozen NotificationActions en notificatiepersistence zijn niet gewijzigd.
- Contracttest `scripts/test-toast-theme-contrast.js` toegevoegd.
- CI run `33023131272`: **SUCCESS**.
- De toast-fix wordt inmiddels met `src/core/utils.js?v=2` in de huidige STEP 11 Preview geladen.
- Product owner heeft op 2026-08-27 expliciet gekozen om de real-device visuele test voor later te bewaren en ondertussen door te gaan met STEP 11.
- Punt blijft daarom open totdat op een echte iPhone is bevestigd dat de acceptatie-toast visueel correct en leesbaar is.

## Status

**Open hoofdpunten: 6**

STEP 11.4 Party Quest-hulp en de aansluitende Party Quest UX patch zijn roadmapcheckpoints en voegen geen nieuw hoofd-fixpunt toe of sluiten er een. De UX-observaties over meerdere Party Quests, direct een nieuwe quest maken en betekenisvolle Arcana-iconen zijn in de goedgekeurde UX patch op code/contractniveau opgelost; real-device verificatie wordt in de STEP 11 acceptancetracker bijgehouden. De open fixlijst blijft daarom ongewijzigd op 6 punten.

1. Home hero card backgrounds
2. Meertaligheid: NL / EN / TR / DE / FR
3. Taaknaam prominenter in taak-aanmaken pop-up
4. Recept als maaltijd voorstellen aan gezinslid
5. Boodschappen afronden + optionele bon + gekocht-mandje leegmaken
6. Party Quest acceptatie-toast — fix candidate klaar, real-device visuele bevestiging uitgesteld/pending