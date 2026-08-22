'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/tasks/taskLegacySyncGuard.js','utf8');
const app=fs.readFileSync('api/app.js','utf8');

assert.ok(source.includes('CANONICAL LEGACY SYNC GUARD v2.0.0'),'legacy sync guard must identify the canonical repository boundary');
assert.ok(!source.includes("if(data.cal&&toArray(data.cal).length)window.calData=toArray(data.cal)"),'legacy family-root listener must never overwrite calData from families/{householdId}/cal');
assert.ok(!source.includes('cal:toObject(window.calData)'),'legacy family-root writer must never persist calData back to families/{householdId}/cal');
assert.ok(app.includes('taskLegacySyncGuard.js?v=2'),'runtime must cache-bust the canonical legacy sync guard on iPhone/PWA');

(async function(){
  const rootListeners=[];
  const writes=[];
  const refs={};
  function ref(path){
    if(refs[path])return refs[path];
    const node={
      path,
      on(event,handler){assert.strictEqual(event,'value');rootListeners.push({path,handler});},
      off(){},
      update(value){writes.push({path,value:JSON.parse(JSON.stringify(value))});return Promise.resolve();}
    };
    refs[path]=node;
    return node;
  }

  const canonical=[{id:'canonical-1',title:'Blijf bestaan',date:'2026-08-28'}];
  const window={
    fbDb:{ref},
    fbFamilyId:'household-A',
    fbUser:{uid:'uA'},
    offlineMode:false,
    _fbSyncActive:false,
    _syncTimer:null,
    calData:canonical.slice(),
    shopData:[],
    recurData:[],
    myXP:0,
    myName:'Shane',
    partnerName:'Esra',
    partnerXPStore:0,
    _currentScreen:'cal',
    _renderScreen(){},
    updateHomeXP(){},
    AuthenticatedSessionController:{addCleanup(){}},
    stopFirebaseSync(){},
    objToArr(value){return value?Object.values(value):[];},
    arrToObj(value){const out={};(value||[]).forEach((row,i)=>{out['id_'+(row.id||i)]=row;});return out;}
  };
  const sandbox={window,console,setTimeout,clearTimeout,Date,Object,Array,Number,String,JSON};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'taskLegacySyncGuard.js'});

  window.startFirebaseSync();
  const root=rootListeners.find(x=>x.path==='families/household-A');
  assert.ok(root,'legacy family-root listener must still attach for unmigrated modules');
  root.handler({val(){return{cal:{id_old:{id:'old',title:'Legacy',date:'2026-01-01'}},shop:{},recurData:{},members:{}};}});
  assert.deepStrictEqual(window.calData,canonical,'legacy root snapshots must not replace canonical Agenda projection');

  window.syncToFirebase();
  await new Promise(resolve=>setTimeout(resolve,850));
  const familyWrite=writes.find(x=>x.path==='families/household-A');
  assert.ok(familyWrite,'legacy sync should still write remaining unmigrated modules');
  assert.ok(!Object.prototype.hasOwnProperty.call(familyWrite.value,'cal'),'legacy root write must not contain cal');
  assert.ok(!Object.prototype.hasOwnProperty.call(familyWrite.value,'tasks'),'legacy root write must not contain tasks');

  console.log('STEP 6 calendar legacy sync guard contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
