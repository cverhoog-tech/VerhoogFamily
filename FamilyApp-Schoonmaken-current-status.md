# FamilyApp — Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **11-09-2026**  
Branch: `agent/household-rebuild-v2`  
Roadmapstap: **STEP 14 — Cleaning v2**

Dit document is de actuele compacte waarheid voor de actieve Cleaning-implementatie. Oudere pre-performance-reset Cleaning-lagen zijn alleen historische productreferentie en mogen niet opnieuw als runtime worden geactiveerd.

## 1. Geaccepteerde stabiele basis

Cleaning V2.0 performance-first basis:  
`b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Status: **REAL-DEVICE GEACCEPTEERD OP IPHONE**. Deze basis is naar main gepromoveerd. Production/main blijft:
`b7f233ebfe1fbb20ecdf426003f332528562ab0f`

De primaire Cleaning-runtime blijft `src/modules/cleaning/cleaningScreen.js` v2.0.0. Die accepted kern is voor V2.2 niet opengebroken.

Blijvende architectuur:
- lazy Cleaning load;
- één household-scoped CleaningV2Repository Firebase `value` listener;
- teardown wanneer Cleaning wordt verlaten;
- `CleaningOccurrence` is canonical concrete execution state;
- completion logs blijven onder canonical Cleaning-data;
- Tasks en Agenda zijn projecties;
- één primaire screen owner en één Cleaning-detail-sheet owner;
- geen generieke TaskDetailPopup voor Cleaning;
- geen MutationObserver-stack;
- geen legacy execution/projection cascade.

## 2. Cleaning V2.1 — samenwerking / overdracht / hulp

Status: **CODECANDIDATE GEREED — SINGLE-DEVICE LIJKT GOED — MULTI-USER VERIFICATIE UITGESTELD**.

Laatste volledig geteste V2.1 checkpoint vóór V2.2:
`7e34cb60b78cf45664fdb82202e9673bb2ae9672`

De product owner heeft op 11-09-2026 aangegeven dat de flow op het beschikbare toestel lijkt te werken, maar dat multi-user testen op dat moment niet mogelijk is. Daarom wordt V2.1 **niet** als volledig real-device/multi-user geaccepteerd gemarkeerd. Die verificatie blijft als expliciete latere gate open terwijl op verzoek wordt doorgewerkt.

V2.1 blijft bevatten:
- occurrence-level overdracht;
- accept/decline via Action Inbox;
- tegenvoorstel persoon/dag/tijd;
- expliciet derde-persoon akkoord, nooit silent reassignment;
- hulp vragen / accepteren / weigeren / intrekken;
- geen impliciet multi-person assignment;
- collaboration-state op `CleaningOccurrence.transferRequest` en `CleaningOccurrence.helpRequest`;
- accepted transfer synchroniseert bestaande Task/Agenda-projecties;
- duplicate-tap/idempotency guards;
- verse Action Inbox-sessie hydrateert Cleaning uitsluitend on-demand en doet daarna teardown.

### V2.1 UX

Samenwerken is geen apart menu onder Kamers. `Overdragen`, `Hulp vragen`, status en `Intrekken` staan contextueel in de bestaande concrete beurt-detail-sheet. Incoming beslissingen blijven in Action Inbox. Een tegenvoorstel routeert terug naar de concrete occurrence. De bestaande V2-sheet blijft de enige popup owner.

### Nog later multi-user verifiëren

- transfer request op account A → zichtbaar op verse sessie account B;
- accept/decline;
- Task/Agenda assignee consistency na acceptatie;
- counter persoon/dag/tijd;
- derde-persoon counter vraagt apart akkoord;
- help accept/decline;
- withdraw flows;
- rapid repeat taps zonder duplicates;
- geen achtergrondperformance-regressie na beide accounts/flows.

## 3. Cleaning V2.2 — historie / Activity / nuttige aandacht

Status: **CODECANDIDATE GEREED — CI GROEN — REAL-DEVICE TEST NOG OPEN**.

Laatste functionele/testcheckpoint:
`ffb0552bad734309e02361de87bde7a3e96a3464`

GitHub Actions:
- workflow: `Household Rebuild Contract Tests`;
- run: `34537327502`;
- volledige `scripts/test-*.js` suite: **PASS**;
- conclusion: **SUCCESS**.

### Gebouwd

Nieuwe pure read-model laag:
`src/modules/cleaning/cleaningHistoryContract.js`

Nieuwe lichte Cleaning-only presentatie:
`src/modules/cleaning/cleaningHistoryV22.js`

De bestaande `cleaningPremiumFeedback.js` lazy bridge laadt nu zowel de V2.1 collaboration companion als de V2.2 history companion uitsluitend wanneer Cleaning zelf wordt geopend.

### Historie-tab

Cleaning krijgt een vierde tab `Historie` naast Vandaag, Kamers en Weekplan.

Historie wordt rechtstreeks uit `cleaning/completionLogs` afgeleid en toont:
- afgeronde beurten gegroepeerd per kamer;
- per kamer wanneer die voor het laatst is bijgewerkt en door wie;
- aantallen afgeronde beurten in de laatste 30 dagen;
- routinehistorie uit de opgeslagen checklist;
- per routine laatste uitvoermoment, uitvoerder en activiteit in 30 dagen;
- compacte weekstatistiek: aantal afgeronde beurten, minuten en aantal actieve uitvoerders in de historie.

Er is **geen tweede history-store/database**.

### Nuttige aandacht op Vandaag

Op Vandaag verschijnt alleen wanneer relevant een compacte, rustige aandachtregel voor de huidige ingelogde assignee:
- aantal eigen beurten vandaag + geschatte minuten;
- aantal eigen achterstallige beurten + geschatte minuten.

Dit is bewust **geen pushmelding en geen NotificationStore-projector**. Er is geen reminder polling-loop. Zodra er niets relevants is, wordt de aandachtregel niet getoond.

### Household Activity

Nieuwe echte completionLogs die tijdens de actieve Cleaning-clientlifecycle worden waargenomen kunnen best-effort naar de bestaande `HouseholdActivity` feed worden geprojecteerd als `cleaning.completed`.

Eigenschappen:
- deterministic occurrenceKey `cleaning:completion:<completionLogId>`;
- bestaande Activity `appendOnce`-dedupe blijft authority;
- de eerste bestaande completionLog-snapshot wordt als baseline genomen om geen historische feed-flood te veroorzaken;
- REOPENED logs publiceren geen nieuw `cleaning.completed` event;
- Activity failure maakt een succesvolle Cleaning completion niet ongedaan.

De oude `cleaningActivityProjector.js` wordt **niet** gereactiveerd.

### Performancekeuzes V2.2

V2.2:
- verandert de accepted primaire `cleaningScreen.js` kern niet;
- hergebruikt dezelfde `CleaningHouseholdRepository.subscribe` snapshot;
- creëert geen tweede raw Firebase listener;
- creëert geen MutationObserver;
- creëert geen `setInterval`/pollingloop;
- creëert geen tweede popup owner;
- creëert geen NotificationStore/push projector;
- gebruikt twee deferred animation frames alleen na bestaande repository/screen-updates om na de primaire V2-render lichtgewicht UI aan te vullen;
- blijft buiten normale app-startup.

De oude pre-reset bestanden `cleaningHistoryExperience.js`, `cleaningActivityProjector.js` en `cleaningNotificationProjector.js` blijven disconnected historical reference.

## 4. Nieuwe testdekking V2.2

`scripts/test-cleaning-history-v22.js` dekt onder andere:
- completion history komt alleen uit canonical `completionLogs`;
- completed versus reopened status;
- room grouping;
- routine history;
- weeksummary;
- wie/wat/wanneer data;
- reminders alleen voor de actuele assignee;
- completed occurrences tellen niet mee als reminder;
- deterministic Activity dedupe key;
- geen Activity-event voor reopened log;
- geen tweede Firebase listener/database owner;
- geen MutationObserver;
- geen pollingtimers;
- geen NotificationStore/pushprojector;
- geen oude Cleaning runtime owners;
- V2.2 blijft lazy achter de Cleaning-route.

De bestaande V2.0/V2.1 performance-, collaboration-, lifecycle-, permissions- en Action Inbox-contracten blijven eveneens groen.

## 5. Real-device testgate V2.2 — open

Te testen op echte iPhone:
1. Cleaning openen: vier tabs moeten netjes op één rij staan — Vandaag, Kamers, Weekplan, Historie.
2. Vandaag blijft soepel; alleen bij eigen today/overdue werk verschijnt de compacte aandachtregel.
3. Historie openen: geen freeze/jank.
4. Bestaande completion logs moeten per kamer zichtbaar zijn.
5. Kamer uitklappen: routines tonen laatste moment + gezinslid.
6. Een nieuwe beurt afronden; Historie moet na de repository-update bijwerken.
7. Controleer de household Activity-feed op één `cleaning.completed` item, niet meerdere.
8. Heropen een afgeronde beurt en controleer dat dit geen tweede completion-activity veroorzaakt.
9. Wissel Vandaag/Kamers/Weekplan/Historie herhaaldelijk; geen dubbele tabs/secties of layout-jank.
10. Verlaat Cleaning en gebruik andere modules; geen achterblijvende Cleaning listener/pollingperformance.

V2.2 wordt pas als real-device geaccepteerd gemarkeerd na expliciete product-ownerbevestiging.

## 6. Daarna

### V2.3 — functionele gaten + hardening
- onvolledige beurt: doorschuiven / later deze week / overslaan;
- handmatig persoon/moment aanpassen;
- projection consistency;
- household key safety;
- idempotency/double-submit;
- lifecycle/account-household switch;
- soft-delete/cache/versioning hardening.

### V2.4 — definitieve premium visual polish
- light/dark polish;
- premium room assets/atlassen;
- duidelijke hiërarchie;
- lichte native-iOS microinteracties;
- geen repaint-zware effecten.

## 7. Expliciet niet opnieuw bouwen

Geen member availability, vakanties, ziekte/afwezigheid, busy-week/capacity engine, automatische personal-availability planning of complexe planning-pause/exception engines.
