'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/tasks/taskLegacySyncGuard.js','utf8');
const app=fs.readFileSync('api/app.js','utf8');

assert.ok(source.includes('CANONICAL LEGACY SYNC GUARD v3.1.0'),'legacy sync guard must identify the STEP 3/6/7 canonical repository boundary');
assert.ok(!source.includes("if(data.cal&&toArray(data.cal).length)window.calData=toArray(data.cal)"),'legacy family-root listener must never overwrite calData');
assert.ok(!source.includes('cal:toObject(window.calData)'),'legacy family-root writer must never persist calData');
assert.ok(!source.includes("if(data.shop&&toArray(data.shop).length)window.shopData=toArray(data.shop)"),'legacy family-root listener must never overwrite shopping state');
assert.ok(!source.includes('shop:toObject(window.shopData)'),'legacy family-root writer must never persist shopData');
assert.ok(!source.includes("window._renderScreen(window._currentScreen)"),'unrelated family-root snapshots must never rebuild the active screen');
assert.ok(source.includes("window._currentScreen==='tasks'"),'legacy recurData may only request a Tasks surface render');
assert.ok(app.includes('taskLegacySyncGuard.js?v=3'),'runtime must cache-bust the anti-flicker legacy sync guard on iPhone/PWA');

(async function(){
  const rootListeners=[];
  const writes=[];
  const refs={};
  function ref(path){
    if(refs[path])return refs[path];
    const node={path,on(event,handler){assert.strictEqual(event,'value');rootListeners.push({path,handler});},off(){},update(value){writes.push({path,value:JSON.parse(JSON.stringify(value))});return Promise.resolve();}};
    refs[path]=node;return node;
  }

  const canonicalCal=[{id:'canonical-1',title:'Blijf bestaan',date:'2026-08-28'}];
  const canonicalShop=[{id:'canonical-shop',name:'Melk'}];
  let renderCount=0,homeXpCount=0,lastRendered=null;
  const window={fbDb:{ref},fbFamilyId:'household-A',fbUser:{uid:'uA'},offlineMode:false,_fbSyncActive:false,_syncTimer:null,calData:canonicalCal.slice(),shopData:canonicalShop.slice(),recurData:[],myXP:0,myName:'Shane',partnerName:'Esra',partnerXPStore:0,_currentScreen:'shop',_renderScreen(screen){renderCount++;lastRendered=screen;},updateHomeXP(){homeXpCount++;},dispatchEvent(){},AuthenticatedSessionController:{addCleanup(){}},stopFirebaseSync(){},objToArr(value){return value?Object.values(value):[];},arrToObj(value){const out={};(value||[]).forEach((row,i)=>{out['id_'+(row.id||i)]=row;});return out;}};
  const sandbox={window,console,setTimeout,clearTimeout,Date,Object,Array,Number,String,JSON,CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail;}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'taskLegacySyncGuard.js'});

  window.startFirebaseSync();
  const root=rootListeners.find(x=>x.path==='families/household-A');
  assert.ok(root,'legacy family-root listener must still attach for recurData');
  const snapshotA={cal:{id_old:{id:'old',title:'Legacy'}},shop:{id_old:{id:'old',name:'Legacy melk'}},recurData:{r1:{id:'r1',title:'Weektaak'}},members:{uA:{name:'Shane',xp:10},uB:{name:'Esra',xp:8}}};
  root.handler({val(){return snapshotA;}});
  assert.deepStrictEqual(window.calData,canonicalCal,'legacy root snapshots must not replace canonical Agenda projection');
  assert.deepStrictEqual(window.shopData,canonicalShop,'legacy root snapshots must not replace canonical Shopping projection');
  assert.strictEqual(window.recurData.length,1,'remaining unmigrated recurData may still project');
  assert.strictEqual(renderCount,0,'initial family snapshot must not rerender Shopping/Home/Agenda');
  assert.strictEqual(homeXpCount,1,'member projection may refresh XP once when member data changes');

  // Simulate a shopping write changing another family child while recur/members are identical.
  root.handler({val(){return Object.assign({},snapshotA,{shoppingLists:{weekly:{id:'weekly'}}});}});
  assert.strictEqual(renderCount,0,'shopping child updates must not rebuild the active Shopping screen');
  assert.strictEqual(homeXpCount,1,'unchanged members must not repaint Home XP/avatar surfaces');

  // A real recurring-task change is allowed to refresh only the Tasks surface.
  window._currentScreen='tasks';
  root.handler({val(){return Object.assign({},snapshotA,{recurData:{r1:{id:'r1',title:'Weektaak gewijzigd'}}});}});
  assert.strictEqual(renderCount,1,'changed recurData may trigger one Tasks refresh');
  assert.strictEqual(lastRendered,'tasks','legacy recurData refresh must target Tasks only');

  window.syncToFirebase();
  await new Promise(resolve=>setTimeout(resolve,850));
  const familyWrite=writes.find(x=>x.path==='families/household-A');
  assert.ok(familyWrite,'legacy sync should still write remaining recurData module');
  assert.ok(!Object.prototype.hasOwnProperty.call(familyWrite.value,'cal'),'legacy root write must not contain cal');
  assert.ok(!Object.prototype.hasOwnProperty.call(familyWrite.value,'tasks'),'legacy root write must not contain tasks');
  assert.ok(!Object.prototype.hasOwnProperty.call(familyWrite.value,'shop'),'legacy root write must not contain shop');
  assert.ok(Object.prototype.hasOwnProperty.call(familyWrite.value,'recurData'),'legacy root write should only retain recurData payload');

  console.log('STEP 6/7 canonical legacy sync + anti-flicker contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
