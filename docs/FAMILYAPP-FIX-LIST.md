# FamilyApp — Lopende fixlijst

Laatst bijgewerkt: 2026-09-11  
Branch: `agent/household-rebuild-v2`

Dit document bevat alleen **werkelijk actuele** fixes/gates. Voor milestonewerk is `docs/FAMILYAPP-CURRENT-TODO.md` leidend.

## 1. Cleaning V2.1 — multi-user verificatie uitgesteld

Status: **CODE GEREED / CI GROEN / SINGLE-DEVICE LIJKT GOED / MULTI-USER TEST LATER**

De huidige UX-correctie is verwerkt: geen zelfstandig `Samenwerken` menu onder Kamers; `Overdragen`, `Hulp vragen`, status en `Intrekken` zitten in de bestaande concrete beurt-detail-sheet. Incoming decisions blijven in Action Inbox.

Product owner meldde op 11-09-2026 dat de beschikbare-device flow lijkt te werken, maar multi-user testen was op dat moment niet mogelijk. Daarom niet als volledig real-device/multi-user geaccepteerd markeren.

Later verifiëren:
- account A transfer/help → verse account B Action Inbox;
- accept/decline/counter;
- eventuele derde persoon apart akkoord;
- withdraw;
- accepted transfer consistent in Cleaning/Tasks/Agenda;
- rapid repeat taps zonder duplicates;
- performance/lifecycle over meerdere accounts.

V2.1 testcheckpoint: `7e34cb60b78cf45664fdb82202e9673bb2ae9672`; CI run `34534350216`: **SUCCESS**.

## 2. Cleaning V2.2 — real-device acceptancegate

Status: **CODECANDIDATE GEREED / CI GROEN / IPHONE TEST OPEN**

Functioneel/testcheckpoint: `ffb0552bad734309e02361de87bde7a3e96a3464`; CI run `34537327502`: **SUCCESS**.

Te verifiëren:
- vier tabs staan netjes op één rij: Vandaag / Kamers / Weekplan / Historie;
- Vandaag blijft soepel;
- attention row verschijnt alleen bij eigen today/overdue Cleaning work;
- Historie opent zonder freeze/jank;
- bestaande completionLogs tonen per kamer;
- kamer expand toont routines, laatste moment en gezinslid;
- nieuwe completion verschijnt in Historie;
- één nieuwe completion geeft maximaal één `cleaning.completed` item in Household Activity;
- reopen geeft geen tweede completed Activity item;
- veel tabwissels veroorzaken geen dubbele History tabs/sections;
- na verlaten Cleaning geen achtergrondperformance-regressie.

Architectuur die tijdens deze test absoluut intact moet blijven:
- één raw Cleaning Firebase listener;
- geen MutationObserver;
- geen polling/setInterval;
- geen tweede history store;
- geen notification/push projector;
- geen tweede popup owner;
- oude `cleaningHistoryExperience.js`, `cleaningActivityProjector.js` en `cleaningNotificationProjector.js` blijven disconnected.

Als een real-device test faalt, voeg de concrete reproduceerbare regressie toe met exacte preview/SHA.

## 3. Party Quest acceptatie-toast

Status: **ALLEEN REAL-DEVICE VERIFICATIE OPEN**

Er bestaat al een fixcandidate. Geen nieuwe implementatie starten totdat op de huidige basis is bevestigd dat de toast nog fout is.

## 4. Google login post-auth freeze

Status: **HISTORISCHE REGRESSIE — HERTEST IN STEP 15**

Niet blind opnieuw repareren. Tijdens STEP 15 opnieuw reproduceren op de dan actuele preview en alleen openen als het probleem nog bestaat.

## 5. STEP 15 Branding / PWA / Login & Auth

Status: **PRODUCTMILESTONE, GEEN LOSSE BUG**

Zie roadmap voor logo/icon family, login design, normale accountflow, Apple action via dezelfde auth authority en PWA manifest/icon/caching/Home Screen verificatie.

## 6. Internationalisatie

Status: **LATER**

NL / EN / TR / DE / FR via één centrale i18n architectuur; taalkeuze per gebruiker opslaan.

## 7. Release/security

Status: **LATER VOOR PUBLIEKE RELEASE**

- server-side role enforcement in Firebase Rules ontwerpen/testen;
- Apple provider/release configuration;
- App Store/native/PWA releasekeuzes.

Production Firebase Rules worden niet gewijzigd zonder expliciete toestemming.

## Niet opnieuw als actieve fix behandelen zonder huidige regressie

Reeds gebouwde/geaccepteerde Home hero ownership, profiel/presence/avatar, Feed/Activity, maaltijdfollow-up, Action Inbox basis, UI scale, safe-area/dark-mode gates, notificatie/push basis, boodschappenarchitectuur, Taken create-card en bestaande Apple Sign-In clientflow blijven gesloten totdat een concrete actuele regressie reproduceerbaar is.
