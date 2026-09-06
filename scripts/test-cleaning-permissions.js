#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(ROOT, 'src/modules/cleaning/cleaningPermissions.js');
const source = fs.readFileSync(SOURCE_PATH, 'utf8');
let failed = false;

function fail(message){failed=true;console.error('FAIL: '+message);}
function ok(message){console.log('OK: '+message);}
function assert(value,message){if(!value)fail(message);}
async function rejects(promise,message){try{await promise;fail(message+' (resolved unexpectedly)');}catch(error){assert(error&&error.code==='CLEANING_PERMISSION_DENIED',message+' (wrong error: '+(error&&error.message)+')');}}

async function main(){
  let currentRole='owner';
  const calls=[];
  const routines={
    r1:{id:'r1',title:'Stofzuigen',intervalDays:7,estimatedMinutes:15,priority:'NORMAL',roomId:'room1',supplyIds:['s1'],assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u1'},
    r2:{id:'r2',title:'Dweilen',intervalDays:14,estimatedMinutes:20,priority:'NORMAL',roomId:'room1',supplyIds:[],assignmentMode:'FIXED_PERSON',assignmentRequestStatus:'ACCEPTED',preferredAssigneeUid:'u2'}
  };
  const repo={
    snapshot:()=>({ready:true,data:{routines:routines}}),
    createRoom:async()=>{calls.push('createRoom');return true;},
    updateRoom:async()=>true,removeRoom:async()=>true,createRoutineItem:async()=>true,removeRoutineItem:async()=>true,
    updateRoutineItem:async(id,input)=>{calls.push('updateRoutineItem:'+id);return input;},
    saveDraftPlan:async()=>{calls.push('saveDraftPlan');return true;},
    setUserPreferences:async()=>{calls.push('setUserPreferences');return true;},
    createSupply:async()=>{calls.push('repoCreateSupply');return true;},setSupplyStatus:async()=>true
  };
  const routineExperience={proposeCounter:async()=>true,resolveRequest:async()=>{calls.push('resolveRequest');return true;},resolveCounter:async()=>true};
  const availability={setMemberUnavailable:async()=>true,setMemberAvailable:async()=>true,setHouseholdMode:async()=>true,clearHouseholdMode:async()=>true};
  const supplies={createSupply:async()=>{calls.push('createSupply');return true;},setSupplyStatus:async()=>true};
  const pause={pauseRoutine:async(id)=>{calls.push('pauseRoutine:'+id);return true;},resumeRoutine:async()=>true,pauseRoom:async()=>true,resumeRoom:async()=>true};
  const noop=()=>{};
  const document={
    documentElement:{},
    addEventListener:noop,
    querySelectorAll:()=>[],
    getElementById:()=>null
  };
  function MutationObserver(){this.observe=noop;}
  const sandbox={
    console,
    Promise,
    setTimeout:()=>1,
    clearTimeout:noop,
    setInterval:()=>1,
    clearInterval:noop,
    requestAnimationFrame:(fn)=>{fn();return 1;},
    MutationObserver,
    document,
    CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;},
    HouseholdContext:{snapshot:()=>({ready:true,uid:'u1',householdId:'h1',revision:1})},
    HouseholdIdentityFirebaseBridge:{getMembers:()=>[{uid:'u1',role:currentRole,status:'active',name:'Tester'}]},
    CleaningHouseholdRepository:repo,
    CleaningRoutineExperience:routineExperience,
    CleaningAvailabilityExperience:availability,
    CleaningSupplyExperience:supplies,
    CleaningPauseExperience:pause,
    addEventListener:noop,
    dispatchEvent:noop,
    showToast:noop
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'cleaningPermissions.js'});

  const permissions=sandbox.CleaningPermissions;
  assert(!!permissions,'CleaningPermissions global must install');
  assert(permissions._normalizeRole('owner')===permissions.ROLE.MANAGER,'owner maps to MANAGER');
  assert(permissions._normalizeRole('admin')===permissions.ROLE.MANAGER,'admin maps to MANAGER');
  assert(permissions._normalizeRole('adult')===permissions.ROLE.MEMBER,'adult maps to MEMBER');
  assert(permissions._normalizeRole('member')===permissions.ROLE.MEMBER,'member maps to MEMBER');
  assert(permissions._normalizeRole('child')===permissions.ROLE.LIMITED,'child maps to LIMITED');
  assert(permissions._normalizeRole('restricted')===permissions.ROLE.LIMITED,'restricted maps to LIMITED');

  let caps=permissions.capabilities(permissions.ROLE.MANAGER);
  assert(caps.STRUCTURE&&caps.PLANNING&&caps.ASSIGNMENTS&&caps.HOUSEHOLD_AVAILABILITY,'manager has structural/planning/assignment/household controls');
  caps=permissions.capabilities(permissions.ROLE.MEMBER);
  assert(!caps.STRUCTURE&&caps.PLANNING&&caps.ASSIGNMENTS&&caps.AVAILABILITY&&caps.SUPPLIES,'member can plan/transfer/availability/supplies but not structure');
  caps=permissions.capabilities(permissions.ROLE.LIMITED);
  assert(!caps.STRUCTURE&&!caps.PLANNING&&!caps.ASSIGNMENTS&&!caps.SUPPLIES&&caps.EXECUTION&&caps.RESPOND&&caps.HELP,'limited profile only keeps execution/respond/help plus personal preferences');
  if(!failed)ok('household roles map to the intended Cleaning capability matrix');

  currentRole='owner';
  await repo.createRoom({name:'Badkamer'});
  assert(calls.includes('createRoom'),'manager can execute structural repository writes');

  currentRole='adult';
  await rejects(repo.createRoom({name:'Keuken'}),'member must not create rooms');
  await repo.saveDraftPlan({});
  assert(calls.includes('saveDraftPlan'),'member can generate/save a concept week plan');
  await repo.updateRoutineItem('r1',{title:'Stofzuigen',intervalDays:7,estimatedMinutes:15,priority:'NORMAL',roomId:'room1',supplyIds:['s1'],preferredAssigneeUid:'u2'});
  await rejects(repo.updateRoutineItem('r1',{title:'Stofzuigen grondig',intervalDays:7,estimatedMinutes:15,priority:'NORMAL',roomId:'room1',supplyIds:['s1']}),'member must not change structural routine fields');
  await supplies.createSupply('Allesreiniger');
  await pause.pauseRoutine('r1',3);
  await rejects(pause.pauseRoutine('r2',3),'member may only manually pause an accepted routine owned by themselves');
  if(!failed)ok('member writer guards preserve planning/transfer/operational powers without structural mutation');

  currentRole='child';
  await rejects(repo.saveDraftPlan({}),'limited profile must not generate household plans');
  await rejects(supplies.createSupply('Doekjes'),'limited profile must not change Cleaning supplies');
  await rejects(routineExperience.proposeCounter('r1','u2'),'limited profile must not start a counterproposal');
  await routineExperience.resolveRequest('r1',true);
  await repo.setUserPreferences({displayMode:'TIME'});
  assert(calls.includes('resolveRequest')&&calls.includes('setUserPreferences'),'limited profile can answer requests and keep personal display preferences');
  if(!failed)ok('limited profile retains assigned-work/request capabilities while management actions are denied');

  assert(!/\.ref\s*\(/.test(source),'permission layer must never become a direct Firebase writer');
  const bootstrap=fs.readFileSync(path.join(ROOT,'src/modules/cleaning/cleaningExperienceBootstrap.js'),'utf8');
  const inboxBootstrap=fs.readFileSync(path.join(ROOT,'src/platform/inbox/actionInboxBootstrap.js'),'utf8');
  assert(bootstrap.includes("import './cleaningPermissions.js?v=1'"),'Cleaning bootstrap must load the permission policy');
  assert(inboxBootstrap.includes("cleaningPermissions.js?v=1"),'Action Inbox bootstrap must load permissions before eager Cleaning runtimes');
  assert(inboxBootstrap.indexOf('cleaningPermissions.js?v=1')<inboxBootstrap.indexOf('cleaningHouseholdRepository.js?v=7'),'Action Inbox must load permissions before Cleaning repository');
  if(!failed)ok('permission policy is writer-free and reachable before both Cleaning runtime paths');

  const rules=fs.readFileSync(path.join(ROOT,'database.rules.json'),'utf8');
  assert(rules.includes('"$sharedData"'),'current Firebase rules broad shared-data boundary remains explicit');
  assert(source.includes('server-side enforcement')&&source.includes('Production Firebase Rules are deliberately NOT changed/deployed here.'),'client policy must document the still-open server-rule security boundary');
  if(!failed)ok('server-side Firebase rule hardening is explicitly separated from this client functional milestone');

  if(failed){console.error('\nCleaning permissions contract FAILED.');process.exitCode=1;}
  else console.log('\nCleaning permissions contract PASSED.');
}

main().catch((error)=>{console.error(error);process.exitCode=1;});
