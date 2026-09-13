#!/usr/bin/env node
'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync('src/modules/cleaning/cleaningCollaborationContract.js','utf8');
const sandbox={window:{},Date:Date,JSON:JSON,Error:Error,String:String,Number:Number,Array:Array,Object:Object,Math:Math};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'cleaningCollaborationContract.js'});
const contract=sandbox.window.CleaningCollaborationContract;
assert.ok(contract,'CleaningCollaborationContract must install');
assert.strictEqual(contract.version,'2.1.0');

const ACTIVE=['A','B','C'];
const ctx=(actor,timestamp,isManager)=>({actorUid:actor,activeUids:ACTIVE.slice(),timestamp:timestamp||1000,isManager:isManager===true});
const base=()=>({
  id:'occ-multi-1',roomId:'room-kitchen',status:'FLEXIBLE',assignmentStatus:'ACTIVE',
  assignmentUids:['A'],scheduledDate:'2026-09-14',scheduledTime:'',estimatedMinutes:35,
  checklist:[{id:'sink',completed:false},{id:'floor',completed:false}]
});
const assigned=row=>Array.from(row.assignmentUids||[]);

// A -> B transfer: canonical assignment stays with A until B explicitly accepts.
let aToB=contract.apply(base(),{type:'REQUEST_TRANSFER',toUid:'B'},ctx('A',1000));
assert.strictEqual(aToB.changed,true);
assert.strictEqual(aToB.occurrence.transferRequest.status,'PENDING');
assert.strictEqual(aToB.occurrence.transferRequest.fromUid,'A');
assert.strictEqual(aToB.occurrence.transferRequest.toUid,'B');
assert.deepStrictEqual(assigned(aToB.occurrence),['A']);
assert.strictEqual(aToB.projectionChanged,false);

// Same request is idempotent and must not bump state or assignment.
let aToBDuplicate=contract.apply(aToB.occurrence,{type:'REQUEST_TRANSFER',toUid:'B'},ctx('A',1001));
assert.strictEqual(aToBDuplicate.changed,false);
assert.deepStrictEqual(assigned(aToBDuplicate.occurrence),['A']);

// C cannot answer a request addressed to B.
assert.throws(()=>contract.apply(aToB.occurrence,{type:'ACCEPT_TRANSFER'},ctx('C',1010)),/CLEANING_COLLAB_NOT_RECIPIENT/);
assert.throws(()=>contract.apply(aToB.occurrence,{type:'DECLINE_TRANSFER'},ctx('C',1011)),/CLEANING_COLLAB_NOT_RECIPIENT/);

// B accepts: only now does assignment change and projection sync become required.
let bAccepts=contract.apply(aToB.occurrence,{type:'ACCEPT_TRANSFER'},ctx('B',1100));
assert.deepStrictEqual(assigned(bAccepts.occurrence),['B']);
assert.strictEqual(bAccepts.occurrence.transferRequest.status,'ACCEPTED');
assert.strictEqual(bAccepts.occurrence.transferRequest.acceptedByUid,'B');
assert.strictEqual(bAccepts.projectionChanged,true);

// B declines: original assignment remains A and no projection rewrite is required.
let bDeclines=contract.apply(aToB.occurrence,{type:'DECLINE_TRANSFER'},ctx('B',1110));
assert.deepStrictEqual(assigned(bDeclines.occurrence),['A']);
assert.strictEqual(bDeclines.occurrence.transferRequest.status,'DECLINED');
assert.strictEqual(bDeclines.projectionChanged,false);

// A can withdraw before B answers; B cannot then accept the withdrawn request.
let withdrawn=contract.apply(aToB.occurrence,{type:'WITHDRAW_TRANSFER'},ctx('A',1120));
assert.strictEqual(withdrawn.occurrence.transferRequest.status,'WITHDRAWN');
assert.deepStrictEqual(assigned(withdrawn.occurrence),['A']);
assert.throws(()=>contract.apply(withdrawn.occurrence,{type:'ACCEPT_TRANSFER'},ctx('B',1121)),/CLEANING_COLLAB_REQUEST_NOT_PENDING/);

// Counter to the original recipient B with a new date/time: A's acceptance finalizes B directly.
let counterToB=contract.apply(aToB.occurrence,{type:'COUNTER_TRANSFER',assigneeUid:'B',scheduledDate:'2026-09-16',scheduledTime:'19:15'},ctx('B',1200));
assert.strictEqual(counterToB.occurrence.transferRequest.status,'COUNTER_PROPOSED');
assert.deepStrictEqual(assigned(counterToB.occurrence),['A']);
let aAcceptsCounterB=contract.apply(counterToB.occurrence,{type:'ACCEPT_COUNTER'},ctx('A',1210));
assert.deepStrictEqual(assigned(aAcceptsCounterB.occurrence),['B']);
assert.strictEqual(aAcceptsCounterB.occurrence.scheduledDate,'2026-09-16');
assert.strictEqual(aAcceptsCounterB.occurrence.scheduledTime,'19:15');
assert.strictEqual(aAcceptsCounterB.occurrence.status,'SCHEDULED');
assert.strictEqual(aAcceptsCounterB.projectionChanged,true);
assert.ok(Number(aAcceptsCounterB.occurrence.scheduledStartAt)>0);
assert.ok(Number(aAcceptsCounterB.occurrence.scheduledEndAt)>Number(aAcceptsCounterB.occurrence.scheduledStartAt));

// A may reject B's counter; assignment must remain untouched.
let aDeclinesCounter=contract.apply(counterToB.occurrence,{type:'DECLINE_COUNTER'},ctx('A',1220));
assert.strictEqual(aDeclinesCounter.occurrence.transferRequest.status,'DECLINED');
assert.deepStrictEqual(assigned(aDeclinesCounter.occurrence),['A']);
assert.strictEqual(aDeclinesCounter.projectionChanged,false);

// Third-person counter B -> proposes C: A accepting the counter must NOT silently assign C.
let counterToC=contract.apply(aToB.occurrence,{type:'COUNTER_TRANSFER',assigneeUid:'C',scheduledDate:'2026-09-17',scheduledTime:'08:45'},ctx('B',1300));
let aAcceptsThirdPerson=contract.apply(counterToC.occurrence,{type:'ACCEPT_COUNTER'},ctx('A',1310));
assert.strictEqual(aAcceptsThirdPerson.retargeted,true);
assert.strictEqual(aAcceptsThirdPerson.occurrence.transferRequest.status,'PENDING');
assert.strictEqual(aAcceptsThirdPerson.occurrence.transferRequest.fromUid,'A');
assert.strictEqual(aAcceptsThirdPerson.occurrence.transferRequest.toUid,'C');
assert.strictEqual(aAcceptsThirdPerson.occurrence.transferRequest.counterAcceptedFromUid,'B');
assert.deepStrictEqual(assigned(aAcceptsThirdPerson.occurrence),['A'],'third person requires explicit consent');
assert.strictEqual(aAcceptsThirdPerson.projectionChanged,false);

// B is no longer the recipient after retarget; only C may answer.
assert.throws(()=>contract.apply(aAcceptsThirdPerson.occurrence,{type:'ACCEPT_TRANSFER'},ctx('B',1311)),/CLEANING_COLLAB_NOT_RECIPIENT/);
let cAccepts=contract.apply(aAcceptsThirdPerson.occurrence,{type:'ACCEPT_TRANSFER'},ctx('C',1320));
assert.deepStrictEqual(assigned(cAccepts.occurrence),['C']);
assert.strictEqual(cAccepts.occurrence.scheduledDate,'2026-09-17');
assert.strictEqual(cAccepts.occurrence.scheduledTime,'08:45');
assert.strictEqual(cAccepts.projectionChanged,true);

// Help stays a helper relationship, never a hidden multi-person assignment.
let helpAB=contract.apply(base(),{type:'REQUEST_HELP',toUid:'B'},ctx('A',2000));
assert.strictEqual(helpAB.occurrence.helpRequest.status,'PENDING');
assert.deepStrictEqual(assigned(helpAB.occurrence),['A']);
let helpDuplicate=contract.apply(helpAB.occurrence,{type:'REQUEST_HELP',toUid:'B'},ctx('A',2001));
assert.strictEqual(helpDuplicate.changed,false);
assert.throws(()=>contract.apply(helpAB.occurrence,{type:'ACCEPT_HELP'},ctx('C',2002)),/CLEANING_COLLAB_NOT_RECIPIENT/);
let bHelps=contract.apply(helpAB.occurrence,{type:'ACCEPT_HELP'},ctx('B',2010));
assert.strictEqual(bHelps.occurrence.helpRequest.status,'ACCEPTED');
assert.strictEqual(bHelps.occurrence.helpRequest.helperUid,'B');
assert.deepStrictEqual(assigned(bHelps.occurrence),['A']);
assert.strictEqual(bHelps.projectionChanged,false);
let bDeclinesHelp=contract.apply(helpAB.occurrence,{type:'DECLINE_HELP'},ctx('B',2020));
assert.strictEqual(bDeclinesHelp.occurrence.helpRequest.status,'DECLINED');
assert.deepStrictEqual(assigned(bDeclinesHelp.occurrence),['A']);
let aWithdrawsHelp=contract.apply(helpAB.occurrence,{type:'WITHDRAW_HELP'},ctx('A',2030));
assert.strictEqual(aWithdrawsHelp.occurrence.helpRequest.status,'WITHDRAWN');
assert.throws(()=>contract.apply(aWithdrawsHelp.occurrence,{type:'ACCEPT_HELP'},ctx('B',2031)),/CLEANING_COLLAB_REQUEST_NOT_PENDING/);

// Ownership/member/closed-occurrence boundaries protect cross-account actions.
assert.throws(()=>contract.apply(base(),{type:'REQUEST_TRANSFER',toUid:'C'},ctx('B',3000)),/CLEANING_COLLAB_NOT_OWNER/);
assert.throws(()=>contract.apply(base(),{type:'REQUEST_HELP',toUid:'C'},ctx('B',3001)),/CLEANING_COLLAB_NOT_OWNER/);
assert.throws(()=>contract.apply(base(),{type:'REQUEST_TRANSFER',toUid:'Z'},ctx('A',3002)),/CLEANING_COLLAB_MEMBER_REQUIRED/);
assert.throws(()=>contract.apply(base(),{type:'REQUEST_HELP',toUid:'A'},ctx('A',3003)),/CLEANING_COLLAB_SELF_HELP/);
assert.throws(()=>contract.apply(Object.assign(base(),{status:'COMPLETED',assignmentStatus:'COMPLETED'}),{type:'REQUEST_TRANSFER',toUid:'B'},ctx('A',3004)),/CLEANING_COLLAB_OCCURRENCE_CLOSED/);

// Manager override is explicit, but must still target an active member and cannot bypass consent.
let managerTransfer=contract.apply(base(),{type:'REQUEST_TRANSFER',toUid:'C'},ctx('B',3100,true));
assert.strictEqual(managerTransfer.occurrence.transferRequest.fromUid,'B');
assert.strictEqual(managerTransfer.occurrence.transferRequest.toUid,'C');
assert.deepStrictEqual(assigned(managerTransfer.occurrence),['A']);
assert.strictEqual(managerTransfer.occurrence.transferRequest.status,'PENDING');

// Invalid counter schedule never leaks through to a third client.
assert.throws(()=>contract.apply(aToB.occurrence,{type:'COUNTER_TRANSFER',assigneeUid:'B',scheduledDate:'16-09-2026',scheduledTime:'19:15'},ctx('B',3200)),/CLEANING_COLLAB_BAD_DATE/);
assert.throws(()=>contract.apply(aToB.occurrence,{type:'COUNTER_TRANSFER',assigneeUid:'B',scheduledDate:'2026-09-16',scheduledTime:'25:99'},ctx('B',3201)),/CLEANING_COLLAB_BAD_TIME/);

console.log('Cleaning V2.1 A/B/C multi-user collaboration matrix: PASS');
