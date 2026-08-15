# FamilyApp — Multi-Household Production Readiness

Laatste update: 2026-08-15

## Doel
FamilyApp moet veilig en betrouwbaar kunnen draaien voor meerdere volledig onafhankelijke gezinnen tegelijk, zonder cross-household datalekken, legacy single-family aannames of inconsistente lokale state.

De norm is niet alleen dat een feature "met Firebase werkt", maar dat deze aantoonbaar kan functioneren met veel onafhankelijke households zonder architectuurwijziging.

## Statuslegenda
- ✅ Gereed / aantoonbaar geschikt
- 🟡 Gedeeltelijk gereed / hardening of migratie nodig
- ⬜ Nog uitvoeren
- 🔴 Blokkerend probleem

## Production-readiness contract
Iedere feature moet uiteindelijk aan deze regels voldoen:

- UID is de primaire gebruikersidentiteit.
- `householdId` bepaalt de scope van gedeelde gezinsdata.
- Gedeelde data wordt household-scoped opgeslagen.
- Privédata wordt UID-scoped opgeslagen.
- Namen zoals Shane/Esra/myName/partnerName mogen nooit autorisatie of functionele identiteit bepalen.
- Firebase Security Rules blokkeren cross-household toegang.
- Firebase is bron van waarheid; localStorage is uitsluitend cache/offline fallback waar nodig.
- Realtime listeners worden correct losgekoppeld en opnieuw gekoppeld bij auth/household-wijzigingen.
- Events, feed en notificaties bevatten expliciete UID/household-context.
- Cross-household references zijn niet toegestaan.
- Iedere afgeronde module krijgt isolation-, lifecycle- en refresh/reconnect-tests.

## Reeds aanwezige basis

### ✅ Household identity & membership foundation
De actuele app heeft een household-platform met unieke family IDs, UID-memberships, invites en presence.

Nog te hardenen voordat dit volledig als productie-gereed geldt:
- account-switch op hetzelfde toestel
- removed-member access revocation
- logout/listener cleanup
- activeHouseholdId-validatie na login
- invite edge cases en lifecycle tests

### ✅ FamilyDataStore foundation
Er bestaat een centrale persistence boundary voor household-shared en user-private data. De cachekeys zijn UID/family scoped en pending writes bewaren context.

Nog te doen:
- alle actieve modules verplicht via deze laag of een opvolgende service-laag laten werken
- directe legacy Firebase/localStorage writes inventariseren en verwijderen
- expliciete HouseholdContext/assertions toevoegen

### 🟡 Firebase Security Rules foundation
De huidige rules zijn default-deny en controleren actief household membership voor family data en UID voor private user data.

Nog te doen:
- rules per nieuwe/gespecialiseerde collectie aanscherpen
- negatieve cross-household security tests automatiseren
- Storage Rules meenemen voor gedeelde assets

---

# Uitvoeringsplan

## Fase 1 — Household/Auth hardening
Status: 🟡

- [ ] Nieuw account maakt eigen household zonder overlap.
- [ ] Invite voegt alleen toe aan bedoelde household.
- [ ] Verlopen/gebruikte invites correct afhandelen.
- [ ] Removed member verliest direct toegang.
- [ ] Logout verwijdert subscriptions en gevoelige runtime state.
- [ ] Account-switch op hetzelfde apparaat toont nooit cache/state van vorige gebruiker.
- [ ] `activeHouseholdId` na login server-side/contextueel valideren.
- [ ] Offline/reconnect household-context behouden zonder verkeerde flush.

Definition of Done: minimaal drie onafhankelijke test-households kunnen tegelijk auth/join/logout/relogin doorlopen zonder data-overlap.

## Fase 2 — HouseholdContext & data-contract
Status: 🟡

- [ ] Centrale `HouseholdContext` introduceren.
- [ ] `requireUser()` / `requireHousehold()` / context assertions.
- [ ] Geen silent fallback naar default/global household.
- [ ] Centrale shared/private collection contracten documenteren.
- [ ] Lifecycle hooks voor household/auth changes.

Definition of Done: modules hoeven zelf geen identity/household-resolutie meer te improviseren.

## Fase 3 — Admin foundation & beta operations
Status: ⬜

Doel: het platform beheersbaar en diagnoseerbaar maken voordat de externe testgroep groter wordt, zonder standaard toegang tot gevoelige huishoudinhoud.

### Platform authorization
- [ ] Platformrollen volledig scheiden van household-rollen.
- [ ] Centrale `platformAdmins/{uid}` of gelijkwaardige server-side autorisatiebron.
- [ ] Geen hardcoded admin-email/UID checks verspreid door frontend-code.
- [ ] Rollen voorbereiden op minimaal `superadmin` en later eventueel `support`.
- [ ] Firebase Rules blokkeren adminfunctionaliteit voor normale household-users.

### Admin Console v1
- [ ] Alleen zichtbaar/toegankelijk voor geautoriseerde platform-admins.
- [ ] Platformoverzicht met totaal aantal households, users en actieve beta-households.
- [ ] Householdlijst met naam/ID, aantal members, createdAt en laatste activiteit.
- [ ] Household detail met members, rollen, status en module-health.
- [ ] Geen standaardweergave van boodschappen, privénotities, financiële details of andere gevoelige inhoud.

### Health & diagnostics
- [ ] Gezondheidsstatus per household: healthy / attention / broken.
- [ ] Laatste succesvolle sync per relevante module waar technisch meetbaar.
- [ ] Pending writes / sync-errors diagnosticeerbaar zonder inhoud te loggen.
- [ ] Schema/app-versie zichtbaar.
- [ ] Detectie voorbereiden voor orphan records, ontbrekende UID-references en inconsistente household pointers.
- [ ] Device/browser/PWA-context beschikbaar bij gemelde technische problemen waar verantwoord.

### Beta cohorts & feature flags
- [ ] Testhouseholds kunnen aan een beta cohort/wave worden gekoppeld.
- [ ] Globale feature flags.
- [ ] Household-specifieke feature overrides.
- [ ] Veilige rolloutvolgorde ondersteunen: eigen household → kleine wave → alle testers → productie.
- [ ] Feature flags mogen nooit securityregels vervangen.

### Veilige admin-acties
- [ ] Invite intrekken.
- [ ] Nieuwe invite laten genereren binnen normale autorisatieregels.
- [ ] Member verwijderen/blokkeren met expliciete bevestiging.
- [ ] Household tijdelijk blokkeren/deblokkeren indien later nodig.
- [ ] Testdata/resetacties uitsluitend expliciet gescoped en met zware bevestiging.
- [ ] Geen onbeperkte "login as user" bouwen.
- [ ] Eventuele support-preview standaard read-only, duidelijk als admin-preview gemarkeerd en gelogd.

### Feedback & support
- [ ] In-app "Feedback / Bug melden" voorbereiden.
- [ ] Automatisch technische context meesturen: householdId, uid, appVersion, screen, device/browser, timestamp en error codes waar beschikbaar.
- [ ] Geen gevoelige scherminhoud automatisch meesturen.
- [ ] Feedback in Admin Console aan household/user/context kunnen koppelen.

### Audit log
- [ ] Iedere gevoelige adminactie logt `adminUid`, `action`, `targetHouseholdId`, optioneel `targetUid`, timestamp en reason/context.
- [ ] Audit records zijn niet client-side manipuleerbaar door normale users.
- [ ] Adminacties zijn achteraf herleidbaar.

Definition of Done: jij kunt een groeiende beta operationeel begeleiden, household-health beoordelen, feature rollouts sturen en supportacties uitvoeren zonder standaard toegang tot privé-inhoud en zonder Firebase Console als primaire beheerinterface.

## Fase 4 — Taken / Quests
Status: 🟡

- [ ] Alle task records household-scoped.
- [ ] `createdByUid`, assignee UID en participant/helper UIDs gebruiken.
- [ ] Geen naamgebaseerde task-logica.
- [ ] Create/edit/delete realtime via centrale datastore/service.
- [ ] Checklist completion veilig en conflictbestendig.
- [ ] Hulp vragen/intrekken.
- [ ] Join Quest / Leave Quest.
- [ ] Party Quest invites alleen naar members van huidige household.
- [ ] XP/progression events UID-correct.
- [ ] Refresh/offline/reconnect tests.
- [ ] Cross-household negatieve tests.

## Fase 5 — Winkelen / Boodschappen
Status: 🟡

- [ ] Legacy `shopData` en andere lokale bron-van-waarheid verwijderen.
- [ ] Meerdere household-scoped lijsten.
- [ ] Realtime add/check/delete.
- [ ] Eventuele privélijsten UID-scoped en rules-protected.
- [ ] Bon/receipt records household-scoped.
- [ ] Shopping → finance idempotent koppelen.
- [ ] Shopping → activity/feed event publiceren.
- [ ] Refresh/offline/reconnect/cross-household tests.

## Fase 6 — Agenda
Status: 🟡

- [ ] Events household-scoped.
- [ ] `createdByUid` en attendee UIDs.
- [ ] Create/edit/delete realtime.
- [ ] Persoonlijke versus gezinsafspraken expliciet modelleren.
- [ ] Geen legacy lokale agenda-array als authority.
- [ ] Refresh/offline/reconnect/isolation tests.

## Fase 7 — Recepten
Status: 🟡

- [ ] Household-shared recipes als primaire bron.
- [ ] `createdByUid` / `updatedByUid`.
- [ ] Realtime create/edit/delete.
- [ ] Recipe image assets centraal opslaan.
- [ ] Storage paths household-scoped.
- [ ] Storage Security Rules.
- [ ] Geen lokale recipe state als bron van waarheid.
- [ ] Isolation tests.

## Fase 8 — Maaltijdplanning
Status: 🟡

- [ ] Meal plans household-scoped.
- [ ] Referenties naar recipes binnen hetzelfde household.
- [ ] Meal → recipe → shopping flow household-safe.
- [ ] Cross-household recipe references blokkeren.
- [ ] Realtime create/edit/delete.
- [ ] Refresh/offline/reconnect tests.

## Fase 9 — Centrale Activity/Event Layer
Status: ⬜

- [ ] Centrale `ActivityService.publish(...)` of equivalent.
- [ ] Verplichte `householdId`, `actorUid`, `type`, `entityType`, `entityId`.
- [ ] Idempotency/deduplicatie waar events financieel of progression-effect hebben.
- [ ] Task-, meal-, shopping-, achievement-events via dezelfde laag.
- [ ] Modules kennen Feed niet rechtstreeks.

## Fase 10 — Feed
Status: 🟡

- [ ] Feed uitsluitend uit huidige household laden.
- [ ] Activity events renderen naar premium feed cards.
- [ ] Posts household-scoped.
- [ ] Comments realtime en household-scoped.
- [ ] Likes persistent en correct gescoped.
- [ ] Actor identity uitsluitend via UID/member profile.
- [ ] Refresh/reconnect/isolation tests.

## Fase 11 — Notificaties
Status: 🟡

- [ ] Centrale NotificationService.
- [ ] `householdId`, `recipientUid`, `actorUid`, `type`, `entityId` verplicht.
- [ ] Party Quest invites.
- [ ] Hulpverzoeken.
- [ ] Ruil/verzoek-events.
- [ ] Click/deep-link validatie binnen juiste household.
- [ ] Intrekken/afhandelen zonder cross-household toegang.
- [ ] Security Rules voor recipient/household-context.

## Fase 12 — Financiën
Status: 🟡

- [ ] Household finance expliciet scheiden van user-private preferences.
- [ ] Transactions household-scoped.
- [ ] `createdByUid`, `source`, `sourceId` gebruiken.
- [ ] Idempotente koppeling voor receipts/shopping.
- [ ] Budgetten, spaardoelen en vrije bestedingsruimte household-safe.
- [ ] Resetfunctie scoped op bedoelde household/data.
- [ ] Rules en isolation tests extra streng uitvoeren.

## Fase 13 — Achievements / XP / Streaks / Skills
Status: 🟡

- [ ] Persoonlijke progression UID-scoped.
- [ ] Household/party progression apart modelleren.
- [ ] Geen `myXP`/`partnerXP` of naamgebaseerde logica.
- [ ] Centrale progression-service.
- [ ] Event-idempotency voorkomt dubbele XP.
- [ ] Realtime/profile/feed integraties UID-correct.
- [ ] Isolation tests.

## Fase 14 — Profiel / Persoon / Presence
Status: 🟡

- [ ] Member display data via `families/{householdId}/members/{uid}`.
- [ ] Private preferences UID-scoped.
- [ ] Avatar sync profiel/feed/notificaties/taken/comments/activity.
- [ ] Cached avatar state veilig bij account-switch.
- [ ] Presence uitsluitend binnen eigen household.
- [ ] Legacy `myName`, `partnerName`, avatar globals uit functionele logica verwijderen.

## Fase 15 — Home dashboard
Status: 🟡

- [ ] Home bezit geen parallelle taak/XP/meal/calendar authority.
- [ ] Alleen consumeren uit centrale services/stores.
- [ ] Hero/stat cards huidige household/UID-data tonen.
- [ ] Refresh/account-switch/household-switch veilig.

## Fase 16 — Search / autocomplete / AI context
Status: ⬜

- [ ] Zoekopdrachten standaard begrensd tot huidige household of UID.
- [ ] Autocomplete lekt geen records uit andere households.
- [ ] AI-context builder krijgt expliciete household/user scope.
- [ ] Geen globale databasecollecties als AI-contextbron.
- [ ] Logging bevat geen onnodige huishoudinhoud.

## Fase 17 — Legacy localStorage & direct-write cleanup
Status: 🟡

- [ ] Inventariseer alle `localStorage` keys.
- [ ] Classificeer cache, preference, legacy authority of migratie.
- [ ] Verwijder globale task/recipe/shop/finance authority keys.
- [ ] UID/household namespacing voor legitieme caches/preferences.
- [ ] Inventariseer directe `firebase.database().ref(...)` writes in modules.
- [ ] Routeer domeindata via centrale service/datastore.

## Fase 18 — Firebase + Storage Rules audit
Status: 🟡

- [ ] Default deny behouden.
- [ ] Cross-household read test: denied.
- [ ] Cross-household write test: denied.
- [ ] Removed member read/write: denied.
- [ ] Private user data door ander household-lid: denied.
- [ ] Finance extra negatieve tests.
- [ ] Platform-admin rules afzonderlijk testen; geen privilege leakage naar household-admins.
- [ ] Storage recipe/avatar/shared assets scoped beveiligen.

## Fase 19 — Automated multi-household isolation tests
Status: ⬜

Testfixture:
- Household Alpha: alpha1, alpha2
- Household Beta: beta1, beta2
- Household Gamma: gamma1

Voor iedere domeinfeature testen:
- [ ] Alpha → Alpha toegestaan.
- [ ] Beta → Beta toegestaan.
- [ ] Alpha → Beta denied/onzichtbaar.
- [ ] Beta → Alpha denied/onzichtbaar.
- [ ] Refresh behoudt juiste context.
- [ ] Reconnect schrijft pending data alleen naar oorspronkelijke UID/household.
- [ ] Normale household-owner krijgt nooit platform-admin privileges.

## Fase 20 — Lifecycle & device/PWA tests
Status: ⬜

- [ ] Signup.
- [ ] Create household.
- [ ] Invite/join.
- [ ] Logout/login.
- [ ] Account switch.
- [ ] Refresh/reopen.
- [ ] Offline/reconnect.
- [ ] Member removal.
- [ ] Invite expiry.
- [ ] Admin-console authorization lifecycle.
- [ ] iPhone Safari.
- [ ] Installed iOS PWA.
- [ ] Android Chrome/PWA.
- [ ] Desktop browser.

## Fase 21 — Observability & externe beta gate
Status: ⬜

- [ ] Foutlogging met UID/household/module/operation/errorCode zonder gevoelige inhoud.
- [ ] Auth/sync/rules fouten diagnoseerbaar.
- [ ] Geen silent data fallbacks.
- [ ] Admin Console gebruikt dezelfde privacyarme diagnostics/health-signalen.
- [ ] Beta testinstructies voor externe households.
- [ ] Bekende beperkingen documenteren.
- [ ] Go/no-go review uitvoeren.

---

# Releasegates

## Gate A — Multi-household testklaar
Minimaal gereed:
- Fase 1–2 voldoende gehard
- minimale veilige delen van Fase 3 aanwezig: platform-admin authorization, householdlijst/health basis, feature flags en audit logging voor adminacties
- Fase 4–8 voldoende gehard
- kritieke delen van Fase 17–18 afgerond
- handmatige test met minimaal 3 onafhankelijke households geslaagd

## Gate B — Multi-household production-ready
Minimaal gereed:
- alle actieve kernmodules door het production-readiness contract
- Admin Console/beta operations veilig bruikbaar zonder standaard privédata-inzage
- volledige Firebase/Storage rules audit
- automated isolation tests
- lifecycle/device/PWA tests
- observability aanwezig

## Gate C — Schaalharding
Na production readiness:
- query/index performance
- listener footprint
- pagination
- storage/bandwidth usage
- rate limiting/misbruikscenario's
- grotere testdataset en concurrency tests
- admin-console performance en pagination bij grotere aantallen households/users

---

# Voortgangsoverzicht

| Onderdeel | Status | Laatste notitie |
|---|---|---|
| Household/Auth | 🟡 | Unieke households, memberships, invites en presence bestaan; hardening/tests nodig |
| FamilyDataStore | 🟡 | Shared/private UID/household persistence boundary bestaat; adoptie per module controleren |
| Admin Console & Beta Operations | ⬜ | Nieuwe workstream: platform-admin auth, health, feature flags, feedback en audit log logisch vóór brede externe beta gepland |
| Security Rules | 🟡 | Default deny + membership checks aanwezig; volledige negatieve audit nog nodig |
| Taken/Quests | 🟡 | Bestaande Firebase/UID-migratie aanwezig; volledige production-readiness audit vereist |
| Winkelen | 🟡 | Shared storage foundation aanwezig; legacy shopping bridge bestaat nog |
| Agenda | 🟡 | Realtime/shared werk is eerder gestart; isolation audit vereist |
| Recepten | 🟡 | Roadmap/migratie loopt; volledige shared + asset hardening vereist |
| Maaltijden | 🟡 | Shared/live migratie vereist/valideren |
| Activity layer | ⬜ | Centrale schaalbare eventlaag nog afronden |
| Feed | 🟡 | Functioneel aanwezig; persistence/live/isolation hardening nodig |
| Notificaties | 🟡 | Functioneel aanwezig; centralisatie + isolation hardening nodig |
| Financiën | 🟡 | Functioneel aanwezig; household isolation en idempotency grondig valideren |
| Progression | 🟡 | UID-migratie eerder uitgevoerd; volledige event/isolation audit nodig |
| Profiel/Presence | 🟡 | Household UID/presence foundation aanwezig; legacy bridges cleanup nodig |
| Home | 🟡 | Consumerlaag controleren op legacy/global state |
| AI/Search | ⬜ | Household context contract nog afdwingen |
| Legacy cleanup | 🟡 | Diverse bridges/localStorage restanten bestaan nog |
| Automated isolation tests | ⬜ | Nog bouwen |
| Lifecycle/device tests | ⬜ | Nog structureel uitvoeren |
| Observability | ⬜ | Nog structureel toevoegen |

---

# Admin Console — privacyprincipes

De adminconsole is een operations- en supporttool, geen standaard data-browser voor huishoudinhoud.

Standaard wel zichtbaar:
- household metadata en ID
- member identity/rol/status
- created/last-active timestamps
- app/schema versie
- module-health
- foutcodes en syncstatus
- recordaantallen en technische inconsistenties
- beta cohort en feature flags
- feedbacktickets en technische context

Standaard niet zichtbaar:
- inhoud van privénotities
- persoonlijke berichten
- volledige financiële inhoud/transactiedetails alleen voor nieuwsgierige inspectie
- boodschappen-/receptinhoud zonder expliciete supportreden
- gevoelige scherminhoud in automatisch verzamelde feedback

Als later inhoudelijke supportinzage nodig blijkt, krijgt dit een afzonderlijke consent-, authorization- en audit-flow in plaats van impliciete superadmin-toegang.

---

# Changelog

## 2026-08-15
- Centrale multi-household production-readiness roadmap aangemaakt.
- Bestaande household identity, FamilyDataStore en Firebase rules als foundation vastgelegd.
- Nog geen feature als volledig production-ready gemarkeerd zonder module-audit + isolation tests.
- `Admin Console & Beta Operations` als aparte workstream toegevoegd.
- Admin foundation logisch direct na Household/Auth + HouseholdContext gepland, zodat feature flags, diagnostics, feedback en audit logging tijdens de rest van de beta-hardening gebruikt kunnen worden.
- Privacyprincipe vastgelegd: platform-admin krijgt standaard operationele metadata/health, geen onbeperkte inzage in gevoelige huishoudinhoud.
- Roadmap uitgebreid van 20 naar 21 fases en releasegates aangepast.

## Update-regel voor toekomstige werkzaamheden
Wanneer we een onderdeel afronden:
1. status in het voortgangsoverzicht aanpassen;
2. relevante checklistitems afvinken;
3. concrete testresultaten en eventuele resterende risico's noteren;
4. changelog aanvullen met datum en relevante commit/PR indien beschikbaar;
5. pas `✅` gebruiken wanneer Definition of Done daadwerkelijk aantoonbaar is gehaald.
