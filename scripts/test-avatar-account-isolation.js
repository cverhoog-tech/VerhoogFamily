'use strict';
const fs=require('fs');
const assert=require('assert');
const appHandler=require('../api/app.js');

function read(path){return fs.readFileSync(path,'utf8');}
function scripts(html){const out=[];const re=/<script[^>]+src=["']([^"']+)["'][^>]*>/g;let m;while((m=re.exec(html)))out.push(m[1]);return out;}
function indexOfScript(list,prefix){return list.findIndex((value)=>String(value).startsWith(prefix));}

const avatarStore=read('src/modules/profile/avatarStore.js');
const avatarBridge=read('src/core/avatarIdentityBridge.js');
const firebaseBridge=read('src/core/householdIdentityFirebaseBridge.js');
const legacyBridge=read('src/core/legacyProfileUidBridge.js');
const loader=read('api/app.js');

assert.ok(avatarStore.includes("const scopedAvatarBase = 'familyapp-current-user-avatar-v2'"),'authenticated avatar storage must have a UID-scoped key');
assert.ok(avatarStore.includes("const scopedAvatarIdBase = 'familyapp-current-user-avatar-id-v2'"),'authenticated avatar selection must have a UID-scoped id key');
assert.ok(avatarStore.includes('detail: { uid: uid || null, id, url }'),'preset avatar events must carry the authenticated UID');
assert.ok(avatarStore.includes("detail: { uid: uid || null, id: 'upload', url: dataUrl }"),'uploaded avatar events must carry the authenticated UID');
assert.ok(avatarStore.includes('storedScopedAvatar(uid) || memberAvatar(uid) || authAvatar(uid)'),'authenticated avatar resolution must avoid unscoped legacy avatar authority');

assert.ok(avatarBridge.includes("version:'2.0.1'"),'served avatar identity bridge must use the UID-safe contract');
assert.ok(avatarBridge.includes('window.__familyAvatarIdentityBridge = true'),'new bridge must block a stale cached v1 bridge from running afterwards');
assert.ok(avatarBridge.includes("SCOPED_AVATAR_BASE = 'familyapp-current-user-avatar-v2'"),'avatar bridge must resolve the active UID from scoped storage');
assert.ok(!avatarBridge.includes('syncActiveLegacyToIdentity'),'authenticated identity must never copy the unscoped legacy avatar into a new active UID');
assert.ok(avatarBridge.includes("window.addEventListener('familyapp:household-context'"),'avatar presentation must refresh on UID/household changes');

assert.ok(firebaseBridge.includes("version:'5.0.1'"),'Firebase identity bridge must use the UID-safe migration contract');
assert.ok(firebaseBridge.includes('window.__householdIdentityFirebaseBridgeV4 = true'),'new Firebase bridge must block stale cached v4 execution');
assert.ok(firebaseBridge.includes("familyapp-current-user-avatar-v2"),'Firebase profile projection/migration must use UID-scoped avatar state');
assert.ok(!firebaseBridge.includes("localStorage.getItem('familyapp-current-user-avatar-v1')"),'Firebase member migration must never read an unscoped avatar as current-user authority');
assert.ok(firebaseBridge.includes("if(detail.uid&&String(detail.uid)!==String(ctx.uid))return"),'avatar writes for another UID must be rejected');

assert.ok(legacyBridge.includes("version:'1.0.0'"),'legacy compatibility bridge must be present');
assert.ok(legacyBridge.includes("avatar:'familyapp-current-user-avatar-v2'"),'legacy compatibility projection must preserve per-UID avatars');
assert.ok(legacyBridge.includes("window.addEventListener('familyapp:household-context'"),'legacy compatibility projection must follow account switches');

assert.ok(loader.includes('avatarIdentityBridge.js?v=2'),'served runtime must cache-bust the UID-safe avatar bridge');
assert.ok(loader.includes('householdIdentityFirebaseBridge.js?v=5'),'served runtime must cache-bust the UID-safe Firebase identity bridge');
assert.ok(loader.includes('legacyProfileUidBridge.js?v=1'),'served runtime must load the per-UID legacy compatibility projection');

(async function(){
  let body='';
  const res={setHeader(){},status(){return this;},send(value){body=String(value);return this;}};
  await appHandler({},res);
  const list=scripts(body);
  const avatarIndex=indexOfScript(list,'src/core/avatarIdentityBridge.js?v=2');
  const firebaseIndex=indexOfScript(list,'src/core/householdIdentityFirebaseBridge.js?v=5');
  const profileIndex=indexOfScript(list,'src/core/profile.legacy.js');
  const contextIndex=indexOfScript(list,'src/core/householdContext.js');
  const legacyIndex=indexOfScript(list,'src/core/legacyProfileUidBridge.js?v=1');
  assert.ok(avatarIndex>=0&&firebaseIndex>=0&&profileIndex>=0,'avatar/profile runtime scripts must all be served');
  assert.ok(avatarIndex<profileIndex&&firebaseIndex<profileIndex,'UID-safe bridges must claim stale-cache guards before legacy profile bootstrap');
  assert.ok(contextIndex>=0&&legacyIndex>contextIndex,'legacy UID projection must load after HouseholdContext exists');
  console.log('profile avatar account isolation contract: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});
