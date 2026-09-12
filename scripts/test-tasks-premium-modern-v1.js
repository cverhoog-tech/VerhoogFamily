'use strict';
const assert=require('assert');
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}

const shell=read('api/app-v7.js');
const overview=read('src/modules/tasks/v3/taskOverviewV3.js');
const detail=read('src/modules/tasks/v3/taskDetailV3.js');
const model=read('src/modules/tasks/v3/taskPresentationModelV3.js');
const polish=read('src/styles/tasksV3Polish.css');

assert(!shell.includes('/src/styles/tasksPremiumModernV1.css'),'retired Tasks modern v1 stylesheet must not be served');
assert(!shell.includes('/src/styles/tasksPremiumModernV1Components.css'),'retired Tasks modern v1 components must not be served');
assert(!shell.includes('/src/modules/tasks/tasksPremiumModernV1.js'),'retired Tasks modern v1 decorator must not be served');

assert(shell.includes('/src/styles/tasksV3.css?v=2'),'Tasks V3 stylesheet must be served');
assert(shell.includes('/src/styles/tasksV3Polish.css?v=2'),'Tasks V3 current compact polish must be served');
assert(shell.includes('/src/modules/tasks/v3/taskPresentationModelV3.js?v=3'),'fresh Tasks V3 model must be served');
assert(shell.includes('/src/modules/tasks/v3/taskOverviewV3.js?v=3'),'responsive Tasks V3 overview must be served');
assert(shell.includes('/src/modules/tasks/v3/taskDetailV3.js?v=3'),'responsive Tasks V3 detail must be served');
assert(overview.includes('window.TaskCompactHome=api'),'Tasks V3 must become the active overview implementation');
assert(overview.includes('optimisticOverviewCheck'),'Tasks V3 overview must paint completion immediately');
assert(detail.includes('window.TaskDetailPopup=api'),'Tasks V3 must become the active task popup implementation');
assert(detail.includes('applySubtaskState'),'Tasks V3 detail must update checkbox state without a full card rebuild');
assert(model.includes('Array.isArray(window.taskData)?window.taskData:[]'),'Tasks V3 model must read canonical taskData');
assert(polish.includes('tv3d-cleaning-manage'),'Tasks V3 polish must keep Cleaning management secondary');
assert(polish.includes('touch-action:manipulation'),'Tasks V3 checkbox controls must be optimized for touch');

console.log('Tasks modern v1 retirement / V3 responsive checkbox activation contract: PASS');