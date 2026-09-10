# STEP 8 Finance — Household foundation

Branch: `agent/household-rebuild-v2`
Status: implementation ready for CI / preview / device gate

## Product classification

The current Finance module is treated as **household-shared budget administration**. The following existing product data remains shared among members of the active household:

- household income settings;
- fixed costs and their paid state;
- manual transactions;
- one-off income/expenses;
- savings goals and savings logs;
- month-plan / analysis projections derived from the shared finance state;
- shopping-receipt transactions projected into Finance.

The following data must **not** be stored in the shared Finance tree if added later:

- bank OAuth/access/refresh tokens;
- bank login credentials or secrets;
- private account-identification data that is not intended for the household;
- import credentials or third-party service secrets.

Those future capabilities require a private UID/server-side security boundary. Per-user presentation preferences can also live under the user-private tree rather than shared Finance.

## Canonical persistence boundary

Canonical shared source of truth:

`families/{householdId}/finance`

`FinanceHouseholdRepository` owns:

- the single Firebase realtime binding;
- `HouseholdContext` UID + household + revision authority;
- `capture()` / `isCurrent()` stale-work protection;
- exact listener detach on context switch;
- UID + household scoped local cache;
- canonical replace and transaction operations;
- one-time same-household migration.

`FinanceStore` remains the business and compatibility facade consumed by the existing Finance UI and integrations. Legacy globals such as income, transactions and savings arrays are now **presentation projections only** and are never read as canonical or migration authority.

## Legacy migration

The only accepted legacy source is the finance data already stored beneath the same resolved household:

`families/{householdId}/shared/finance`

Migration marker:

`families/{householdId}/financeMigrations/v3SharedToCanonical`

Rules:

- existing canonical Finance always wins;
- old `shared/finance` may seed only the same household;
- generic `window.*`, AppState or unscoped localStorage data can never seed a resolved household;
- a new/empty household starts with an empty schema-v3 Finance state;
- household/account switching clears or replaces the prior Finance projection immediately, so prior-household data is not briefly rendered while the next Firebase binding resolves.

## Reset semantics

`FinanceStore.resetAll()` replaces **only the current active household's Finance state** with an empty schema-v3 state. It does not reset tasks, agenda, recipes, meals, shopping or progression.

The existing `Verse start` UI remains a compatibility control over this canonical Finance operation.

## Shopping receipt integration

`ShoppingReceiptFinance` remains a compatibility bridge and continues to call:

`FinanceStore.upsertSourceTransaction(...)`

with a stable `sourceType + sourceId` key. Re-processing the same shopping-list receipt updates the existing source transaction instead of creating duplicates.

## Privacy / Firebase Rules note

The current Firebase family rules require active household membership for the family subtree. That protects the household boundary, but it does **not** provide an adult-only/parent-only Finance boundary inside one household.

STEP 8 therefore does not claim that Finance is hidden from an active child household member at the Firebase Rules level. If the product requires parent/adult-only Finance later, that must be enforced with a dedicated data/rules contract in STEP 15; client-side UI hiding is not a security boundary.

No production Firebase Rules deployment is part of STEP 8.

## Regression contract

`scripts/test-finance-household-repository.js` verifies:

- canonical `families/{householdId}/finance` ownership;
- `HouseholdContext.capture()` / `isCurrent()` protection;
- exact Firebase listener detach;
- A -> B household switching;
- immediate removal of A projection while B is resolving;
- stale A callbacks cannot repopulate B;
- B mutations write only below B;
- UID metadata follows the authenticated actor;
- UID + household scoped caches;
- same-household `shared/finance` migration;
- a new household cannot inherit legacy global salary/transactions/savings;
- shopping-receipt upsert remains idempotent;
- reset clears only the active household Finance state;
- runtime load order is repository -> FinanceStore -> legacy Finance UI.
