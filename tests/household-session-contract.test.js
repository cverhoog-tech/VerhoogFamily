'use strict';
const fs=require('fs');
const path=require('path');

function read(rel){return fs.readFileSync(path.join(process.cwd(),rel),'utf8');}
function must(source,pattern,label){if(!pattern.test(source)){throw new Error('Missing contract: '+label);}}
function mustNot(source,pattern,label){if(pattern.test(source)){throw new Error('Forbidden contract: '+label);}}

const session=read('src/core/householdSessionHardening.js');
const bridge=read('src/core/householdIdentityFirebaseBridge.js');
const app=read('api/app.js');

// Session lifecycle must explicitly own and detach the legacy household listener.
must(session,/syncRef\.off\('value',syncHandler\)/,'legacy family value listener is detached');
must(session,/currentUid\(\)!==uid\s*\|\|\s*currentHousehold\(\)!==hid/,'late family callbacks are context-guarded');
must(session,/stopBoundContext\(/,'old bound context has a dedicated cleanup path');
must(session,/clearRuntimeState\(\)/,'shared runtime state is cleared on auth/session teardown');

// Logout/account-switch must clean identity + presence context.
must(session,/detachIdentity\(\)/,'identity bridge detached during session cleanup');
must(session,/stopPresence\(/,'presence cleanup exists');
must(session,/auth-account-switch/,'account switch cleanup is explicit');
must(session,/auth-signed-out/,'signed-out cleanup is explicit');

// Modern households require an active membership; stale pointers are removed.
must(session,/member\.status\s*!==\s*'active'/,'active membership gate exists');
must(session,/HOUSEHOLD_ACCESS_REVOKED/,'revoked membership has explicit error state');
must(session,/activeHouseholdId'\]=null|activeHouseholdId.*null/,'stale active household pointer is cleared');

// Authenticated profile cache must be UID scoped.
must(session,/familyapp-profile-v2:/,'UID-scoped profile cache exists');
must(bridge,/familyapp-profile-v2:/,'identity bridge uses UID-scoped profile cache');

// Identity bridge must detach when auth/household context disappears or switches.
must(bridge,/if\(!d \|\| !u \|\| !hid\)\s*\{[\s\S]*detach\(/,'identity sync detaches when context is missing');
must(bridge,/currentUid\s*!==\s*u\.uid|currentUid&&currentUid!==u\.uid/,'identity bridge checks UID context switch');
must(bridge,/currentHouseholdId\s*!==\s*hid|currentHouseholdId&&currentHouseholdId!==hid/,'identity bridge checks household context switch');
must(bridge,/stale-member-callback/,'member callbacks reject stale context');
must(bridge,/stale-presence-callback/,'presence callbacks reject stale context');

// Vercel app loader must load canonical household runtime after legacy auth module.
const duoIndex=app.indexOf('src/modules/tasks/duoQuests.js');
const platformIndex=app.indexOf('src/core/householdPlatform.js');
const bridgeIndex=app.indexOf('src/core/householdIdentityFirebaseBridge.js');
const hardeningIndex=app.indexOf('src/core/householdSessionHardening.js');
if(!(duoIndex>=0 && platformIndex>duoIndex && bridgeIndex>platformIndex && hardeningIndex>bridgeIndex)){
  throw new Error('Household runtime load order contract failed');
}

// Do not reintroduce hard-coded platform authorization or a default family fallback here.
mustNot(session,/email\s*===\s*['"][^'"]+['"]/,'hard-coded admin/user email');
mustNot(session,/fbFamilyId\s*=\s*uid/,'UID used as implicit household ID');

console.log('household-session-contract: PASS');
