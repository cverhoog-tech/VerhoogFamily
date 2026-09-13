'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
function read(path){return fs.readFileSync(path,'utf8');}

const shell=read('api/app-v7.js');
const recipeFix=read('src/modules/recipes/recipePhotoUploadFixV1.js');
const moreFix=read('src/core/moreMenuDismissV1.js');
const taskFeedback=read('src/modules/tasks/v3/taskCompletionFeedbackV1.js');
const lexBase=read('src/modules/shop/groceryProductLexicon.js');
const lexEnhance=read('src/modules/shop/groceryProductLexiconEnhanceV1.js');
const iconRegistryEnhance=read('src/ui/icons/familyAppGroceryIconRegistryV1.js');
const iconSprite=read('src/ui/icons/assets/familyapp-grocery-special-icons.svg');

// Recipe photo selection: intercept raw library file, preview immediately and normalize before canonical editor handler.
assert(recipeFix.includes("input.id!=='rep-photo-file'"),'recipe fix must scope itself to recipe photo input');
assert(recipeFix.includes('showImmediatePreview(file)'),'recipe fix must show immediate photo feedback');
assert(recipeFix.includes('stopImmediatePropagation'),'recipe fix must stop the old raw handler before async normalization');
assert(recipeFix.includes("canvas.toBlob"),'recipe fix must compress oversized iPhone photos client-side');
assert(recipeFix.includes("'image/jpeg'"),'recipe fix must normalize photos to a persistable JPEG');
assert(recipeFix.includes('TARGET_BYTES=112000'),'recipe output must stay safely under RecipeStore inline limit after base64 encoding');

// More menu: scoped backdrop dismissal, no document-wide generic click owner.
assert(moreFix.includes("BACKDROP_ID='more-menu-backdrop-v1'"),'More menu must use a dedicated backdrop');
assert(moreFix.includes("addEventListener('pointerdown'"),'More menu backdrop must close on immediate pointer/touch down');
assert(moreFix.includes("event.stopPropagation()"),'outside dismissal must not leak ghost taps through to content');
assert(moreFix.includes("event.key==='Escape'"),'desktop Escape dismissal must remain available');
assert(!moreFix.includes("document.addEventListener('click'"),'More menu fix must not introduce a generic document click owner');

// Task completion: presentation-only immediate feedback; canonical toggleTask remains owner.
assert(taskFeedback.includes("[data-tv3-complete]"),'task completion feedback must target only V3 completion CTA');
assert(taskFeedback.includes("pointerdown"),'completion CTA must respond immediately on touch down');
assert(taskFeedback.includes("Klaar ✓"),'completion CTA must acknowledge completion immediately');
assert(taskFeedback.includes('canonical toggleTask handler fully in charge'),'completion companion must preserve canonical completion ownership');
assert(!taskFeedback.includes('TaskSharedData.update'),'completion feedback companion must not become a second task writer');

// Grocery icon assets/keys.
['utility-spices','utility-sauce','utility-fryer'].forEach(id=>assert(iconSprite.includes('id="'+id+'"'),'missing grocery icon '+id));
['utilitySpices','utilitySauce','utilityFryer'].forEach(key=>assert(iconRegistryEnhance.includes(key),'missing grocery icon registry key '+key));

// Execute the real lexicon + enhancement to verify product-family recognition end to end.
const context={window:{},Object:Object,String:String,Array:Array};
vm.createContext(context);
vm.runInContext(lexBase,context);
vm.runInContext(lexEnhance,context);
const match=context.window.FamilyAppProductLexicon.match;
const expectations=[
  ['paprikapoeder','utilitySpices'],
  ['knoflooksaus','utilitySauce'],
  ['friet','utilityFryer'],
  ['diepvriespizza','utilityFrozen'],
  ['cola','utilitySoda'],
  ['appelsap','utilityDrinks'],
  ['koffie','utilityCoffee'],
  ['rundergehakt','utilityMeat'],
  ['volle melk','utilityDairy']
];
expectations.forEach(([name,key])=>assert.strictEqual(match(name).iconKey,key,name+' should resolve to '+key));

// Served shell wiring: all companions need to be present in the real V7 shell.
[
  'familyAppGroceryIconRegistryV1.js?v=1',
  'groceryProductLexiconEnhanceV1.js?v=1',
  'recipePhotoUploadFixV1.js?v=1',
  'moreMenuDismissV1.js?v=1',
  'taskCompletionFeedbackV1.js?v=1'
].forEach(asset=>assert(shell.includes(asset),'V7 shell missing '+asset));

console.log('FamilyApp feedback round 2 contracts: PASS');
