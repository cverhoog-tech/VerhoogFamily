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

Status: **fix candidate implemented/contract green — real-device PWA verification pending**.

Waargenomen gedrag:

- Gebruiker tikt op **Inloggen met Google**.
- Google-accountkeuze opent normaal.
- Na het kiezen van het account keerde de app terug naar het inlogscherm.
- Het inlogscherm leek ongeveer vijf seconden gefreezed / reageerde niet zichtbaar door.
- Na de app sluiten en opnieuw openen bleek de gebruiker wél correct ingelogd te zijn.

Bevestigde oorzaak / fix:

- Firebase-authenticatie en sessiepersistence waren niet het primaire probleem.
- `googleAuthMobileFix.js` gebruikte het succesvolle `signInWithPopup()`-resultaat niet om de bestaande session bootstrap direct te starten; de UI wachtte volledig op de afzonderlijke `onAuthStateChanged`-callback.
- Op iOS/PWA kunnen popup-resultaat en auth-observer in verschillende volgorde/timing arriveren. De bestaande controller startte bij iedere bootstrap een nieuwe generatie, waardoor een directe handoff zonder dedupe eveneens een race zou kunnen veroorzaken.
- Het succesvolle popup-resultaat wordt nu via `AuthenticatedSessionController.acceptAuthenticatedUser(result.user)` aan de **bestaande canonical session authority** doorgegeven.
- `AuthenticatedSessionController` hergebruikt één in-flight `loadUserFamily()`-bootstrap per UID en negeert een late duplicate observer-bootstrap wanneer dezelfde gebruiker al `ready` is.
- Er is geen tweede auth-, household- of app-reveal authority toegevoegd; `loadUserFamily()` en `revealApp()` blijven eigendom van de bestaande session/household-keten.
- Tijdens de overgang toont de knop expliciet **Google openen...** en daarna **Gezin laden...**.
- Een recoverable household/startup-fout blijft zichtbaar en maakt de Google-knop weer bruikbaar voor een retry in plaats van permanent disabled te blijven.
- De household-resolver wordt via een Promise-microtask aangeroepen zodat ook een synchrone resolver-fout in dezelfde recoverable error-route terechtkomt.
- Runtime cachekeys zijn verhoogd naar `googleAuthMobileFix.js?v=2` en `authenticatedSessionController.js?v=3`, zodat de PWA niet op de oude auth-runtime blijft hangen.

Regressiebewaking:

- Nieuwe test `scripts/test-auth-popup-handoff-race.js` simuleert beide relevante volgordes:
  - auth-observer eerst, popup-resultaat daarna;
  - popup-resultaat eerst, auth-observer daarna.
- In beide gevallen mag exact één household-bootstrap starten, Home één keer worden onthuld en een late same-UID observer geen tweede household-load veroorzaken.
- `scripts/test-auth-startup-ownership.js` bewaakt dat de Google-adapter geen `loadUserFamily()`/app-reveal authority overneemt en dat er exact één Firebase auth observer blijft.
- Bestaande Tasks-loadercontract is alleen bijgewerkt voor de legitieme session-controller cachekey `v3`; Tasks-authority zelf is niet gewijzigd.
- Code/contract checkpoint: `f10e198fd144caa62427c78609f1295780707ef4`.
- Full `Household Rebuild Contract Tests` run `33069878758`: **SUCCESS**.
- Vercel commit status voor dit checkpoint: **SUCCESS**.
- Punt blijft open totdat op een echte iPhone/PWA is bevestigd dat Google-login na accountkeuze direct doorstroomt naar household/Home zonder app sluiten/heropenen.

## Status

**Open hoofdpunten: 7**

De Party Quest UX patch is inmiddels real-device PASS voor multi-start, Arcana-iconen, **Nieuwe quest maken** en **Later beslissen**. Die roadmap-UX wordt daarom niet als extra open hoofd-fixpunt gedupliceerd.

1. Home hero card backgrounds
2. Meertaligheid: NL / EN / TR / DE / FR
3. Taaknaam prominenter in taak-aanmaken pop-up
4. Recept als maaltijd voorstellen aan gezinslid
5. Boodschappen afronden + optionele bon + gekocht-mandje leegmaken
6. Party Quest acceptatie-toast — fix candidate klaar, real-device visuele bevestiging uitgesteld/pending
7. Google login — code/contract fix candidate groen; real-device bevestigen dat post-auth handoff zonder app-herstart direct naar household/Home gaat
