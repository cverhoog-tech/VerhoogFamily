'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningApprovalClarity.js'),'utf8');
const document={
  getElementById:()=>null,addEventListener:()=>{},documentElement:{},head:{appendChild:()=>{}},
  createElement:()=>({id:'',textContent:'',appendChild:()=>{},setAttribute:()=>{}})
};
const context={
  console,Date,Math,JSON,Promise,document,
  requestAnimationFrame:(fn)=>{fn();return 1;},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},
  addEventListener:()=>{},dispatchEvent:()=>{},MutationObserver:function(){this.observe=()=>{};this.disconnect=()=>{};}
};
context.window=context;
vm.runInNewContext(source,context,{filename:'cleaningApprovalClarity.js'});
const clarity=context.CleaningApprovalClarity;
assert.ok(clarity);
assert.strictEqual(clarity.version,'0.1.0');
assert.strictEqual(clarity._bannerModel({id:'p1',status:'DRAFT'}).title,'Nog niet actief');
assert.strictEqual(clarity._bannerModel({id:'p1',status:'ACTIVE'}).title,'Plan is actief ✓');

assert.ok(source.includes('Jouw akkoord is nog nodig'));
assert.ok(source.includes('Nog niet actief · wacht op '));
assert.ok(source.includes('Planning vernieuwen'));
assert.ok(source.includes('CleaningPlanSanitizer'));
assert.ok(source.includes('De huidige goedkeuringen blijven waar mogelijk behouden'));
assert.ok(!source.includes('cleaning-approval-copy'),'clarity decorator may not rewrite the canonical approval copy');
assert.ok(!source.includes('cleaning-plan-actions > span'),'clarity decorator may not rewrite Planning hero copy');

console.log('cleaning explicit approval clarity + safe refresh action: ok');
