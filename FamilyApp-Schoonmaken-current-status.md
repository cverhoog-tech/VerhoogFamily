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

De primaire Cleaning-runtime blijft `src/modules/cleaning/cleaningScreen.js` v2.0.0. Die accepted kern is ook tijdens V2.1/V2.2/V2.2.1 niet vervangen als canonical execution/write authority.

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

Samenwerken is geen apart menu onder Kamers. Het blijft contextueel bij de concrete beurt in dezelfde bestaande Cleaning-sheet. Incoming beslissingen blijven in Action Inbox.

Open latere multi-user gate: A/B/C transfer/help/counter/withdraw, projection consistency, rapid taps en lifecycle/performance over meerdere accounts.

## 3. Cleaning V2.2 — historie / Activity / nuttige aandacht

Status: **CODECANDIDATE GEREED — CI GROEN — REAL-DEVICE TEST NOG OPEN**.

Functioneel runtimecheckpoint:
`ffb0552bad734309e02361de87bde7a3e96a3464`

Laatste V2.2 docs/testcheckpoint vóór de detailvisualrework:
`28fd9fb6832ef369ee084723b4a71736fb4e662d`

GitHub Actions:
- workflow: `Household Rebuild Contract Tests`;
- run: `34537817885`;
- conclusion: **SUCCESS**.

V2.2 bevat:
- pure `cleaningHistoryContract.js` over canonical `completionLogs`;
- lichte `cleaningHistoryV22.js` companion;
- vierde Cleaning-tab `Historie`;
- history per kamer/routine;
- laatste moment + uitvoerend gezinslid;
- 30-dagen activity counts;
- current-week count/minuten/mensen summary;
- rustige in-module aandacht voor eigen today/overdue beurten;
- best-effort `cleaning.completed` naar bestaande Household Activity;
- deterministic dedupe key;
- geen historische feed flood;
- REOPENED publiceert geen tweede completed Activity.

V2.2 voegt geen tweede Firebase-listener, history database, MutationObserver, polling, NotificationStore/pushprojector of popup owner toe. De oude history/activity/notification runtimes blijven disconnected.

De functionele V2.2 real-device gate blijft open. De zichtbare beurt-/Benodigdheden-test gebeurt vanaf nu via V2.2.1 hieronder.

## 4. Cleaning V2.2.1 — Calm Premium detail visual rework

Status: **CODECANDIDATE GEREED — CI GROEN — REAL-DEVICE TEST OPEN**.

Exacte groene runtime/testcandidate:
`7867946641cb588d84ea075e08c4c54a3e60cfc5`

GitHub Actions:
- workflow: `Household Rebuild Contract Tests`;
- run: `34572194287`;
- conclusion: **SUCCESS**.

Vercel:
- deployment: `dpl_45GFm7ugk8BkKBQPRLgBQHrdJtRA`;
- state: **READY**;
- immutable preview: `https://verhoog-family-7xhfyvsbn-cverhoog-techs-projects.vercel.app`.

### Productbesluit

Op 11-09-2026 is besloten de concrete schoonmaakbeurt en Benodigdheden eerst naar de nieuw vastgezette FamilyApp-designrichting te brengen vóór V2.3 wordt uitgebreid.

Canonieke gedeelde visuele bron:
`docs/FAMILYAPP-VISUAL-DESIGN-SYSTEM.md`

Richting: **Calm Premium Home**.

Schoonmaken wordt hierbij nadrukkelijk **geen tweede Taken-module**. De Cleaning-mental model blijft:

**kamer → routine → planning → uitvoering → benodigdheden → historie.**

Taken wordt later visueel geharmoniseerd, maar blijft de algemene uitvoerlaag.

### Nieuwe detailpresentatie

Nieuw:
- `src/modules/cleaning/cleaningDetailVisualV221.js`;
- `src/styles/cleaning-detail-v221.css`;
- `scripts/test-cleaning-detail-visual-v221.js`.

`cleaningPremiumFeedback.js` laadt deze visual companion uitsluitend lazy wanneer Cleaning zelf wordt geopend.

### Concrete schoonmaakbeurt

Nieuwe vaste volgorde:
1. native rustige header;
2. kamerhero + status;
3. prominente titel;
4. dag / moment / onderdelen / duur;
5. toegewezen persoon;
6. routineprogressie;
7. checklist;
8. `Start schoonmaken` / `Verder schoonmaken`;
9. `Bewerken`;
10. `Bekijk beurt` + `Benodigdheden`;
11. collaboration contextueel binnen dezelfde bestaande sheet.

De visual companion gebruikt de bestaande `data-cv2-check` en complete-all controls; `cleaningScreen.js` blijft de write authority.

### Benodigdheden

Nieuwe vaste volgorde:
1. contextheader;
2. `Voor deze beurt / Alle kameritems`;
3. beurt-/kamerintro;
4. rustige supply rows;
5. 46px minimalistische gekleurde line-icon tiles;
6. tekst + indicator voor `Op voorraad / Bijna op / Ontbreekt`;
7. `Ontbreekt iets?` callout;
8. kamer-voorraadsamenvatting;
9. beheer van kameritem waar capability dit toestaat;
10. `Bekijk alle kameritems` + `Boodschappen`.

LOW/OUT-handoff gebruikt de bestaande `ShoppingListStore.addItems(...,{dedupe:true})`; er is geen nieuwe shopping writer.

### CI-correctie tijdens de milestone

De eerste run op `c32eb2dac2be9d40912cdb4c6f68c7566e935e06` was rood door drie testmetadata-issues: twee oudere companion-version asserts stonden nog op `2.2.0`, en een CSS-guard matchte het woord `backdrop-filter` in een comment waarin juist stond dat dit effect níet werd gebruikt. De functional closeout was daar al groen. Na correctie is de volledige contractsuite op `7867946641cb588d84ea075e08c4c54a3e60cfc5` groen.

### Performance / architectuur

V2.2.1:
- laat `cleaningScreen.js` op v2.0.0;
- hergebruikt exact `#cleaning-v2-sheet`;
- maakt geen tweede modal/popup owner;
- maakt geen tweede raw Firebase listener;
- gebruikt geen MutationObserver;
- gebruikt geen document-wide click owner;
- gebruikt geen polling/setInterval/setTimeout in de visual companion;
- gebruikt geen backdrop-filter of continue animatie in de nieuwe detail-CSS;
- gebruikt bestaande repositorymethodes voor supply/inventory mutations;
- verandert production Firebase Rules niet.

### Real-device gate V2.2.1 — OPEN

Te testen op iPhone, light én dark:
- hero/header/titel/meta/assignee/progress/checklist hiërarchie;
- checklist/percentage blijven direct en soepel reageren;
- Start/Verder + afronden blijft werken;
- `Bewerken` blijft via bestaande beheerflow werken;
- collaboration blijft in dezelfde sheet;
- segmented supplies switch;
- icoonstijl, kleur, dimensies en voorraadstatus;
- kameritem toevoegen en status wijzigen;
- LOW/OUT naar Boodschappen zonder duplicates;
- veel open/dicht/switch interacties zonder freeze/jank;
- Historie/Vandaag/Weekplan blijven intact.

Niet als real-device geaccepteerd markeren tot de product owner exact `7867946641cb588d84ea075e08c4c54a3e60cfc5` expliciet bevestigt.

## 5. Testdekking

Naast de bestaande V2.0/V2.1/V2.2 tests bewaakt `scripts/test-cleaning-detail-visual-v221.js` onder andere:
- exact één bestaande Cleaning-sheet;
- geen nieuwe Firebase owner/listener;
- geen MutationObserver/timerpolling/document-wide click owner;
- behoud van canonical execution controls;
- vaste beurt- en supplies-hiërarchie;
- ShoppingListStore handoff met dedupe;
- existing repository ownership van inventory/supply writes;
- warm light / deep navy dark tokens;
- 46px supply icon tiles en mobiele rowmaten;
- geen zware backdrop blur of continue animatie;
- expliciete Cleaning-vs-Taken productgrens.

## 6. Daarna

### V2.3 — functionele gaten + hardening
- onvolledige beurt: doorschuiven / later deze week / overslaan;
- handmatig persoon/moment aanpassen;
- projection consistency;
- household key safety;
- idempotency/double-submit;
- lifecycle/account-household switch;
- soft-delete/cache/versioning hardening.

### V2.4 — brede premium consistency pass
- resterende Cleaning cards/tabs/states harmoniseren;
- volledige light/dark consistency;
- kamerassets/atlassen verder finetunen;
- native-iOS microinteracties zonder repaint-zware effecten;
- voorbereiding van dezelfde shared visual primitives voor Taken.

## 7. Expliciet niet opnieuw bouwen

Geen member availability, vakanties, ziekte/afwezigheid, busy-week/capacity engine, automatische personal-availability planning of complexe planning-pause/exception engines.
