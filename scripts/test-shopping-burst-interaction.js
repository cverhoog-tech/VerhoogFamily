'use strict';
const fs=require('fs');
const assert=require('assert');

const page=fs.readFileSync('src/modules/shop/shoppingPageV2.js','utf8');
const duplicates=fs.readFileSync('src/modules/shop/shoppingRecipeDuplicateResolver.js','utf8');
const resolver=fs.readFileSync('src/ui/icons/familyAppUtilityIconResolver.js','utf8');
const classifier=fs.readFileSync('src/modules/shop/groceryProductClassifier.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

assert.ok(page.includes("var VERSION='2.0.0'"),'STEP 7 must serve the rebuilt ShoppingPageV2 presentation');
assert.ok(page.includes('FLUSH_IDLE_MS=220'),'canonical writes must be deferred behind a short idle window');
assert.ok(page.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),'Te kopen and Gekocht controls must be exactly equal width');
assert.ok(page.includes("height:48px"),'Te kopen and Gekocht controls must share the same compact fixed height');
assert.ok(page.includes("<span>Te kopen</span>")&&page.includes("<span>Gekocht</span>"),'rebuilt status controls must use text labels');
assert.ok(!page.includes('🛒 Te kopen')&&!page.includes('✅ Gekocht'),'rebuilt status controls must not use generic emoji icons');
assert.ok(page.includes('.shopv2-info{min-width:0;display:flex;flex-direction:column'),'product metadata must be vertically stacked under the product title');
assert.ok(page.includes('.shopv2-picker-kicker'),'active-list picker must have its own premium context-card hierarchy');
assert.ok(page.includes('.shopv2-tabs{display:grid')&&page.includes('padding:4px;border:1px'),'status controls must render as a distinct segmented control rather than item-sized cards');
assert.ok(page.includes('.shopv2-item{display:grid')&&page.includes('box-shadow:0 5px 16px'),'product rows must have a lighter elevated row treatment distinct from the list picker and status control');
assert.ok(page.includes('item.done=lane.desiredDone;localItems[key]=item'),'tap must change local state synchronously before persistence');
assert.ok(page.includes("if(el)el.remove();updateTabs();updateEmpty();scheduleFlush();"),'tap must remove the row from the current view immediately before the Firebase flush');
assert.ok(page.includes("r.setItem(lane.scope,lane.listId,lane.itemKey,{done:desired})"),'idle flush must persist only the final done state through the canonical repository');
assert.ok(page.includes("list.addEventListener('pointerdown'")&&page.includes("list.addEventListener('pointerup'"),'shopping list interaction must use direct delegated pointer events');
assert.ok(!page.includes('innerHTML=view.openItems.map'),'rebuilt shopping page must not re-render complete columns on each change');

assert.ok(duplicates.includes("title:'Dubbele boodschappen'"),'recipe duplicate resolver must remain available after the UI rebuild');
assert.ok(duplicates.includes(".shopping-conflict-modal .fam-modal-title{color:#111!important}"),'duplicate-dialog title must always render black');
assert.ok(duplicates.includes(".shopping-conflict-intro b{color:#111!important}"),'duplicate-dialog lead text must remain black');
assert.ok(resolver.includes("'Overig':'utilityCategory'"),'unknown products must use the canonical product/category fallback instead of a box');
assert.ok(resolver.includes("'📦':'utilityCategory'"),'legacy box values must visually resolve to the product/category fallback');
assert.ok(!classifier.includes("result('Overig','📦'"),'classifier must no longer emit a box for unknown products');

const storeIndex=loader.indexOf('src/modules/shop/shoppingListStore.js?v=1');
const pageIndex=loader.indexOf('src/modules/shop/shoppingPageV2.js?v=1');
const duplicateIndex=loader.indexOf('src/modules/shop/shoppingRecipeDuplicateResolver.js?v=1');
const addIndex=loader.indexOf('src/modules/shop/groceryAddSheet.js?v=3');
assert.ok(storeIndex>=0&&pageIndex>storeIndex&&duplicateIndex>pageIndex&&addIndex>duplicateIndex,'ShoppingPageV2 runtime order must preserve canonical store, duplicate resolver and add sheet');
assert.ok(!loader.includes('src/modules/shop/shop.js?v=8'),'legacy shopping renderer must not be served alongside ShoppingPageV2');
assert.ok(!loader.includes('src/modules/shop/shopInteractionBurstPolish.js'),'obsolete burst overlay must not be served alongside the rebuilt page');

console.log('STEP 7 ShoppingPageV2 instant interaction + premium hierarchy contract: PASS');
