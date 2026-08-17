# Phase 12 — Finance household-context migration

Status: 🟡 architecture/automated checks complete; live multi-device/PWA gates deferred.

## Canonical authority

Finance remains under `families/{householdId}/shared/finance` and is owned by `FinanceStore`.

`FinanceStore` v4.0.0 now uses `HouseholdContext` as the sole runtime identity authority. Every mutation captures `{ uid, householdId }`, validates it before the write, and validates it again after asynchronous persistence. Cross-account/household continuation rejects with `FINANCE_CONTEXT_CHANGED`.

## Lifecycle

The store now has explicit `stop()` / `rebind()` behavior and listens to:

- `familyapp:household-context-changed`
- `familyapp:session:cleared`
- `online`
- `focus`

Realtime callbacks are ignored when their captured context is stale. Projected finance globals are cleared on stop to prevent the previous household remaining visible.

## Shopping receipt accounting

`ShoppingReceiptFinance` already persists receipts through `FinanceStore.upsertSourceTransaction()` with:

- `sourceType: shoppingReceipt`
- a stable household/list source id
- a negative transaction amount

`FinanceStore.monthlySummary()` includes every negative transaction in `transactionExpenses`, including shopping receipts. Therefore receipt totals reduce `disposable` income exactly once while retaining idempotent upsert semantics.

Automated coverage explicitly proves an €80 shopping receipt reduces disposable income from €5,000 to €4,920 in the fixture month.

## Savings and reset

Savings goals, savings log mutations, income, fixed costs, extra income and the full finance reset all use the same captured HouseholdContext boundary. `resetAll()` can therefore no longer finish against a newly selected household after a context switch.

## Compatibility

Legacy globals (`window.transData`, `window.savingsGoals`, income globals) remain presentation projections for the existing finance UI. They are not persistence or identity authorities and can be removed during Phase 17 cleanup.

## Automated gates

- `tests/finance-context-rebind.test.js`
- `tests/finance-context-adoption.test.js`
- `.github/workflows/household-session-contract.yml`

## Deferred gates

Before marking Phase 12 ✅:

1. verify finance live on two devices in the same household;
2. switch between independent live households and confirm no stale values/actions;
3. verify shopping receipt → transaction → disposable balance on-device;
4. verify savings/reset behavior in PWA/mobile lifecycle scenarios.
