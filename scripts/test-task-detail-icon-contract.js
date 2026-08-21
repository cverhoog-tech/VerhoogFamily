const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const popup=read('src/modules/tasks/taskDetailPopup.js');
const icons=read('src/modules/tasks/taskCategoryIcons.js');
const registry=read('src/ui/icons/familyAppIconRegistry.js');
const actions=read('src/ui/icons/assets/familyapp-content-actions.svg');

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
