'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningSupplyDirectManager.js'),'utf8');
const document={
  getElementById:()=>null,querySelector:()=>null,addEventListener:()=>{},
  body:{},documentElement:{},head:{appendChild:()=>{}},
  createElement:()=>({id:'',textContent:'',appendChild:()=>{},setAttribute:()=>{}})
};
const context={
  console,Date,Math,JSON,Promise,document,
  requestAnimationFrame:(fn)=>{fn();return 1;},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},
  addEventListener:()=>{},dispatchEvent:()=>{},MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningSupplyDirectManager.js'});
const manager=context.CleaningSupplyDirectManager;
assert.ok(manager);
assert.strictEqual(manager.version,'0.1.0');
assert.deepStrictEqual(Array.from(manager._toggleLinkIds(['soap'],'cloth',true)),['soap','cloth']);
assert.deepStrictEqual(Array.from(manager._toggleLinkIds(['soap','cloth'],'soap',false)),['cloth']);
assert.deepStrictEqual(Array.from(manager._toggleLinkIds(['soap','soap'],'soap',true)),['soap'],'link mutations remain duplicate-free');

assert.ok(source.includes('data-cleaning-supply-direct-target'),'popup lets the user select the owning routine directly');
assert.ok(source.includes('data-cleaning-supply-direct-name'),'popup has direct item creation');
assert.ok(source.includes('data-cleaning-supply-direct-suggest'),'smart suggestions are available in the popup itself');
assert.ok(source.includes('data-cleaning-supply-link-routine'),'existing items can change routine ownership without opening routine edit');
assert.ok(source.includes("write.db.ref(write.path+'/routines/'+routineId).transaction"),'supply link writes stay scoped to one routine');
assert.ok(source.includes('CleaningSupplyExperience'));
assert.ok(source.includes('_smartSuggestions'));
assert.ok(source.includes('Koppel aan routine'));
assert.ok(source.includes('Gebruikt bij'));
assert.ok(!source.includes('cleaning-approval-copy'));
assert.ok(!source.includes('cleaning-plan-actions > span'));

console.log('cleaning direct room supply manager: ok');
