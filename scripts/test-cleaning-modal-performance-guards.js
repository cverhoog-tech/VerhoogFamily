'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}

const round2=read('src/core/familyappFeedbackRound2.js');
const direct=read('src/modules/cleaning/cleaningSupplyDirectManager.js');

// Regression guard for the iPhone/PWA modal freeze found in September 2026.
// A modal decorator must not unconditionally mutate a subtree observed by its
// own MutationObserver, otherwise the observer -> rAF -> decorate -> mutation
// chain can run forever and starve close/tap handling.
assert.match(round2,/function queueTurn\(\)/,'Cleaning turn overlay needs its own targeted queue');
assert.match(round2,/function queueSupply\(\)/,'Cleaning supply overlay needs its own targeted queue');
assert.match(round2,/function relevantObservedMutation\(records\)/,'Round2 must filter self-authored modal mutations');
assert.match(round2,/scope==='turn'\)queueTurn\(\);else if\(scope==='supply'\)queueSupply\(\)/,'Overlay observers must not schedule the full Cleaning decorator');
assert.match(round2,/summary\.getAttribute\('data-familyapp-signature'\)!==summarySignature/,'Supply summary innerHTML must be signature-gated');
assert.match(round2,/context\.getAttribute\('data-familyapp-signature'\)!==contextSignature/,'Turn context innerHTML must be signature-gated');
assert.match(round2,/start\.getAttribute\('data-familyapp-signature'\)!==startMode/,'Turn CTA innerHTML must be signature-gated');

// iOS/WebKit close guard: do not remove the overlay in the native pointerup
// handler before the compatibility click has had a stable target.
assert.match(round2,/function onPointerUp\(event\)/,'Round2 must guard the supply close pointerup');
assert.match(round2,/document\.addEventListener\('pointerup',onPointerUp,true\)/,'Supply close guard must run in capture phase');
assert.match(round2,/raf\(function\(\)\{var experience=window\.CleaningSupplyExperience/,'Supply close must be deferred to the next frame');

// Direct manager used to write the empty-state text on every decorate pass,
// which woke its own overlay MutationObserver forever.
assert.match(direct,/if\(empty&&empty\.textContent!==emptyText\)empty\.textContent=emptyText/,'Direct supply empty-state write must be change-gated');
assert.match(direct,/state\.observer\.observe\(overlay,\{childList:true,subtree:true\}\)/,'Direct manager observer must stay scoped to the supply overlay');
assert.doesNotMatch(direct,/state\.observer\.observe\(document\.(body|documentElement)/,'Direct manager must never observe the whole document');

console.log('Cleaning modal performance guards OK');
