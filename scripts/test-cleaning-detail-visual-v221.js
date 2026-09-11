#!/usr/bin/env node
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}

const visual=read('src/modules/cleaning/cleaningDetailVisualV221.js');
const css=read('src/styles/cleaning-detail-v221.css');
const cssRuntime=css.replace(/\/\*[\s\S]*?\*\//g,'');
const companion=read('src/modules/cleaning/cleaningCompanionLoader.js');
const premium=read('src/modules/cleaning/cleaningPremiumFeedback.js');
const screen=read('src/modules/cleaning/cleaningScreen.js');
const design=read('docs/FAMILYAPP-VISUAL-DESIGN-SYSTEM.md');

assert.match(visual,/VERSION='2\.2\.1'/,'visual companion version must be v2.2.1');
assert.match(companion,/cleaningDetailVisualV221\.js\?v=1/,'visual rework must remain Cleaning-route lazy');
assert.match(premium,/version:'2\.2\.1'/,'premium bridge must expose the visual milestone version');

assert.match(visual,/CleaningHouseholdRepository\|\|window\.CleaningV2Repository/,'visual layer must reuse canonical Cleaning repository');
assert.doesNotMatch(visual,/firebase\.database|fbDb|\.ref\s*\(|\.on\(\s*['"]value['"]/,'visual layer must not own Firebase or add a raw listener');
assert.doesNotMatch(visual,/new\s+MutationObserver|MutationObserver\s*\(/,'visual layer must not use MutationObserver');
assert.doesNotMatch(visual,/setInterval\s*\(|setTimeout\s*\(/,'visual layer must not poll or schedule timer loops');
assert.doesNotMatch(visual,/TaskDetailPopup|CleaningExecutionWriteRuntime|CleaningProjectionService/,'visual layer must not reactivate legacy Cleaning owners');
assert.doesNotMatch(visual,/document\.addEventListener\s*\(/,'visual layer must not add document-wide click ownership');
assert.doesNotMatch(visual,/createElement\(['"]div['"]\).*role=['"]dialog|appendChild\(.*cv2-sheet/,'visual layer must not create a second modal owner');

assert.match(visual,/document\.getElementById\('cleaning-v2-sheet'\)/,'visual layer must reuse the existing Cleaning V2 sheet');
assert.match(visual,/data-cv2-check/,'turn checklist must preserve the accepted execution control contract');
assert.match(visual,/data-cv2-complete-all/,'turn completion must continue through the accepted execution writer');
assert.match(visual,/data-cv2-supplies/,'turn must retain contextual supplies navigation');
assert.match(visual,/CleaningCollaborationV21/,'collaboration must remain contextual to the concrete turn');
assert.match(visual,/>Bewerken<\/button>/,'turn must keep the agreed secondary edit action');
assert.match(visual,/>Bekijk beurt<\/span>/,'turn must keep the agreed utility-pair hierarchy');
assert.match(visual,/function syncTurnProgressUi\(/,'visual percentage/copy must update after existing checklist interactions');
assert.match(visual,/body\.scrollTop=0/,'Bekijk beurt must stay a lightweight in-sheet action');

assert.match(visual,/Voor deze beurt/,'supplies must expose concrete-turn scope');
assert.match(visual,/Alle kameritems/,'supplies must expose room scope');
assert.match(visual,/Bekijk alle kameritems/,'supplies must keep the agreed bottom utility wording');
assert.match(visual,/Op voorraad/,'supplies must expose stock state');
assert.match(visual,/Bijna op/,'supplies must expose low-stock state');
assert.match(visual,/Ontbreekt/,'supplies must expose missing state');
assert.match(visual,/ShoppingListStore/,'missing or low supplies must route through canonical ShoppingListStore');
assert.match(visual,/store\.addItems\(null,items,\{dedupe:true\}\)/,'shopping handoff must dedupe through the shopping facade');
assert.match(visual,/setInventoryStatus/,'supply state updates must use the existing Cleaning repository method');
assert.match(visual,/addRoomSupply/,'room supply creation must use the existing Cleaning repository method');
assert.match(visual,/refreshRows:false/,'optimistic supply interactions must preserve immediate local visual state');
assert.match(visual,/function leaveDetailMode\(preserveCurrentTitle\)/,'navigation to existing generic forms must preserve their freshly rendered title');

assert.match(css,/--fav-violet:#6d3fea/,'light theme must carry FamilyApp violet identity');
assert.match(css,/--fav-bg:#f8f6f2/,'light theme must use warm off-white rather than clinical white');
assert.match(css,/--fav-bg:#08111b/,'dark theme must use deep navy foundation');
assert.match(css,/\.fav-supply-icon\{width:46px;height:46px/,'supply icons must use the locked 44–48px tile language');
assert.match(css,/min-height:76px;display:grid;grid-template-columns:48px/,'supply rows must preserve premium mobile dimensions');
assert.match(css,/\.fav-turn-hero\{[\s\S]*min-height:194px/,'turn detail must keep a strong room hero');
assert.doesNotMatch(cssRuntime,/backdrop-filter|filter:\s*blur|animation:\s*[^;]*(infinite)/,'visual runtime CSS must avoid paint-heavy glass/continuous animation');

assert.match(design,/Calm Premium Home/,'shared FamilyApp design system must be canonical');
assert.match(design,/Schoonmaken mag \*\*niet\*\* uitgroeien tot een tweede Taken-module/,'Cleaning/Tasks product boundary must stay explicit');
assert.match(design,/44–48px/,'design system must lock supply icon dimensions');

assert.match(screen,/const VERSION='2\.0\.0'/,'accepted primary Cleaning V2 screen baseline must stay intact');
assert.doesNotMatch(screen,/CleaningDetailVisualV221/,'primary screen must not absorb the visual companion or change accepted architecture');

console.log('Cleaning v2.2.1 premium detail visual guards OK');