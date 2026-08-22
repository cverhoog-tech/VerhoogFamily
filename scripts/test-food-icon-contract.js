'use strict';
const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const resolver=read('src/ui/icons/familyAppFoodIconResolver.js');
const renderer=read('src/ui/icons/familyAppIconRenderer.js');
const registry=read('src/ui/icons/familyAppIconRegistry.js');
const shop=read('src/modules/shop/shop.js');
const recipeEditor=read('src/modules/recipes/recipeEditorPopup.js');
const meals=read('src/modules/meals/meals.js');
const shell=read('api/app.js');
const taskStatus=read('docs/household-rebuild-status.md');

assert(resolver.includes("'Ontbijt':'utilityBread'"),'food resolver must map breakfast');
assert(resolver.includes("'Lunch':'utilityLunch'"),'food resolver must map lunch');
assert(resolver.includes("'Diner':'utilityDinner'"),'food resolver must map dinner');
assert(resolver.includes("'breakfast':'utilityBread'"),'food resolver must map breakfast meal type');
assert(resolver.includes("'dinner':'utilityDinner'"),'food resolver must map dinner meal type');
assert(renderer.includes('FamilyAppIconRenderer'),'canonical renderer missing');
['utilityShopping','utilityRecipe','utilityMeal','utilityLunch','utilityDinner','utilityBread','utilitySnacks'].forEach(function(key){
  assert(registry.includes(key+':'),'registry missing '+key);
});

assert(shop.includes('FamilyAppUtilityIconResolver'),'shopping products must keep canonical product resolver');
assert(shop.includes("uiIcon('utilityShopping'"),'shopping list presentation must use canonical shopping icon');
assert(!shop.includes("?'🔒 Privé':'👨‍👩‍👧 Gezin · live'"),'shopping list labels must not rely on scope emoji');
assert(recipeEditor.includes('FamilyAppFoodIconResolver'),'recipe editor must use canonical food resolver');
assert(!recipeEditor.includes("hero.emoji+' '+esc(draft.cat)"),'recipe editor hero must not render legacy category emoji');
assert(meals.includes('FamilyAppFoodIconResolver'),'meal screen must use canonical food resolver');
assert(meals.includes("foodIcon(type,'sm')"),'meal slots must render canonical semantic icons');

assert(shell.includes('src/ui/icons/familyAppFoodIconResolver.js?v=1'),'runtime must load food resolver');
assert(shell.includes('src/modules/recipes/recipeEditorPopup.js?v=2'),'runtime must cache-bust migrated recipe editor');
assert(shell.includes('src/modules/shop/shop.js?v=7'),'runtime must cache-bust migrated shopping UI');
assert(shell.includes('src/modules/meals/meals.js?v=3'),'runtime must cache-bust migrated meals UI');

assert(taskStatus.includes('STEP 2B.6 — Tasks icon/detail/create presentation'),'frozen task baseline status missing');
assert(taskStatus.includes('accepted / frozen baseline'),'task baseline must remain frozen');

console.log('FamilyApp STEP 2B.7 food icon contract OK');
