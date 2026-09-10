'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningRoomWorkflowUx.js'),'utf8');
const document={
  getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  addEventListener:()=>{},documentElement:{},body:{},head:{appendChild:()=>{}},
  createElement:()=>({id:'',textContent:'',appendChild:()=>{},setAttribute:()=>{}})
};
const context={
  console,Date,Math,JSON,Promise,document,
  requestAnimationFrame:(fn)=>{fn();return 1;},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},
  addEventListener:()=>{},dispatchEvent:()=>{},MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningRoomWorkflowUx.js'});
const ux=context.CleaningRoomWorkflowUx;
assert.ok(ux);
assert.strictEqual(ux.version,'0.2.0');
assert.strictEqual(ux._roomLabel('living-room'),'Woonkamer');
assert.strictEqual(ux._roomLabel('bathroom'),'Badkamer');
assert.strictEqual(ux._defaultRoomName('living-room',[]),'Woonkamer');
assert.strictEqual(ux._defaultRoomName('living-room',[{name:'Woonkamer',active:true}]),'Woonkamer 2');
assert.strictEqual(ux._defaultRoomName('living-room',[{name:'Woonkamer',active:true},{name:'Woonkamer 2',active:true}]),'Woonkamer 3');
assert.strictEqual(ux._defaultRoomName('living-room',[{name:'Woonkamer',active:false}]),'Woonkamer','removed rooms may not reserve the default name');
assert.strictEqual(ux._defaultRoomName('custom',[]),'','custom rooms still require a real name');

assert.ok(source.includes("label.textContent=type==='custom'?'Naam':'Naam (optioneel)'"));
assert.ok(source.includes("form.insertBefore(typeField,nameField)"),'room type must be visually above the optional name');
assert.ok(source.includes('prepareOptionalName'));
assert.ok(source.includes("document.addEventListener('submit',onSubmit,true)"),'optional standard name is resolved before canonical form submit');
assert.ok(source.includes('data-cleaning-routine-more'));
assert.ok(source.includes('cleaning-routine-more-menu'));
assert.ok(source.includes('Bewerken'));
assert.ok(source.includes('Toewijzen'));
assert.ok(source.includes('Pauzeren'));
assert.ok(source.includes('Verwijderen'));
assert.ok(source.includes('cleaning-routine-edit-button'));
assert.ok(source.includes('cleaning-routine-assign-button'));
assert.ok(source.includes('cleaning-routine-pause-button'));
assert.ok(source.includes('cleaning-routine-remove-button'));
assert.ok(source.includes("action==='pause'"),'compact menu must proxy the canonical pause control');
assert.ok(source.includes('display:none!important'),'separate routine controls are visually collapsed behind one menu');
assert.ok(!source.includes('cleaning-approval-copy'));
assert.ok(!source.includes('cleaning-plan-actions > span'));

console.log('cleaning optional room name + compact edit/assign/pause/remove actions: ok');