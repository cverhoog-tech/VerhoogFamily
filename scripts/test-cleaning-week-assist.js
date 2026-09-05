'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningWeekAssist.js'),'utf8');
const templates=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningRoutineTemplates.js'),'utf8');
const context={console,Date,Math,JSON,Number,String,Array,Object,RegExp,Promise,Map,Set};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningWeekAssist.js'});
const assist=context.CleaningWeekAssist;

assert.ok(assist,'CleaningWeekAssist must register');
assert.strictEqual(assist.version,'0.1.2');
assert.ok(templates.includes("import './cleaningWeekAssist.js?v=2';"),'Cleaning module must load the current week assist cache version');

const root={
  rooms:{bath:{id:'bath',name:'Badkamer',active:true}},
  routines:{
    shower:{id:'shower',roomId:'bath',active:true,supplyIds:['cleaner','cloth']},
    deep:{id:'deep',roomId:'bath',active:true,supplyIds:['gloves']}
  },
  supplies:{
    cleaner:{id:'cleaner',name:'Badkamerreiniger',active:true},
    cloth:{id:'cloth',name:'Microvezeldoek',active:true},
    gloves:{id:'gloves',name:'Handschoenen',active:true}
  },
  inventory:{
    cleaner:{supplyId:'cleaner',status:'OUT',updatedAt:100},
    cloth:{supplyId:'cloth',status:'IN_STOCK',updatedAt:100},
    gloves:{supplyId:'gloves',status:'LOW',updatedAt:100}
  },
  occurrences:{
    occ1:{id:'occ1',roomId:'bath',status:'ACTIVE',assignmentStatus:'ACCEPTED',assignmentUids:['u1'],scheduledDate:'2026-09-07',estimatedMinutes:30,routineItemIds:['shower'],checklist:[{id:'shower',routineItemId:'shower',completed:false}]},
    occFuture:{id:'occFuture',roomId:'bath',status:'ACTIVE',assignmentStatus:'ACCEPTED',assignmentUids:['u1'],scheduledDate:'2026-09-15',estimatedMinutes:20,routineItemIds:['deep'],checklist:[{id:'deep',routineItemId:'deep',completed:false}]},
    occDone:{id:'occDone',roomId:'bath',status:'COMPLETED',assignmentStatus:'COMPLETED',assignmentUids:['u1'],scheduledDate:'2026-09-08',estimatedMinutes:20,routineItemIds:['deep'],checklist:[{id:'deep',routineItemId:'deep',completed:true}]}
  }
};

const cleaningEvent={
  id:'clean-1',date:'2026-09-07',time:'10:00',title:'Schoonmaken · Badkamer',assignedToUid:'u1',flexible:false,completed:false,
  projectionManaged:true,sourceType:'cleaning-occurrence',cleaningOccurrenceId:'occ1',cleaningOccurrenceIds:['occ1']
};
const calendar=[
  cleaningEvent,
  {id:'meeting',date:'2026-09-07',time:'10:15',durationMinutes:30,title:'Tandarts',assignedToUid:'u1',completed:false},
  {id:'other-person',date:'2026-09-07',time:'10:10',durationMinutes:45,title:'Afspraak ander gezinslid',assignedToUid:'u2',completed:false},
  {id:'same-source-reference',date:'2026-09-07',time:'10:05',durationMinutes:30,title:'Zelfde bronreferentie',sourceId:'occ1',assignedToUid:'u1'},
  {id:'flex-clean',date:'2026-09-08',time:'11:00',title:'Flexibel schoonmaken',assignedToUid:'u1',flexible:true,projectionManaged:true,sourceType:'cleaning-occurrence',cleaningOccurrenceId:'occ1'}
];

const conflicts=assist._deriveConflicts(root,calendar,{fromIso:'2026-09-05',days:7});
assert.strictEqual(conflicts.length,1,'only the timed cleaning event with a real overlap should conflict');
assert.strictEqual(conflicts[0].id,'clean-1');
assert.strictEqual(conflicts[0].conflicts.length,1,'same source reference and other assignee must not become conflicts');
assert.strictEqual(conflicts[0].conflicts[0].id,'meeting');
assert.strictEqual(conflicts[0].potential,false,'known duration + same explicit assignee should be a hard conflict');

const suggestions=assist._suggestTimes(root,cleaningEvent,calendar,3);
assert.ok(suggestions.length>0&&suggestions.length<=3,'must offer a short list of same-day alternatives');
assert.strictEqual(suggestions[0],'09:30','nearest free half-hour should be preferred');
const blockerStart=10*60+15,blockerEnd=10*60+45;
suggestions.forEach((time)=>{
  const start=assist._timeMinutes(time),end=start+30;
  assert.ok(!(start<blockerEnd&&blockerStart<end),'suggestion may not overlap known blocker');
});

const needs=assist._weeklySupplyNeeds(root,{fromIso:'2026-09-05',days:7});
assert.deepStrictEqual(Array.from(needs).map((row)=>row.id),['cleaner'],'only LOW/OUT supplies actually needed inside the next seven days belong in the bundle');
assert.strictEqual(needs[0].status,'OUT');
assert.deepStrictEqual(Array.from(needs[0].occurrenceIds),['occ1']);
assert.deepStrictEqual(Array.from(needs[0].roomNames),['Badkamer']);
assert.strictEqual(assist._filterHiddenNeeds(needs,{cleaner:true}).length,0,'a dismissed supply must disappear from the visible weekly bundle');
assert.deepStrictEqual(Array.from(assist._filterHiddenNeeds(needs,{})).map((row)=>row.id),['cleaner'],'non-dismissed supplies must stay visible');

const shoppingRecords=assist._shoppingRecordsForNeeds(needs);
assert.strictEqual(shoppingRecords.length,1);
assert.strictEqual(shoppingRecords[0].source,'cleaning');
assert.strictEqual(shoppingRecords[0].cleaningSupplyId,'cleaner');
assert.deepStrictEqual(Array.from(shoppingRecords[0].cleaningOccurrenceIds),['occ1']);

const openProjection={shared:{household_default:{id:'household_default',items:{
  a:{name:'Badkamerreiniger',source:'cleaning',cleaningSupplyId:'cleaner',done:false,updatedAt:150},
  b:{name:'Badkamerreiniger',source:'manual',done:false,updatedAt:151},
  c:{name:'Badkamerreiniger',source:'cleaning',cleaningSupplyId:'cleaner',done:true,updatedAt:152},
  d:{name:'Handschoenen',source:'cleaning',cleaningSupplyId:'gloves',done:false,updatedAt:153}
}}},private:{}};
const openLookup=assist._openShoppingLookup(root,openProjection);
assert.strictEqual(openLookup.cleaner,true,'an open Cleaning shopping item must suppress a duplicate weekly add prompt');
const removable=assist._openCleaningShoppingRowsForSupply(root,openProjection,'cleaner');
assert.strictEqual(removable.length,1,'dismiss must target only the exact open Cleaning-linked shopping row');
assert.strictEqual(removable[0].key,'a','manual, completed or another-supply rows must be protected');

const purchasedProjection={shared:{household_default:{id:'household_default',items:{a:{name:'Badkamerreiniger',source:'cleaning',cleaningSupplyId:'cleaner',done:true,updatedAt:200}}}},private:{}};
let purchased=assist._purchasedSupplySuggestions(root,purchasedProjection);
assert.strictEqual(purchased.length,1,'a newly checked-off Cleaning item may suggest restoring stock');
assert.strictEqual(purchased[0].id,'cleaner');
const restocked=JSON.parse(JSON.stringify(root));
restocked.inventory.cleaner.updatedAt=300;
purchased=assist._purchasedSupplySuggestions(restocked,purchasedProjection);
assert.strictEqual(purchased.length,0,'after inventory was explicitly updated, the old purchase must not keep prompting');

const legacyNameOnly={shared:{household_default:{id:'household_default',items:{a:{name:'Badkamerreiniger',source:'cleaning',done:true,updatedAt:200}}}},private:{}};
assert.strictEqual(assist._purchasedSupplySuggestions(root,legacyNameOnly).length,1,'older Cleaning shopping items remain resolvable by an exact unique supply name');

assert.ok(source.includes("runtime.transact('calendar'"),'moving a suggestion must use the existing canonical reverse-sync runtime');
assert.ok(source.includes('store.addItems(null,records,{dedupe:true})'),'weekly supplies must only use ShoppingListStore after a user action');
assert.ok(source.includes('repo.deleteItem(row.scope,row.listId,row.key)'),'dismiss must remove only resolved open Cleaning shopping rows through the Shopping repository');
assert.ok(source.includes('HIDDEN_KEY_PREFIX'),'dismissed weekly supplies must use a scoped presentation preference');
assert.ok(source.includes('supplies.setSupplyStatus(id,STATUS.IN_STOCK)'),'restock confirmation must use Cleaning supply status boundary');
assert.ok(!source.includes('.transaction('),'week assist itself must not own a Firebase transaction');
assert.ok(!source.includes('cleaning-approval-copy'),'week assist may not own Planning approval copy');
assert.ok(!source.includes('cleaning-plan-actions > span'),'week assist may not rewrite Planning hero approval text');

console.log('cleaning week assist detects conflicts, bundles supplies and safely dismisses unwanted purchases: ok');
