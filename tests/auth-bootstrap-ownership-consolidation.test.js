'use strict';
const fs=require('fs');
const path=require('path');

function read(rel){return fs.readFileSync(path.join(process.cwd(),rel),'utf8');}
function must(source,pattern,label){if(!pattern.test(source)){throw new Error('Missing contract: '+label);}}
function mustNot(source,pattern,label){if(pattern.test(source)){throw new Error('Forbidden contract: '+label);}}

const duo=read('src/modules/tasks/duoQuests.js');
const boot=read('src/core/authSessionBootstrap.js');
const platform=read('src/core/householdPlatform.js');
const hardening=read('src/core/householdSessionHardening.js');
const migration=read('src/core/householdMigrationCompatibility.js');

// ── duoQuests.js: authentication only, never a second bootstrap owner ──
mustNot(duo,/firebase\.auth\(\)\.onAuthStateChanged/,'duoQuests.js must not register its own onAuthStateChanged bootstrap listener');
mustNot(duo,/getRedirectResult\(\)\.then\(function\(result\)\s*\{\s*if\(result\s*&&\s*result\.user\)\s*\{\s*fbUser\s*=\s*result\.user;\s*loadUserFamily\(\)/,'getRedirectResult must not directly drive loadUserFamily');
mustNot(duo,/loadUserFamily\(\)\.then\(onLoggedIn\)/,'duoQuests.js must not chain loadUserFamily().then(onLoggedIn) itself');
mustNot(duo,/loadUserFamily\(\)\.catch\(function\(\)\{\s*showNameSetupStep/,'duoQuests.js sign-in success paths must not call loadUserFamily directly');
mustNot(duo,/function onLoggedIn\(\)/,'legacy onLoggedIn() implementation must be removed from duoQuests.js — AuthSessionBootstrap is the sole definer of window.onLoggedIn');
must(duo,/function hideLoginScreen\(\)/,'hideLoginScreen must remain for the offline-mode path');
must(duo,/is the sole owner of[\s\S]{0,80}window\.onLoggedIn/,'file must document that AuthSessionBootstrap owns the reveal flow');

// ── authSessionBootstrap.js: the single canonical action owner ──
must(boot,/onAuthStateChanged\(function\(user\)\{\s*if\(user\)\s*bootAuthenticatedSession\(user\);\s*else\s*resetStartedState/,'AuthSessionBootstrap must self-register the canonical auth listener');
must(boot,/HOUSEHOLD_ACCESS_REVOKED/,'AuthSessionBootstrap must explicitly handle HOUSEHOLD_ACCESS_REVOKED with visible recovery UI');
must(boot,/opts\.retry/,'bootstrap/render failures must offer a visible retry, never a dead blank screen');
must(boot,/AUTH_BOOT_CONTEXT_CHANGED/,'stale generations must still cancel silently without touching current UI');
must(boot,/wasStarted/,'resetStartedState must guard against leaving a stale reveal on screen');

// ── householdPlatform.js: no separate reveal logic after create/join ──
mustNot(platform,/\.then\(function\(\)\{closeOverlay\(\);if\(typeof onLoggedIn==='function'\)onLoggedIn\(\);/,'create/join success must not call onLoggedIn ad hoc');
must(platform,/function revealAfterHouseholdChange\(\)/,'household create/join must route through one explicit canonical-reveal helper');

// ── explicit ownership contracts, not accidental __householdV1 collisions ──
mustNot(hardening,/__householdV1/,'householdSessionHardening must use the explicit __familyHouseholdLoadOwner contract');
mustNot(migration,/__householdV1/,'householdMigrationCompatibility must use the explicit __familyHouseholdLoadOwner contract, and must not become a second bootstrap owner');
must(hardening,/__familyHouseholdLoadOwner/,'householdSessionHardening must tag its loader with the explicit ownership contract');
must(migration,/__familyHouseholdLoadOwner/,'householdMigrationCompatibility must tag its loader with the explicit ownership contract');
must(migration,/migration-only compatibility boundary/i,'householdMigrationCompatibility must document it is migration-only, not a bootstrap owner');

// ── HouseholdSessionHardening/HouseholdContext remain observers, never bootstrap ──
mustNot(hardening,/[^/\n]\bloadUserFamily\(\)\.(then|catch)/,'HouseholdSessionHardening must never call loadUserFamily itself (only override the reference)');
mustNot(hardening,/[^/\n]\bonLoggedIn\(\)(?!\/)/,'HouseholdSessionHardening must never call onLoggedIn');

console.log('auth-bootstrap-ownership-consolidation: PASS');
