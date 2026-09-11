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

De product owner meldt dat de flow op het beschikbare toestel **lijkt te werken**, maar kon op dat moment geen multi-user test uitvoeren. Op verzoek wordt verdergegaan zonder V2.1 ten onrechte als volledig geaccepteerd te markeren.

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
Functioneel runtimecheckpoint: `ffb0552bad734309e02361de87bde7a3e96a3464`  
Laatste V2.2 docs/testcheckpoint vóór visual rework: `28fd9fb6832ef369ee084723b4a71736fb4e662d`  
CI op dat checkpoint: `Household Rebuild Contract Tests` run `34537817885` — **SUCCESS**

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

**V2.2 blijft functioneel nog real-device te verifiëren; de nieuwe V2.2.1 visual candidate hieronder is vanaf nu de bedoelde zichtbare testoppervlakte voor beurt- en benodigdhedendetail.**

---

## Cleaning V2.2.1 — Calm Premium detail visual rework

Status: **IMPLEMENTATIE GEREED — CONTRACT/CI + REAL-DEVICE GATE OPEN**  
Implementatiecheckpoint vóór milestone-documentatie: `c32eb2dac2be9d40912cdb4c6f68c7566e935e06`

### Waarom deze milestone vóór V2.3 is ingevoegd

Op 11-09-2026 heeft de product owner de definitieve visuele referentie voor de concrete schoonmaakbeurt en Benodigdheden opnieuw bevestigd. Besloten is deze detailflows **vóór** verdere V2.3-functionaliteit te harmoniseren, zodat nieuwe functionele acties straks niet eerst in een tijdelijke UI worden gebouwd en daarna opnieuw moeten worden verplaatst.

De gedeelde visuele bron is:
`docs/FAMILYAPP-VISUAL-DESIGN-SYSTEM.md`

Art direction: **Calm Premium Home** — warm, clean, rustig, premium, minimalistisch zonder kaal te worden, met FamilyApp-violet, zachte surfaces, semantische statuskleuren en compacte kleurrijke line-icon tiles.

### Productgrens vastgezet

Schoonmaken wordt nadrukkelijk **geen tweede Taken-module**.

Schoonmaken blijft primair:
**kamer → routine → planning → uitvoering → benodigdheden → historie.**

Taken blijft later de algemene uitvoerlaag en mag dezelfde designprimitives gebruiken zonder Cleaning-routines/voorraad/room-context over te nemen.

### Concrete schoonmaakbeurt — nieuwe vaste visuele hiërarchie

1. rustige native header met back, contexttitel en overflow;
2. grote kamerhero met statuschip;
3. prominente schoonmaakbeurttitel;
4. dag / moment / onderdelen / geschatte duur;
5. toegewezen persoon met avatar;
6. routinevoortgang met percentage en progressbar;
7. concrete routinechecklist;
8. primaire `Start schoonmaken` / `Verder schoonmaken` flow;
9. secundaire `Bewerken` actie;
10. utility pair `Bekijk beurt` + `Benodigdheden` met countbadge;
11. samenwerking blijft contextueel in dezelfde bestaande Cleaning-sheet en wordt visueel ondergeschikt aan de uitvoerflow.

### Benodigdheden — nieuwe vaste visuele hiërarchie

1. header `Kamer — Benodigdheden` context;
2. segmented control `Voor deze beurt / Alle kameritems`;
3. intro met concrete beurtcontext of kamercontext;
4. 76px supply rows met 46px gekleurde line-icon tiles;
5. tekststatus `Op voorraad / Bijna op / Ontbreekt` plus compacte semantische indicator;
6. `Ontbreekt iets?` callout;
7. kamer-voorraadsamenvatting;
8. beheeractie om kameritem toe te voegen waar permissies dit toestaan;
9. utility pair `Bekijk alle kameritems` + `Boodschappen`.

LOW/OUT-items gaan via de bestaande canonical `ShoppingListStore` naar Boodschappen met dedupe; de visual rework maakt geen tweede shopping writer.

### Implementatie

Nieuw:
- `src/modules/cleaning/cleaningDetailVisualV221.js`;
- `src/styles/cleaning-detail-v221.css`;
- `scripts/test-cleaning-detail-visual-v221.js`.

Gewijzigd:
- `src/modules/cleaning/cleaningPremiumFeedback.js` laadt de visual companion alleen lazy wanneer Cleaning zelf geopend wordt;
- `scripts/test-cleaning-functional-closeout.js` neemt de V2.2.1-contracten mee.

### Architectuur/performanceguards

Bewust behouden:
- primaire `cleaningScreen.js` blijft version `2.0.0` en write authority;
- dezelfde bestaande `cleaning-v2-sheet` blijft de enige popup owner;
- bestaande `data-cv2-check` / complete-all flow blijft de uitvoering schrijven;
- bestaande repositorymethodes blijven supply/inventory writes doen;
- geen tweede raw Firebase listener;
- geen MutationObserver;
- geen document-wide click owner;
- geen polling/setInterval/setTimeout in de visual companion;
- geen backdrop-filter of continue animatie in de nieuwe detail-CSS;
- geen oude Cleaning execution/projection runtime;
- geen production Firebase Rules wijziging.

### Real-device gate — OPEN

Te verifiëren op echte iPhone, light én dark:
1. beurt opent met nieuwe hero/header zonder layout-jump;
2. titel/meta/assignee/progress/checklist hebben de afgesproken hiërarchie;
3. checklist blijft snel en percentage/bar lopen direct mee;
4. `Start schoonmaken` → uitvoering en complete-all blijven werken;
5. `Bewerken` blijft in de bestaande beheerflow functioneren;
6. collaboration blijft onder dezelfde beurt zichtbaar zonder tweede popup;
7. Benodigdheden opent direct en segmented switch werkt soepel;
8. supply-iconen, kleuren, dimensies en statusindicatoren voelen als de referenties;
9. voorraadstatus wisselen en kameritem toevoegen blijven werken;
10. LOW/OUT → Boodschappen voegt geen duplicates toe;
11. herhaald openen/sluiten/schakelen veroorzaakt geen freeze/jank;
12. Historie/Vandaag/Weekplan blijven intact na de visual rework.

**Niet markeren als REAL-DEVICE GEACCEPTEERD totdat de product owner het exacte candidate-checkpoint expliciet bevestigt.**

---

## Cleaning V2.3 — Functionele gaten + hardening

Status: **VOLGENDE NA V2.2.1 REAL-DEVICE CHECK**

Onvolledige beurt (doorschuiven/later/overslaan), handmatige persoon/datum/tijd-wijziging, projection consistency, household-key safety, idempotency/double submit, account/household lifecycle, soft-delete en cache/versioning.

---

## Cleaning V2.4 — Brede premium consistency pass

Status: **GEPLAND NA FUNCTIONELE STABILITEIT**

Brede Schoonmaken-polish buiten de nu vastgezette detailflows plus cross-module voorbereiding richting Taken: resterende cards/tabs/states, full light/dark consistency, kamerassets/atlassen, native-iOS microinteracties en design-tokenharmonisatie zonder repaint-zware effecten.

---

## Expliciet uitgesloten

Geen availability per member, vakanties, ziekte/afwezigheid, busy-week/capacity model, automatic scheduling rond persoonlijke beschikbaarheid of complexe pause/exception engine zonder expliciete nieuwe productbeslissing.
