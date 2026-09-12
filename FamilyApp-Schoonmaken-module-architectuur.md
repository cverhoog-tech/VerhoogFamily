# FamilyApp — Module-architectuur Schoonmaken v2

Laatst bijgewerkt: **11-09-2026**  
Branch: `agent/household-rebuild-v2`

Dit document beschrijft de **actieve Cleaning-v2 architectuur**. Pre-performance-reset availability/approval/exception/history/notification-engines blijven historische referentie en zijn geen runtimewaarheid.

## 1. Productdoel

Cleaning helpt het huishouden snel antwoord geven op:

**Wat moet er gebeuren → wanneer → door wie → uitvoeren / overdragen / handmatig aanpassen → terugzien wat gedaan is.**

Cleaning is geen tweede Taken-module. Cleaning beheert structurele schoonmaakcontext en concrete CleaningOccurrences; Taken en Agenda zijn afgeleide projecties.

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
- V2.1 collaboration request state.

Tasks en Calendar/Agenda zijn **projecties**, nooit een tweede Cleaning authority.

### Completion history

`families/{householdId}/cleaning/completionLogs` is de canonical bron voor uitgevoerde Cleaning-historie.

V2.2 introduceert bewust **geen tweede history-store**. Kamer-/routinehistorie en weekstatistieken worden als read model rechtstreeks uit deze completionLogs afgeleid.

### Structurele data

Onder `families/{householdId}/cleaning` blijven onder meer:
- `rooms`
- `routines`
- `supplies`
- `inventory`
- `plans`
- `occurrences`
- `completionLogs`
- `preferences`

Historische velden mogen in oude data bestaan zonder dat bijbehorende oude engines actief worden.

## 3. Household scope

Alle actieve Cleaning writes gebruiken actuele `HouseholdContext` onder:

`families/{householdId}/cleaning/...`

Voor writes wordt context/token gevalideerd zodat stale account-/household-context niet naar het vorige huishouden schrijft.

Production Firebase Rules worden niet gewijzigd zonder expliciete toestemming.

## 4. Runtime lifecycle

De primaire runtime is `src/modules/cleaning/cleaningScreen.js`.

Regels:
- Cleaning wordt lazy geladen bij navigatie naar Schoonmaken;
- geen Cleaning-repository/listener tijdens app startup;
- `CleaningV2Repository` heeft één actieve household-scoped Firebase `value` listener;
- verlaten van Cleaning stopt die Firebase/context binding;
- V2-companions mogen uitsluitend dezelfde repositorysnapshot/subscription hergebruiken;
- een companion-subscription mag nooit een tweede raw Firebase listener starten.

De primaire accepted V2.0 screen/runtime blijft in V2.2 inhoudelijk intact.

## 5. UI ownership

Primaire Cleaning-v2:
- één screen render owner;
- één eigen Cleaning detail-sheet owner;
- root-scoped interacties;
- geen generieke `TaskDetailPopup`;
- geen document-wide Cleaning click owner;
- geen MutationObserver-architectuur;
- geen meerdere popup owners.

### V2.1 collaboration UI

V2.1 Collaboration gebruikt **geen zelfstandig Samenwerken-menu onder Kamers** en geen nieuwe modal/popup. `cleaningCollaborationExperience.js` voegt alleen contextuele controls toe binnen de bestaande concrete beurt-detail-sheet.

### V2.2 history UI

`cleaningHistoryV22.js` is eveneens geen tweede screen owner. Het is een lichte Cleaning-only companion die na de primaire render:
- een vierde `Historie` tab toevoegt;
- bij Historie de native primaire content tijdelijk visueel vervangt door een read-only history projection;
- op Vandaag alleen indien relevant één kleine attention row toevoegt.

De history companion gebruikt geen MutationObserver. Omdat de primaire V2-root op repository updates via `innerHTML` opnieuw wordt opgebouwd, plant V2.2 uitsluitend na zo’n bestaande update twee `requestAnimationFrame` callbacks om **na** de primaire render de kleine presentatie opnieuw aan te brengen. Dit is event-driven en geen voortdurende animation/polling-loop.

## 6. Execution writes

Checklist-uitvoering blijft uitsluitend in de primaire Cleaning-v2 runtime:
- optimistic UI;
- korte coalescing/bundling;
- canonical occurrence transaction/write;
- completionLog creation in Cleaning;
- bounded update van bestaande Task/Calendar-projecties.

V2.1 collaboration heeft alleen zijn smalle occurrence-level collaboration command writer.

V2.2 History is **read-only ten opzichte van Cleaning**. Het schrijft geen rooms/routines/occurrences/completionLogs en bezit geen execution authority.

## 7. Weekplanning

V2.0 gebruikt de accepted pure planner/persistence-contracten om lichtgewicht weekplanning en concrete occurrences te materialiseren.

V2.1/V2.2 voegen geen weekplan approval engine toe.

## 8. Roles/capabilities

Bestaande Cleaning-v2 capabilitybasis blijft leidend voor structure/planning/supplies/execution/destructive acties.

V2.1 collaboration valideert daarnaast actuele actor, active household target, recipient ownership en manager capability waar relevant.

V2.2 history is read-only. De attention row telt alleen open occurrences die aan de huidige UID zijn toegewezen.

Server-side rolhandhaving is release/securitywerk en wordt niet stil in production Rules gewijzigd.

## 9. Cleaning V2.1 collaboration model

### 9.1 Pure state machine

`src/modules/cleaning/cleaningCollaborationContract.js`

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

### 9.2 Transfer

State leeft op `CleaningOccurrence.transferRequest`.

Request verandert current assignee niet. Acceptatie wijzigt de bestaande occurrence. Decline/withdraw laat assignment staan. Identieke PENDING request naar dezelfde persoon is idempotent.

### 9.3 Third-person counter safety

Als een counter een derde household member voorstelt, mag acceptatie door de oorspronkelijke requester die derde persoon niet stil toewijzen.

Flow:
1. recipient doet counter met derde persoon;
2. requester accepteert counter;
3. er ontstaat nieuw `PENDING` transferrequest aan derde persoon;
4. derde persoon beslist zelf;
5. assignment wijzigt pas na diens acceptatie.

### 9.4 Help

State leeft op `CleaningOccurrence.helpRequest`.

Accepted help noteert de helper maar wijzigt **niet** `assignmentUids`. Multi-person assignment is geen impliciete V2.1-feature.

## 10. Collaboration writer / concurrency

`src/modules/cleaning/cleaningCollaborationExperience.js`

- transaction op bestaande occurrence;
- HouseholdContext token validation;
- active-member allow-list;
- occurrence-level busy guard;
- idempotente pure state-machine;
- geen `.push()` voor collaboration records;
- geen aparte requeststore;
- accepted assignment/schedulewijziging synchroniseert bestaande Task/Calendar-projecties bounded.

## 11. Action Inbox

Action Inbox blijft de beslissingslaag voor incoming V2.1 collaboration requests:
- `cleaning.help`
- `cleaning.occurrence.transfer`
- `cleaning.occurrence.counter`

Inbox deriveert uit occurrence-state, blijft writer-free en routeert acties naar `CleaningCollaborationV21.handleInboxAction`.

Op een verse ontvanger-sessie mag Action Inbox Cleaning uitsluitend on-demand hydrateren voor één verse snapshot en daarna teardown uitvoeren.

## 12. Cleaning V2.2 pure history contract

`src/modules/cleaning/cleaningHistoryContract.js`

Pure module zonder Firebase, DOM, notifications of persistence.

Deriveert uit bestaande data:
- `logs(data)` — completion logs newest-first;
- `roomRows(data)` — geschiedenis gegroepeerd per kamer;
- `routineTouches(...)` — routinehistorie uit opgeslagen completion checklists;
- `summary(...)` — completion count/minuten/uitvoerders in huidige week;
- `reminders(...)` — today/overdue read model voor één UID;
- `activityEvent(...)` — deterministic Household Activity event voor echte COMPLETED logs.

REOPENED/PARTIAL/SKIPPED/CARRIED_FORWARD worden niet als nieuwe completed Activity gezien.

## 13. Cleaning V2.2 presentation lifecycle

`src/modules/cleaning/cleaningHistoryV22.js`

Regels:
- geladen via `cleaningPremiumFeedback.js` en dus uitsluitend achter de Cleaning-route;
- gebruikt `CleaningHouseholdRepository.subscribe`, niet `.on('value')`;
- bewaart alleen lokale presentation state (`historyActive`, seen completion ids, in-flight activity ids);
- geen Firebase database owner;
- geen `MutationObserver`;
- geen `setInterval` of polling;
- geen notification projector;
- geen popup/modal;
- root click listener is scoped aan `#screen-cleaning`.

## 14. Household Activity projection V2.2

Household Activity ondersteunt reeds `cleaning.completed` en dedupliceert via `ActivityHouseholdRepository.appendOnce`.

V2.2 gebruikt daarom geen oude scan-projector. In plaats daarvan:
1. bij eerste ready Cleaning snapshot worden bestaande completionLog IDs alleen als baseline gemarkeerd;
2. bij latere snapshots worden alleen nieuw waargenomen IDs bekeken;
3. alleen echte COMPLETED logs leveren een `cleaning.completed` event;
4. occurrenceKey is `cleaning:completion:<completionLogId>`;
5. Activity publish is best-effort en mag Cleaning nooit terugrollen.

Hiermee ontstaat geen historische feed-flood bij het activeren van V2.2.

`cleaningActivityProjector.js` blijft disconnected historical reference.

## 15. Reminders / aandacht

V2.2 gebruikt het woord reminder alleen als **read-only attention projection in Cleaning zelf**.

Er is geen:
- NotificationStore write;
- push notification;
- daily timer;
- pollingloop;
- global reminder listener.

De Vandaag-tab kan compact tonen hoeveel aan de huidige gebruiker toegewezen beurten vandaag of achterstallig zijn en hoeveel geschatte minuten dat betreft.

`cleaningNotificationProjector.js` blijft disconnected historical reference.

## 16. V2.1 verificatie tijdens V2.2

De V2.1 single-device flow lijkt volgens de product owner correct, maar multi-user verificatie is uitgesteld. Dit verandert niets aan de architectuur: V2.1 wordt niet als volledig accepted gemarkeerd totdat die multi-user gate later expliciet is uitgevoerd.

V2.2 mag op product-ownerinstructie vooruitlopen zonder V2.1 naar main te promoveren.

## 17. Expliciet uitgesloten engines

Niet opnieuw bouwen zonder expliciete productbeslissing:
- availability per member;
- vacations;
- sickness/absence;
- busy-week/capacity planning;
- automatic scheduling rond personal availability;
- complexe pause/exception engines.

## 18. Testcontracten

Actieve guards omvatten onder andere:
- `scripts/test-cleaning-runtime-reachability.js`
- `scripts/test-cleaning-modal-performance-guards.js`
- `scripts/test-cleaning-functional-closeout.js`
- `scripts/test-cleaning-permissions.js`
- `scripts/test-cleaning-planning-member-filter.js`
- `scripts/test-cleaning-module-identity.js`
- `scripts/test-action-inbox.js`
- `scripts/test-cleaning-collaboration-v21.js`
- `scripts/test-cleaning-history-v22.js`

V2.2-contracts bewaken expliciet: canonical completionLogs, room/routine history, current-assignee attention, deterministic Activity key, geen observer/poller/extra Firebase owner en geen reactivatie van de oude history/activity/notification runtimes.

## 19. Milestone order

- V2.0 — accepted performance base.
- V2.1 — collaboration codecandidate; multi-user verification deferred/open.
- V2.2 — history/activity/attention codecandidate; real-device test open.
- V2.3 — incomplete occurrence/manual adjustment/hardening.
- V2.4 — final premium visual polish.

Main blijft read-only totdat een exact milestonecheckpoint expliciet is geaccepteerd én apart voor promotie is vrijgegeven.
