# STEP 8 Finance — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: **pending — core Finance + receipt behavior accepted; Analysis redesign remains**

## Confirmed on real iPhone/PWA — 2026-08-23

- Existing household Finance information remained present after reload.
- Canonical household persistence/migration passed the real-device persistence check.
- Maandplan savings flow works after the special add-sheet routing fix.
- Sparen interactions work after presentation-ID normalization and canonical-ID mapping.
- Finance navigation/interactions no longer show the reported freeze/no-op behavior.
- Shopping receipt flow is accepted on device.
- Receipt transaction name remains editable.
- Receipt category is now an optional fixed dropdown; free typing is removed and `Geen categorie` is available.
- Receipt processing saves successfully to Finance.
- After successful Finance processing, the exact processed items disappear from **Gekocht**.
- Purchased-item snapshots are retained with the Finance receipt transaction for future history/Analysis use.
- A later shopping trip on the same Shopping list can create a distinct Finance receipt transaction instead of overwriting older receipt history.

## Accepted receipt contract

The Shopping receipt flow behaves as follows:

1. The user may edit the Finance transaction name.
2. Category is an **optional fixed choice**, not free text.
3. Allowed receipt categories are: `Boodschappen`, `Uit eten`, `Thuisbezorgd`, `Uitjes`, `Transport`, `Gezondheid`, `Abonnementen`, `Kleding`, `Shopping`, `Wonen`, `Kinderen`, `Huisdieren`, `Overig`, or empty/`Geen categorie`.
4. The Finance transaction stores a compact snapshot of the purchased items for future history/Analysis use.
5. Only after the Finance write succeeds, the exact purchased-item batch used for that receipt is removed from the Shopping list.
6. A retry of the exact same batch remains idempotent.
7. A later shopping trip using the same Shopping list creates a distinct Finance receipt transaction and must not overwrite older receipt history.

Implementation owner: `src/modules/shop/shoppingReceiptFinance.js` v1.5.2.

## Analysis redesign — remaining STEP 8 gate

The Analysis tab is intentionally **not accepted** in its current presentation. STEP 8 remains open until Analysis is redesigned/reviewed separately.

The redesign should explicitly cover:

- selected-month overview;
- comparison with another month / previous month;
- income vs expenses vs disposable amount;
- spending by fixed category taxonomy;
- category trends over time;
- budget vs actual where applicable;
- savings deposits/withdrawals without double-counting them as ordinary spending;
- receipt-driven Shopping history where useful;
- clear, premium mobile-first charts and legends;
- a premium export/monthly report direction.

## Destructive reset

`Verse start` is intentionally destructive for the active household's Finance data. Do not use it on household Finance data you want to keep merely to complete the gate. Its cross-household isolation is covered by the automated repository contract.

## Security note

This gate verifies household isolation and product behavior. It does not claim an adult-only Finance permission boundary inside a household. That requires Firebase Rules/data-layout hardening in STEP 15 if the product decides Finance must be parent/adult-only.
