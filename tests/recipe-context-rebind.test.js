'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
let current={uid:'alpha-user',householdId:'alpha-household'};
const listeners={},subs=[],writes=[];
const store={
  makeId:p=>p+'_1',
  readShared:()=>Promise.resolve({schemaVersion:3,initialized:true,items:{id_alpha:{id:'alpha',name:'Alpha recept',ingredients:[]}}}),
  writeShared:()=>Promise.resolve(),
  writeSharedPath:(collection,path,value)=>new Promise(resolve=>{writes.push({collection,path,value,resolve});}),
  subscribeShared:(collection,cb)=>{const s={collection,cb,off:false};subs.push(s);return()=>{s.off=true;};}
};
const document={readyState:'complete',getElementById:()=>null};
const window={FamilyDataStore:store,HouseholdContext:{requireUser:()=>current.uid,requireHousehold:()=>current.householdId,assertContext:()=>true,isCurrent:t=>!!t&&t.uid===current.uid&&t.householdId===current.householdId},recipesData:[],addEventListener:(n,fn)=>{(listeners[n]||(listeners[n]=[])).push(fn);},dispatchEvent:()=>{}};
const context={window,document,localStorage:{getItem:()=>null,setItem:()=>{}},console,Promise,JSON,Date,Math,Object,Array,String,CustomEvent:function(){},setInterval:()=>0,clearInterval:()=>{}};
vm.createContext(context);vm.runInContext(fs.readFileSync('src/modules/recipes/recipeSharedLive.js','utf8'),context,{filename:'recipeSharedLive.js'});
async function waitFor(fn){for(let i=0;i<50;i++){if(fn())return;await Promise.resolve();}throw new Error('condition not reached');}
(async()=>{
  await waitFor(()=>subs.length>=1);
  const alphaSub=subs[0];
  alphaSub.cb({schemaVersion:3,initialized:true,items:{id_alpha:{id:'alpha',name:'Alpha recept',ingredients:[]}}});
  assert.equal(window.RecipeStore.list()[0].name,'Alpha recept');
  const pending=window.RecipeStore.create({name:'Late Alpha',ingredients:[]});
  await waitFor(()=>writes.length===1);
  current={uid:'beta-user',householdId:'beta-household'};
  (listeners['familyapp:household-context-changed']||[]).forEach(fn=>fn());
  await waitFor(()=>alphaSub.off===true);
  assert.equal(window.RecipeStore.status().context.householdId,'beta-household');
  alphaSub.cb({schemaVersion:3,initialized:true,items:{id_leak:{id:'leak',name:'ALPHA-LEAK',ingredients:[]}}});
  assert(!window.RecipeStore.list().some(r=>r.name==='ALPHA-LEAK'));
  writes[0].resolve(true);
  await assert.rejects(pending,e=>e&&e.code==='RECIPE_CONTEXT_CHANGED');
  console.log('recipe-context-rebind: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
