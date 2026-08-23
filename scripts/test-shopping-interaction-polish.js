'use strict';
const fs=require('fs');
const assert=require('assert');

const shop=fs.readFileSync('src/modules/shop/shop.js','utf8');
const guard=fs.readFileSync('src/modules/tasks/taskLegacySyncGuard.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

// Smooth checkbox contract: visual response must happen before the async write,
// and canonical rerenders are debounced until the rapid-tap interaction settles.
const toggleStart=shop.indexOf('function toggleShop(id)');
const paintIndex=shop.indexOf('paintToggle(id,nextDone)',toggleStart);
const writeIndex=shop.indexOf("r.setItem(found.row.scope",toggleStart);
assert.ok(toggleStart>=0&&paintIndex>toggleStart,'shopping toggle must optimistically paint the checkbox immediately');
assert.ok(writeIndex>paintIndex,'visual checkbox feedback must happen before waiting for Firebase');
assert.ok(shop.includes('shop-toggle-pulse'),'shopping checkbox interaction must include a compact completion animation');
assert.ok(shop.includes('interactionPendingUntil'),'rapid taps must hold full list reordering until interaction settles');
assert.ok(shop.includes('requestAnimationFrame'),'shopping rerender must be frame-scheduled rather than synchronously rebuilding on each callback');
assert.ok(shop.includes('scheduleRenderShop(false)'),'store updates must use the debounced shopping renderer');

// Duplicate ingredient contract: duplicate recipe imports must never silently
// overwrite/skip an existing item. The user chooses the action per conflict.
assert.ok(shop.includes('analyzeRecipeDuplicates'),'recipe imports must detect duplicate product names before applying mutations');
assert.ok(shop.includes("value=\"sum\""),'same-unit duplicates must offer quantity addition');
assert.ok(shop.includes('Bestaande hoeveelheid vervangen'),'duplicates must offer replacing the existing quantity');
assert.ok(shop.includes('Als aparte regel toevoegen'),'duplicates must offer keeping the incoming ingredient as a separate row');
assert.ok(shop.includes('Bestaande laten staan'),'duplicates must offer skipping an incoming duplicate');
assert.ok(shop.includes('data-conflict-index'),'duplicate decisions must be selectable per individual item');
assert.ok(shop.includes('patch.amount=a.amount+b.amount'),'sum must mathematically add compatible quantities instead of overwriting');
assert.ok(shop.includes('appendRecipeIngredients.__duplicateResolver=true'),'all recipe/meal callers of the facade must cross the duplicate resolver');

// Anti-flicker contract: family-root compatibility updates may refresh Tasks for
// recurData, but must never rebuild Home/Shopping merely because another child wrote.
assert.ok(guard.includes('CANONICAL LEGACY SYNC GUARD v3.1.0'),'anti-flicker sync guard version must be active');
assert.ok(!guard.includes('window._renderScreen(window._currentScreen)'),'legacy root listener must not rebuild the current screen generically');
assert.ok(guard.includes("window._currentScreen==='tasks'"),'only changed legacy recurring-task data may request a Tasks render');
assert.ok(loader.includes('shop.js?v=8'),'served runtime must cache-bust the shopping interaction polish');
assert.ok(loader.includes('taskLegacySyncGuard.js?v=3'),'served runtime must cache-bust the anti-flicker guard');

console.log('STEP 7 shopping interaction polish contract: PASS');
