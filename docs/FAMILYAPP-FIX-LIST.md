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

- Na het accepteren van een Party Quest-uitnodiging werkt de actie functioneel correct.
- Op de real-device test verschijnt daarna echter een vrijwel lege **witte toast/balk**.
- Het handdruk-/handshake-icoon is wel zichtbaar.
- De begeleidende tekst en/of toast-styling is niet goed leesbaar/zichtbaar.
- De toast moet weer een duidelijke bevestiging tonen, bijvoorbeeld dat de Party Quest-uitnodiging is geaccepteerd.
- Styling moet correct werken in zowel lichte als donkere modus en aansluiten bij de premium FamilyApp-toaststijl.
- Dit is een losse UI-fix en blokkeert de functionele STEP 11.2-acceptatie niet.

## Status

**Open hoofdpunten: 6**

1. Home hero card backgrounds
2. Meertaligheid: NL / EN / TR / DE / FR
3. Taaknaam prominenter in taak-aanmaken pop-up
4. Recept als maaltijd voorstellen aan gezinslid
5. Boodschappen afronden + optionele bon + gekocht-mandje leegmaken
6. Party Quest acceptatie-toast: witte balk/tekst onzichtbaar, handshake-icoon wel zichtbaar