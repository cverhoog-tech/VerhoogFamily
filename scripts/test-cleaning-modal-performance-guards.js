'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}

const round2=read('src/core/familyappFeedbackRound2.js');
const round4=read('src/core/familyappFeedbackRound4.js');
const turn=read('src/modules/cleaning/cleaningTurnExperience.js');
const guard=read('src/modules/cleaning/cleaningTurnRenderGuard.js');
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
assert.doesNotMatch(turn,/new\s+MutationObserver|MutationObserver\s*\(/,'Dedicated Cleaning turn popup must not create DOM observers');
assert.doesNotMatch(turn,/scrollIntoView/,'Cleaning turn popup must not invoke browser-managed scrollIntoView');

// The heavy Cleaning screen must be detached while the fullscreen turn modal
// owns the interaction. This prevents repository/member emissions from doing a
// full root.innerHTML rebuild behind the modal and prevents presentation
// observers from decorating that hidden DOM. Restore exactly once when the
// modal closes, using the same canonical CleaningScreen module identity.
assert.match(turn,/import '\.\/cleaningTurnRenderGuard\.js\?v=20260910-1';/,'Turn experience must load the render guard before registering its capture owner');
assert.match(guard,/window\.CleaningTurnRenderGuard\s*=\s*\{/,'Cleaning turn render guard must be exported');
assert.match(guard,/replaceChild\(placeholder,root\)/,'Render guard must detach the Cleaning content root while the modal is open');
assert.match(guard,/familyapp:cleaning-turn-closed/,'Render guard must restore after the dedicated turn modal closes');
assert.match(guard,/import\('\/src\/modules\/cleaning\/cleaningScreen\.js\?v=1'\)/,'Render guard must reuse the canonical CleaningScreen module identity');
assert.match(guard,/renderCleaningScreen\(root\)/,'Render guard must perform one fresh render after restoring the root');
assert.doesNotMatch(guard,/new\s+MutationObserver|MutationObserver\s*\(/,'Render guard must not introduce another DOM observer');
assert.doesNotMatch(guard,/TaskSharedData|CleaningHouseholdRepository\.(create|update|remove|save)|\.transaction\(/,'Render guard must remain presentation-only and must not write Cleaning/task data');
assert.doesNotMatch(guard,/scrollIntoView/,'Render guard must not use browser-managed scrolling');
assert.doesNotMatch(guard,/TaskDetailPopup/,'Render guard must not reintroduce the generic task popup');

// A single ES-module URL must own CleaningSupplyExperience. Different query
// strings create different module identities in browsers even for the same
// source file, so the turn fallback stays aligned with the canonical v=2 import.
assert.match(turn,/cleaningSupplyExperience\.js\?v=2/,'Turn supplies must use the canonical v=2 CleaningSupplyExperience identity');
assert.doesNotMatch(turn,/cleaningSupplyExperience\.js\?v=1/,'Turn supplies must not create a second v=1 module identity');

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
