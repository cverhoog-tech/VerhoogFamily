# FamilyApp — Schoonmaken Milestone Log

Laatst bijgewerkt: **11-09-2026**

Alleen een milestone die de product owner expliciet op real-device heeft geaccepteerd wordt hier als **REAL-DEVICE GEACCEPTEERD** gemarkeerd. Een tijdelijke onmogelijkheid om multi-user te testen geldt niet als acceptatie.

---

## Historische pre-reset Cleaning

Status: **HISTORISCHE REFERENTIE — NIET ACTIEF**

De vroegere omvangrijke Cleaning-runtime met availability, approval, pause/exception, MutationObservers, zware experience/projectie-lagen en aanvullende notificatie-engines veroorzaakte ernstige freezes op echte iPhone.

Niet opnieuw activeren:
- `CleaningExecutionWriteRuntime`;
- `CleaningProjectionService`;
- generieke `TaskDetailPopup` voor Cleaning;
- oude Cleaning experience-stack;
- MutationObserver-architectuur;
- document-wide Cleaning click owners;
- meerdere popup owners;
- zware reconcile per checkbox;
- Cleaning startupwerk;
- parallelle canonical Cleaning writers.

---

## Cleaning V2.0 — Performance-first rebuild

Status: **AFGEROND / REAL-DEVICE GEACCEPTEERD OP IPHONE**  
Acceptatiecheckpoint: `b4511561f0885023e5ca6649a1eecd8f4a611d6a`

Deze basis is naar main gepromoveerd. Production/main blijft:
`b7f233ebfe1fbb20ecdf426003f332528562ab0f`

V2.0 blijft de harde performance-/rollbackbasis.

Geaccepteerd: lazy loading, lifecycle teardown, één Cleaning repository, canonical CleaningOccurrence, kamers/routines CRUD, presets, supplies/inventory, weekplanning/persoonsfilter, lichte eigen detail-sheet, optimistic/coalesced checklistwrites, completion logs, Task/Agenda-projecties en capabilities.

---

## Cleaning V2.1 — Samenwerking / overdracht / hulp

Status: **CODECANDIDATE GEREED — SINGLE-DEVICE LIJKT GOED — MULTI-USER VERIFICATIE UITGESTELD**  
Laatste volledig geteste V2.1 checkpoint: `7e34cb60b78cf45664fdb82202e9673bb2ae9672`  
CI: `Household Rebuild Contract Tests` run `34534350216` — **SUCCESS**

### Scope
- occurrence-level transfer;
- accept/decline via Action Inbox;
- counter persoon/dag/tijd;
- derde persoon vereist expliciet eigen akkoord;
- help request accept/decline/withdraw;
- transfer withdraw;
- geen multi-person assignment via help;
- deterministic/idempotent request transitions;
- existing Task/Agenda projections bounded synchroniseren na accepted transfer;
- Action Inbox verse sessie hydrateert Cleaning alleen on-demand.

### Definitieve V2.1 UX

Geen zelfstandig `Samenwerken`-blok onder Kamers. Samenwerken hoort bij de concrete beurt en staat in de bestaande V2 beurt-detail-sheet: `Overdragen`, `Hulp vragen`, status en `Intrekken`. Incoming decisions blijven in Action Inbox. De bestaande V2-sheet blijft de enige popup owner.

### Verificatiestatus 11-09-2026

De product owner meldt dat de flow op het beschikbare toestel **lijkt te werken**, maar kon op dat moment geen multi-user test uitvoeren. Op verzoek wordt verdergegaan met V2.2 zonder V2.1 ten onrechte als volledig geaccepteerd te markeren.

Open latere multi-user gate:
- account A → transfer/help request;
- verse account B → Action Inbox;
- accept/decline/counter;
- derde-persoon expliciet akkoord;
- projection consistency Cleaning/Tasks/Agenda;
- rapid taps/idempotency;
- performance/lifecycle over beide accounts.

---

## Cleaning V2.2 — Historie / Activity / nuttige aandacht

Status: **CODECANDIDATE GEREED — CI GROEN — REAL-DEVICE TEST OPEN**  
Functioneel/testcheckpoint: `ffb0552bad734309e02361de87bde7a3e96a3464`  
CI: `Household Rebuild Contract Tests` run `34537327502` — **SUCCESS**

### Productdoel

Historie zichtbaar maken en relevante schoonmaakactiviteit tonen zonder de oude zware history/notification runtimes terug te brengen.

### Nieuwe pure history contractlaag

`src/modules/cleaning/cleaningHistoryContract.js`

Leest uitsluitend bestaande canonical Cleaning-data en deriveert:
- completion logs newest-first;
- historie per kamer;
- routinehistorie uit completion checklists;
- weeksummary;
- current-assignee today/overdue aandacht;
- deterministic `cleaning.completed` Activity-eventdata.

Geen Firebase, DOM, notification of persistence authority.

### Nieuwe lichte V2.2 presentation companion

`src/modules/cleaning/cleaningHistoryV22.js`

Wordt via de bestaande Cleaning-only lazy bridge geladen en:
- hergebruikt `CleaningHouseholdRepository.subscribe`;
- voegt `Historie` als vierde Cleaning-tab toe;
- toont weekstatistieken;
- groepeert historie per kamer;
- toont per routine laatste moment + gezinslid + 30-dagen activiteit;
- toont op Vandaag alleen indien relevant een compacte regel met eigen today/overdue werk en minuten.

### Activity

Nieuwe completionLogs die in de actieve Cleaning-clientlifecycle binnenkomen kunnen best-effort naar de bestaande Household Activity-feed worden gepubliceerd als `cleaning.completed`.

Safety:
- deterministic `cleaning:completion:<completionLogId>` occurrenceKey;
- bestaande Activity `appendOnce` blijft dedupe authority;
- eerste bestaande completionLog-snapshot wordt baseline, dus geen historische flood;
- REOPENED completion logs publiceren niet opnieuw;
- Activity failure rolt een Cleaning completion niet terug.

### Bewust géén notification/reminder engine

V2.2 bouwt geen pushmeldingen, NotificationStore-projector of dagelijkse poller. De “reminder” is uitsluitend een rustige contextuele aandachtregel wanneer de gebruiker Cleaning/Vandaag zelf opent.

### Performancegate

Automatisch bewaakt:
- accepted primaire `cleaningScreen.js` blijft intact;
- geen tweede raw Firebase listener;
- geen MutationObserver;
- geen `setInterval`/polling;
- geen tweede popup owner;
- geen oude `cleaningHistoryExperience.js` activation;
- geen oude `cleaningActivityProjector.js` activation;
- geen oude `cleaningNotificationProjector.js` activation;
- geen Cleaning startup path.

Nieuwe test:
`scripts/test-cleaning-history-v22.js`

Bestaande V2.0/V2.1 tests blijven groen.

### Real-device gate — OPEN

Te verifiëren op echte iPhone:
1. vier tabs netjes op één rij: Vandaag / Kamers / Weekplan / Historie;
2. Vandaag blijft soepel en toont aandacht alleen waar relevant;
3. Historie opent zonder jank;
4. completion logs verschijnen per kamer;
5. kamer uitklappen toont routine + moment + gezinslid;
6. nieuwe beurt afronden → historie ververst;
7. Activity-feed krijgt maximaal één `cleaning.completed` item voor die completion;
8. reopen maakt geen tweede completed activity;
9. veel tabwissels maken geen dubbele Historie-tab/sectie;
10. verlaten Cleaning laat geen nieuwe runtime/polling achter.

**Niet markeren als REAL-DEVICE GEACCEPTEERD totdat de product owner dit expliciet bevestigt.**

---

## Cleaning V2.3 — Functionele gaten + hardening

Status: **GEPLAND NA V2.2 TEST**

Onvolledige beurt (doorschuiven/later/overslaan), handmatige persoon/moment-wijziging, projection consistency, household-key safety, idempotency/double submit, account/household lifecycle, soft-delete en cache/versioning.

---

## Cleaning V2.4 — Definitieve premium visual polish

Status: **GEPLAND NA FUNCTIONELE STABILITEIT**

Premium FamilyApp-look, light/dark, kamerassets/atlassen, duidelijke hiërarchie en lichte native-iOS microinteracties zonder repaint-zware effecten.

---

## Expliciet uitgesloten

Geen availability per member, vakanties, ziekte/afwezigheid, busy-week/capacity model, automatic scheduling rond persoonlijke beschikbaarheid of complexe pause/exception engine zonder expliciete nieuwe productbeslissing.
