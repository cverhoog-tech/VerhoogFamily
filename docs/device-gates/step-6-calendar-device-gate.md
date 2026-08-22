# STEP 6 Agenda — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: accepted on real iPhone/PWA on 2026-08-23
Accepted preview: `https://verhoog-family-fl3a49ck3-cverhoog-techs-projects.vercel.app`
Accepted branch HEAD: `b18f42c026dde094812eaf3a18919b17e79810b6`

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

## Acceptance result

The product owner confirmed the complete STEP 6 flow on a real iPhone/PWA on 2026-08-23. STEP 6 is accepted.

The device gate exposed and closed three runtime issues before acceptance:
- a reused add-sheet button could remain disabled after a successful calendar save;
- the selected calendar day was not initially propagated into the add form;
- the legacy family-root Firebase sync still projected `families/{householdId}/cal` into `calData`, racing the canonical `calendarEvents` repository and causing newly created appointments to disappear after reload.

The accepted implementation now keeps Tasks and Agenda fenced from the legacy family-root sync. `CalendarEventHouseholdRepository` is the persistence/projection owner for Agenda, acknowledged mutations project immediately after Firebase success, and realtime Firebase remains the canonical synchronization path.

## Architecture covered by CI

The STEP 6 contracts prove:
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
- legacy family-root sync cannot read or write `calData` / `cal` after STEP 6;
- runtime order remains legacy UI → canonical repository → facade → premium UI → meal projection → Google sync.

Household Rebuild Contracts and Vercel were green on the accepted branch HEAD. No merge to `main`, production deployment or production Firebase Rules deployment was performed.
