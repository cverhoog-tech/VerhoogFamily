'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const utilsSource=fs.readFileSync(path.join(__dirname,'..','src','core','utils.js'),'utf8');
const homeSource=fs.readFileSync(path.join(__dirname,'..','src','modules','home','home.js'),'utf8');

const nodes={
  'stat-tasks':{textContent:''},
  'stat-cleaning':{textContent:''},
  'stat-shop':{textContent:''},
  'stat-feed':{textContent:''}
};

function localIso(offsetDays){
  const value=new Date();
  value.setHours(12,0,0,0);
  value.setDate(value.getDate()+offsetDays);
  const month=String(value.getMonth()+1).padStart(2,'0');
  const day=String(value.getDate()).padStart(2,'0');
  return value.getFullYear()+'-'+month+'-'+day;
}

const context={
  console,
  Date,
  Math,
  JSON,
  localStorage:{getItem:()=>null,setItem:()=>{}},
  setTimeout:()=>1,
  clearTimeout:()=>{},
  document:{
    getElementById:(id)=>nodes[id]||null,
    createElement:()=>({style:{},setAttribute:()=>{},remove:()=>{}}),
    body:{appendChild:()=>{}}
  },
  ShoppingListStore:{projection:()=>({openCount:5})},
  feedData:[{id:1},{id:2},{id:3}],
  activityData:[],
  actNextId:1,
  taskData:[
    {id:'overdue',date:localIso(-1),done:false,status:'open'},
    {id:'today',dueDate:localIso(0),done:false},
    {id:'clean-source',date:localIso(0),done:false,sourceType:'cleaning-occurrence-group',cleaningOccurrenceIds:['occ-a']},
    {id:'clean-managed',date:localIso(-2),done:false,projectionManaged:true,cleaningOccurrenceId:'occ-b'},
    {id:'future',date:localIso(1),done:false},
    {id:'finished',date:localIso(0),done:true},
    {id:'completed-status',date:localIso(0),done:false,status:'COMPLETED'},
    {id:'cancelled-status',date:localIso(-1),done:false,status:'CANCELLED'},
    {id:'undated',done:false,status:'open'}
  ]
};
context.window=context;

vm.runInNewContext(utilsSource,context,{filename:'utils.js'});

assert.strictEqual(context.homeLocalTodayIso(new Date(2026,8,3,23,30,0,0)),'2026-09-03','Home counters must use local calendar dates');
assert.strictEqual(context.homeTaskNeedsAttention({date:'2026-09-03',done:false},'2026-09-03'),true);
assert.strictEqual(context.homeTaskNeedsAttention({date:'2026-09-04',done:false},'2026-09-03'),false);
assert.strictEqual(context.homeTaskNeedsAttention({date:'2026-09-03',done:true},'2026-09-03'),false);
assert.strictEqual(context.homeTaskNeedsAttention({done:false},'2026-09-03'),false,'undated backlog is not part of overdue + today');
assert.strictEqual(context.homeTaskIsCleaningProjection({sourceType:'cleaning-occurrence'}),true);
assert.strictEqual(context.homeTaskIsCleaningProjection({projectionManaged:true,cleaningOccurrenceIds:['occ-a']}),true);
assert.strictEqual(context.homeTaskIsCleaningProjection({category:'cleaning'}),false,'only canonical Cleaning projections belong on the Cleaning tile');
assert.strictEqual(context.FamilyIcons.has('cleaning'),true);

context.updateStats();
assert.strictEqual(nodes['stat-tasks'].textContent,4,'Tasks tile must count only open overdue + today tasks');
assert.strictEqual(nodes['stat-cleaning'].textContent,2,'Cleaning tile must count only open overdue + today canonical cleaning tasks');
assert.strictEqual(nodes['stat-shop'].textContent,5,'Shopping tile remains unchanged');
assert.strictEqual(nodes['stat-feed'].textContent,3,'Legacy feed counter remains harmless when its element exists');

assert.ok(homeSource.includes("count.id='stat-cleaning'"),'the third Home card must expose the Cleaning counter');
assert.ok(homeSource.includes("label.textContent='schoonmaken'"),'the third Home card must be labelled Schoonmaken');
assert.ok(homeSource.includes("window.showScreen('cleaning')"),'the Cleaning tile must navigate to the Cleaning module');
assert.ok(homeSource.includes("['.cleaning-card .card-icon .icon','cleaning']"),'the Cleaning tile must use the Cleaning icon');
assert.ok(homeSource.includes('familieapp_white_assets/tasks_background.png'),'the old Posts image must be replaced by a local household-work background');

console.log('home actionable task + cleaning counters: ok');
