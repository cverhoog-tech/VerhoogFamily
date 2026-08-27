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

Status: **instrumentation/code green — root cause investigation pending real-device timing** (fix #7 is heropend, niet resolved).

Waargenomen gedrag:

- Gebruiker tikt op **Inloggen met Google**.
- Google-accountkeuze opent normaal.
- Na het kiezen van het account keerde de app terug naar het inlogscherm.
- Het inlogscherm leek ongeveer vijf tot tien seconden gefreezed / reageerde niet zichtbaar door.
- Soms moest de PWA zelfs worden gesloten en opnieuw geopend, waarna de gebruiker wél correct bleek ingelogd te zijn.

Eerdere fix-poging (checkpoint `f10e198fd144caa62427c78609f1295780707ef4`, CI `33069878758` groen) heeft de vertraging op een echte iPhone/PWA **niet** opgelost. Er werd daarom niet opnieuw gegokt op de root cause; in plaats daarvan is fix #7 heropend voor een bewijsgedreven onderzoek.

### Fase 1 — AuthTiming instrumentatie (huidig)

- Nieuwe `src/core/authTimingDiagnostics.js`: `[AuthTiming]` console-marks met deltas op T0 t/m T13 langs het volledige login-pad (`googleAuthMobileFix.js`, `authenticatedSessionController.js`, `householdPlatform.js`), plus lifecycle-listeners (`visibilitychange`, `pageshow`, `pagehide`, `focus`, `blur`) rond de terugkeer uit de Google-popup.
- `T13` (Home zichtbaar) wordt via een dubbele `requestAnimationFrame` gemeten in plaats van synchroon, zodat het daadwerkelijke paint-moment wordt benaderd — niet alleen het moment waarop de JS-call terugkeert.
- Geen tokens, Firebase credentials of persoonlijke data worden gelogd.
- Nieuwe `src/core/authTimingDebugViewer.js`: preview/debug-only paneel, alleen actief achter `?authdebug=1`, met een **Kopieer timings**-knop (Clipboard API + `execCommand('copy')` fallback voor oudere iOS PWA WebKit). Pure lezer van `window.getFamilyAppAuthTiming()`; geen tweede Firebase auth observer, geen household-logica, geen UID/e-mail/naam/household-id/token wordt ooit getoond of gekopieerd.
- Architectuur ongewijzigd: `AuthenticatedSessionController` blijft de enige canonical auth/session bootstrap authority; `HouseholdContext`/Firebase Auth UID blijft de identity/household authority. Geen timeout-hacks, geen geforceerde Home na X seconden, geen optimistic Home vóór bevestigde household access.
- Nieuwe contracttests `scripts/test-auth-timing-diagnostics.js` en `scripts/test-auth-timing-debug-viewer.js`; bestaande `scripts/test-auth-startup-ownership.js` en `scripts/test-task-household-repository.js` bijgewerkt voor de nieuwe loader-volgorde/versies.
- Code/contract checkpoint: `a4778172fad1590069e431236467ef2c2527009d`. Volledige lokale `scripts/test-*.js` suite: **65/65 PASS**. Vercel Preview `dpl_HtSNyHnMXNJKKRp9YKDsipJatncm`: **READY**.
- Punt blijft open totdat op een echte iPhone/PWA-sessie met `?authdebug=1` een timing-capture is teruggestuurd en daarmee de daadwerkelijke root cause (Scenario A: popup/iOS-lifecycle, Scenario B: auth/household reads, of Scenario C: post-household render/main-thread blocking) is vastgesteld. Pas daarna volgt Fase 2: root cause + daadwerkelijke fix.

## Status

**Open hoofdpunten: 7**

De Party Quest UX patch is inmiddels real-device PASS voor multi-start, Arcana-iconen, **Nieuwe quest maken** en **Later beslissen**. Die roadmap-UX wordt daarom niet als extra open hoofd-fixpunt gedupliceerd.

1. Home hero card backgrounds
2. Meertaligheid: NL / EN / TR / DE / FR
3. Taaknaam prominenter in taak-aanmaken pop-up
4. Recept als maaltijd voorstellen aan gezinslid
5. Boodschappen afronden + optionele bon + gekocht-mandje leegmaken
6. Party Quest acceptatie-toast — fix candidate klaar, real-device visuele bevestiging uitgesteld/pending
7. Google login — fix #7 heropend; instrumentation/code green — root cause investigation pending real-device timing
