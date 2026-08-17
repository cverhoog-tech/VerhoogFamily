'use strict';
const fs=require('fs');
const assert=require('assert');

const readiness=fs.readFileSync('src/modules/tasks/taskCreateReadinessFix.js','utf8');
const boundary=fs.readFileSync('src/modules/tasks/taskContextBoundary.js','utf8');
const app=fs.readFileSync('api/app.js','utf8');

assert(readiness.includes('HouseholdContext'),'task create readiness must depend on HouseholdContext');
assert(!readiness.includes('fbFamilyId'),'task create readiness must not resolve household from fbFamilyId');
assert(!readiness.includes('fbUser'),'task create readiness must not resolve identity from fbUser');
assert(!readiness.includes('FamilyHousehold.resolve'),'task create readiness must not run a parallel household resolver');
assert(boundary.includes("TASK_CONTEXT_CHANGED"),'task mutations must expose stale-context cancellation');
assert(boundary.includes("requireUser"),'task boundary must require authenticated UID');
assert(boundary.includes("requireHousehold"),'task boundary must require household scope');
assert(app.indexOf('taskContextBoundary.js?v=1')>app.indexOf('taskSharedData.js?v=2'),'task boundary must load after TaskSharedData');
assert(app.includes('taskCreateReadinessFix.js?v=3'),'runtime must load HouseholdContext-based readiness v3');

console.log('task-context-adoption: PASS');
