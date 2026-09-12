'use strict';
const assert=require('assert');
const fs=require('fs');
const shell=require('../api/app-v7.js');

const controller=fs.readFileSync('src/core/authenticatedSessionController.js','utf8');
const shellSource=fs.readFileSync('api/app-v7.js','utf8');

assert.ok(controller.includes("root.classList.add('familyapp-auth-prepaint')"),'session controller must claim the first-paint auth guard');
assert.ok(controller.includes("root.classList.remove('familyapp-auth-prepaint')"),'session controller must release the first-paint auth guard');
assert.ok(controller.includes('function releaseFirstPaintGuard()'),'first-paint guard release must be centralized');
assert.ok(controller.includes('function setAppShellLocked(locked)'),'session controller must own a persistent signed-out shell lock');
assert.ok(controller.includes("root.classList.add('familyapp-auth-locked')"),'signed-out shell lock must be claimable');
assert.ok(controller.includes("root.classList.remove('familyapp-auth-locked')"),'signed-out shell lock must only release for ready app state');
assert.ok(controller.includes("if(show){\n      setAppShellLocked(true)"),'showing login must lock the underlying app shell before releasing startup paint guard');
assert.ok(controller.includes("if(state!=='ready')setAppShellLocked(true)"),'lifecycle resume/background transitions must keep non-ready app shells locked');
assert.ok(shellSource.includes('class="familyapp-auth-prepaint"'),'served shell must guard app content before JavaScript runs');
assert.ok(shellSource.includes('familyapp-auth-first-paint'),'served shell must include critical first-paint CSS');
assert.ok(shellSource.includes('#login-screen>*{visibility:hidden!important}'),'legacy login markup must stay hidden until native login/session resolution is ready');
assert.ok(shellSource.includes('familyapp-auth-locked .app-header')&&shellSource.includes('familyapp-auth-locked .bottom-nav')&&shellSource.includes('familyapp-auth-locked .screen'),'signed-out shell must keep Home/navigation invisible even after initial paint guard is released');
assert.ok(shellSource.includes('familyapp-auth-locked #login-screen')&&shellSource.includes('familyapp-auth-locked #household-onboarding'),'login/onboarding must remain visible while private app shell is locked');
assert.ok(shellSource.includes("authenticatedSessionController.js?v=5"),'served shell must cache-bust the lifecycle-safe session controller');

(async function(){
  let body='';
  const headers={};
  const res={
    setHeader(name,value){headers[name]=value;return this;},
    status(){return this;},
    send(value){body=String(value);return this;}
  };
  await shell({},res);
  assert.ok(body.includes('<html lang="nl" class="familyapp-auth-prepaint">'),'rendered document must be guarded before first paint');
  assert.ok(body.includes('id="familyapp-auth-first-paint"'),'rendered document must include inline critical guard CSS');
  assert.ok(body.includes('familyapp-auth-locked .screen'),'rendered shell must contain persistent signed-out screen privacy CSS');
  assert.ok(body.includes('src/core/authenticatedSessionController.js?v=5'),'rendered document must serve lifecycle-safe controller generation');
  assert.ok(headers['Cache-Control']==='no-store, max-age=0','HTML shell must remain non-cacheable');
  console.log('auth first-paint + signed-out resume shell guard contract: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});
