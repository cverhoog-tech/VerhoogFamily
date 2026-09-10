'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/core/notificationHouseholdRepository.js','utf8');

function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}
function snap(v){return{val(){return clone(v);}};}
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function parts(path){return String(path||'').split('/').filter(Boolean);}
function getAt(root,path){let cur=root;for(const p of parts(path)){if(!cur||typeof cur!=='object'||!(p in cur))return null;cur=cur[p];}return clone(cur);}
function setAt(root,path,value){const ps=parts(path);if(!ps.length)return;let cur=root;for(let i=0;i<ps.length-1;i++){const p=ps[i];if(!cur[p]||typeof cur[p]!=='object')cur[p]={};cur=cur[p];}const leaf=ps[ps.length-1];if(value===null||value===undefined)delete cur[leaf];else cur[leaf]=clone(value);}

function makeDb(initial){
  const tree=clone(initial||{}),refs={};
  function ref(path){
    path=String(path);
    if(refs[path])return refs[path];
    const handlers=[],offCalls=[];
    const node={
      path,handlers,offCalls,
      on(event,handler,errorHandler){
        assert.strictEqual(event,'value');handlers.push(handler);node.errorHandler=errorHandler;
        Promise.resolve().then(()=>handler(snap(getAt(tree,path))));
      },
      off(event,handler){offCalls.push({event,handler});const i=handlers.indexOf(handler);if(i>=0)handlers.splice(i,1);},
      set(value){setAt(tree,path,value);return Promise.resolve();},
      transaction(updater){
        const current=getAt(tree,path);
        let next;
        try{next=updater(clone(current));}catch(error){return Promise.reject(error);}
        if(next===undefined)return Promise.resolve({committed:false,snapshot:snap(current)});
        setAt(tree,path,next);
        return Promise.resolve({committed:true,snapshot:snap(next)});
      },
      emitValue(value){setAt(tree,path,value);handlers.slice().forEach(h=>h(snap(value)));}
    };
    refs[path]=node;
    return node;
  }
  return{tree,refs,ref,get(path){return getAt(tree,path);}};
}

(async function(){
  let current={ready:true,uid:'userA',householdId:'houseA',revision:1};
  const contextListeners=[];
  const initialEvent={
    id:'evt_existing',eventKey:'system:welcome',schemaVersion:1,type:'system.message',title:'Welkom',
    actor:{uid:'system'},audience:{kind:'household'},createdAt:10,updatedAt:10,readBy:{},dismissedBy:{}
  };
  const db=makeDb({families:{
    houseA:{shared:{notifications:{evt_existing:initialEvent}}},
    houseB:{shared:{notifications:{evt_b:{id:'evt_b',eventKey:'system:b',type:'system.message',title:'B',actor:{uid:'system'},audience:{kind:'household'},createdAt:20,updatedAt:20,readBy:{},dismissedBy:{}}}}}
  }});

  const HouseholdContext={
    snapshot(){return clone(current);},
    capture(){return{uid:current.uid,householdId:current.householdId,revision:current.revision};},
    isCurrent(token){return !!token&&token.uid===current.uid&&token.householdId===current.householdId&&token.revision===current.revision;},
    subscribe(fn){contextListeners.push(fn);fn(clone(current),'subscribe');return()=>{const i=contextListeners.indexOf(fn);if(i>=0)contextListeners.splice(i,1);};}
  };
  function publishContext(next,reason){current=clone(next);contextListeners.slice().forEach(fn=>fn(clone(current),reason||'test'));}

  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const events=[];
  const window={
    HouseholdContext,
    fbDb:db,
    dispatchEvent(event){events.push(event);},
    addEventListener(){}
  };
  const sandbox={window,HouseholdContext,CustomEvent,console,setTimeout,clearTimeout,setInterval,clearInterval,Promise,Date,Math,JSON,Object,String,Number,Array,encodeURIComponent};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'notificationHouseholdRepository.js'});

  const repo=window.NotificationHouseholdRepository;
  assert.ok(repo,'NotificationHouseholdRepository must install');
  assert.strictEqual(repo.version,'1.0.0');

  await tick();await tick();
  assert.strictEqual(repo.status().ready,true,'initial household listener must become ready');
  assert.strictEqual(repo.status().boundUid,'userA');
  assert.strictEqual(repo.status().boundHouseholdId,'houseA');
  assert.strictEqual(repo.get().evt_existing.title,'Welkom');

  const aRoot='families/houseA/shared/notifications';
  const aRef=db.ref(aRoot);
  const staleA=aRef.handlers[0];
  assert.ok(staleA,'house A listener must be attached');

  // The same deterministic event may only be inserted once, even when two
  // callers observe the same domain transition.
  const key='task.help.requested:task42:111:userB';
  const event={type:'task.help.requested',title:'Hulp gevraagd',body:'Help even',actor:{uid:'userA'},audience:{kind:'uids',uids:['userB']}};
  const first=await repo.publishOnce(key,event);
  const second=await repo.publishOnce(key,event);
  assert.strictEqual(first.created,true,'first deterministic notification must be created');
  assert.strictEqual(second.created,false,'duplicate deterministic notification must not be created twice');
  assert.strictEqual(first.id,repo.eventIdFor(key));
  assert.strictEqual(db.get(aRoot+'/'+first.id).eventKey,key);
  assert.strictEqual(Object.keys(db.get(aRoot)).filter(id=>id===first.id).length,1);

  // Read/dismiss writes are always scoped to the active UID by the repository;
  // callers cannot pass another UID into these mutation APIs.
  await repo.markRead(first.id,500);
  assert.strictEqual(db.get(aRoot+'/'+first.id+'/readBy/userA'),500);
  assert.strictEqual(db.get(aRoot+'/'+first.id+'/readBy/userB'),null);
  await repo.dismiss(first.id,600);
  assert.strictEqual(db.get(aRoot+'/'+first.id+'/dismissedBy/userA'),600);
  assert.strictEqual(db.get(aRoot+'/'+first.id+'/dismissedBy/userB'),null);

  // Same-household account switch still requires a full rebind because UID is
  // part of the canonical HouseholdContext identity.
  publishContext({ready:true,uid:'userB',householdId:'houseA',revision:2},'same-household-account-switch');
  await tick();await tick();
  assert.ok(aRef.offCalls.length>=1,'same-household UID switch must detach the previous listener');
  assert.strictEqual(repo.status().boundUid,'userB');
  assert.strictEqual(repo.status().boundHouseholdId,'houseA');

  // A callback captured under user A may never overwrite the user-B projection.
  const beforeStale=clone(repo.get());
  staleA(snap({evt_leak:{id:'evt_leak',title:'STALE A'}}));
  await tick();
  assert.deepStrictEqual(repo.get(),beforeStale,'stale callback from previous UID must be ignored');

  // Per-user marker now writes only for user B.
  await repo.markRead(first.id,700);
  assert.strictEqual(db.get(aRoot+'/'+first.id+'/readBy/userA'),500,'A marker must remain intact');
  assert.strictEqual(db.get(aRoot+'/'+first.id+'/readBy/userB'),700,'B marker must be separate');

  // Cross-household switch detaches A and reads/writes only house B.
  publishContext({ready:true,uid:'userC',householdId:'houseB',revision:3},'household-switch');
  await tick();await tick();
  assert.strictEqual(repo.status().boundHouseholdId,'houseB');
  assert.ok(repo.get().evt_b,'house B projection must load');
  assert.ok(!repo.get().evt_existing,'house A projection must be replaced, not merged');
  const bKey='system:houseB-only';
  const bWrite=await repo.publishOnce(bKey,{type:'system.message',title:'Alleen B',actor:{uid:'userC'},audience:{kind:'household'}});
  assert.strictEqual(bWrite.created,true);
  assert.ok(db.get('families/houseB/shared/notifications/'+bWrite.id));
  assert.strictEqual(db.get(aRoot+'/'+bWrite.id),null,'house B write must never land in house A');

  // Logout clears the projection immediately and rejects further writes.
  const bRef=db.ref('families/houseB/shared/notifications');
  const staleB=bRef.handlers[0];
  publishContext({ready:false,uid:null,householdId:null,revision:4},'logout');
  await tick();
  assert.ok(bRef.offCalls.length>=1,'logout must detach house B listener');
  assert.deepStrictEqual(repo.get(),{},'logout must clear notification projection');
  await assert.rejects(()=>repo.publishOnce('logged-out:test',{type:'system.message',title:'Nope'}),/CONTEXT_NOT_READY/i);

  staleB(snap({evt_leak_b:{id:'evt_leak_b',title:'STALE B'}}));
  await tick();
  assert.deepStrictEqual(repo.get(),{},'stale callback after logout must not repopulate notifications');

  assert.ok(events.some(e=>e.type==='familyapp:notification-repository'),'repository must publish projection events');
  console.log('STEP 10 notification household repository contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
