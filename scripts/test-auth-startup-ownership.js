'use strict';
const fs=require('fs');
const assert=require('assert');
const appHandler=require('../api/app.js');

function read(path){return fs.readFileSync(path,'utf8');}
function count(haystack,needle){return haystack.split(needle).length-1;}
function scripts(html){const out=[];const re=/<script[^>]+src=["']([^"']+)["'][^>]*>/g;let m;while((m=re.exec(html)))out.push(m[1]);return out;}
function indexOfScript(list,prefix){return list.findIndex(x=>String(x).startsWith(prefix));}

const controller=read('src/core/authenticatedSessionController.js');
const duo=read('src/modules/tasks/duoQuests.js');
const google=read('src/core/googleAuthMobileFix.js');
const household=read('src/core/householdPlatform.js');
const onboarding=read('src/core/householdOnboardingBridge.js');
const taskReady=read('src/modules/tasks/taskCreateReadinessFix.js');
const loader=read('api/app.js');

assert.strictEqual(count(controller,'.onAuthStateChanged('),1,'session controller must own exactly one Firebase auth observer');
assert.strictEqual(count(duo,'.onAuthStateChanged('),0,'duoQuests must not own auth state');
assert.strictEqual(count(taskReady,'.onAuthStateChanged('),0,'task readiness must consume SessionController instead of observing auth');
assert.strictEqual(count(google,'loadUserFamily'),0,'Google sign-in adapter must not resolve household');
assert.strictEqual(count(google,'onLoggedIn'),0,'Google sign-in adapter must not reveal/start app');
assert.strictEqual(count(google,'recoverExistingSession'),0,'Google sign-in adapter must not own existing-session bootstrap');
assert.ok(google.includes('AuthenticatedSessionController'),'Google adapter must hand successful popup auth to the canonical session controller');
assert.ok(google.includes('acceptAuthenticatedUser'),'Google adapter must use the explicit canonical post-auth handoff');
assert.ok(controller.includes('acceptAuthenticatedUser'),'session controller must expose an explicit authenticated-user handoff');
assert.ok(controller.includes('bootstrapPromise')&&controller.includes('bootstrapUid'),'session controller must dedupe same-UID in-flight bootstrap races');
assert.ok(taskReady.includes('AuthenticatedSessionController.whenAuthenticated'),'task readiness must use canonical session readiness');
assert.ok(loader.includes('authenticatedSessionController.js?v=4'),'runtime loader must include current canonical session controller');
assert.ok(loader.includes('googleAuthMobileFix.js?v=3'),'runtime loader must include the current Google auth adapter');
assert.ok(loader.includes('householdPlatform.js?v=3'),'runtime loader must include canonical household platform');
assert.ok(loader.includes('householdOnboardingBridge.js?v=1'),'runtime loader must include deterministic household onboarding bridge');
assert.ok(loader.includes('authTimingDiagnostics.js?v=1'),'runtime loader must include the fix #7 AuthTiming diagnostics module');
assert.ok(loader.includes('authTimingDebugViewer.js?v=1'),'runtime loader must include the fix #7 AuthTiming debug viewer (?authdebug=1)');
assert.ok(loader.includes('familyapp-profile-name-v1'),'runtime loader must explicitly retire the old localStorage reveal signature');
assert.ok(controller.includes("window.useOfflineMode=function()"),'guest/offline login must be retired at the session boundary');
assert.ok(controller.includes("state='recoverableError'")||controller.includes("setState('recoverableError'"),'startup failures must have a recoverable visible state');
assert.ok(controller.includes('HOUSEHOLD_REQUIRED'),'new authenticated accounts without a household must enter onboarding');
assert.ok(controller.includes('HOUSEHOLD_ACCESS_REQUIRED'),'stale/inaccessible household pointers must enter safe re-onboarding');
assert.ok(controller.includes('generation'),'controller must guard stale async bootstrap generations');
assert.ok(household.includes("throw new Error('HOUSEHOLD_REQUIRED')"),'household resolver must emit explicit missing-household contract');
assert.ok(onboarding.includes('platform.resolve()'),'onboarding bridge must delegate household resolution to FamilyHousehold');
assert.ok(onboarding.includes('HOUSEHOLD_ACCESS_REQUIRED'),'permission-denied stale membership must be normalized to safe re-onboarding');
assert.ok(onboarding.includes('platform.showOnboarding()'),'setup route must open household create/join chooser');

(async function(){
  let body='';
  const res={setHeader(){},status(){return this;},send(value){body=String(value);return this;}};
  await appHandler({},res);
  const list=scripts(body);
  const duoIndex=indexOfScript(list,'src/modules/tasks/duoQuests.js');
  const diagnosticsIndex=indexOfScript(list,'src/core/authTimingDiagnostics.js');
  const viewerIndex=indexOfScript(list,'src/core/authTimingDebugViewer.js');
  const googleIndex=indexOfScript(list,'src/core/googleAuthMobileFix.js');
  const householdIndex=indexOfScript(list,'src/core/householdPlatform.js');
  const bridgeIndex=indexOfScript(list,'src/core/householdOnboardingBridge.js');
  const controllerIndex=indexOfScript(list,'src/core/authenticatedSessionController.js');
  const contextIndex=indexOfScript(list,'src/core/householdContext.js');
  [duoIndex,diagnosticsIndex,viewerIndex,googleIndex,householdIndex,bridgeIndex,controllerIndex,contextIndex].forEach((idx)=>assert.ok(idx>=0,'canonical auth/household runtime script must be served'));
  assert.ok(duoIndex<diagnosticsIndex,'Firebase/legacy compatibility bootstrap must load before AuthTiming diagnostics');
  assert.ok(diagnosticsIndex<viewerIndex,'AuthTiming diagnostics must load before the debug viewer that reads its marks');
  assert.ok(viewerIndex<googleIndex,'fix #7 AuthTiming debug viewer must load before the Google adapter so it can catch T0');
  assert.ok(googleIndex<householdIndex,'Google adapter must be installed before household resolution starts');
  assert.ok(householdIndex<bridgeIndex,'FamilyHousehold must exist before deterministic onboarding bridge');
  assert.ok(bridgeIndex<controllerIndex,'household resolver/setup overrides must be installed before auth observer starts');
  assert.ok(controllerIndex<contextIndex,'HouseholdContext must consume canonical session controller');
  console.log('auth startup + household onboarding ownership contract: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});
