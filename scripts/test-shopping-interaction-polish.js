'use strict';
const fs=require('fs');
const assert=require('assert');

const page=fs.readFileSync('src/modules/shop/shoppingPageV2.js','utf8');
const duplicates=fs.readFileSync('src/modules/shop/shoppingRecipeDuplicateResolver.js','utf8');
const guard=fs.readFileSync('src/modules/tasks/taskLegacySyncGuard.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

// Instant interaction contract: local state + DOM removal must precede any
// canonical Firebase persistence, so taps never wait on networking or rerenders.
const toggleStart=page.indexOf('function toggleItem(key)');
const localIndex=page.indexOf('item.done=lane.desiredDone;localItems[key]=item',toggleStart);
const removeIndex=page.indexOf("if(el)el.remove()",toggleStart);
const scheduleIndex=page.indexOf('scheduleFlush()',toggleStart);
const writeIndex=page.indexOf('r.setItem(lane.scope,lane.listId,lane.itemKey',{); 
assert.ok(toggleStart>=0&&localIndex>toggleStart,'rebuilt shopping toggle must update local state immediately');
assert.ok(removeIndex>localIndex,'row must leave the current list immediately after local state changes');
assert.ok(scheduleIndex>removeIndex,'Firebase flush scheduling must happen only after the visual move');
assert.ok(page.includes('FLUSH_IDLE_MS=220'),'rapid taps must share a short idle persistence window');
assert.ok(page.includes("list.addEventListener('pointerdown'")&&page.includes("list.addEventListener('pointerup'"),'rebuilt list must use delegated pointer interaction');

// Duplicate ingredient contract stays independent from the renderer and must
// never silently overwrite or skip an existing product.
assert.ok(duplicates.includes('function analyze('),'recipe imports must detect duplicate product names before mutations');
assert.ok(duplicates.includes('value=\"sum\"'),'same-unit duplicates must offer quantity addition');
assert.ok(duplicates.includes('Bestaande hoeveelheid vervangen'),'duplicates must offer replacing the existing quantity');
assert.ok(duplicates.includes('Als aparte regel toevoegen'),'duplicates must offer a separate incoming row');
assert.ok(duplicates.includes('Bestaande laten staan'),'duplicates must offer keeping the current item');
assert.ok(duplicates.includes('data-conflict-index'),'duplicate decisions must be selectable per item');
assert.ok(duplicates.includes('patch.amount=a.amount+b.amount'),'sum must mathematically add compatible quantities');
assert.ok(duplicates.includes('appendRecipeIngredients.__duplicateResolverV2=true'),'all recipe/meal callers must cross the rebuilt duplicate resolver');
assert.ok(duplicates.includes('.shopping-conflict-modal .fam-modal-title{color:#111!important}'),'duplicate dialog title must stay black');

// Anti-flicker contract: family-root compatibility updates may refresh Tasks for
// recurData, but must never rebuild Home/Shopping merely because another child wrote.
assert.ok(guard.includes('CANONICAL LEGACY SYNC GUARD v3.1.0'),'anti-flicker sync guard version must be active');
assert.ok(!guard.includes('window._renderScreen(window._currentScreen)'),'legacy root listener must not rebuild the current screen generically');
assert.ok(guard.includes("window._currentScreen==='tasks'"),'only changed recurring-task data may request a Tasks render');
assert.ok(loader.includes('shoppingPageV2.js?v=1'),'served runtime must load the rebuilt shopping presentation');
assert.ok(loader.includes('shoppingRecipeDuplicateResolver.js?v=1'),'served runtime must load duplicate handling independently');
assert.ok(!loader.includes('shopInteractionBurstPolish.js'),'obsolete burst patch must not be served');
assert.ok(loader.includes('taskLegacySyncGuard.js?v=3'),'served runtime must keep the anti-flicker guard');

console.log('STEP 7 rebuilt shopping interaction contract: PASS');
