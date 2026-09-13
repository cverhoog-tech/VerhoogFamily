'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

function read(path){return fs.readFileSync(path,'utf8');}
function section(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'expected source section '+start);
  return source.slice(a,b);
}

const source=read('src/core/householdPlatform.js');
const rules=JSON.parse(read('database.rules.json')).rules;
new vm.Script(source,{filename:'householdPlatform.js'});

const create=section(source,'function createHousehold(opts){','function ensureLegacyMembership');
const metaWrite="d.ref('families/'+hid+'/meta').set(meta)";
const memberWrite="d.ref('families/'+hid+'/members/'+u.uid).set(member)";
const userWrite="d.ref('users/'+u.uid).update(userUpdates)";
assert.ok(create.includes(metaWrite),'household create must write meta first');
assert.ok(create.includes(memberWrite),'household create must create owner membership');
assert.ok(create.includes(userWrite),'household create must update the user only after membership exists');
assert.ok(create.indexOf(metaWrite)<create.indexOf(memberWrite),'meta must be persisted before owner membership');
assert.ok(create.indexOf(memberWrite)<create.indexOf(userWrite),'owner membership must exist before user pointers');
assert.ok(!create.includes("updates['users/'+u.uid]"),'create must not combine the user ancestor path with descendant household paths');
assert.ok(!create.includes('return d.ref().update(updates)'),'create must not use the old overlapping root multi-location update');
assert.ok(create.includes("userUpdates['households/'+hid]"),'user household pointer must be written relative to users/{uid}');
assert.ok(create.includes("role:'owner',status:'active'"),'new household creator must remain active owner');
assert.ok(create.includes("cleanup['families/'+hid+'/meta']=null")&&create.includes("cleanup['families/'+hid+'/members/'+u.uid]=null"),'failed user-pointer write must best-effort roll back only the newly created household');
assert.ok(create.includes('startPresence(hid)'),'presence must start only after the persistent create chain succeeds');

const userRules=rules.users['$uid'];
assert.strictEqual(rules['.write'],false,'root database writes must remain denied by default');
assert.ok(userRules.activeHouseholdId['.validate'].includes("child('members')")&&userRules.activeHouseholdId['.validate'].includes("child('status').val() === 'active'"),'active household pointer must still require an active family membership');
assert.ok(userRules.households['$familyId']['.validate'].includes("child('members')")&&userRules.households['$familyId']['.validate'].includes("child('status').val() === 'active'"),'household index pointer must still require an active family membership');
const memberWriteRule=rules.families['$familyId'].members['$memberUid']['.write'];
assert.ok(memberWriteRule.includes("newData.child('role').val() === 'owner'")&&memberWriteRule.includes("newData.child('status').val() === 'active'")&&memberWriteRule.includes("child('meta').child('ownerUid').val() === auth.uid"),'owner bootstrap rule must remain strict and depend on prior meta ownership');

const createUi=section(source,'function showCreate(){','function showJoin(){');
assert.ok(createUi.includes('if(b.disabled)return'),'create UI must reject duplicate submits while a create is pending');
assert.ok(createUi.includes('Promise.resolve().then(function(){return createHousehold({name:name});})'),'create UI must convert synchronous create errors into the promise error path');
assert.ok(createUi.includes("b.disabled=false")&&createUi.includes("'Aanmaken mislukt.'"),'create UI must re-enable the button and show a readable error');

assert.ok(source.includes('function createInvite(role){'),'invite creation flow must remain present');
assert.ok(source.includes('function completeMembership(hid,role,code){'),'membership completion flow must remain present');
assert.ok(source.includes('function joinHousehold(code){'),'join flow must remain present');
assert.ok(source.includes('window.FamilyHousehold={create:createHousehold,resolve:resolveHousehold,createInvite:createInvite,inspectInvite:inspectInvite,join:joinHousehold'),'public household/invite/join surface must remain wired');

console.log('household create + onboarding regression contract: PASS');
