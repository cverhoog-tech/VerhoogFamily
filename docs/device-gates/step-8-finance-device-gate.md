# STEP 8 Finance — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: **pending**

Do not mark STEP 8 accepted until the real-device checks below have passed.

## Required checks

1. Open **Financien** and confirm the screen renders normally with the existing premium layout.
2. Existing household Finance data should still be present after the one-time same-household migration.
3. Add or edit income/fixed-cost data, reload the app, and confirm the change persists.
4. Add a manual transaction, reload, and confirm it remains present exactly once.
5. Create or update a savings goal / savings transaction and confirm it remains correct after reload.
6. From Shopping, process a bought-items receipt into Finance. Process that same list again with a changed amount and confirm Finance updates the existing receipt transaction instead of creating a duplicate.
7. If a second test household/account is available, switch to it and confirm no Finance values from the prior household are visible, even briefly. Switch back and confirm the original household data returns.
8. Confirm ordinary navigation between Finance tabs and back to other FamilyApp modules remains responsive on iPhone/PWA.

## Destructive reset

`Verse start` is intentionally destructive for the active household's Finance data. Do not use it on household Finance data you want to keep merely to complete the gate. Its cross-household isolation is covered by the automated repository contract.

## Security note

This gate verifies household isolation and product behavior. It does not claim an adult-only Finance permission boundary inside a household. That requires Firebase Rules/data-layout hardening in STEP 15 if the product decides Finance must be parent/adult-only.
