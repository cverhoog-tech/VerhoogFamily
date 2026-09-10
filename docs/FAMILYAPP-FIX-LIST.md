# FamilyApp — Lopende fixlijst

Laatst bijgewerkt: 2026-09-10  
Branch: `agent/household-rebuild-v2`

Dit document bevat alleen **werkelijk actuele** fixes/gates. Oudere fixregels die inmiddels gebouwd/geaccepteerd zijn staan alleen nog in git history en worden niet automatisch opnieuw geopend.

Voor milestonewerk is `docs/FAMILYAPP-CURRENT-TODO.md` leidend.

## 1. Cleaning V2.1 — real-device acceptancegate

Status: **CODE GEREED / CI GROEN / IPHONE TEST NOG OPEN**

Geen nieuwe codefix bekend op dit moment. Nog real-device verifiëren:
- transfer maken;
- accept/decline;
- counter person/date/time;
- derde-persoon counter vereist apart akkoord;
- transfer intrekken;
- help request accept/decline;
- help request intrekken;
- rapid repeat taps veroorzaken geen duplicate records;
- accepted transfer blijft consistent in Cleaning/Tasks/Agenda;
- Cleaning openen/sluiten blijft soepel zonder achtergrondruntime.

Als een van deze tests faalt, voeg de concrete reproduceerbare regressie hier toe met exacte preview/SHA.

## 2. Party Quest acceptatie-toast

Status: **ALLEEN REAL-DEVICE VERIFICATIE OPEN**

Er bestaat al een fixcandidate en contracts zijn historisch groen. Geen nieuwe implementatie starten totdat op de huidige basis is bevestigd dat de toast nog fout is.

## 3. Google login post-auth freeze

Status: **HISTORISCHE REGRESSIE — HERTEST IN STEP 15**

Historisch kon na Google accountkeuze op iPhone/PWA een freeze van circa 5–10 seconden optreden.

Niet blind opnieuw repareren. Tijdens STEP 15 opnieuw reproduceren op de dan actuele preview. Alleen openen als het probleem nog bestaat.

## 4. STEP 15 Branding / PWA / Login & Auth

Status: **PRODUCTMILESTONE, GEEN LOSSE BUG**

Zie de roadmap voor:
- nieuw premium FamilyApp-logo/icon family;
- nieuw login design;
- normale accountregistratie/login expliciet testen;
- Apple action ook op Home via dezelfde auth authority;
- PWA manifest/icon/caching/Home Screen verificatie.

## 5. Internationalisatie

Status: **LATER**

NL / EN / TR / DE / FR via één centrale i18n architectuur; taalkeuze per gebruiker opslaan.

## 6. Release/security

Status: **LATER VOOR PUBLIEKE RELEASE**

- server-side role enforcement in Firebase Rules ontwerpen/testen;
- Apple provider/release configuration;
- App Store/native/PWA releasekeuzes.

Production Firebase Rules worden niet gewijzigd zonder expliciete toestemming.

## Niet opnieuw als actieve fix behandelen zonder huidige regressie

Onder meer reeds gebouwde/geaccepteerde Home hero ownership, profiel/presence/avatar, Feed/Activity, maaltijdfollow-up, Action Inbox basis, UI scale, safe-area/dark-mode device gates, notificatie/push basis, boodschappenarchitectuur, Taken create-card en bestaande Apple Sign-In clientflow blijven gesloten totdat een concrete actuele regressie reproduceerbaar is.
