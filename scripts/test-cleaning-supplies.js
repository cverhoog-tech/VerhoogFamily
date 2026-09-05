'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

function read(file){return fs.readFileSync(path.join(__dirname,'..',file),'utf8');}
function context(){
  const document={
    getElementById:()=>null,
    querySelector:()=>null,
    querySelectorAll:()=>[],
    createElement:()=>({style:{},setAttribute:()=>{},getAttribute:()=>null,appendChild:()=>{},remove:()=>{},addEventListener:()=>{}}),
    addEventListener:()=>{},
    head:{appendChild:()=>{}},
    body:{style:{},appendChild:()=>{}},
    documentElement:{}
  };
  const sandbox={
    console,Date,Math,JSON,Promise,
    document,
    MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};},
    requestAnimationFrame:(fn)=>{fn();return 1;},
    setTimeout:(fn)=>{if(typeof fn==='function')fn();return 1;},
    clearTimeout:()=>{},
    setInterval:()=>1,
    clearInterval:()=>{},
    addEventListener:()=>{},
    dispatchEvent:()=>{},
    CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
  };
  sandbox.window=sandbox;
  return sandbox;
}

const supplySource=read('src/modules/cleaning/cleaningSupplyExperience.js');
const supplyContext=context();
vm.runInNewContext(supplySource,supplyContext,{filename:'cleaningSupplyExperience.js'});
const supplies=supplyContext.CleaningSupplyExperience;
assert.ok(supplies);
assert.strictEqual(supplies.version,'0.2.0');
assert.strictEqual(supplies._supplyIdForName('  Allesreiniger  '),supplies._supplyIdForName('allesreiniger'),'supply identity is normalized');
assert.notStrictEqual(supplies._supplyIdForName('Allesreiniger'),supplies._supplyIdForName('Glasreiniger'));

const root={
  rooms:{kitchen:{id:'kitchen',name:'Keuken',type:'kitchen',active:true},bathroom:{id:'bathroom',name:'Badkamer',type:'bathroom',active:true}},
  supplies:{
    soap:{id:'soap',name:'Allesreiniger',active:true},
    cloth:{id:'cloth',name:'Microvezeldoek',active:true},
    gloves:{id:'gloves',name:'Handschoenen',active:true},
    retired:{id:'retired',name:'Oud middel',active:false}
  },
  inventory:{
    soap:{supplyId:'soap',status:'LOW'},
    cloth:{supplyId:'cloth',status:'IN_STOCK'},
    gloves:{supplyId:'gloves',status:'OUT'}
  },
  routines:{
    worktop:{id:'worktop',roomId:'kitchen',title:'Werkblad',active:true,supplyIds:['soap','cloth','soap']},
    floor:{id:'floor',roomId:'kitchen',title:'Vloer',active:true,supplyIds:['soap','gloves']},
    old:{id:'old',roomId:'kitchen',title:'Oud',active:false,supplyIds:['retired']},
    shower:{id:'shower',roomId:'bathroom',title:'Douche',active:true,supplyIds:['gloves']}
  },
  occurrences:{
    completed:{id:'completed',roomId:'kitchen',slotAt:100,status:'COMPLETED',assignmentStatus:'COMPLETED',checklist:[{routineItemId:'worktop'}]},
    later:{id:'later',roomId:'kitchen',slotAt:300,status:'FLEXIBLE',assignmentStatus:'ACTIVE',checklist:[{routineItemId:'floor'}]},
    first:{id:'first',roomId:'kitchen',slotAt:200,status:'FLEXIBLE',assignmentStatus:'ACTIVE',checklist:[{routineItemId:'worktop'}]},
    other:{id:'other',roomId:'bathroom',slotAt:150,status:'FLEXIBLE',assignmentStatus:'ACTIVE',checklist:[{routineItemId:'shower'}]}
  }
};

assert.deepStrictEqual(Array.from(supplies._roomSupplyIds(root,'kitchen')),['soap','cloth','gloves'],'room supplies combine active routines without duplicates');
assert.deepStrictEqual(Array.from(supplies._supplyIdsForOccurrence(root,root.occurrences.first)),['soap','cloth'],'a concrete turn only exposes supplies for its checklist routines');
assert.strictEqual(supplies._currentOccurrenceForRoom(root,'kitchen').id,'first','completed turns are ignored and earliest active turn wins');
const summary=supplies._summaryForSupplyIds(root,['soap','cloth','gloves']);
assert.strictEqual(summary.total,3);
assert.strictEqual(summary.inStock,1);
assert.strictEqual(summary.low,1);
assert.strictEqual(summary.out,1);
assert.strictEqual(summary.attention,2);
assert.strictEqual(summary.tone,'out');
assert.strictEqual(summary.label,'1 ontbreekt');
assert.deepStrictEqual(Array.from(supplies._supplyRowsForIds(root,['gloves','cloth'])).map((row)=>row.name),['Handschoenen','Microvezeldoek']);

assert.deepStrictEqual(
  Array.from(supplies._smartSuggestions('bathroom','Douche ontkalken',[])).slice(0,3),
  ['Ontkalker','Handschoenen','Microvezeldoek']
);
assert.deepStrictEqual(
  Array.from(supplies._smartSuggestions('kitchen','Oven grondig reinigen',['Handschoenen'])).slice(0,3),
  ['Ovenreiniger','Spons','Allesreiniger']
);
assert.ok(Array.from(supplies._smartSuggestions('living-room','Afstoffen',[])).includes('Stofdoek'));

const taskSource=read('src/modules/cleaning/cleaningTaskSupplyUi.js');
const taskContext=context();
vm.runInNewContext(taskSource,taskContext,{filename:'cleaningTaskSupplyUi.js'});
const taskUi=taskContext.CleaningTaskSupplyUi;
assert.ok(taskUi);
assert.strictEqual(taskUi.version,'0.1.0');

const task={
  id:'clean-task',
  projectionManaged:true,
  sourceType:'cleaning-occurrence-group',
  cleaningOccurrenceIds:['first','later'],
  subtasks:[
    {id:'worktop',sourceRoutineItemId:'worktop',cleaningOccurrenceId:'first'},
    {id:'floor',sourceRoutineItemId:'floor',cleaningOccurrenceId:'later'}
  ]
};
const details=taskUi._deriveDetails(task,root);
assert.strictEqual(details.roomId,'kitchen');
assert.deepStrictEqual(Array.from(details.routineIds),['worktop','floor']);
assert.deepStrictEqual(Array.from(details.supplyIds),['soap','cloth','gloves']);
assert.strictEqual(details.summary.attention,2);
assert.strictEqual(details.items.find((item)=>item.id==='soap').status,'LOW');
assert.strictEqual(details.items.find((item)=>item.id==='gloves').status,'OUT');
assert.ok(taskUi._panelHtml(details).includes('Allesreiniger · Bijna op'));
assert.ok(taskUi._panelHtml(details).includes('Handschoenen · Op'));
assert.strictEqual(taskUi._isManaged(task),true);
assert.strictEqual(taskUi._isManaged({id:'normal'}),false);

// Explicit Shopping add keeps canonical Cleaning context on each new item.
// It uses the existing Shopping repository persistence boundary directly so
// metadata is not stripped by the legacy facade normalizer.
assert.ok(supplySource.includes('ShoppingListStore'));
assert.ok(supplySource.includes('ShoppingListHouseholdRepository'));
assert.ok(supplySource.includes('shoppingRepo.addItems(active.scope,active.list.id,items)'));
assert.ok(supplySource.includes('existingNames[canonicalName(item.name)]'),'Shopping addition must preserve explicit open-item name dedupe');
assert.ok(supplySource.includes('cleaningSupplyId:text(row.id)'));
assert.ok(supplySource.includes('cleaningOccurrenceIds:uniqueIds(occurrenceIds)'));
assert.ok(supplySource.includes('cleaningRoomIds:[text(model.room.id)]'));
assert.ok(supplySource.includes('cleaningRoutineIds:uniqueIds(relatedRoutineIds)'));
assert.ok(supplySource.includes("source:'cleaning'"));
assert.ok(supplySource.includes('Toevoegen aan Boodschappen gebeurt nooit automatisch'));
assert.ok(!supplySource.includes("setSupplyStatus(row.id,STATUS.IN_STOCK)"),'Shopping add may never auto-change Cleaning stock');
assert.ok(supplySource.includes('data-cleaning-smart-supply'),'routine form exposes smart supply suggestions');
assert.ok(supplySource.includes("overlay.addEventListener('pointerup'"),'modal close must have a direct high-priority pointer handler');
assert.ok(supplySource.includes('setRepositorySnapshot(event.detail)'),'repository event snapshot must be cached directly');
assert.ok(!supplySource.includes('function snapshot()'),'decorators must not repeatedly clone the full cleaning repository snapshot');
assert.ok(!supplySource.includes("write.db.ref(write.path).transaction"),'supply creation must not transact the full Cleaning root');
assert.ok(!supplySource.includes('cleaning-approval-copy'),'supplies may not own Planning approval UI');
assert.ok(taskSource.includes("once('value')"),'task context may read canonical Cleaning before lazy module mount');
assert.ok(!taskSource.includes('.transaction('));
assert.ok(!taskSource.includes('.update('));

console.log('cleaning fast supplies, explicit Shopping metadata, smart suggestions, inventory summary and exact Task context: ok');
