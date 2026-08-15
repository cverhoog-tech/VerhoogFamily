# Phase 2 — Recipes household-context migration

## Status

🟡 Architecture/context hardening complete. Real-device/PWA multi-household acceptance remains a deferred release gate.

## Canonical authority

Shared recipes live under the FamilyDataStore `recipes` collection, household-scoped by the active HouseholdContext. `RecipeStore` is the only active mutation authority for recipe records.

## Changes

- `RecipeStore` upgraded to v3.0.0 and now captures exact `{uid, householdId}` from `HouseholdContext`.
- Removed `fbFamilyId` fallback from RecipeStore identity resolution.
- Stored realtime unsubscribe handle is detached on household/session switches.
- Store state is cleared before rebinding so records from the previous household cannot remain projected.
- Stale subscription callbacks are ignored.
- `create`, `upsert`, and `remove` reject when the household context changes during an async mutation with `RECIPE_CONTEXT_CHANGED`.
- Recipe records carry `householdId`, `createdBy`, and `updatedBy` UID attribution.
- Legacy Firebase `families/{householdId}/recipes` access remains migration-only and is tied to the captured household token.
- `fam_recipes_v1` remains a compatibility/offline projection, not an authority.
- `recipeManageAndImageBridge.js` no longer writes recipe arrays to localStorage or `HouseholdRepository`; edit/photo/delete delegate to `RecipeStore`.
- Premium editor and link-import continue to use RecipeStore record-level mutations.
- Existing recipe → shopping flow remains routed through `ShoppingListService`, which is already HouseholdContext guarded.

## Automated evidence

- `tests/recipe-context-rebind.test.js`
  - proves Alpha listener detaches on switch to Beta;
  - proves stale Alpha callbacks cannot project into Beta;
  - proves an Alpha mutation resolving after the switch rejects with `RECIPE_CONTEXT_CHANGED`.
- `tests/recipe-context-adoption.test.js`
  - enforces HouseholdContext usage;
  - blocks reintroduction of `fbFamilyId` authority fallback;
  - enforces RecipeStore use by editor/import/manage UI;
  - prevents legacy localStorage/HouseholdRepository recipe authority in the manage bridge.

## Deferred acceptance

- two-device realtime create/edit/delete;
- refresh/reopen/PWA validation;
- explicit three-household live isolation;
- large image/upload workflow once persistent image storage is introduced.
