# STEP 7 Shopping — iPhone/PWA device gate

Branch: `agent/household-rebuild-v2`
Status: accepted on real iPhone/PWA on 2026-08-23
Accepted preview: `https://verhoog-family-eeqevrgoh-cverhoog-techs-projects.vercel.app`
Accepted deployment: `dpl_8eLoW6sQigVnBtAPddheNUCRgHry`
Accepted implementation HEAD: `395507f0bc297c77110f2f501410013f5286ecc9`
Accepted Household Rebuild Contracts run: `32635153066`

## Acceptance result

The product owner confirmed on a real iPhone/PWA that the final STEP 7 Shopping flow and presentation are good and accepted.

Verified behavior and presentation:
- rapid taps move products immediately between `Te kopen` and `Gekocht` without waiting for Firebase;
- repeated taps at the same physical list position remain responsive because the tapped row is removed from the active keyed view synchronously;
- the canonical write is deferred behind the short idle flush while the local projection updates immediately;
- the grocery add flow remains protected against the historical add/freeze regression;
- product metadata such as `1 st · Overig` is displayed below the product title;
- the final product list is one continuous native-style surface with subtle dividers instead of separate nested item cards;
- check controls are deliberately slim while the full row remains the large touch target;
- product artwork has no square tile/outline around it;
- the unknown-product fallback is a dedicated mixed shopping basket with green/red/blue/orange product accents and no purple or generic box;
- the lighter pre-rework active-list selector is restored;
- `Te kopen` and `Gekocht` remain equal-width compact segmented controls without generic status emoji;
- recipe duplicate resolution remains available independently, with the duplicate-dialog title/lead text forced to black;
- receipt-to-Finance compatibility remains wired.

## Accepted architecture

- canonical shared source: `families/{householdId}/shoppingLists/{listId}`;
- canonical private source: `users/{uid}/private/households/{householdId}/shoppingLists/{listId}`;
- `ShoppingListHouseholdRepository` owns canonical Firebase persistence;
- `ShoppingListStore` remains the business/data facade used by Shopping UI integrations;
- active-list preference is scoped to the authenticated UID + household;
- only same-household historical shopping sources may be reconciled;
- generic/unscoped local shopping data is never migration authority for another household;
- legacy family-root Shopping sync is fenced so it cannot reintroduce stale root state or generic rerender/flicker behavior;
- `ShoppingPageV2` owns only presentation and optimistic interaction, not a second persistence authority;
- each tap updates local `done` state and removes the row synchronously before the canonical Firebase write;
- per-item write lanes preserve ordering when the same item changes state while an earlier write is still in flight;
- recipe/meal-to-shopping integration continues through the canonical Shopping store/repository boundary;
- duplicate-recipe handling remains isolated from the fast Shopping page renderer;
- Shopping receipt-to-Finance remains a compatibility bridge only; broader Finance architecture is STEP 8.

## Regression coverage

The rebuild suite covers:
- shared/private household-scoped Shopping repository behavior;
- cross-household/lifecycle isolation and safe same-household migration;
- legacy root-sync fencing and anti-flicker ownership;
- grocery-add freeze regression behavior;
- instant local state change before persistence;
- delegated pointer interaction and rapid repeated tap behavior;
- ordered canonical repository writes;
- recipe duplicate resolver availability and black duplicate-dialog text;
- unknown product fallback with the dedicated mixed product basket and no generic box;
- continuous-list presentation without per-item card gaps/shadows;
- receipt/Finance compatibility and runtime ordering.

Household Rebuild Contracts and Vercel were green on the accepted implementation HEAD. No merge to `main`, production deployment or production Firebase Rules deployment was performed.
