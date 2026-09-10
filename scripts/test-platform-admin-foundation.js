'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/platform/admin/platformAdminFoundation.js','utf8');
const rules=JSON.parse(fs.readFileSync('database.rules.json','utf8')).rules;
const loader=fs.readFileSync('api/app.js','utf8');

assert.ok(rules.platformAdmins,'platform admin registry must exist');
assert.strictEqual(rules.platformAdmins['.write'],false,'platform admin registry must not be client-writable');
assert.strictEqual(rules.platformAdmins.$uid['.write'],false,'a client must never self-elevate its own platform role');
assert.ok(String(rules.platformAdmins.$uid['.read']).includes('auth.uid === $uid'),'a user may only inspect their own platform role');
assert.ok(rules.platformOperations,'sanitized platform operations projection must have a dedicated root');
assert.strictEqual(rules.platformOperations['.write'],false,'normal clients may not write platform operations projections');
assert.ok(String(rules.platformOperations.households.$familyId['.read']).includes("child('platformAdmins')"),'operations reads must require protected platform authority');
assert.strictEqual(rules.platformAudit['.write'],false,'audit persistence must be server-only');
assert.ok(!JSON.stringify(rules.families).includes('platformAdmins'),'platform-admin status must not grant implicit family-content access');
assert.ok(!source.includes('currentUser.email'),'platform authority must not be based on email');
assert.ok(!source.includes('myName'),'platform authority must not be based on display name');
assert.ok(source.includes("database.ref('platformAdmins/'+uid).once('value')"),'client capability state must resolve from protected UID registry');
assert.ok(loader.includes('src/platform/admin/platformAdminFoundation.js?v=1'),'runtime must load the platform capability helper');

let registry=null;
let lastRef=null;
const operationsRaw={
  householdId:'family_alpha',
  memberCount:4,
  health:'healthy',
  moduleHealth:{tasks:'healthy',shopping:'healthy'},
  errorSummary:{code:'NONE',count:0},
  taskTitle:'private task title',
  amount:123.45,
  posts:['private feed post']
};
const fakeDb={
  ref(path){
    lastRef=path;
    return {
      once(){
        if(path==='platformAdmins/owner-uid')return Promise.resolve({val:()=>registry});
        if(path==='platformOperations/households/family_alpha')return Promise.resolve({val:()=>operationsRaw});
        return Promise.resolve({val:()=>null});
      }
    };
  }
};
const sandbox={
  console,
  Promise,
  Date,
  Object,
  Array,
  String,
  Error,
  RegExp,
  window:{
    fbDb:fakeDb,
    HouseholdContext:{snapshot:()=>({uid:'owner-uid',householdId:'family_alpha',ready:true,memberRole:'owner'})},
    addEventListener(){},
    dispatchEvent(){}
  }
};
vm.runInNewContext(source,sandbox,{filename:'platformAdminFoundation.js'});
const foundation=sandbox.window.PlatformAdminFoundation;
assert.ok(foundation,'platform admin foundation should register');

(async()=>{
  await foundation.refresh();
  assert.strictEqual(foundation.isPlatformAdmin(),false,'household owner/admin must not become platform admin without protected registry entry');
  assert.strictEqual(lastRef,'platformAdmins/owner-uid','platform role lookup must be UID-scoped');

  registry={uid:'owner-uid',role:'superadmin',status:'active'};
  await foundation.refresh();
  assert.strictEqual(foundation.isPlatformAdmin(),true,'active protected superadmin registry entry should grant platform capability');
  assert.strictEqual(foundation.has('platform.operations.read'),true,'superadmin should receive explicit platform operations permission');

  assert.strictEqual(foundation.privacy.classifyPath('families/family_beta/shared/tasks'),'household-content');
  assert.strictEqual(foundation.privacy.canReadByDefault('household-content'),false,'platform status must not make raw household content readable by default');
  assert.strictEqual(foundation.privacy.canReadByDefault('operational'),true,'sanitized operational projection is the normal platform surface');

  const sanitized=await foundation.readHouseholdOperations('family_alpha');
  assert.strictEqual(lastRef,'platformOperations/households/family_alpha');
  assert.strictEqual(sanitized.householdId,'family_alpha');
  assert.strictEqual(sanitized.memberCount,4);
  assert.strictEqual(sanitized.taskTitle,undefined,'task content must be absent from normal admin projection');
  assert.strictEqual(sanitized.amount,undefined,'financial amount content must be absent from normal admin projection');
  assert.strictEqual(sanitized.posts,undefined,'feed content must be absent from normal admin projection');

  const audit=foundation.audit.createEvent('support.case.opened',{
    targetHouseholdId:'family_alpha',
    reason:'Technical reproduction',
    metadata:{errorCode:'SYNC_TIMEOUT',taskTitle:'private title',amount:25}
  });
  assert.strictEqual(audit.actorUid,'owner-uid');
  assert.strictEqual(audit.metadata.errorCode,'SYNC_TIMEOUT');
  assert.strictEqual(audit.metadata.taskTitle,undefined,'audit metadata must not copy task content');
  assert.strictEqual(audit.metadata.amount,undefined,'audit metadata must not copy financial amounts');
  assert.strictEqual(foundation.audit.persistence,'server-only','privileged audit records must be persisted by server/admin tooling');

  console.log('platform admin identity/privacy contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
