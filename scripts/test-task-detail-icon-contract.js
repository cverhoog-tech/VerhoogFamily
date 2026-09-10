const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const popup=read('src/modules/tasks/taskDetailPopup.js');
const icons=read('src/modules/tasks/taskCategoryIcons.js');
const registry=read('src/ui/icons/familyAppIconRegistry.js');
const actions=read('src/ui/icons/assets/familyapp-content-actions.svg');
const controls=read('src/styles/taskDetailControlFix.css');
const loader=read('api/app.js');

// STEP 2B.6A accepted category path must remain canonical.
assert(popup.includes('TaskCategoryIcons.icon'),'task detail category badge must use TaskCategoryIcons');
assert(icons.includes('FamilyAppIconRenderer.render'),'task category/actions bridge must use canonical renderer');

// STEP 2B.6C approved action migrations.
['utilityTrash','utilityBookmark','utilityCheck'].forEach(k=>assert(registry.includes(k+':utility('),'missing canonical task action '+k));
assert(actions.includes('id="utility-trash"'),'trash artwork missing');
assert(actions.includes('id="utility-bookmark"'),'bookmark artwork missing');
assert(actions.includes('id="utility-check"'),'check artwork missing');
assert(icons.includes("#tdp-overlay .tdp-sub-accent[data-sub-del]"),'subtask delete migration missing');
assert(icons.includes("#tdp-overlay #tdp-bookmark-btn"),'bookmark migration missing');
assert(icons.includes("#tdp-overlay #tdp-create-save-btn"),'create confirm migration missing');

// STEP 2B.6D iOS/Safari subtask-control regression guard.
// The editable icon slot is a <button>, so width/height alone are not enough:
// global/mobile native metrics can still impose a larger minimum height. Lock
// every dimension in the scoped override and keep the done glyph high-contrast.
assert(controls.includes('#tdp-overlay .tdp-sub-icon-btn'),'subtask icon button must have a scoped popup control contract');
assert(controls.includes('min-height:24px !important'),'desktop icon-slot minimum height must be explicitly locked');
assert(controls.includes('max-height:24px !important'),'desktop icon-slot maximum height must be explicitly locked');
assert(controls.includes('aspect-ratio:1 / 1 !important'),'subtask icon slot must preserve a strict square before border-radius');
assert(controls.includes('-webkit-appearance:none !important'),'iOS native button appearance must be disabled for the subtask icon slot');
assert(controls.includes('#tdp-overlay .tdp-sub-chk.done{\n  color:#fff !important;'),'completed checkbox glyph must be white on the purple fill');
assert(controls.includes('stroke-width:2.4 !important'),'completed checkbox checkmark must have explicit readable stroke weight');
assert(controls.includes('#tdp-overlay .tdp-sub-chk,\n  #tdp-overlay .tdp-sub-icon,\n  #tdp-overlay .tdp-sub-icon-btn{'),'mobile checkbox and icon slot must share one geometry override');
assert(controls.includes('min-height:26px !important')&&controls.includes('max-height:26px !important'),'mobile controls must be locked to 26px height');
assert(!controls.includes('#tdp-overlay .tdp-sub [class*="sub-icon"]'),'broad substring selector must not accidentally recapture the interactive icon button');
assert(loader.includes('src/styles/taskDetailControlFix.css?v=2'),'loader must cache-bust the hardened iOS task-detail control stylesheet');

// Explicitly preserve the user-approved legacy presentation for controls that
// were visually rejected when migrated in STEP 2B.6B. These are deliberate
// exclusions until a separately approved redesign exists.
assert(popup.includes("uiIcon('link',12)"),'help/collaboration icon presentation changed unexpectedly');
assert(popup.includes('helpCrestSvg()'),'help crest presentation changed unexpectedly');
assert(popup.includes("uiIcon('calendar',11)"),'task metadata calendar icon changed unexpectedly');
assert(popup.includes("uiIcon('shield',11)"),'task recurrence shield changed unexpectedly');
assert(popup.includes("uiIcon('close',12)"),'task popup close icon changed unexpectedly');
assert(popup.includes("task.done?'reopen':'check'"),'completion/reopen state icon contract changed unexpectedly');
assert(popup.includes("uiIcon('lock',12)"),'locked completion state icon changed unexpectedly');

console.log('task detail icon contract OK');