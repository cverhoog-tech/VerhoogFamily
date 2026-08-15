# Fase 1 — Invite Lifecycle Validation

Datum: 2026-08-15
Branch: `agent/household-auth-hardening`
PR: #22

## Doel
Bewijzen dat een invite alleen het bedoelde household kan ontsluiten, verlopen/gebruikte/ingetrokken codes niet opnieuw bruikbaar zijn en join claims niet naar een ander household kunnen worden omgebogen.

## Gevonden probleem
De bestaande `database.rules.json` kende `status: revoked` als geldig invite-statusveld, maar had geen geldige write-route voor een actieve household owner/admin om `active → revoked` uit te voeren. Bovendien vereiste de validator bij ieder bestaand invite-record een `uses + 1` of rollback `uses - 1`, waardoor een revoke met gelijkblijvend gebruik ook werd afgewezen.

De nieuwe emulator-test maakte dit eerst rood: `RVOK-0001` gaf terecht `PERMISSION_DENIED` onder de oude rules.

## Fix
- Firebase Rules: alleen een actieve owner/admin van het household waar de invite bij hoort mag `active → revoked` uitvoeren.
- Household ID en overige immutable invitevelden blijven gelijk.
- Bij revoke blijft `uses` exact gelijk.
- De gewone invite-consume route blijft afhankelijk van active status, niet verlopen TTL, resterend gebruik en `usedBy === auth.uid`.
- `src/core/householdInviteLifecycle.js` voegt `FamilyHousehold.revokeInvite(code)` toe.
- De client controleert vóór revoke opnieuw: actieve owner/admin, invite bestaat, invite hoort bij het huidige household en status is active.
- Na revoke wordt het lightweight household-indexrecord `families/{householdId}/inviteCodes/{code}` verwijderd.

## Geautomatiseerde emulator-tests
`tests/database-rules-invite-lifecycle.test.mjs` bewijst:

- ✅ een ingelogde gebruiker kan een individuele invite inspecteren;
- ✅ top-level invite listing blijft denied;
- ✅ geldige active invite kan door precies de betreffende auth UID worden geconsumeerd;
- ✅ een tweede account kan een consumed invite niet stelen/hergebruiken;
- ✅ verlopen invite kan niet worden geconsumeerd;
- ✅ household owner/admin kan een active invite intrekken;
- ✅ revoked invite kan daarna niet worden geconsumeerd;
- ✅ used invite van een andere UID kan niet worden hervat;
- ✅ joinClaim moet overeenkomen met invite household, usedBy en used status;
- ✅ een Alpha-claim kan geen Beta-membership creëren;
- ✅ na geldige Alpha-membership kan de user pointer alleen naar Alpha wijzen, niet naar Beta.

## CI-resultaat
GitHub Actions run `31901945579` is volledig groen:

- syntax check — PASS
- household isolation contract — PASS
- account-switch behavior — PASS
- removed-member Realtime Database rules — PASS
- invite lifecycle Realtime Database rules — PASS

## Resterend voor Fase 1
Invite lifecycle is nu geautomatiseerd afgedekt. Fase 1 blijft nog 🟡 totdat de resterende lifecycle-eisen zijn bewezen, met name offline/reconnect gedrag, create-household/no-overlap in een bredere fixture en echte device/PWA flows.
