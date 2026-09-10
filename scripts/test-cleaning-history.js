'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningHistoryExperience.js'),'utf8');
const listeners={};
const sandbox={
  console,Date,Math,JSON,Promise,Object,Array,String,Number,Map,Set,
  requestAnimationFrame:()=>1,
  setTimeout:()=>1,
  addEventListener:(name,fn)=>{listeners[name]=fn;},
  HouseholdIdentityFirebaseBridge:{getMembers:()=>[
    {uid:'u1',displayName:'Shane',status:'active'},
    {uid:'u2',displayName:'Esra',status:'active'}
  ]},
  CleaningHouseholdRepository:{snapshot:()=>({ready:true,data:{}})},
  document:{
    getElementById:()=>null,
    createElement:()=>({id:'',textContent:'',innerHTML:'',firstElementChild:null}),
    head:{appendChild:()=>{}},
    documentElement:{}
  },
  MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};}
};
sandbox.window=sandbox;
vm.runInNewContext(source,sandbox,{filename:'cleaningHistoryExperience.js'});

const history=sandbox.CleaningHistoryExperience;
assert.ok(history,'history experience must register');
assert.strictEqual(history.version,'0.1.0');

const now=Date.now();
const root={
  rooms:{
    bath:{id:'bath',name:'Badkamer',active:true},
    kitchen:{id:'kitchen',name:'Keuken',active:true}
  },
  routines:{
    shower:{id:'shower',roomId:'bath',title:'Douche schoonmaken',active:true},
    floor:{id:'floor',roomId:'bath',title:'Vloer dweilen',active:true},
    worktop:{id:'worktop',roomId:'kitchen',title:'Werkblad reinigen',active:true}
  },
  completionLogs:{
    bathRecent:{
      id:'bathRecent',roomId:'bath',completedAt:now-86400000,outcome:'CARRY_FORWARD',status:'PARTIAL',completedByUid:'u1',
      remainingRoutineItemIds:['floor'],
      checklist:[
        {routineItemId:'shower',title:'Douche schoonmaken',completed:true},
        {routineItemId:'floor',title:'Vloer dweilen',completed:false}
      ]
    },
    bathOlder:{
      id:'bathOlder',roomId:'bath',completedAt:now-5*86400000,outcome:'COMPLETED',status:'COMPLETED',completedByUid:'u2',
      remainingRoutineItemIds:[],
      checklist:[{routineItemId:'floor',title:'Vloer dweilen',completed:true}]
    },
    kitchenRecent:{
      id:'kitchenRecent',roomId:'kitchen',completedAt:now-2*86400000,outcome:'COMPLETED',status:'COMPLETED',completedByUid:'u2',
      remainingRoutineItemIds:[],
      checklist:[{routineItemId:'worktop',title:'Werkblad reinigen',completed:true}]
    },
    ignored:{id:'ignored',roomId:'bath',outcome:'COMPLETED',status:'COMPLETED',checklist:[]}
  }
};

const rows=history._roomRows(root);
assert.strictEqual(rows.length,2,'history must group canonical completion logs by room');
assert.strictEqual(rows[0].roomId,'bath','most recently touched room must sort first');
assert.strictEqual(rows[0].name,'Badkamer');
assert.strictEqual(rows[0].activity30,2,'30-day room activity must count canonical logs only');
assert.strictEqual(rows[1].roomId,'kitchen');

const bathRoutines=rows[0].routines;
assert.strictEqual(bathRoutines.length,2);
const shower=bathRoutines.find((row)=>row.id==='shower');
const floor=bathRoutines.find((row)=>row.id==='floor');
assert.ok(shower&&floor);
assert.strictEqual(shower.status,'COMPLETED','completed checklist work remains completed in routine history');
assert.strictEqual(shower.byUid,'u1');
assert.strictEqual(floor.status,'CARRY_FORWARD','remaining work must preserve carry-forward outcome');
assert.strictEqual(floor.at,root.completionLogs.bathRecent.completedAt,'latest routine touch must win over older logs');

// History is strictly a read-only projection over canonical completionLogs.
assert.ok(source.includes('completionLogs'));
assert.ok(source.includes('Geschiedenis per kamer'));
assert.ok(source.includes('data-cleaning-history-detail'));
assert.ok(!source.includes('.transaction('),'history may never mutate Firebase');
assert.ok(!source.includes('.update('),'history may never mutate Firebase');
assert.ok(!source.includes('CleaningHouseholdRepository.create'),'history may never create canonical data');
assert.ok(!source.includes('CleaningHouseholdRepository.remove'),'history may never remove canonical data');

console.log('cleaning canonical room/routine history projection: ok');
