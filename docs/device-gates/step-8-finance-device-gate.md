# STEP 8 Finance — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: **pending — savings interaction fixes + Analysis redesign still require device acceptance**

## Confirmed on real iPhone/PWA — 2026-08-23

- Existing household Finance information remained present after reload.
- Canonical household persistence/migration therefore passed the first real-device persistence check.

## Issues reported during first gate

1. **Maandplan → bedrag opzij zetten**: pressing the generic add/submit button could leave the app appearing frozen because the generic add-sheet `f1` guard ran before the special savings handler.
2. **Sparen**: deposit/withdraw/edit flows could no-op for migrated goals whose canonical IDs were numeric while HTML `data-*` values were strings.
3. **Analyse**: product owner wants a full redesign/rethink after the interaction fixes; do not accept the existing Analysis presentation as the final STEP 8 experience.
4. **Shopping receipt → Finance**: receipt entry must allow an editable Finance transaction name and category instead of forcing a hard-coded `Boodschappen` label/category.

## Fix contract

The STEP 8 interaction fix must preserve the canonical Finance repository and existing premium layout while:

- making savings special sheets bypass the generic `f1` validation path;
- normalizing legacy numeric savings IDs at the presentation boundary and mapping them back to canonical IDs for writes;
- keeping calendar add-sheet ownership intact;
- retaining household-scoped realtime persistence;
- allowing free transaction name + category metadata when processing a Shopping receipt;
- keeping Shopping receipt re-processing idempotent through its stable source key.

## Required re-test after fix preview

1. Open **Financien → Maandplan** and use **Bedrag opzij zetten**. The sheet must submit, close normally and persist the savings movement.
2. Open **Sparen** and test **Storting**, **Opname**, **Nieuw doel**, editing a goal and deleting a log entry where practical. Buttons must react immediately and survive reload.
3. Confirm Maandplan/Transacties/Sparen navigation remains responsive and no add-sheet freeze occurs.
4. In Shopping, process bought items into Finance and set a custom transaction name (for example `Dierentuin Breda`) plus a category (for example `Uitjes`). Confirm both appear in Finance after reload.
5. Re-process the same Shopping list receipt with changed metadata/amount and confirm the existing source transaction is updated instead of duplicated.
6. If a second household/account is available, confirm Finance values do not cross household boundaries during switching.

## Analysis redesign

The Analysis tab is intentionally **not accepted** in its current presentation. After the functional savings/receipt fixes pass, review the information architecture, charts, comparisons, filters and export direction separately before STEP 8 is closed.

## Destructive reset

`Verse start` is intentionally destructive for the active household's Finance data. Do not use it on household Finance data you want to keep merely to complete the gate. Its cross-household isolation is covered by the automated repository contract.

## Security note

This gate verifies household isolation and product behavior. It does not claim an adult-only Finance permission boundary inside a household. That requires Firebase Rules/data-layout hardening in STEP 15 if the product decides Finance must be parent/adult-only.
