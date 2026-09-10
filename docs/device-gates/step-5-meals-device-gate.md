# STEP 5 Meals — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: accepted on real iPhone/PWA on 2026-08-23
Accepted preview: `https://verhoog-family-cuw1hs65a-cverhoog-techs-projects.vercel.app`
Accepted implementation HEAD: `f37476f99b095f881e56bd3249a987151dd44390`

## Acceptance result

The product owner confirmed on a real iPhone/PWA that the STEP 5 meal-planning flow works on the current READY preview.

Verified flow:
- plan a recipe into a lunch/dinner slot;
- reload and confirm persistence;
- replace/edit the planned slot;
- reload and confirm the change;
- remove the slot;
- reload and confirm it does not return;
- plan from Recipes → Maaltijd plannen;
- switch between current and next week.

## Accepted architecture

- canonical source: `families/{householdId}/mealPlans`;
- `MealPlanHouseholdRepository` owns realtime Firebase binding and UID/household mutation boundary;
- `HouseholdContext.capture()/isCurrent()` protects stale async work;
- exact prior Firebase listener is detached on context change;
- local fallback cache is UID + household scoped;
- generic historical meal localStorage is never migration authority;
- only same-household `shared/mealPlans` can be reconciled into the canonical store;
- meal → recipe relationship uses stable `recipeId`/`recipeRef`, never recipe name or list index;
- planned meal title snapshot survives later recipe deletion;
- cross-household recipe references are rejected;
- create/edit/delete and household-switch isolation are covered by rebuild contracts.

Household Rebuild Contracts and Vercel were green before the accepted device test. No merge to `main`, production deployment or production Firebase Rules deployment was performed.
