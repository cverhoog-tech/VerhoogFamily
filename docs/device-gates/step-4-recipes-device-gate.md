# STEP 4 Recipes — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: pending real-device acceptance

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

## Acceptance criteria

- No white screen, freeze or repeated loading state.
- Recipe create/edit/delete survives reloads correctly.
- Existing recipes are not duplicated by the one-time migration.
- No recipe from another account/household appears after an identity switch.
- Existing premium Recipes UI remains intact; STEP 4 is an architecture migration, not a redesign.

## Architecture already covered by CI

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

Do not mark STEP 4 accepted until this device gate passes on an up-to-date READY preview containing the current rebuild branch HEAD.
