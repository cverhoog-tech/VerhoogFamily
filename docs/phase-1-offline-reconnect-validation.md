# Fase 1 — Offline/Reconnect & Pending Write Isolation

Datum: 2026-08-15
PR: #22
Status: automated behavior test groen; live device/PWA reconnect blijft onderdeel van de uiteindelijke lifecycle gate.

## Bevindingen
Tijdens de audit van `src/core/familyDataStore.js` zijn twee concrete context-isolatierisico's gevonden:

1. Pending-write deduplicatie gebruikte alleen `scope + collection + path`. Daardoor konden writes van verschillende UID/household-contexten op hetzelfde pad elkaar uit de lokale queue verdringen.
2. Een private pending write zonder resolved UID kon met `uid: null` worden opgeslagen. De oude flushlogica accepteerde zo'n item later onder een ingelogd account omdat alleen een aanwezige, afwijkende UID werd geblokkeerd.

## Hardening
`FamilyDataStore` is verhoogd naar v1.5.0.

- Pending-write identiteit bevat nu `uid + familyId + scope + collection + path`.
- Shared pending writes worden alleen aangemaakt als zowel UID als householdId resolved zijn.
- Private pending writes worden alleen aangemaakt als UID resolved is.
- Flush vereist nu een exacte UID-match.
- Shared flush vereist daarnaast een exacte householdId-match.
- Oude/onveilige pending records zonder UID, of shared records zonder householdId, worden veilig gedropt en nooit aan een latere sessie toegeschreven.
- `flushPending()` rapporteert `droppedUnsafe` voor deze quarantained/afgekeurde legacy-items.

## Geautomatiseerde gedragstest
`tests/family-data-store-pending-context.test.js` simuleert:

1. Alpha schrijft offline naar shared en private data.
2. Account/household switch naar Beta.
3. Beta schrijft offline naar exact dezelfde collection/path-combinaties.
4. De queue moet alle vier writes behouden; Alpha en Beta mogen elkaar niet dedupliceren.
5. Reconnect als Beta mag uitsluitend Beta-writes flushen.
6. Terugschakelen naar Alpha mag daarna uitsluitend de resterende Alpha-writes flushen.
7. Legacy unresolved pending records met ontbrekende owner-context worden nooit geschreven.
8. Nieuwe writes terwijl UID/household unresolved zijn mogen geen flushable pending record creëren.

## Security betekenis
Een offline write is voortaan cryptografisch niet gebonden, maar applicatief wel expliciet aan de UID/household-context waarin hij ontstond. Een latere login, account-switch of household-switch kan die write niet stilzwijgend naar een andere gebruiker of family path verplaatsen.

## Resterend voor volledige Fase-1 lifecycle gate
- echte browser/device offline → reconnect test met Firebase SDK networking;
- iPhone Safari/PWA lifecycle;
- create-household/join/logout/relogin met minimaal drie onafhankelijke test-households.
