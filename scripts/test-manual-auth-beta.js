'use strict';
const assert=require('assert');
const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}

const registration=read('src/core/manualRegistrationBetaV1.js');
const recovery=read('src/core/manualAuthRecoveryV1.js');
const shell=read('api/app-v7.js');
const workflow=read('.github/workflows/rebuild-contract-tests.yml');

assert(registration.includes("VERSION='1.0.0'"),'manual registration beta version missing');
assert(registration.includes("window._loginTab==='register'"),'registration companion must only own register mode');
assert(registration.includes('createUserWithEmailAndPassword(email,pass)'),'registration must use canonical Firebase e-mail auth');
assert(registration.includes("updateProfile({displayName:name})"),'new e-mail account should retain its chosen display name');
assert(registration.includes("localStorage.setItem('familyapp-profile-name-v1',name)"),'new account must retain profile name for existing identity compatibility');
assert(!registration.includes("localStorage.setItem('familyapp-partner-name-v1'"),'new registration must not synthesize a partner identity');
assert(registration.includes("localStorage.removeItem('familyapp-partner-name-v1')"),'fresh registration must clear obsolete device-local partner residue');
assert(registration.includes("label[for=\"auth-partner\"]"),'legacy partner label must be removed from premium register UI');
assert(registration.includes("byId('auth-partner')"),'legacy partner input must be removed from premium register UI');
assert(registration.includes('AuthenticatedSessionController.resume'),'post-registration household resolution must use existing session authority');
assert(registration.includes('FamilyHousehold.showOnboarding'),'registration may hand off to canonical household onboarding');
assert(!registration.includes('setupNewFamily('),'registration companion must not become a household writer');
assert(registration.includes('Gezinsleden nodig je daarna veilig uit.'),'registration UI must explain the real household flow');

assert(recovery.includes('sendPasswordResetEmail(email)'),'manual e-mail auth must support password recovery');
assert(recovery.includes('Als dit e-mailadres bij een FamilyApp-account hoort'),'recovery confirmation must not enumerate accounts');

assert(shell.includes('/src/core/manualAuthRecoveryV1.js?v=1'),'production shell must load password recovery');
assert(shell.includes('/src/core/manualRegistrationBetaV1.js?v=1'),'production shell must load simplified registration');
assert(workflow.includes('      - main\n      - agent/household-rebuild-v2'),'contract workflow must protect current main beta builds and rebuild branch');

console.log('FamilyApp manual auth beta safeguards: PASS');
