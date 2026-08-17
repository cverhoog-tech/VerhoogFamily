# Fase 1 — Household/Auth Hardening Audit

Datum: 2026-08-15
Status: 🟡 hardening geïmplementeerd op PR #22; geautomatiseerde isolation-tests groen; echte device/PWA-acceptatie nog open.

## Scope
Deze audit toetst Fase 1 uit `MULTI-HOUSEHOLD-PRODUCTION-READINESS.md`: household-isolatie bij login/logout/account-switch, membership-validatie, listener cleanup, presence lifecycle, cache/runtime state en removed-member access revocation.

## Oorspronkelijke blockers en huidige status

### ✅ 1. Legacy family realtime listener cleanup
Oorspronkelijk bleef de `families/{householdId}` value-listener uit legacy `duoQuests` actief na logout/account-switch.

PR #22 introduceert `householdSessionHardening.js` dat:
- ref + handler bewaart;
- expliciet `.off('value', handler)` uitvoert;
- callbacks bindt aan oorspronkelijke UID + householdId;
- late callbacks weigert zodra auth/household-context is veranderd;
- gedeelde runtime arrays opruimt bij context teardown.

Automatisch bewezen via syntax/contracttest en account-switch behavior simulation.

### ✅ 2. Household Identity Bridge lifecycle
`HouseholdIdentityFirebaseBridge.sync()` detacht nu expliciet wanneer auth, database of household-context ontbreekt, en bij UID/household-switch.

Verder:
- stale member callbacks worden verworpen;
- stale presence callbacks worden verworpen;
- subscribers krijgen een lege memberlijst na detach;
- de bridge luistert naar session teardown;
- UID + householdId worden samen als bound context behandeld.

### ✅ 3. Presence cleanup boundary
De session-hardening verwijdert oude `.info/connected` listeners, annuleert oude `onDisconnect` waar mogelijk en zet de vorige presence expliciet offline bij context teardown.

Volledige live multi-device presence-acceptatietest blijft nog open; de lifecycle-contracten zijn wel automatisch bewaakt.

### ✅ 4. Active membership gate / removed-member handling
Moderne households worden alleen geactiveerd als `families/{householdId}/members/{uid}/status === 'active'`.

Bij ontbrekende/inactieve membership:
- household activation wordt geweigerd;
- stale `users/{uid}/activeHouseholdId` en legacy `familyId` worden verwijderd;
- een verwijderd lid wordt niet impliciet opnieuw toegevoegd;
- alleen een expliciet pre-platform legacy household mag de oude migratieroute gebruiken.

### ✅ 5. UID-scoped profile cache boundary
Authenticated profielcache gebruikt `familyapp-profile-v2:{uid}:...`.

De oude globale profile keys bestaan alleen nog als compatibility mirror/migratiebron voor de huidige ingelogde UID en worden bij session teardown gewist.

### 🟠 6. Legacy auth/family compatibility blijft tijdelijk aanwezig
`duoQuests.js` bevat nog legacy auth/family functies. De nieuwe runtime-loadvolgorde is nu expliciet:

1. legacy `duoQuests.js`
2. `householdPlatform.js`
3. `householdIdentityFirebaseBridge.js`
4. `householdSessionHardening.js`

Hierdoor vervangt de hardeninglaag de risicovolle lifecyclepaden. Definitieve verwijdering van legacy identity-code hoort bij de latere cleanup/HouseholdContext-fase.

## Automatische tests toegevoegd

### Household session contract
GitHub Actions controleert onder andere:
- syntax van household runtime;
- expliciete listener cleanup;
- stale callback guards;
- logout/account-switch teardown;
- actieve membership gate;
- stale household pointer cleanup;
- UID-scoped profile cache;
- identity bridge detach lifecycle;
- canonical runtime load order;
- geen hardcoded user/admin e-mail identity of UID-as-household fallback.

Status: ✅ groen.

### Account-switch behavior simulation
Een mock Firebase runtime simuleert:

`Alpha user → Alpha household → data callback → switch naar Beta user/household → late Alpha callback → Beta callback → logout`

Bewezen:
- Alpha data komt eerst binnen;
- oude Alpha listener wordt verwijderd;
- late Alpha callback kan Beta runtime-state niet muteren;
- Beta data wordt correct actief;
- logout wist household runtime en `fbFamilyId`.

Status: ✅ groen.

### Removed-member Firebase Realtime Database emulator test
De echte Firebase Database emulator laadt `database.rules.json` en test:

1. actief Alpha-lid mag Alpha shared data lezen en schrijven;
2. actief Alpha-lid mag Beta household niet lezen/schrijven;
3. Alpha owner zet dat lid via de echte rules op `status: removed`;
4. dezelfde authenticated UID wordt direct geweigerd voor:
   - Alpha shared reads;
   - Alpha member reads;
   - Alpha shared writes;
   - Alpha presence writes;
5. removed user mag eigen stale `activeHouseholdId`/`familyId` leegmaken;
6. removed user mag zichzelf niet opnieuw naar Alpha wijzen zolang membership niet active is.

Status: ✅ groen in GitHub Actions run `31901692837`.

## Security Rules conclusie voor removed-member lifecycle
De huidige Realtime Database Rules dwingen access revocation server-side af. Dit is belangrijk: de beveiliging hangt dus niet alleen af van frontend cleanup. Zelfs wanneer een oude client nog een Firebase auth-token/sessie heeft, is family data na `status: removed` niet meer leesbaar/schrijfbaar volgens de emulator.

## Nog open binnen Fase 1

- [ ] Nieuw account maakt eigen household zonder overlap — echte signup/create acceptatietest.
- [ ] Invite voegt alleen toe aan bedoelde household — invite lifecycle emulator/integration test uitbreiden.
- [ ] Verlopen/gebruikte/revoked invites volledig testen.
- [x] Removed member verliest direct server-side toegang — emulator bewezen.
- [x] Logout verwijdert legacy household listener/runtime-state — automatisch contract + behavior simulation.
- [x] Account-switch laat late oude household callbacks geen state muteren — behavior simulation bewezen.
- [x] `activeHouseholdId` vereist actieve membership voor moderne households — codecontract + rules bewezen.
- [ ] Offline/reconnect met echte FamilyDataStore pending writes testen.
- [ ] Live presence op twee devices valideren.
- [ ] iPhone Safari + installed PWA Google auth/logout/relogin valideren.
- [ ] Minimaal drie onafhankelijke echte test-households end-to-end uitvoeren.

## Definition of Done voor Fase 1
Fase 1 blijft 🟡 totdat de resterende invite-, offline/reconnect-, live presence-, PWA/device- en drie-household acceptatietests zijn geslaagd.

De belangrijkste cross-household runtime- en removed-member securityblockers hebben nu wel geautomatiseerde regressiedekking.
