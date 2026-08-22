'use strict';
const fs = require('fs');
const path = require('path');

function read(rel){return fs.readFileSync(path.join(__dirname,'..',rel),'utf8');}
function assert(cond,msg){if(!cond)throw new Error(msg);}

const popup = read('src/modules/tasks/taskDetailPopup.js');

// 1. Old keyword/content auto-classifier must be fully gone -- no fallback
//    sparkle/basket/drawer/appliance icon logic left anywhere in the file.
assert(!popup.includes('function subIcon('), 'the keyword-based subIcon() auto-classifier must be removed');
assert(!popup.includes('SUB_ICON_PATHS'), 'the old SUB_ICON_PATHS icon set must be removed');
assert(!/sparkle:/.test(popup), 'no sparkle fallback icon definition may remain');

// 2. New explicit, optional icon model.
assert(popup.includes('function getSubIcon('), 'a single canonical getSubIcon() reader must exist');
assert(/getSubIcon\(s\)\{var v=s&&s\.icon;return \(typeof v===.string.&&v\)\?v:null;\}/.test(popup),
  'getSubIcon must treat undefined, missing, and null identically as "no icon" (never assume physical icon:null presence)');

// 3. Curated categorized picker (SubtaskIconPicker), not a full unicode keyboard clone.
assert(popup.includes('SUBTASK_ICON_CATEGORIES'), 'a curated category list must back the picker');
assert(popup.includes('subtaskIconPickerHtml'), 'a shared picker-panel renderer must exist');
assert(popup.includes('subtaskIconButtonHtml'), 'a shared icon-slot button renderer must exist');
assert(popup.includes('Geen icoon'), 'the picker must offer an explicit "no icon" clear option');

// 4. One picker implementation reused by both detail and create views (no duplication).
const pickerHtmlCalls = (popup.match(/subtaskIconPickerHtml\(/g) || []).length;
const pickerBtnCalls = (popup.match(/subtaskIconButtonHtml\(/g) || []).length;
assert(pickerHtmlCalls >= 2, 'subtaskIconPickerHtml must be reused by both the detail view and the create view, not duplicated');
assert(pickerBtnCalls >= 2, 'subtaskIconButtonHtml must be reused by both the detail view and the create view, not duplicated');

// 5. Picker state is tracked per subtask id, not a single ambiguous boolean.
assert(popup.includes('var iconPickerForId = null'), 'picker-open state must be keyed by subtask id');
assert(!/var iconPickerOpen\s*=\s*(true|false)/.test(popup), 'must not use a bare global boolean for icon-picker visibility');

// 6. Icon values are escaped, never raw-injected as HTML.
assert(popup.includes("esc(subId)") && popup.includes('data-icon-value="\'+esc(ic)+\'"'),
  'curated icon values must be escaped when written into picker markup');
assert(popup.includes('icon?esc(icon)'), 'a subtask\'s stored icon must be escaped before rendering');

// 7. Icon slot and checkbox are separate controls; icon click must not toggle completion.
assert(popup.includes('data-sub-icon-toggle='), 'icon slot must be its own distinct control (separate attribute from data-sub-toggle)');
assert(popup.includes('data-sub-toggle='), 'checkbox toggle control must still exist independently');
const iconToggleHandler = popup.split("querySelectorAll('[data-sub-icon-toggle]')")[1] || '';
assert(iconToggleHandler.slice(0, 120).includes('stopPropagation'), 'icon-slot click handler must stop propagation so it cannot bubble into row/checkbox handling');

// 8. done remains the sole completion field; no rename, no task-model migration triggered by this change.
assert(popup.includes('s.done'), 'subtask completion must still be read via the existing done field');
assert(!popup.includes('s.completed'), 'this change must not introduce/rename to a completed field');

// 9. Persistence still goes through the existing patch()/TaskSharedData.update boundary --
//    no new storage layer, no localStorage, no parallel task array.
assert(popup.includes('patch(task.id,{subtasks:next},render)'), 'icon selection must persist via the existing patch() boundary in the detail view');
assert(!popup.includes('localStorage.setItem'), 'no new localStorage authority may be introduced by this change');

console.log('subtask-icon-contract: ok');
