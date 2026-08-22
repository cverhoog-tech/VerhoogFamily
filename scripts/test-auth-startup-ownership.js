'use strict';
const fs=require('fs');
const assert=require('assert');

function read(path){return fs.readFileSync(path,'utf8');}
function count(haystack,needle){return haystack.split(needle).length-1;}

const controller=read('src/core/authenticatedSessionController.js');
const duo=read('src/modules/tasks/duoQuests.js');
const google=read('src/core/googleAuthMobileFix.js');
const taskReady=read('src/modules/tasks/taskCreateReadinessFix.js');
const loader=read('api/app.js');

assert.strictEqual(count(controller,'.onAuthStateChanged('),1,'session controller must own exactly one Firebase auth observer');
assert.strictEqual(count(duo,'.onAuthStateChanged('),0,'duoQuests must not own auth state');
assert.strictEqual(count(taskReady,'.onAuthStateChanged('),0,'task readiness must consume SessionController instead of observing auth');
assert.strictEqual(count(google,'loadUserFamily'),0,'Google sign-in adapter must not resolve household');
assert.strictEqual(count(google,'onLoggedIn'),0,'Google sign-in adapter must not reveal/start app');
assert.strictEqual(count(google,'recoverExistingSession'),0,'Google sign-in adapter must not own existing-session bootstrap');
assert.ok(taskReady.includes('AuthenticatedSessionController.whenAuthenticated'),'task readiness must use canonical session readiness');
assert.ok(loader.includes('authenticatedSessionController.js?v=1'),'runtime loader must include canonical session controller');
assert.ok(loader.includes('familyapp-profile-name-v1'),'runtime loader must explicitly retire the old localStorage reveal signature');
assert.ok(controller.includes("window.useOfflineMode=function()"),'guest/offline login must be retired at the session boundary');
assert.ok(controller.includes("state='recoverableError'")||controller.includes("setState('recoverableError'"),'startup failures must have a recoverable visible state');
assert.ok(controller.includes('generation'),'controller must guard stale async bootstrap generations');

console.log('auth startup ownership contract: PASS');
