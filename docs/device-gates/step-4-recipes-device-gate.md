# STEP 4 Recipes — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: accepted on real iPhone/PWA on 2026-08-22
Accepted preview: `https://verhoog-family-ktc5t31fd-cverhoog-techs-projects.vercel.app`
Accepted branch HEAD: `09106c4e20b60ab399f58733ead4280bc3f66b78`

## Purpose

Validate the STEP 4 canonical household recipe repository in the actual FamilyApp runtime after CI has already proven household isolation and lifecycle behavior.

## Required smoke flow

1. Open Recipes and confirm existing household recipes render normally.
2. Open an existing recipe and confirm detail content is present.
3. Create a temporary recipe with at least one ingredient and save it.
4. Reload the app and confirm the new recipe still exists.
5. Edit the temporary recipe and change at least the name or one ingredient.
6. Reload again and confirm the edit persisted.
7. Delete the temporary recipe.
8. Reload again and confirm the deleted recipe does not return.
9. Confirm the existing Recipes UI, recipe-to-shopping action and meal-planning action still open normally.
10. Confirm Tasks and the rest of the app still open normally after the recipe flow.

## Acceptance result

The product owner confirmed on a real iPhone/PWA on 2026-08-22 that the STEP 4 recipe flow works on the current READY preview. STEP 4 is therefore accepted.

Accepted behavior:
- no white screen, freeze or repeated loading state observed during the device gate;
- recipe create/edit/delete persisted correctly across reloads;
- existing Recipes UI remained usable;
- the accepted build served `recipeHouseholdRepository.js?v=1` before `recipeSharedLive.js?v=4`;
- Vercel reported the branch-HEAD preview READY before the device test.

## Architecture covered by CI

The contract suite separately proves:
- canonical source `families/{householdId}/recipes`;
- `HouseholdContext.capture()/isCurrent()` protection;
- exact Firebase listener cleanup on context change;
- stale callback rejection;
- UID + household scoped cache;
- no migration from generic `fam_recipes_v1` localStorage;
- same-household `shared/recipes` reconciliation only;
- canonical schema-v3 conflict precedence;
- isolated create, edit and delete behavior.

No merge to `main`, production deployment or production Firebase Rules deployment is part of this acceptance.
