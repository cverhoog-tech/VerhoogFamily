# FamilyApp — Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **10-09-2026**  
Branch: `agent/household-rebuild-v2`  
Roadmapstap: **STEP 14 — Cleaning v2**

Dit document is de actuele compacte waarheid voor de actieve Cleaning-implementatie. Oudere versies die de grote pre-performance-reset runtime beschrijven zijn alleen historische productreferentie.

## 1. Geaccepteerde stabiele basis

Cleaning V2.0 performance-first basis:  
`b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Real-device status: **GEACCEPTEERD OP IPHONE**. Deze basis is naar main gepromoveerd. Production/main blijft:
`b7f233ebfe1fbb20ecdf426003f332528562ab0f`

## 2. Actieve Cleaning-v2 architectuur

De primaire runtime is `src/modules/cleaning/cleaningScreen.js` v2.0.0.

Eigenschappen:
- lazy geladen wanneer Cleaning wordt geopend;
- één household-scoped CleaningV2Repository Firebase `value` listener;
- teardown bij verlaten van Cleaning;
- `CleaningOccurrence` is canonical concrete execution state;
- één primaire screen owner en één Cleaning-detail-sheet owner;
- snelle optimistic checklistupdates met coalescing;
- completion logs in Cleaning;
- Tasks en Calendar/Agenda zijn projecties;
- geen actieve generieke TaskDetailPopup voor Cleaning;
- geen legacy execution/projection cascade;
- geen MutationObserver-stack.

V2.0 bevat kamers/routines CRUD, presets, supplies/voorraad, weekplanning, persoonsfilter, de lichte detail-sheet, checklist/complete-all, completion logs, Task/Agenda-projecties en household capabilities.

## 3. Huidige milestone — Cleaning V2.1

Naam: **Samenwerking / overdracht / hulp**  
Status: **CODECANDIDATE GEREED, CI GROEN, REAL-DEVICE ACCEPTATIE NOG OPEN**.

Laatste functionele/testcheckpoint:
`7e34cb60b78cf45664fdb82202e9673bb2ae9672`

GitHub Actions:
- workflow: `Household Rebuild Contract Tests`;
- run: `34534350216`;
- volledige `scripts/test-*.js` suite: **PASS**;
- conclusion: **SUCCESS**.

### Product-UX na correctie 10-09-2026

Samenwerken is **geen apart menu of blok meer onder Kamers**.

De entrypoint is nu de concrete schoonmaakbeurt:
- gebruiker opent een beurt via Vandaag of Weekplan;
- in de bestaande Cleaning V2 beurt-detail-sheet staat een compacte sectie `Samenwerken`;
- daar staan, afhankelijk van state/rechten, `Overdragen`, `Hulp vragen`, actuele verzoekstatus en `Intrekken`;
- ontvangen beslissingen blijven in de Action Inbox;
- `Ander voorstel` vanuit de Action Inbox navigeert terug naar de concrete occurrence en opent het tegenvoorstel in diezelfde beurt-detailflow;
- de bestaande Cleaning V2 detail-sheet blijft de enige popup owner.

Er wordt dus geen tweede Cleaning-popup of los samenwerkingsoverzicht geïntroduceerd.

### Overdracht
- Assigned member/manager kan een concrete open occurrence overdragen aan een actief household member.
- Verzoek verandert de assignee nog niet.
- Ontvanger accepteert/weigert via Action Inbox.
- Acceptatie wijzigt dezelfde CleaningOccurrence.
- Weigering laat de oorspronkelijke assignee staan.
- Aanvrager kan een PENDING of COUNTER_PROPOSED overdracht intrekken.

### Tegenvoorstel
- Ontvanger kan vanuit Action Inbox `Ander voorstel` kiezen.
- Counter ondersteunt persoon, datum en optionele tijd.
- Oorspronkelijke aanvrager accepteert/weigert via Action Inbox.
- Een voorgestelde derde persoon wordt nooit stil toegewezen: na acceptatie ontstaat een nieuw expliciet PENDING verzoek aan die derde persoon.

### Hulp
- Assigned member/manager kan hulp vragen aan een actief household member.
- Ontvanger accepteert/weigert via Action Inbox.
- Aanvrager kan PENDING hulp intrekken.
- Hulpacceptatie noteert de helper op `helpRequest`, maar wijzigt `assignmentUids` niet.
- Er is dus bewust geen impliciet multi-person assignment-model.

### Canonical state

Collaboration-state blijft op de bestaande occurrence:
- `CleaningOccurrence.transferRequest`
- `CleaningOccurrence.helpRequest`

Er is geen aparte requestdatabase of tweede Cleaning authority.

### Action Inbox op verse sessie

Cleaning blijft buiten app-startup. Als een ontvanger direct Action Inbox opent terwijl Cleaning nog niet actief was:
- `cleaningScreen.js` wordt pas on-demand lazy geïmporteerd;
- dezelfde `CleaningHouseholdRepository` wordt tijdelijk gestart;
- er wordt gewacht op een verse household snapshot;
- Action Inbox wordt uit canonical occurrence-state ververst;
- de tijdelijke repositorybinding wordt direct weer gestopt.

### Projecties

Alleen accepted assignment/schedulewijzigingen vragen projection sync. Bestaande Task/Calendar-projecties worden bounded bijgewerkt; V2.1 maakt geen nieuwe occurrence/task/event via `push()`.

### Performance-keuzes

V2.1:
- hergebruikt dezelfde Cleaning repository/snapshot;
- maakt geen tweede langlevende Firebase listener;
- voegt geen Cleaning startupwerk toe;
- gebruikt de bestaande V2 beurt-detail-sheet in plaats van een extra popup/menu;
- gebruikt geen MutationObserver;
- heeft geen document-wide Cleaning click owner;
- maakt geen notificatieprojector/reminder-loop;
- gebruikt Action Inbox voor actionable decisions;
- bouwt weekplan approval niet terug.

### Idempotency
- identiek PENDING transferrequest naar dezelfde persoon is idempotent;
- identieke PENDING hulpvraag is idempotent;
- occurrence-level busy/double-tap guard;
- state-transitions valideren actuele requeststatus en recipient;
- derde-persoons counter wijzigt assignment pas na expliciet akkoord van die derde persoon.

## 4. Testdekking

Automatisch afgedekt:
- transfer request/accept/decline/withdraw;
- counter persoon/datum/tijd + derde-persoon consent;
- help accept/decline/withdraw zonder multi-person assignment;
- active-member/recipient validation;
- geen extra Firebase listener;
- verse Action Inbox on-demand hydration + teardown;
- geen Firebase push-path voor collaboration;
- geen verboden legacy runtimepatronen;
- Action Inbox writer-free occurrence adapters;
- geen standalone samenwerkingmenu;
- collaborationcontrols moeten in de bestaande beurt-detailflow zitten;
- cache-bumped lazy import (`cleaningCollaborationExperience.js?v=2`) om stale iPhone/PWA UI te vermijden.

## 5. Real-device gate — nog open

V2.1 is **NIET** real-device geaccepteerd.

Te testen op echte iPhone:
1. Open Cleaning en controleer dat onder Kamers géén los `Samenwerken`-menu meer staat.
2. Open een concrete beurt; `Overdragen` en `Hulp vragen` moeten in die beurt-detail-sheet staan.
3. Maak een transferverzoek.
4. Open op een verse ontvanger-sessie direct Action Inbox; het verzoek moet zichtbaar zijn zonder eerst Cleaning handmatig te openen.
5. Accepteer; dezelfde occurrence + Task + Agenda moeten de nieuwe assignee tonen.
6. Test weigeren en intrekken; oorspronkelijke assignee blijft waar van toepassing staan.
7. Test tegenvoorstel persoon/dag/tijd, inclusief expliciet akkoord van een eventuele derde persoon.
8. Test hulp accepteren, weigeren en intrekken.
9. Probeer snelle dubbele taps; geen dubbele occurrence/task/event/requeststate.
10. Open/sluit/heropen Cleaning en gebruik daarna andere modules; geen freeze, jank of achterblijvende Cleaning runtime.

Pas na expliciete product-ownerbevestiging wordt de exacte geaccepteerde SHA als nieuwe rollbackbasis vastgelegd.

## 6. Volgende Cleaning-stappen

### V2.2 — Historie / Activity / reminders
Pas na V2.1 acceptance: kamer-/routinehistorie, zichtbare completion logs, wie/wat/wanneer, relevante household activity feed events en alleen nuttige reminders.

### V2.3 — Functionele gaten + hardening
Onvolledige beurt (doorschuiven/later/overslaan), handmatige persoon/moment-wijziging, projection consistency, household key safety, idempotency, lifecycle, soft-delete en cache/versioning.

### V2.4 — Definitieve premium visual polish
Light/dark, premium room assets/atlassen, duidelijke hiërarchie en lichte native-iOS microinteracties zonder repaint-zware effecten.

## 7. Expliciet niet opnieuw bouwen

Geen member availability, vakanties, ziekte/afwezigheid, busy-week/capacity engine, automatische personal-availability planning of complexe planning-pause/exception engines.
