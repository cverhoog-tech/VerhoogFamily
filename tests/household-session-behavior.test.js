'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('src/core/householdSessionHardening.js','utf8');

function makeStorage(){
  const data=new Map();
  return {
    getItem:k=>data.has(k)?data.get(k):null,
    setItem:(k,v)=>data.set(k,String(v)),
    removeItem:k=>data.delete(k)
  };
}

function makeDb(){
  const refs=new Map();
  function getRef(path){
    if(refs.has(path)) return refs.get(path);
    const listeners={};
    const ref={
      path,
      on(event,handler){(listeners[event]||(listeners[event]=new Set())).add(handler);},
      off(event,handler){
        if(!event){Object.keys(listeners).forEach(k=>listeners[k].clear());return;}
        if(!listeners[event]) return;
        if(handler) listeners[event].delete(handler); else listeners[event].clear();
      },
      listenerCount(event){return listeners[event]?listeners[event].size:0;},
      handlers(event){return listeners[event]?[...listeners[event]]:[];},
      once(){return Promise.resolve({val:()=>null,exists:()=>false});},
      update(){return Promise.resolve();},
      onDisconnect(){return{cancel(){return Promise.resolve();}};}
    };
    refs.set(path,ref);return ref;
  }
  return {ref:getRef,refs};
}

const db=makeDb();
const authListeners=[];
const auth={
  currentUser:null,
  onAuthStateChanged(fn){authListeners.push(fn);},
  signOut(){this.currentUser=null;authListeners.forEach(fn=>fn(null));return Promise.resolve();}
};

const events=[];
const context={
  console,
  Promise,
  Date,
  setTimeout,
  clearTimeout,
  localStorage:makeStorage(),
  CustomEvent:function(name,opts){this.type=name;this.detail=opts&&opts.detail;},
  taskData:[],shopData:[],calData:[],recurData:[],
  partnerName:'Partner',myName:'',myInitials:'',myXP:0,
  _fbSyncActive:false,_appStarted:false,offlineMode:false,
  fbDb:db,fbAuth:auth,fbUser:null,fbFamilyId:null,
  firebase:{
    database:function(){return db;},
    auth:function(){return auth;}
  }
};
context.firebase.database.ServerValue={TIMESTAMP:123456789};
context.window=context;
context.addEventListener=function(){};
context.dispatchEvent=function(evt){events.push(evt);};
context.HouseholdIdentityFirebaseBridge={detachCalls:0,detach(){this.detachCalls++;}};
context.FamilyHousehold={
  startPresence(){},
  resolve(){return Promise.reject(new Error('legacy not used in behavior test'));}
};

vm.createContext(context);
vm.runInContext(source,context,{filename:'householdSessionHardening.js'});

assert.strictEqual(typeof context.startFirebaseSync,'function','hardening installs startFirebaseSync');
assert.strictEqual(typeof context.HouseholdSessionHardening.stopAll,'function','hardening exposes lifecycle stop');
assert.strictEqual(authListeners.length,1,'one auth lifecycle listener is registered');

// Account A + Household Alpha.
const userA={uid:'alpha-user',displayName:'Alpha'};
auth.currentUser=userA;context.fbUser=userA;context.fbFamilyId='house-alpha';
authListeners[0](userA);
assert.strictEqual(context.startFirebaseSync(),true,'Account A sync attaches');
const alphaRef=db.ref('families/house-alpha');
assert.strictEqual(alphaRef.listenerCount('value'),1,'Alpha has exactly one root listener');
const staleAlphaHandler=alphaRef.handlers('value')[0];

// A normal Alpha snapshot may mutate Alpha runtime state.
staleAlphaHandler({val:()=>({tasks:{one:{id:'alpha-task'}}})});
assert.strictEqual(context.taskData.length,1,'Alpha callback updates Alpha runtime');
assert.strictEqual(context.taskData[0].id,'alpha-task');

// Auth switches to Account B before a new household is selected.
const userB={uid:'beta-user',displayName:'Beta'};
auth.currentUser=userB;
authListeners[0](userB);
assert.strictEqual(alphaRef.listenerCount('value'),0,'Alpha root listener detached on account switch');
assert.strictEqual(context.fbFamilyId,null,'old household pointer cleared on account switch');
assert.strictEqual(context.taskData.length,0,'shared runtime state cleared on account switch');
assert.strictEqual(context.fbUser.uid,'beta-user','new auth user becomes current user');

// Even if Firebase delivers an already queued Alpha callback, it must not restore Alpha state.
staleAlphaHandler({val:()=>({tasks:{late:{id:'LEAKED-ALPHA'}}})});
assert.strictEqual(context.taskData.length,0,'late Alpha callback cannot mutate Beta runtime');

// Activate Household Beta and attach a fresh listener.
context.fbFamilyId='house-beta';
assert.strictEqual(context.startFirebaseSync(),true,'Account B sync attaches');
const betaRef=db.ref('families/house-beta');
assert.strictEqual(betaRef.listenerCount('value'),1,'Beta has exactly one root listener');
assert.strictEqual(alphaRef.listenerCount('value'),0,'Alpha remains detached after Beta attach');

const betaHandler=betaRef.handlers('value')[0];
betaHandler({val:()=>({tasks:{two:{id:'beta-task'}}})});
assert.strictEqual(context.taskData.length,1,'Beta callback updates Beta runtime');
assert.strictEqual(context.taskData[0].id,'beta-task');

// Logout must tear Beta down as well.
context.logoutUser();
assert.strictEqual(betaRef.listenerCount('value'),0,'Beta root listener detached on logout');
assert.strictEqual(context.fbFamilyId,null,'household pointer cleared on logout');
assert.strictEqual(context.taskData.length,0,'shared runtime state cleared on logout');

console.log('household-session-behavior: PASS');
