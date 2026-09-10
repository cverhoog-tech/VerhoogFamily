'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningRoomListControlsV2.js'),'utf8');
const context={
  console,Date,
  setTimeout:()=>1,clearTimeout:()=>{},requestAnimationFrame:(fn)=>{fn();return 1;},
  addEventListener:()=>{},showToast:()=>{},
  MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};},
  HouseholdContext:{
    snapshot:()=>({ready:true,uid:'u1',householdId:'family-1'}),
    capture:()=>({uid:'u1',householdId:'family-1',revision:1}),
    isCurrent:()=>true
  },
  CleaningDomain:{basePath:(id)=>'families/'+id+'/cleaning'},
  document:{
    body:{},documentElement:{},head:{appendChild:()=>{}},
    getElementById:()=>null,
    querySelector:()=>null,
    querySelectorAll:()=>[],
    addEventListener:()=>{},
    createElement:()=>({
      id:'',className:'',textContent:'',innerHTML:'',style:{},parentNode:null,
      classList:{toggle:()=>{}},
      setAttribute:()=>{},getAttribute:()=>null,appendChild:()=>{},insertBefore:()=>{},querySelector:()=>null
    })
  }
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningRoomListControlsV2.js'});

const controls=context.CleaningRoomListControlsV2;
assert.strictEqual(controls.version,'0.2.0');

const rooms={
  first:{id:'first',name:'Woonkamer',active:true,createdAt:10,sortOrder:2000},
  second:{id:'second',name:'Keuken',active:true,createdAt:20,sortOrder:1000},
  unordered:{id:'unordered',name:'Zolder',active:true,createdAt:30},
  deleted:{id:'deleted',name:'Oude kamer',active:false,createdAt:1,sortOrder:0}
};
assert.deepStrictEqual(
  Array.from(controls._activeRoomsFrom(rooms)).map((room)=>room.id),
  ['second','first','unordered'],
  'stored order must win and unordered new rooms must remain at the end'
);

const moved=controls._reorderRooms(rooms,'first',-1,'u1',12345);
assert.strictEqual(moved.changed,true);
assert.deepStrictEqual(Array.from(moved.order),['first','second','unordered']);
assert.strictEqual(moved.rooms.first.sortOrder,1000);
assert.strictEqual(moved.rooms.second.sortOrder,2000);
assert.strictEqual(moved.rooms.unordered.sortOrder,3000);
assert.strictEqual(moved.rooms.first.updatedByUid,'u1');
assert.strictEqual(moved.rooms.first.updatedAt,12345);
assert.strictEqual(moved.rooms.deleted.sortOrder,0,'inactive rooms must not be reordered');

const boundary=controls._reorderRooms(moved.rooms,'first',-1,'u1',12346);
assert.strictEqual(boundary.changed,false,'top room cannot move further up');
assert.deepStrictEqual(Array.from(boundary.order),['first','second','unordered']);

assert.ok(source.includes('data-cleaning-routine-remove'));
assert.ok(source.includes('Zeker verwijderen?'));
assert.ok(source.includes('removeRoutineItem'));
assert.ok(source.includes("ref(write.path+'/rooms').transaction"));
assert.ok(source.includes('data-cleaning-room-move'));
assert.ok(source.includes('data-order-signature'));
assert.ok(source.includes("if(bar.getAttribute('data-order-signature')!==signature)"),'room controls must not rewrite identical DOM on every observer pass');
assert.ok(!source.includes('cleaning-approval-copy'));
assert.ok(!source.includes('cleaning-plan-actions > span'));

console.log('cleaning direct routine removal + persistent room ordering: ok');
