# FamilyApp — Schoonmaken Milestone Log

Laatst bijgewerkt: **10-09-2026**

Dit is het actieve milestone-log voor STEP 14 — Schoonmaken. Alleen een flow die de product owner expliciet op real-device heeft geaccepteerd wordt hier als REAL-DEVICE GEACCEPTEERD gemarkeerd.

De zeer uitgebreide oude milestonebeschrijvingen van de pre-performance-reset Cleaning-runtime blijven beschikbaar in git history, maar zijn niet langer de actieve runtimewaarheid.

---

## Historische pre-reset milestones

Status: **HISTORISCHE REFERENTIE — NIET AUTOMATISCH ACTIEF**

Tot en met begin september 2026 is een omvangrijke Cleaning-implementatie gebouwd met onder andere rooms, routines, planning, availability, approval, transfer/counter, help, pause/exception, history, notifications, supplies en projecties.

Belangrijk: deze implementatie bleek op echte iPhone te zwaar en veroorzaakte ernstige freezes. De product owner heeft daarom besloten de zware actieve runtime te verwijderen en Cleaning opnieuw performance-first op te bouwen.

De oude bestanden/tests mogen als productreferentie dienen, maar mogen niet opnieuw worden geactiveerd voor snelle feature parity.

Verboden terugkeerpatronen:
- oude `CleaningExecutionWriteRuntime`;
- oude `CleaningProjectionService`;
- generieke `TaskDetailPopup` voor Cleaning;
- oude Cleaning experience-stack;
- MutationObserver-architectuur;
- document-wide Cleaning click owners;
- meerdere popup owners;
- zware reconcile-cascade per checkbox;
- Cleaning startupwerk;
- parallelle canonical Cleaning writers.

---

## Cleaning V2.0 — Performance-first rebuild

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**  
Acceptatiecheckpoint: `b4511561f0885023e5ca6649a1eecd8f4a611d6a`  
Product-owner acceptatie: **“Top dit werkt perfect.”**

Deze basis is daarna naar main gepromoveerd. De huidige production/main-baseline is `b7f233ebfe1fbb20ecdf426003f332528562ab0f`.

### Geaccepteerde V2.0 scope

- lazy Cleaning loading;
- teardown van runtime/listeners bij verlaten Cleaning;
- household-scoped Firebase;
- `CleaningOccurrence` canonical execution state;
- kamers CRUD;
- routines CRUD + presets;
- supplies/voorraad;
- weekplanning;
- persoonsfilter;
- lichte eigen detail-sheet;
- snelle optimistic checklist + coalesced writes;
- complete-all;
- completion logs;
- Task/Agenda projecties;
- household roles/capabilities.

### Architectuurgate

V2.0 is de rollback-/performancebasis die iedere volgende Cleaning-milestone moet behouden. Een feature die functioneel werkt maar deze performancebasis opnieuw beschadigt, wordt niet geaccepteerd.

---

## Cleaning V2.1 — Samenwerking / overdracht / hulp

Status: **MILESTONE CODECANDIDATE GEREED — CI GROEN — REAL-DEVICE ACCEPTATIE OPEN**  
Laatste functionele/testcheckpoint vóór de finale documentatie-updates: `1460b9de4405364a9bea54502620d76347b41c5e`

### Doel

De gewenste samenwerking uit de oude productflow opnieuw lichtgewicht aanbieden, zonder availability-/approval-/exception-engines of oude runtime-lagen terug te brengen.

### Gebouwd

#### Canonical collaboration state
- `CleaningOccurrence.transferRequest`
- `CleaningOccurrence.helpRequest`
- geen aparte collaboration/request store;
- geen tweede occurrence authority.

#### Overdracht
- open occurrence overdragen aan ander actief household member;
- oorspronkelijke assignment blijft staan zolang request niet geaccepteerd is;
- recipient accept/decline via Action Inbox;
- accepted transfer wijzigt dezelfde occurrence;
- declined transfer laat assignment ongewijzigd;
- requester kan PENDING/COUNTER_PROPOSED request intrekken.

#### Tegenvoorstel
- recipient kan `Ander voorstel` openen;
- voorstel ondersteunt persoon, datum en tijd;
- requester accepteert/weigert via Action Inbox;
- voorstel naar een derde household member wordt niet stil uitgevoerd;
- bij acceptatie door requester ontstaat dan een nieuw PENDING verzoek voor die derde persoon;
- pas diens expliciete acceptatie verandert de assignment.

#### Hulp
- hulp vragen aan actief household member;
- accept/decline via Action Inbox;
- PENDING hulpvraag intrekken;
- accepted help noteert helper in requeststate;
- `assignmentUids` wordt niet uitgebreid: multi-person assignment is bewust niet onderdeel van V2.1.

#### Action Inbox verse sessie
- Cleaning blijft uit de app-startup;
- wanneer Action Inbox wordt geopend, kan de Inbox Cleaning v2 on-demand lazy importeren;
- buiten een actieve Cleaning-sessie wordt de bestaande repository eerst gestopt, waarna één verse household-snapshot wordt opgehaald;
- de retained oude snapshot wordt niet als verse decision-state gebruikt;
- na de eerste verse snapshot/error wordt de tijdelijke Cleaning repositorybinding direct weer gestopt;
- er is daardoor geen blijvende tweede Cleaning listener buiten de Cleaning-module.

#### Task/Agenda projections
- alleen accepted assignment/schedule changes triggeren projection sync;
- bestaande Task/Calendar projections worden bounded bijgewerkt;
- V2.1 maakt geen nieuwe occurrence/task/calendar record via `push()`.

#### Performance en lifecycle
- collaboration experience laadt via de lazy Cleaning-route;
- Action Inbox mag Cleaning alleen on-demand kort hydrateren wanneer de Inbox zelf wordt geopend;
- hergebruikt dezelfde `CleaningHouseholdRepository` snapshot/listener;
- geen tweede langlevende Firebase `value` listener;
- geen app-startup Cleaning work;
- eigen klein inline collaboration sub-root;
- geen extra popup owner;
- geen document-wide Cleaning click owner;
- geen MutationObserver;
- geen oude Cleaning execution/projection runtime;
- geen nieuwe notification projector/listener/reminder-loop.

#### Productkeuzes
- weekplan approval niet teruggebouwd; het vereenvoudigt de huidige flow niet;
- notifications bewust niet uitgebreid in V2.1; actionable decisions lopen via Action Inbox;
- multi-person assignment niet impliciet toegevoegd;
- availability/vakantie/ziekte/capaciteit/pause engines blijven uitgesloten.

### Idempotency / concurrency

- duplicate-tap busy guard per occurrence;
- identiek PENDING transferrequest is idempotent;
- identieke PENDING helprequest is idempotent;
- request transitions valideren actuele status en actor/recipient;
- transfer wordt in een Firebase transaction op dezelfde occurrence toegepast;
- Action Inbox blijft writer-free.

### Automatische teststatus

Op `1460b9de4405364a9bea54502620d76347b41c5e`:
- volledige repositorysuite `scripts/test-*.js`: **PASS**;
- GitHub Actions run `34519907566`: **SUCCESS**;
- Vercel deployment: **READY / SUCCESS**;
- immutable deployment: `https://verhoog-family-j4tekgf2i-cverhoog-techs-projects.vercel.app`;
- branch-preview alias: `https://verhoog-family-git-agent-househo-3f9e18-cverhoog-techs-projects.vercel.app`.

Nieuwe relevante test:
`scripts/test-cleaning-collaboration-v21.js`

Aanvullend uitgebreid:
`scripts/test-action-inbox.js`

Deze dekken onder andere:
- request/accept/decline/withdraw;
- counter person/date/time;
- expliciet derde-persoon akkoord;
- help zonder multi-person assignment;
- active-member en recipient validation;
- idempotent repeat requests;
- geen tweede langlevende Firebase listener;
- verse Action Inbox sessie hydrateert Cleaning uitsluitend on-demand en doet daarna teardown;
- geen Firebase push-path voor collaboration records;
- geen verboden legacy runtimepatronen;
- Action Inbox occurrence adapters en writer-free routing.

### Real-device acceptancegate — NOG OPEN

Te verifiëren op echte iPhone:
1. Cleaning openen/sluiten/heropenen zonder freeze of jank.
2. Transfer request aanmaken.
3. Op verse ontvanger-sessie direct Action Inbox openen; verzoek moet zichtbaar worden zonder eerst Schoonmaken handmatig te openen.
4. Recipient accepteert — same occurrence + Task + Agenda tonen recipient.
5. Recipient weigert — oorspronkelijke assignment blijft staan.
6. Tegenvoorstel persoon/dag/tijd.
7. Tegenvoorstel naar derde persoon — derde persoon moet expliciet akkoord geven.
8. Transfer intrekken vóór acceptatie.
9. Hulp vragen → acceptatie.
10. Hulp vragen → weigering.
11. Hulpvraag intrekken.
12. Rapid repeat taps zonder dubbele occurrences/tasks/events.
13. Na verlaten Cleaning/Inbox geen achtergrondperformance-regressie.

**Niet markeren als REAL-DEVICE GEACCEPTEERD totdat de product owner dit expliciet bevestigt.**

Na acceptatie:
- documenteer de exacte geaccepteerde SHA als nieuwe rollbackbasis;
- pas daarna, en alleen na expliciete toestemming, exact die geaccepteerde staat naar main promoten.

---

## Cleaning V2.2 — Historie / Activity / reminders

Status: **GEPLAND — PAS NA V2.1 ACCEPTATIE**

- kamerhistorie;
- routinehistorie;
- completion logs zichtbaar;
- wie/wat/wanneer;
- relevante household activity feed events;
- alleen nuttige reminders;
- eventueel lichte gezamenlijke progressie;
- geen competitief schoonmaakleaderboard.

---

## Cleaning V2.3 — Functionele gaten + hardening

Status: **GEPLAND**

- onvolledige beurt: doorschuiven / later deze week / overslaan;
- handmatig persoon/moment aanpassen;
- Task/Agenda projection consistency;
- household-key safety;
- idempotency/double submit;
- listener lifecycle bij account/household switches;
- soft-delete edge cases;
- cache/versioning;
- aanvullende contracts.

Niet toevoegen: availability-, vakantie-, ziekte-, capacity- of complexe pause engines.

---

## Cleaning V2.4 — Definitieve premium visual polish

Status: **GEPLAND NA FUNCTIONELE STABILITEIT**

- premium FamilyApp-look;
- light + dark;
- kameratlassen/assets;
- duidelijke kaarthiërarchie;
- lichte native-iOS microinteracties;
- geen repaint-zware glass/blur-effecten.
