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
- De toast-fix wordt met `src/core/utils.js?v=2` in de huidige STEP 11 Preview geladen.
- Product owner heeft op 2026-08-27 expliciet gekozen om de real-device visuele test voor later te bewaren.
- Punt blijft open totdat op een echte iPhone is bevestigd dat de acceptatie-toast visueel correct en leesbaar is.

## 7. Google login — post-auth handoff/startup blijft hangen

Status: **open — real-device regressie waargenomen op 2026-08-27**.

Waargenomen gedrag:

- Gebruiker tikt op **Inloggen met Google**.
- Google-accountkeuze opent normaal.
- Na het kiezen van het account keert de app terug naar het inlogscherm.
- Het inlogscherm lijkt ongeveer vijf seconden gefreezed / reageert niet zichtbaar door.
- Na de app sluiten en opnieuw openen blijkt de gebruiker wél correct ingelogd te zijn.

Interpretatie / onderzoeksrichting:

- De Google/Firebase-authenticatie zelf lijkt te slagen en de sessie wordt persistent opgeslagen.
- Het probleem zit waarschijnlijk in de zichtbare post-auth handoff/startup-keten, niet in het verkrijgen van de Firebase-sessie.
- Huidige relevante keten: `signInWithPopup()` → `onAuthStateChanged` → `AuthenticatedSessionController.bootstrap()` → `loadUserFamily()` → `revealApp()`.
- Onderzoek of `loadUserFamily()` of een lifecycle/race na terugkeer uit de Google-popup vertraagt of blijft hangen.
- Tijdens deze overgang moet de gebruiker een duidelijke laadstatus krijgen; een interactief-ogend maar feitelijk stilstaand inlogscherm is niet acceptabel.
- Bij succesvolle auth moet de app zonder handmatige app-herstart naar de juiste household/Home-state doorstromen.
- Fouten/time-outs in household bootstrap moeten zichtbaar en herstelbaar zijn in plaats van stil te blijven hangen.
- Geen nieuwe auth-, household- of sessie-authority introduceren; fix binnen de bestaande `googleAuthMobileFix` / `AuthenticatedSessionController` / household-bootstrap architectuur.

## Status

**Open hoofdpunten: 7**

De Party Quest UX patch is inmiddels real-device PASS voor multi-start, Arcana-iconen, **Nieuwe quest maken** en **Later beslissen**. Die roadmap-UX wordt daarom niet als extra open hoofd-fixpunt gedupliceerd.

1. Home hero card backgrounds
2. Meertaligheid: NL / EN / TR / DE / FR
3. Taaknaam prominenter in taak-aanmaken pop-up
4. Recept als maaltijd voorstellen aan gezinslid
5. Boodschappen afronden + optionele bon + gekocht-mandje leegmaken
6. Party Quest acceptatie-toast — fix candidate klaar, real-device visuele bevestiging uitgesteld/pending
7. Google login — auth slaagt, maar post-login handoff/startup kan op inlogscherm blijven hangen tot app-herstart