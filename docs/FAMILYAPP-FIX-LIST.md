# FamilyApp — Lopende fixlijst

Laatst bijgewerkt: 2026-09-10  
Branch: `agent/household-rebuild-v2`

Dit document bevat alleen **werkelijk actuele** fixes/gates. Voor milestonewerk is `docs/FAMILYAPP-CURRENT-TODO.md` leidend.

## 1. Cleaning V2.1 — real-device acceptancegate

Status: **CODE GEREED / CI GROEN / IPHONE TEST NOG OPEN**

De UX-correctie van 10-09-2026 is verwerkt: `Samenwerken` staat niet meer als zelfstandig menu onder Kamers. `Overdragen` en `Hulp vragen` zijn contextuele acties in de bestaande concrete beurt-detail-sheet. Incoming decisions blijven in Action Inbox.

Nog real-device verifiëren:
- geen los `Samenwerken`-blok onder Kamers;
- concrete beurt openen → `Overdragen` / `Hulp vragen` zichtbaar in de bestaande detail-sheet;
- transfer maken → accept/decline;
- counter person/date/time;
- derde-persoon counter vereist apart akkoord;
- transfer intrekken;
- help request accept/decline/withdraw;
- verse recipient session kan request direct in Action Inbox zien;
- rapid repeat taps veroorzaken geen duplicate records;
- accepted transfer blijft consistent in Cleaning/Tasks/Agenda;
- Cleaning openen/sluiten/heropenen blijft soepel zonder achtergrondruntime.

Laatste functionele/testcheckpoint: `7e34cb60b78cf45664fdb82202e9673bb2ae9672`. GitHub Actions run `34534350216`: **SUCCESS**.

Als een real-device test faalt, voeg de concrete reproduceerbare regressie hier toe met exacte preview/SHA. V2.1 blijft tot expliciete bevestiging **NIET REAL-DEVICE GEACCEPTEERD**.

## 2. Party Quest acceptatie-toast

Status: **ALLEEN REAL-DEVICE VERIFICATIE OPEN**

Er bestaat al een fixcandidate. Geen nieuwe implementatie starten totdat op de huidige basis is bevestigd dat de toast nog fout is.

## 3. Google login post-auth freeze

Status: **HISTORISCHE REGRESSIE — HERTEST IN STEP 15**

Niet blind opnieuw repareren. Tijdens STEP 15 opnieuw reproduceren op de dan actuele preview en alleen openen als het probleem nog bestaat.

## 4. STEP 15 Branding / PWA / Login & Auth

Status: **PRODUCTMILESTONE, GEEN LOSSE BUG**

Zie roadmap voor logo/icon family, login design, normale accountflow, Apple action via dezelfde auth authority en PWA manifest/icon/caching/Home Screen verificatie.

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

Reeds gebouwde/geaccepteerde Home hero ownership, profiel/presence/avatar, Feed/Activity, maaltijdfollow-up, Action Inbox basis, UI scale, safe-area/dark-mode gates, notificatie/push basis, boodschappenarchitectuur, Taken create-card en bestaande Apple Sign-In clientflow blijven gesloten totdat een concrete actuele regressie reproduceerbaar is.
