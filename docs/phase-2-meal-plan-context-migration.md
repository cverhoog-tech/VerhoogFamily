# Phase 2 — Meal planning context migration

Status: 🟡 architecture hardened; live device/PWA acceptance deferred.

## Canonical authority

Shared meal planning is owned by `FamilyDataStore` collection `mealPlans`, scoped to the active household. `window.mealPlanData` remains a compatibility/read-model projection only.

## HouseholdContext lifecycle

`MealPlanStore` v2.0 captures `{ uid, householdId }` through `HouseholdContext`, detaches its old subscription on account/household changes, clears projected state, and rebinds to the new household. Stale callbacks are ignored.

Mutations (`create`, `upsert`, `remove`, `replaceSlot`) write using the captured context. Local projection is updated only after the Firebase write succeeds and the same context is still current. Stale operations fail with `MEAL_PLAN_CONTEXT_CHANGED`.

## Legacy migration

The old `familyapp_food_meal_plan_v001` localStorage payload is migration input only. It is read only when the canonical household collection is empty. Migrated records receive canonical UID/household attribution.

## Planner modal boundary

`mealPlannerContextGuard.js` captures the active UID/household when the `📅 Maaltijd plannen` BottomSheet opens and validates that context before executing write actions. This prevents an old modal opened in Household Alpha from scheduling a meal after switching to Household Beta.

## Integrations

- Recipe selection remains a read from `RecipeStore`.
- Calendar integration remains read-only projection from `MealPlanStore`; it does not become a second meal-plan authority.
- Week-to-shopping delegates to the already context-safe `ShoppingListService`.

## Automated evidence

- `tests/meal-plan-context-rebind.test.js`
  - Alpha subscription binds
  - Alpha detaches on switch to Beta
  - stale Alpha callbacks do not project into Beta
  - new Beta records carry Beta UID and householdId
- `tests/meal-plan-context-adoption.test.js`
  - HouseholdContext required
  - no `FamilyDataStore.status()` identity authority
  - no `fbFamilyId` fallback
  - stale context error required
  - planner BottomSheet context guard required
  - runtime loader/cache bust required

## Deferred release gates

- two-device realtime planning
- reconnect/offline recovery
- iPhone Safari/PWA modal lifecycle
- three independent live households

Until these live gates are executed, Meal Planning remains 🟡 rather than ✅.