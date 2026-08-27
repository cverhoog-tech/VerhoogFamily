'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/core/authenticatedSessionController.js','utf8');

function createRuntime(){
  let authObserver=null;
  let resolveHousehold=null;
  let householdLoads=0;
  let homeReveals=0;
  const elements={
    'login-screen':{style:{display:'flex'}},
    'login-step-1':{style:{}},
    'login-step-2':{style:{}},
    'auth-error':{style:{},textContent:''}
  };
  const window={
    _appStarted:false,
    fbFamilyId:'family-1',
    dispatchEvent(){},
    fbAuth:{
      currentUser:null,
      onAuthStateChanged(next){authObserver=next;return function(){};}
    },
    loadUserFamily(){
      householdLoads++;
      return new Promise((resolve)=>{resolveHousehold=resolve;});
    },
    renderNav(){},
    showScreen(screen){if(screen==='home')homeReveals++;},
    startFirebaseSync(){}
  };
  const document={
    readyState:'complete',
    getElementById(id){return elements[id]||null;},
    addEventListener(){}
  };
  const sandbox={window,document,console,Promise,setTimeout,clearTimeout,CustomEvent:function(type,options){this.type=type;this.detail=options&&options.detail;}};
  vm.runInNewContext(source,sandbox,{filename:'authenticatedSessionController.js'});
  return{
    window,
    controller:window.AuthenticatedSessionController,
    observer(user){window.fbAuth.currentUser=user;authObserver(user);},
    resolve(){resolveHousehold();},
    householdLoads(){return householdLoads;},
    homeReveals(){return homeReveals;},
    loginDisplay(){return elements['login-screen'].style.display;}
  };
}

async function flush(){await Promise.resolve();await Promise.resolve();}

async function observerFirst(){
  const runtime=createRuntime();
  const user={uid:'user-1'};
  runtime.observer(user);
  const popupHandoff=runtime.controller.acceptAuthenticatedUser(user);
  assert.strictEqual(runtime.householdLoads(),1,'observer + popup handoff must share one household bootstrap');
  runtime.resolve();
  await popupHandoff;
  await flush();
  assert.strictEqual(runtime.controller.status().state,'ready','shared bootstrap must reach ready');
  assert.strictEqual(runtime.homeReveals(),1,'app must reveal Home once');
  assert.strictEqual(runtime.loginDisplay(),'none','login screen must be hidden after household bootstrap');
  runtime.observer(user);
  await flush();
  assert.strictEqual(runtime.householdLoads(),1,'late same-user auth observer must not reload household after ready');
}

async function popupFirst(){
  const runtime=createRuntime();
  const user={uid:'user-2'};
  runtime.window.fbAuth.currentUser=user;
  const popupHandoff=runtime.controller.acceptAuthenticatedUser(user);
  runtime.observer(user);
  assert.strictEqual(runtime.householdLoads(),1,'popup + later observer must share one household bootstrap');
  runtime.resolve();
  await popupHandoff;
  await flush();
  assert.strictEqual(runtime.controller.status().state,'ready','popup-first bootstrap must reach ready');
  assert.strictEqual(runtime.homeReveals(),1,'popup-first flow must reveal Home once');
  assert.strictEqual(runtime.loginDisplay(),'none','popup-first flow must hide login screen');
}

(async function(){
  await observerFirst();
  await popupFirst();
  console.log('Google auth popup handoff race: PASS');
})().catch((error)=>{console.error(error);process.exit(1);});
