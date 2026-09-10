# FamilyApp — Schoonmaken Milestone Log

Laatst bijgewerkt: **10-09-2026**

Alleen een flow die de product owner expliciet op real-device heeft geaccepteerd wordt hier als **REAL-DEVICE GEACCEPTEERD** gemarkeerd. Oude pre-performance-reset Cleaning-implementaties blijven alleen historische referentie in git history.

---

## Historische pre-reset Cleaning

Status: **HISTORISCHE REFERENTIE — NIET AUTOMATISCH ACTIEF**

De vroegere omvangrijke Cleaning-runtime bevatte onder meer availability, approval, pause/exception, zware experience-lagen, projectie/reconcile-runtimes en extra notificatielogica. Die versie veroorzaakte ernstige freezes op echte iPhone en is daarom geen actieve productbasis meer.

Niet opnieuw activeren:
- `CleaningExecutionWriteRuntime`;
- `CleaningProjectionService`;
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

Deze basis is naar main gepromoveerd. Production/main-baseline blijft:
`b7f233ebfe1fbb20ecdf426003f332528562ab0f`

Geaccepteerde scope: lazy Cleaning loading, teardown bij verlaten, household-scoped repository, CleaningOccurrence canonical state, kamers/routines CRUD, presets, supplies/inventory, weekplanning/persoonsfilter, lichte eigen detail-sheet, optimistic/coalesced checklists, complete-all/completion logs, Task/Calendar-projecties en rollen/capabilities.

V2.0 blijft de performance-/rollbackbasis voor alle volgende Cleaning-milestones.

---

## Cleaning V2.1 — Samenwerking / overdracht / hulp

Status: **MILESTONE CODECANDIDATE GEREED — CI GROEN — REAL-DEVICE ACCEPTATIE OPEN**  
Laatste functionele/testcheckpoint: `7e34cb60b78cf45664fdb82202e9673bb2ae9672`

### UX-correctie 10-09-2026

Het aanvankelijke losse blok `Samenwerken` onder het Cleaning-scherm is verwijderd als productentrypoint.

De definitieve V2.1-candidate werkt contextueel per schoonmaakbeurt:
- open een concrete beurt vanuit Vandaag of Weekplan;
- in de bestaande Cleaning V2 detail-sheet staat `Samenwerken`;
- daar staan `Overdragen`, `Hulp vragen`, verzoekstatus en waar relevant `Intrekken`;
- ontvangen beslissingen blijven in Action Inbox;
- `Ander voorstel` vanuit Action Inbox brengt de gebruiker terug naar de concrete beurt en opent het tegenvoorstel daar;
- de bestaande Cleaning V2 sheet blijft de enige popup owner.

Er is dus **geen standalone Samenwerken-menu onder Kamers** en geen extra collaboration-popup.

### Canonical collaboration state
- `CleaningOccurrence.transferRequest`
- `CleaningOccurrence.helpRequest`
- geen aparte requeststore;
- geen tweede occurrence authority.

### Overdracht
- concrete open occurrence naar ander actief household member;
- assignment verandert pas na acceptatie;
- accept/decline via Action Inbox;
- accepted transfer wijzigt dezelfde occurrence;
- requester kan PENDING/COUNTER_PROPOSED intrekken.

### Tegenvoorstel
- persoon, datum en tijd;
- requester accepteert/weigert via Action Inbox;
- een derde persoon wordt nooit stil toegewezen;
- bij acceptatie ontstaat een nieuw PENDING verzoek aan die derde persoon;
- pas diens expliciete acceptatie wijzigt de assignment.

### Hulp
- hulp vragen aan actief household member;
- accept/decline via Action Inbox;
- PENDING hulpvraag intrekken;
- accepted help noteert `helperUid`, maar wijzigt `assignmentUids` niet.

### Action Inbox verse sessie
- Cleaning blijft buiten app-startup;
- Action Inbox kan Cleaning on-demand lazy hydrateren;
- dezelfde repository wordt tijdelijk gestart voor een verse household snapshot;
- daarna direct teardown;
- geen blijvende tweede Cleaning listener.

### Task/Agenda projecties
Alleen accepted assignment/schedulewijzigingen triggeren bounded update van bestaande Task/Calendar-projecties. Geen nieuwe occurrence/task/calendar records via `push()`.

### Performance/lifecycle
- dezelfde CleaningHouseholdRepository;
- geen tweede langlevende Firebase `value` listener;
- geen Cleaning startupwerk;
- geen extra popup owner;
- geen document-wide Cleaning click owner;
- geen MutationObserver;
- geen oude execution/projection runtime;
- geen notification projector/reminder-loop;
- cache key voor de collaborationmodule is gebumpt naar `?v=2` zodat de iPhone/PWA niet de oude standalone UI kan hergebruiken.

### Idempotency/concurrency
- occurrence-level duplicate-tap guard;
- identieke PENDING transfer/help requests zijn idempotent;
- actor/recipient/status wordt per transition gevalideerd;
- Action Inbox blijft writer-free.

### Automatische teststatus

Op `7e34cb60b78cf45664fdb82202e9673bb2ae9672`:
- volledige repositorysuite `scripts/test-*.js`: **PASS**;
- GitHub Actions `Household Rebuild Contract Tests` run `34534350216`: **SUCCESS**;
- de contracts bewaken nu expliciet dat er geen standalone collaborationmenu wordt gerenderd en dat de controls in de bestaande beurt-detailflow zitten.

### Real-device acceptancegate — NOG OPEN

Te verifiëren op echte iPhone:
1. Geen los `Samenwerken`-menu onder Kamers.
2. Open concrete beurt → `Overdragen` en `Hulp vragen` staan in de bestaande detail-sheet.
3. Transfer request maken.
4. Verse ontvanger-sessie → direct Action Inbox → request zichtbaar zonder eerst Cleaning te openen.
5. Accept → dezelfde occurrence + Task + Agenda tonen recipient.
6. Decline / withdraw → oorspronkelijke assignment blijft waar van toepassing staan.
7. Counter persoon/dag/tijd, inclusief expliciet derde-persoon akkoord.
8. Hulp accept/decline/withdraw.
9. Rapid repeat taps zonder dubbele occurrence/task/event/requeststate.
10. Cleaning openen/sluiten/heropenen en daarna andere modules gebruiken zonder freeze/jank/achtergrondruntime.

**Niet markeren als REAL-DEVICE GEACCEPTEERD totdat de product owner dit expliciet bevestigt.**

Na acceptatie wordt de exacte geaccepteerde SHA als nieuwe rollbackbasis vastgelegd. Alleen na aparte expliciete toestemming mag die staat naar main.

---

## Cleaning V2.2 — Historie / Activity / reminders

Status: **GEPLAND — PAS NA V2.1 ACCEPTATIE**

Kamer-/routinehistorie, zichtbare completion logs, wie/wat/wanneer, relevante household activity feed events en alleen nuttige reminders.

---

## Cleaning V2.3 — Functionele gaten + hardening

Status: **GEPLAND**

Onvolledige beurt (doorschuiven/later/overslaan), handmatige persoon/moment-wijziging, projection consistency, household-key safety, idempotency, lifecycle, soft-delete, cache/versioning en aanvullende contracts.

---

## Cleaning V2.4 — Definitieve premium visual polish

Status: **GEPLAND NA FUNCTIONELE STABILITEIT**

Premium FamilyApp-look, light/dark, kamerassets/atlassen, duidelijke hiërarchie en lichte native-iOS microinteracties zonder repaint-zware effecten.
