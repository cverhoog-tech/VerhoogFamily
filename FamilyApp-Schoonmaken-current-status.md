# FamilyApp — Schoonmaken actuele implementatiestatus

Laatst bijgewerkt: **10-09-2026**  
Branch: `agent/household-rebuild-v2`  
Roadmapstap: **STEP 14 — Cleaning v2**

Dit document is de actuele compacte waarheid voor de actieve Cleaning-implementatie. Oudere versies van dit bestand beschreven de grote pre-performance-reset Cleaning-runtime en zijn alleen nog via git history bruikbaar als historische productreferentie.

## 1. Geaccepteerde stabiele basis

Cleaning V2.0 performance-first basis:
`b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Real-device status: **GEACCEPTEERD OP IPHONE**. Product-owner reactie: “Top dit werkt perfect.”

Deze basis is daarna naar main gepromoveerd. De huidige productie/main-baseline blijft:
`b7f233ebfe1fbb20ecdf426003f332528562ab0f`

## 2. Actieve Cleaning-v2 architectuur

De actieve primaire runtime is `src/modules/cleaning/cleaningScreen.js` v2.0.0.

Eigenschappen:
- lazy geladen wanneer Cleaning wordt geopend;
- één CleaningV2Repository listener op de household-scoped Cleaning-root;
- listener/runtime teardown bij verlaten van Cleaning;
- `CleaningOccurrence` is canonical concrete execution state;
- één primaire screen owner en één primaire Cleaning-detail-sheet owner;
- snelle optimistic checkbox-updates met coalescing;
- completion logs in Cleaning;
- Tasks en Calendar/Agenda zijn projecties;
- geen actieve generieke TaskDetailPopup voor Cleaning;
- geen actieve legacy execution/projection cascade;
- geen MutationObserver-stack.

Functioneel aanwezig in V2.0:
- kamers aanmaken/bewerken/verwijderen;
- routines aanmaken/bewerken/verwijderen;
- presets;
- supplies/voorraad;
- weekplanning;
- persoonsfilter;
- lichte Cleaning detail-sheet;
- checklist/complete-all;
- completion logs;
- Task/Agenda projecties;
- household roles/capabilities.

## 3. Huidige milestone — Cleaning V2.1

Naam: **Samenwerking / overdracht / hulp**  
Status: **CODECANDIDATE GEREED, CI GROEN, REAL-DEVICE ACCEPTATIE NOG OPEN**.

Implementatiecheckpoint vóór deze documentatie-updates:
`a9fa6afd7781898fdadf16c10ca50f7a007eaca8`

### Gebouwd

#### Overdracht
- Assigned member/manager kan een concrete open occurrence overdragen aan een actief household member.
- Verzoek verandert de assignee nog niet.
- Ontvanger krijgt een Action Inbox-beslissing.
- Ontvanger kan accepteren of weigeren.
- Acceptatie wijzigt dezelfde CleaningOccurrence.
- Weigering laat de oorspronkelijke assignee staan.
- Aanvrager kan een PENDING of COUNTER_PROPOSED overdracht intrekken.

#### Tegenvoorstel
- Ontvanger kan vanuit Action Inbox `Ander voorstel` kiezen.
- Counter bevat persoon, datum en optionele tijd.
- Oorspronkelijke aanvrager accepteert/weigert het tegenvoorstel in Action Inbox.
- Als de voorgestelde persoon de counter-auteur of oorspronkelijke aanvrager is, kan acceptatie direct de bestaande occurrence aanpassen.
- Als een derde gezinslid wordt voorgesteld, wordt die persoon **niet** stil toegewezen: de state-machine maakt een nieuw expliciet PENDING overdrachtsverzoek aan die derde persoon.

#### Hulp
- Assigned member/manager kan hulp vragen aan een actief household member.
- Ontvanger accepteert/weigert via Action Inbox.
- Aanvrager kan PENDING hulp intrekken.
- Hulpacceptatie noteert de helper op `helpRequest`, maar voegt de helper niet toe aan `assignmentUids`.
- Er is dus bewust nog geen multi-person assignment-model.

### Canonical state

Nieuwe collaboration-state blijft op de bestaande occurrence:
- `CleaningOccurrence.transferRequest`
- `CleaningOccurrence.helpRequest`

Er is geen aparte Cleaning request-database en geen tweede canonical writer/store.

### Projecties

Alleen een geaccepteerde assignment-/schedulewijziging vraagt projection sync.
De V2.1 writer werkt de reeds bestaande Task/Calendar records bij met een bounded family-root update en maakt geen nieuwe occurrence/task/event via push aan.

### Performance-keuzes

V2.1:
- hergebruikt `CleaningHouseholdRepository` / CleaningV2Repository;
- maakt geen tweede Firebase `value` listener;
- wordt alleen via de lazy Cleaning-route geladen;
- voegt geen Cleaning startupwerk toe;
- gebruikt een eigen klein inline samenwerking-subroot, geen tweede popup;
- gebruikt geen MutationObserver;
- heeft geen document-wide click owner;
- maakt geen notificatieprojector/reminder-loop;
- gebruikt Action Inbox als actionable beslissingsoppervlak;
- bouwt weekplan approval niet terug.

### Idempotency

- dezelfde PENDING transfer naar dezelfde persoon is idempotent;
- dezelfde PENDING hulpvraag naar dezelfde persoon is idempotent;
- UI heeft occurrence-level busy/double-tap guard;
- accept/decline/counter transitions valideren actuele requeststatus en ontvanger;
- derde-persoons counter creëert pas na expliciete acceptatie de echte assignmentwijziging.

## 4. Teststatus

Op implementatiecheckpoint `a9fa6afd7781898fdadf16c10ca50f7a007eaca8`:
- volledige repositorysuite `scripts/test-*.js`: **PASS**;
- `Household Rebuild Contracts`: **SUCCESS**;
- Vercel Git deployment: **SUCCESS**.

Nieuwe V2.1-testdekking:
- pure transfer state-machine;
- accept/decline/withdraw;
- counterproposal + derde-persoon opt-in;
- help accept/withdraw;
- geen multi-person assignment via help;
- active-member validation;
- recipient validation;
- geen extra Firebase listener;
- geen Firebase push-path voor collaboration;
- geen legacy MutationObserver/popup/execution/projection-runtime;
- geen notificatiepublisher in V2.1;
- Action Inbox writer-free occurrence adapters;
- lazy load achter Cleaning-route.

## 5. Real-device gate — nog open

V2.1 is **NIET** real-device geaccepteerd.

Te testen door product owner op echte iPhone:
1. Cleaning openen/sluiten/heropenen — geen freeze/jank.
2. Transfer verzoek maken.
3. Recipient accepteert; dezelfde occurrence + Task + Agenda tonen nieuwe assignee.
4. Transfer weigeren; assignment blijft staan.
5. Counter persoon/dag/tijd maken en accepteren/weigeren.
6. Counter naar derde persoon; derde persoon moet apart akkoord geven.
7. PENDING transfer intrekken.
8. Hulp vragen; accepteren en weigeren.
9. PENDING hulpvraag intrekken.
10. Snelle dubbele taps; geen dubbele occurrence/task/event/requeststate.
11. Na verlaten Cleaning geen merkbare achtergrondvertraging in andere modules.

Pas na expliciete bevestiging wordt de exacte geaccepteerde SHA als nieuwe rollbackbasis vastgelegd.

## 6. Volgende Cleaning-stappen

### V2.2 — Historie / Activity / reminders
Pas na V2.1 acceptance:
- kamerhistorie;
- routinehistorie;
- completion logs zichtbaar;
- wie/wat/wanneer;
- relevante household activity feed events;
- alleen nuttige reminders;
- eventueel subtiele gezamenlijke progressie, geen leaderboard.

### V2.3 — Functionele gaten + hardening
- onvolledige beurt: doorschuiven / later deze week / overslaan;
- handmatig ander moment/persoon;
- projection consistency;
- household key safety;
- idempotency/double-submit;
- account/household switch lifecycle;
- soft-delete;
- cache/versioning;
- extra contracts.

### V2.4 — Definitieve premium visual polish
- light/dark;
- premium room assets/atlassen;
- duidelijke hiërarchie;
- lichte native iOS microinteracties;
- geen repaint-zware blur/glass effecten.

## 7. Expliciet niet opnieuw bouwen

Geen:
- availability per gezinslid;
- vakanties;
- ziekte/afwezigheid;
- drukke-week/capacity engine;
- automatische planning op persoonlijke beschikbaarheid;
- complexe tijdelijke planning-pauzes/exception engines.

Oude bestanden die dergelijke functies bevatten mogen alleen als product-/historische referentie worden gelezen. Ze mogen niet opnieuw in de actieve v2 runtime worden geïmporteerd om snel feature parity te bereiken.
