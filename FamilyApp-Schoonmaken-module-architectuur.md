# FamilyApp — Module-architectuur Schoonmaken v2

Laatst bijgewerkt: **10-09-2026**  
Branch: `agent/household-rebuild-v2`

Dit document beschrijft de **actieve Cleaning-v2 architectuur**. Oudere versies van dit bestand beschreven de pre-performance-reset Cleaning-engine met availability/approval/exception-lagen. Die versie is historische referentie in git history, niet de huidige runtimewaarheid.

## 1. Productdoel

Cleaning helpt het huishouden snel antwoord geven op vier vragen:

**Wat moet er gebeuren → wanneer → door wie → uitvoeren / overdragen / handmatig aanpassen.**

Cleaning is geen tweede Taken-module. Cleaning beheert de structurele schoonmaakcontext en concrete schoonmaakoccurrences; Taken en Agenda tonen daarvan afgeleide uitvoer/projecties.

## 2. Canonical model

### CleaningOccurrence is de concrete authority

`CleaningOccurrence` is de canonical concrete execution state.

Een occurrence bevat onder andere:
- household identity;
- room/routine context;
- schedule/date/time;
- assignment;
- checklist/execution state;
- completion state;
- projection metadata;
- vanaf V2.1 collaboration request state.

Tasks en Calendar/Agenda zijn **projecties**, nooit een tweede Cleaning authority.

### Structurele data

Onder `families/{householdId}/cleaning`:
- `rooms`
- `routines`
- `supplies`
- `inventory`
- `plans`
- `occurrences`
- `completionLogs`
- `preferences`

Historische velden kunnen nog in bestaande data voorkomen. Hun aanwezigheid betekent niet dat oude runtime-engines opnieuw actief moeten worden.

## 3. Household scope

Alle actieve Cleaning writes gebruiken het actuele `HouseholdContext`:

`families/{householdId}/cleaning/...`

Voor writes wordt de actuele context/token gecontroleerd zodat een account- of household-switch geen stale write in het vorige huishouden mag uitvoeren.

Production Firebase Rules vallen buiten de huidige Cleaning-milestones en worden niet aangepast zonder expliciete toestemming.

## 4. Runtime lifecycle

De actieve primaire runtime is `src/modules/cleaning/cleaningScreen.js`.

Regels:
- Cleaning wordt lazy geladen bij navigatie naar Schoonmaken;
- geen Cleaning-repository/listener tijdens app startup;
- `CleaningV2Repository` heeft één actieve household-scoped Firebase `value` listener;
- verlaten van Cleaning stopt de binding/runtime;
- heropenen start vanuit actuele HouseholdContext;
- aanvullende V2-slices mogen dezelfde repositorysnapshot/subscription hergebruiken, maar geen tweede Firebase listener starten.

## 5. UI ownership

Primaire Cleaning-v2:
- één screen render owner;
- één eigen Cleaning detail-sheet owner;
- root-scoped interacties;
- geen generieke `TaskDetailPopup`;
- geen document-wide Cleaning click owner;
- geen MutationObserver-architectuur;
- geen meerdere popup owners.

V2.1 Collaboration gebruikt daarom geen nieuwe modal/popup. Het heeft een klein eigen inline sub-root onder het Cleaning-scherm en luistert alleen op dat sub-root.

Definitieve visuele polish blijft V2.4; functionele V2-slices moeten licht blijven.

## 6. Execution writes

Checklist-uitvoering blijft in de primaire Cleaning-v2 runtime:
- optimistic UI;
- korte coalescing/bundling;
- canonical occurrence transaction/write;
- bounded update van bestaande Task/Calendar projecties;
- complete-all schrijft dezelfde canonical occurrence;
- completion logs blijven Cleaning-data.

V2.1 collaboration wordt niet in deze checklistcascade gehangen. Collaboration heeft een eigen smalle occurrence-level command writer voor collaboration transitions; die maakt geen tweede execution authority en start geen reconcile-cascade.

## 7. Weekplanning

V2.0 gebruikt de geaccepteerde pure planner/persistence-contracten om een weekplan lichtgewicht te genereren en concrete occurrences te materialiseren.

V2.1 voegt **geen weekplan approval engine** toe. Productbesluit: approval alleen toevoegen als het aantoonbaar eenvoudiger wordt; voor de huidige flow doet het dat niet.

## 8. Roles/capabilities

Bestaande Cleaning-v2 capabilitybasis blijft leidend voor structure/planning/supplies/execution/destructive acties.

V2.1 collaboration valideert bovendien:
- actuele actor;
- actief household membership voor doelpersonen;
- recipient ownership bij accept/decline/counter;
- initiator/requester ownership bij withdraw/counter response;
- manager capability waar de huidige productflow dat toestaat.

Server-side rolhandhaving is release/securitywerk en wordt niet stil in production Rules veranderd.

## 9. Cleaning V2.1 collaboration model

### 9.1 Pure state machine

`src/modules/cleaning/cleaningCollaborationContract.js`

Deze module is puur en kent geen Firebase/DOM/notificatie/projectiewrites.

Commands:
- `REQUEST_TRANSFER`
- `WITHDRAW_TRANSFER`
- `ACCEPT_TRANSFER`
- `DECLINE_TRANSFER`
- `COUNTER_TRANSFER`
- `ACCEPT_COUNTER`
- `DECLINE_COUNTER`
- `REQUEST_HELP`
- `WITHDRAW_HELP`
- `ACCEPT_HELP`
- `DECLINE_HELP`

### 9.2 Transfer state

State leeft op:
`CleaningOccurrence.transferRequest`

Principes:
- request verandert de current assignee niet;
- acceptatie verandert de bestaande occurrence;
- decline/withdraw laten assignment staan;
- dezelfde PENDING request naar dezelfde persoon is idempotent;
- een counter kan assignee/date/time voorstellen.

### 9.3 Third-person counter safety

Als een counter een derde household member voorstelt, mag acceptatie door de oorspronkelijke requester die derde persoon niet stil toewijzen.

Flow:
1. recipient doet counter met derde persoon;
2. requester accepteert counter;
3. state wordt nieuw `PENDING` transferrequest naar derde persoon;
4. pas derde persoon accepteert;
5. assignment wijzigt.

Dit voorkomt impliciete assignment zonder consent.

### 9.4 Help state

State leeft op:
`CleaningOccurrence.helpRequest`

Principes:
- PENDING request aan één actief household member;
- recipient accepteert/weigert;
- requester kan PENDING intrekken;
- accepted help noteert `helperUid`;
- accepted help wijzigt **niet** `assignmentUids`.

Multi-person assignment is dus geen impliciete V2.1-feature.

## 10. Collaboration writer / concurrency

`src/modules/cleaning/cleaningCollaborationExperience.js`

Regels:
- schrijft collaboration-state via transaction op de bestaande occurrence;
- gebruikt HouseholdContext token validation;
- gebruikt active household members als target allow-list;
- occurrence-level busy guard voorkomt rapid duplicate UI submits;
- pure state-machine maakt identieke PENDING request idempotent;
- geen `.push()` voor collaboration occurrence/task/calendar records;
- geen nieuwe request store.

## 11. Task/Agenda projection sync bij transfer

Alleen een geaccepteerde collaboration transition die assignment/schedule wijzigt zet `projectionChanged=true`.

Daarna:
- zoek de bestaande Task projection via Cleaning occurrence metadata;
- zoek de bestaande Calendar projection;
- update bounded assignment/date/timevelden;
- maak geen nieuw Task/Calendar record als side effect van een repeated collaboration tap.

V2.3 doet verdere projectieconsistentie-hardening; V2.1 introduceert geen brede reconcile-engine.

## 12. Action Inbox

Action Inbox is de beslissingslaag voor incoming collaboration requests.

V2.1 types:
- `cleaning.help`
- `cleaning.occurrence.transfer`
- `cleaning.occurrence.counter`

Architectuur:
- Inbox deriveert item presence rechtstreeks uit `CleaningHouseholdRepository` / occurrence-state;
- Action Inbox is writer-free;
- acties routeren naar `CleaningCollaborationV21.handleInboxAction`;
- een `counter` action opent de Cleaning collaboration form;
- accept/decline/counter decisions gebruiken dezelfde canonical occurrence transition path.

Er is geen aparte Inbox request database.

## 13. Notifications/reminders

V2.1 voegt geen nieuwe notification projector, push loop of reminder listener toe.

Reden:
- requestbeslissingen zijn al actionable in Action Inbox;
- productbesluit vraagt beperkt/gebundeld gedrag;
- V2.2 is de plek voor uitsluitend nuttige Cleaning reminders/activity.

## 14. Expliciet uitgesloten engines

Niet opnieuw bouwen binnen Cleaning v2:
- availability per member;
- vacations;
- sickness/absence;
- busy-week/capacity planning;
- automatic personal-availability scheduling;
- complexe tijdelijke planning-pauzes/exception engines.

Oude bestanden met deze logica mogen alleen als historische/productreferentie worden gelezen.

## 15. Testcontracten

Belangrijke actieve guards:
- `scripts/test-cleaning-runtime-reachability.js`
- `scripts/test-cleaning-modal-performance-guards.js`
- `scripts/test-cleaning-functional-closeout.js`
- `scripts/test-cleaning-permissions.js`
- `scripts/test-cleaning-planning-member-filter.js`
- `scripts/test-cleaning-module-identity.js`
- `scripts/test-action-inbox.js`
- `scripts/test-cleaning-collaboration-v21.js`

De GitHub workflow draait alle `scripts/test-*.js` bestanden op iedere relevante branchpush.

## 16. Milestone order

- V2.0 — accepted performance base.
- V2.1 — collaboration candidate; real-device acceptance pending.
- V2.2 — visible history/activity/useful reminders.
- V2.3 — incomplete occurrence/manual adjustment/hardening.
- V2.4 — final premium visual polish.

Geen volgende Cleaning milestone als V2.1 de real-device performancebasis beschadigt.
