'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}

const round2=read('src/core/familyappFeedbackRound2.js');
const round4=read('src/core/familyappFeedbackRound4.js');
const turn=read('src/modules/cleaning/cleaningTurnExperience.js');
const direct=read('src/modules/cleaning/cleaningSupplyDirectManager.js');

// September 2026 rebuild guard: the Cleaning turn UI is a dedicated component.
// It must never fall back to decorating/reopening the generic task popup again.
assert.match(turn,/window\.CleaningTurnExperience\s*=\s*\{/,'Dedicated Cleaning turn experience must be exported');
assert.match(turn,/cleaning-turn-overlay/,'Dedicated Cleaning turn overlay must exist');
assert.match(turn,/document\.addEventListener\('click',onPrimaryClick,true\)/,'Cleaning turn owner must capture the room primary action');
assert.match(turn,/stopImmediatePropagation\(\)/,'Cleaning turn owner must prevent competing room-primary handlers');
assert.match(turn,/TaskSharedData/,'Checklist and completion must keep the existing task execution write route');
assert.match(turn,/CleaningSupplyExperience/,'Supplies must keep the existing Cleaning supply experience');
assert.doesNotMatch(turn,/TaskDetailPopup/,'Cleaning turn UI must never reuse the generic TaskDetailPopup');
assert.doesNotMatch(turn,/MutationObserver/,'Dedicated Cleaning turn popup must not use DOM observers');
assert.doesNotMatch(turn,/scrollIntoView/,'Cleaning turn popup must not invoke browser-managed scrollIntoView');

// The Start button is intentionally local presentation state only. It must not
// write data, rebuild the popup, or move browser scroll state.
const startBegin=turn.indexOf('function start(){');
const startEnd=turn.indexOf('function visibleProgress()',startBegin);
assert.ok(startBegin>=0&&startEnd>startBegin,'Cleaning turn local start handler must exist');
const startBody=turn.slice(startBegin,startEnd);
assert.match(startBody,/state\.started=true/,'Start button must only enter local started state');
assert.doesNotMatch(startBody,/TaskSharedData|\.update\(|scrollTop|scrollIntoView|innerHTML/,'Start button must not write, scroll, or rebuild popup content');

// Round2 now owns only general/supply presentation. The old Cleaning task popup
// decorator, observer and checkbox interception must stay removed.
assert.doesNotMatch(round2,/TaskDetailPopup|tdp-overlay|familyapp-cleaning-turn|queueTurn|data-familyapp-turn/,'Round2 must not regain Cleaning turn popup ownership');
assert.match(round2,/function queueSupply\(\)/,'Cleaning supply overlay retains its targeted queue');
assert.match(round2,/summary\.getAttribute\('data-familyapp-signature'\)!==summarySignature/,'Supply summary innerHTML must remain signature-gated');

// Round4 deliberately loads the dedicated popup before PremiumFeedback and the
// legacy presentation adapters, making its capture handler the single owner.
assert.match(round4,/function loadCleaningTurnExperience\(\)/,'Round4 must load the dedicated Cleaning turn experience');
assert.match(round4,/loadCleaningTurnExperience\(\)[\s\S]*?\.then\(function\(\)\{return loadPremiumFeedback\(\);\}\)[\s\S]*?loadCleaningAdapters\(\)/,'Dedicated turn popup must load before premium/adapters');
assert.match(round4,/familyappFeedbackRound2\.js\?v=20260909-turn-rebuild-1/,'Round2 rebuild must be cache-busted for mobile Safari/PWA');

// iOS/WebKit supply close guard remains: do not remove the overlay during the
// native pointerup before the compatibility click has a stable target.
assert.match(round2,/function onPointerUp\(event\)/,'Round2 must guard the supply close pointerup');
assert.match(round2,/document\.addEventListener\('pointerup',onPointerUp,true\)/,'Supply close guard must run in capture phase');
assert.match(round2,/raf\(function\(\)\{var experience=window\.CleaningSupplyExperience/,'Supply close must be deferred to the next frame');

// Direct manager used to write the empty-state text on every decorate pass,
// which woke its own overlay MutationObserver forever.
assert.match(direct,/if\(empty&&empty\.textContent!==emptyText\)empty\.textContent=emptyText/,'Direct supply empty-state write must be change-gated');
assert.match(direct,/state\.observer\.observe\(overlay,\{childList:true,subtree:true\}\)/,'Direct manager observer must stay scoped to the supply overlay');
assert.doesNotMatch(direct,/state\.observer\.observe\(document\.(body|documentElement)/,'Direct manager must never observe the whole document');

console.log('Cleaning modal rebuild guards OK');
