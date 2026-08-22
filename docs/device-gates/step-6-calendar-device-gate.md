# STEP 6 Agenda — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: implementation complete; real-device acceptance pending
Implementation HEAD: `b4c76ce9a07955c59cc6a040cb6871916fdc31e1`

## Purpose

Validate the canonical household agenda repository in the real FamilyApp runtime after CI has already proven household isolation and stale-listener protection.

## Required smoke flow

1. Open Agenda and confirm the current calendar renders normally.
2. Create a temporary appointment with title, date, time and description.
3. Reload the app and confirm the appointment persists.
4. Open the appointment detail and edit at least the title or description.
5. Reload and confirm the edit persists.
6. Delete the temporary appointment.
7. Reload and confirm it does not return.
8. Confirm a planned meal from STEP 5 still appears virtually in Agenda on the correct day.
9. Confirm the meal is not duplicated as a normal editable appointment.
10. Confirm the Google Agenda card/surface still renders normally; an actual Google connection is not required for this device gate.
11. Open Tasks, Recipes and Meals once after the Agenda flow to confirm there is no startup/freeze regression.

## Architecture already covered by CI

The STEP 6 contract proves:
- canonical source `families/{householdId}/calendarEvents`;
- `HouseholdContext.capture()/isCurrent()` stale-context protection;
- exact prior Firebase listener cleanup;
- UID + household scoped cache;
- no generic AppState/window.calData migration authority;
- only same-household `shared/calendar` and `families/{householdId}/cal` can be reconciled;
- schema-v2 canonical rows win migration conflicts;
- household A → B switch rejects stale callbacks from A;
- create/edit/delete stay inside the active household;
- immutable household/creator/schema fields cannot be moved by an edit;
- MealPlanStore remains a virtual Agenda projection and is not duplicated into calendarEvents;
- runtime order remains legacy UI → canonical repository → facade → premium UI → meal projection → Google sync.

Do not mark STEP 6 accepted until this flow passes on an up-to-date READY preview containing the implementation HEAD or a descendant with green Household Rebuild Contracts.

No merge to `main`, production deployment or production Firebase Rules deployment is part of this gate.
