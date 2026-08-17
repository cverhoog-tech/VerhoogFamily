'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
  let ctx={uid:'alpha-user',householdId:'alpha-household'},members=[{uid:'alpha-user',displayName:'Alpha',online:true,lastSeen:Date.now()},{uid:'alpha-two',displayName:'Alpha Two',online:false,lastSeen:Date.now()-1000}],updates=[];
  const listeners={};
  const window={
    HouseholdContext:{requireUser:()=>ctx.uid,requireHousehold:()=>ctx.householdId,assertContext:(t)=>{if(t.uid!==ctx.uid||t.householdId!==ctx.householdId){const e=new Error('changed');e.code='HOUSEHOLD_CONTEXT_CHANGED';throw e;}},isCurrent:(t)=>!!t&&t.uid===ctx.uid&&t.householdId===ctx.householdId},
    HouseholdIdentityFirebaseBridge:{getMembers:()=>members.slice(),updateOwnMemberProfile:(patch)=>new Promise(r=>setTimeout(()=>{updates.push({ctx:{...ctx},patch:{...patch}});r(true);},5)),sync:()=>true},
    addEventListener:(n,fn)=>{(listeners[n]||(listeners[n]=[])).push(fn);},dispatchEvent:()=>{},CustomEvent:function(){},localStorage:{setItem:()=>{}}
  };
  const sandbox={window,console,CustomEvent:function(){}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('src/modules/profile/profileContextService.js','utf8'),sandbox);
  const svc=window.ProfileContextService;assert.equal(svc.getCurrentMember().displayName,'Alpha');assert.equal(svc.getPresence('alpha-user').state,'online');
  await svc.updateName('Alpha Nieuw');assert.equal(updates.length,1);assert.equal(updates[0].patch.name,'Alpha Nieuw');
  const pending=svc.updateName('Mag niet lekken');ctx={uid:'beta-user',householdId:'beta-household'};members=[{uid:'beta-user',displayName:'Beta',online:true,lastSeen:Date.now()}];
  let rejected=false;try{await pending;}catch(e){rejected=e&&e.code==='PROFILE_CONTEXT_CHANGED';}assert.equal(rejected,true,'Profile update must reject after context switch');assert.equal(svc.getCurrentMember().displayName,'Beta');
  console.log('profile context rebind OK');
})().catch(e=>{console.error(e);process.exit(1);});
