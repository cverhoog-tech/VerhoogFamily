'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', 'cleaning', 'cleaningPlanApprovalUi.js'), 'utf8');
const context = {
  console,
  setInterval: () => 0,
  setTimeout: () => 0,
  clearInterval: () => {},
  CustomEvent: function CustomEvent(){},
  MutationObserver: function MutationObserver(){ this.observe = function observe(){}; },
  requestAnimationFrame: (callback) => callback(),
  addEventListener: () => {},
  document: {
    documentElement: {},
    head: { appendChild: () => {} },
    getElementById: () => null,
    createElement: () => ({ id:'', textContent:'', appendChild:() => {}, setAttribute:() => {} })
  },
  CleaningDomain: { basePath: (householdId) => 'families/' + householdId + '/cleaning' }
};
context.window = context;
vm.runInNewContext(source, context, {filename:'cleaningPlanApprovalUi.js'});

const api = context.CleaningPlanApprovalUi;
assert(api, 'approval API should be exposed');

function draftRoot(){
  return {
    plans: {
      week: {
        id:'week',
        householdId:'household-1',
        status:'DRAFT',
        occurrenceIds:['occurrence-a','occurrence-b'],
        createdByUid:'uid-a'
      }
    },
    occurrences: {
      'occurrence-a': {id:'occurrence-a', planId:'week', assignmentUids:['uid-a'], status:'DRAFT', assignmentStatus:'PROPOSED'},
      'occurrence-b': {id:'occurrence-b', planId:'week', assignmentUids:['uid-b'], status:'DRAFT', assignmentStatus:'PROPOSED'}
    }
  };
}

let root = api.proposeRoot(draftRoot(), 'week', 'uid-a', 'household-1', 1000);
assert.strictEqual(root.plans.week.status, 'PROPOSED');
assert.deepStrictEqual(Array.from(root.plans.week.requiredApprovalUids), ['uid-a','uid-b']);
assert.strictEqual(root.approvals['uid-a'].week.status, 'PENDING');
assert.strictEqual(root.approvals['uid-b'].week.status, 'PENDING');

root = api.acceptRoot(root, 'week', 'uid-a', 'household-1', 1100);
assert.strictEqual(root.plans.week.status, 'PARTIALLY_ACCEPTED');
assert.strictEqual(root.occurrences['occurrence-a'].assignmentStatus, 'ACCEPTED');
assert.strictEqual(root.occurrences['occurrence-b'].assignmentStatus, 'PROPOSED');

root = api.acceptRoot(root, 'week', 'uid-b', 'household-1', 1200);
assert.strictEqual(root.plans.week.status, 'ACTIVE');
assert.strictEqual(root.plans.week.approvalState, 'APPROVED');
assert.strictEqual(root.occurrences['occurrence-a'].assignmentStatus, 'ACTIVE');
assert.strictEqual(root.occurrences['occurrence-b'].assignmentStatus, 'ACTIVE');
assert.deepStrictEqual(root.occurrences['occurrence-a'].projections, undefined);

let rejected = api.proposeRoot(draftRoot(), 'week', 'uid-a', 'household-1', 2000);
rejected = api.declineRoot(rejected, 'week', 'uid-b', 'household-1', 2100);
assert.strictEqual(rejected.plans.week.approvalState, 'CHANGES_REQUESTED');
assert.strictEqual(rejected.approvals['uid-b'].week.status, 'DECLINED');

context.HouseholdIdentityFirebaseBridge = {
  getMembers: () => [{uid:'uid-a', role:'owner'}, {uid:'uid-b', role:'adult'}]
};
rejected = api.reopenRoot(rejected, 'week', 'uid-a', 'household-1', 2200);
assert.strictEqual(rejected.plans.week.status, 'DRAFT');
assert.strictEqual(rejected.occurrences['occurrence-a'].status, 'DRAFT');
assert.strictEqual(rejected.occurrences['occurrence-b'].status, 'DRAFT');

console.log('cleaning plan approval flow contract: ok');
