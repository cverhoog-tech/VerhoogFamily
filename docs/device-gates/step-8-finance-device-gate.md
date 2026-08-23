# STEP 8 Finance — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: **pending — core Finance/savings behavior accepted; receipt follow-up + Analysis redesign remain**

## Confirmed on real iPhone/PWA — 2026-08-23

- Existing household Finance information remained present after reload.
- Canonical household persistence/migration passed the real-device persistence check.
- Maandplan savings flow works after the special add-sheet routing fix.
- Sparen interactions work after presentation-ID normalization and canonical-ID mapping.
- Finance navigation/interactions no longer show the reported freeze/no-op behavior.

## Receipt follow-up requested after functional acceptance

The Shopping receipt flow must now behave as follows:

1. The user may edit the Finance transaction name.
2. Category is an **optional fixed choice**, not free text.
3. Allowed receipt categories are: `Boodschappen`, `Uit eten`, `Thuisbezorgd`, `Uitjes`, `Transport`, `Gezondheid`, `Abonnementen`, `Kleding`, `Shopping`, `Wonen`, `Kinderen`, `Huisdieren`, `Overig`, or empty/`Geen categorie`.
4. The Finance transaction stores a compact snapshot of the purchased items for future history/Analysis use.
5. Only after the Finance write succeeds, the exact purchased-item batch used for that receipt is removed from the Shopping list.
6. A retry of the exact same batch remains idempotent.
7. A later shopping trip using the same Shopping list creates a distinct Finance receipt transaction and must not overwrite older receipt history.

Implementation owner: `src/modules/shop/shoppingReceiptFinance.js` v1.5.2.

## Targeted receipt re-test

1. Mark several Shopping items as bought and open the receipt flow.
2. Confirm **Naam transactie** remains editable.
3. Confirm **Categorie** is a select/dropdown: free typing is impossible and `Geen categorie` is available.
4. Process the receipt and confirm the Finance transaction is saved with the selected category (or no category).
5. Confirm the exact processed items disappear from **Gekocht** only after successful Finance processing.
6. Add a new batch of Shopping items to the same list, mark them bought and process another receipt. Confirm this creates a second Finance transaction rather than replacing the earlier receipt.
7. If processing fails before Finance persistence, confirm the bought items remain available for retry.

## Analysis redesign

The Analysis tab is intentionally **not accepted** in its current presentation. STEP 8 remains open until Analysis is redesigned/reviewed separately, including information architecture, month comparison, category trends, budget vs actual, savings treatment, charts and premium report/export direction.

## Destructive reset

`Verse start` is intentionally destructive for the active household's Finance data. Do not use it on household Finance data you want to keep merely to complete the gate. Its cross-household isolation is covered by the automated repository contract.

## Security note

This gate verifies household isolation and product behavior. It does not claim an adult-only Finance permission boundary inside a household. That requires Firebase Rules/data-layout hardening in STEP 15 if the product decides Finance must be parent/adult-only.
