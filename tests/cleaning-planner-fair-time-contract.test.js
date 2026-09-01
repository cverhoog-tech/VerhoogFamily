'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function loadContract(){
  const window={};
  const sandbox={window,Object,String,Number,Error,Array,Math};
  vm.createContext(sandbox);
  const source=fs.readFileSync(path.join(__dirname,'../src/modules/cleaning/cleaningPlannerContract.js'),'utf8');
  vm.runInContext(source,sandbox,{filename:'cleaningPlannerContract.js'});
  return window.CleaningPlannerContract;
}

(function(){
  const planner=loadContract();
  const members=[
    {uid:'member-a',displayName:'A',status:'active',joinedAt:2},
    {uid:'member-b',displayName:'B',status:'active',joinedAt:1},
    {uid:'member-c',displayName:'C',status:'inactive',joinedAt:3},
    {id:'legacy-profile-only',displayName:'Legacy'}
  ];
  const bundles=[
    {bundleKey:'room:small',roomId:'small',estimatedMinutes:10,earliestDueAt:3,distributionMode:'FAIR_TIME'},
    {bundleKey:'room:big',roomId:'big',estimatedMinutes:30,earliestDueAt:1,distributionMode:'FAIR_TIME'},
    {bundleKey:'room:medium',roomId:'medium',estimatedMinutes:20,earliestDueAt:2,distributionMode:'FAIR_TIME'}
  ];
  const before=JSON.stringify({members,bundles});
  const result=planner.assignFairTime({members,bundles});

  assert.strictEqual(JSON.stringify({members,bundles}),before,'fair-time assignment must not mutate input');
  assert.deepStrictEqual(Array.from(result.members,x=>x.uid),['member-b','member-a'],'active canonical UIDs are ordered deterministically');
  assert.strictEqual(result.excludedMembers.length,2);
  assert.deepStrictEqual(Array.from(result.assignments,x=>x.bundleKey),['room:small','room:big','room:medium'],'output keeps canonical bundle order');
  assert.deepStrictEqual(Array.from(result.assignments,x=>x.assignedUid),['member-a','member-b','member-a']);
  assert.deepStrictEqual(Array.from(result.memberLoads,x=>x.estimatedMinutes),[30,30],'fairness uses minutes, not bundle count');
  assert.deepStrictEqual(Array.from(result.memberLoads,x=>x.bundleCount),[1,2]);
  assert.strictEqual(result.totalEstimatedMinutes,60);
  assert.strictEqual(result.imbalanceMinutes,0);
  assert.strictEqual(JSON.stringify(planner.assignFairTime({members,bundles})),JSON.stringify(result),'same snapshot must produce the same assignment');
  assert.strictEqual(Object.isFrozen(result.assignments),true);
  assert.strictEqual(Object.isFrozen(result.assignments[0].assignmentUids),true);

  assert.throws(()=>planner.selectEligibleHouseholdMembers([{uid:'same'},{uid:'same'}]),/CLEANING_PLANNER_DUPLICATE_MEMBER_UID/);
  assert.throws(()=>planner.assignFairTime({members:[],bundles:[bundles[0]]}),/CLEANING_PLANNER_ACTIVE_MEMBER_REQUIRED/);
  assert.throws(()=>planner.assignFairTime({members,bundles:[bundles[0],bundles[0]]}),/CLEANING_PLANNER_DUPLICATE_BUNDLE_KEY/);
  assert.throws(()=>planner.assignFairTime({members,bundles:[Object.assign({},bundles[0],{distributionMode:'MANUAL'})]}),/CLEANING_PLANNER_DISTRIBUTION_MODE_UNSUPPORTED/);

  console.log('cleaning-planner-fair-time-contract: ok');
})();
