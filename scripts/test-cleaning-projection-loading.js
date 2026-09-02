'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const templates=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningRoutineTemplates.js'),'utf8');
assert.ok(templates.includes("import './cleaningPlanApprovalUi.js?v=1';"));
assert.ok(templates.includes("import './cleaningProjectionService.js?v=1';"));
assert.ok(templates.indexOf('cleaningPlanApprovalUi.js?v=1') < templates.indexOf('cleaningProjectionService.js?v=1'));
console.log('cleaning projection loading: ok');
