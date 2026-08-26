'use strict';
const fs=require('fs');
const assert=require('assert');
const appHandler=require('../api/app.js');

function read(path){return fs.readFileSync(path,'utf8');}
function scripts(html){const out=[];const re=/<script[^>]+src=["']([^"']+)["'][^>]*>/g;let m;while((m=re.exec(html)))out.push(m[1]);return out;}
function indexOfScript(list,prefix){return list.findIndex((value)=>String(value).startsWith(prefix));}

const actions=read('src/core/sessionActions.js');
const avatarStore=read('src/modules/profile/avatarStore.js');
const profileScreen=read('src/modules/profile/ProfileScreen.target.js');
const profileBridge=read('src/core/profile.legacy.js');
const loader=read('api/app.js');

assert.ok(actions.includes("version:'1.1.0'"),'session actions must expose the current logout contract');
assert.ok(actions.includes('instance.signOut()'),'logout must delegate to Firebase Auth signOut');
assert.strictEqual((actions.match(/onAuthStateChanged/g)||[]).length,0,'logout action must not create a second auth observer');
assert.ok(actions.includes("id='more-logout-btn'")||actions.includes("button.id='more-logout-btn'"),'More menu must receive an Uitloggen action');
assert.ok(actions.includes("<span>Uitloggen</span>"),'More menu logout must be visibly labelled');
assert.ok(actions.includes('MutationObserver'),'More logout must survive dynamic More-menu rerenders');

assert.ok(avatarStore.includes("familyapp-profile-name-v2"),'authenticated profile names must use a UID-scoped key');
assert.ok(avatarStore.includes("familyapp-partner-name-v2"),'authenticated partner names must use a UID-scoped key');
assert.ok(avatarStore.includes('export function setProfileNames'),'profile screen must use one scoped write boundary');
assert.ok(!avatarStore.includes("return localStorage.getItem(nameKey) || 'Shane'"),'new accounts must not fall back to Shane');
assert.ok(!avatarStore.includes("return localStorage.getItem(partnerKey) || 'Esra'"),'new accounts must not fall back to Esra');
assert.ok(avatarStore.includes("if (uid) return String(localStorage.getItem(scopedKey(scopedPartnerBase, uid)) || '').trim()"),'authenticated partner fallback must be empty/current-UID only');

assert.ok(profileScreen.includes("from './avatarStore.js?v=profile2'"),'profile screen must cache-bust the corrected account-scoped store');
assert.ok(profileScreen.includes('setProfileNames(nameInput.value.trim(), partnerInput.value.trim())'),'profile save must use scoped profile storage');
assert.ok(!profileScreen.includes("nameInput.value.trim() || 'Shane'"),'profile save must not inject Shane');
assert.ok(!profileScreen.includes("partnerInput.value.trim() || 'Esra'"),'profile save must not inject Esra');
assert.ok(profileScreen.includes('data-profile-logout'),'Profile must expose an Uitloggen action');
assert.ok(profileScreen.includes('window.FamilySessionActions.signOut()'),'Profile logout must use the shared session action');
assert.ok(profileScreen.includes('placeholder="Optioneel"'),'partner field must be empty/optional for accounts without a configured partner');
assert.ok(profileScreen.includes('function getActiveAuthEmail()'),'Profile must resolve the active auth email from Firebase Auth');
assert.ok(profileScreen.includes('window.fbAuth && window.fbAuth.currentUser'),'active account email must prefer the current Firebase Auth user');
assert.ok(profileScreen.includes('data-active-auth-email'),'Profile must visibly expose the active account identity');
assert.ok(profileScreen.includes('Actief account'),'active auth email must have a clear user-facing label');
assert.ok(profileBridge.includes('ProfileScreen.target.js?v=account3'),'profile bridge must cache-bust the active-account profile UI');

assert.ok(loader.includes('sessionActions.js?v=1'),'served runtime must load session actions before interactive navigation');
assert.ok(!loader.includes('src/app/freshStartReset.js'),'Verse start must no longer be part of the served runtime');

(async function(){
  let body='';
  const res={setHeader(){},status(){return this;},send(value){body=String(value);return this;}};
  await appHandler({},res);
  const list=scripts(body);
  const actionsIndex=indexOfScript(list,'src/core/sessionActions.js');
  const profileIndex=indexOfScript(list,'src/core/profile.legacy.js');
  const navIndex=indexOfScript(list,'src/core/navigation.js');
  assert.ok(actionsIndex>=0,'session actions must be present in actual served HTML');
  assert.ok(profileIndex>=0&&navIndex>=0,'profile/navigation must still be served');
  assert.ok(actionsIndex<profileIndex&&actionsIndex<navIndex,'session actions must exist before Profile and More interactions');
  assert.strictEqual(indexOfScript(list,'src/app/freshStartReset.js'),-1,'actual served HTML must not load Verse start reset');
  console.log('profile identity + active auth email + logout + More-menu contract: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});