'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/shop/shopInteractionBurstPolish.js','utf8');
const loader=fs.readFileSync('api/app.js','utf8');

assert.ok(source.includes('IDLE_FLUSH_MS=420'),'rapid taps must be coalesced behind a short idle window');
assert.ok(source.includes('lane.desiredDone=!lane.desiredDone'),'every tap must toggle the queued local end-state immediately');
assert.ok(source.includes('repository.setItem(lane.scope,lane.listId,lane.itemKey,{done:desired})'),'flush must write only the final done patch through the canonical repository');
assert.ok(source.includes("window.addEventListener('pagehide',flushAll)"),'queued taps must flush before page exit');
assert.ok(source.includes('visibilitychange'),'queued taps must flush when the PWA backgrounds');
assert.ok(source.includes('inset:-11px'),'checkbox touch target must extend beyond the visible circle');
assert.ok(source.includes(':has(.shopping-conflict-list) .fam-modal-primary'),'duplicate resolver primary action must receive stronger contrast');
assert.ok(source.includes(':has(.shopping-conflict-list) .fam-modal-secondary'),'duplicate resolver secondary action must receive its own contrasting treatment');
const shopIndex=loader.indexOf('src/modules/shop/shop.js?v=8');
const burstIndex=loader.indexOf('src/modules/shop/shopInteractionBurstPolish.js?v=1');
const addIndex=loader.indexOf('src/modules/shop/groceryAddSheet.js?v=2');
assert.ok(shopIndex>=0&&burstIndex>shopIndex&&addIndex>burstIndex,'burst interaction layer must load after shop renderer and before add sheet');

function classList(){const set=new Set();return{toggle(name,on){if(on)set.add(name);else set.delete(name);},contains(name){return set.has(name);},add(name){set.add(name);},remove(name){set.delete(name);}};}
(async function(){
  const item={_key:'milk',name:'Melk',done:false};
  const row={key:'shared:list',scope:'shared',list:{id:'list',items:{milk:item}}};
  const writes=[];
  const window={
    ShoppingListStore:{active(){return row;}},
    ShoppingListHouseholdRepository:{setItem(scope,listId,key,patch){writes.push({scope,listId,key,patch:Object.assign({},patch)});item.done=!!patch.done;return Promise.resolve(Object.assign({},item));}},
    toggleShop(){throw new Error('fallback should not be used');},
    addEventListener(){},
    awardXP(){},addActivity(){},myName:'Test',
    renderShop(){},showToast(){}
  };
  const check={classList:classList(),innerHTML:''};
  const name={classList:classList()};
  const visualRow={classList:classList(),offsetWidth:1,querySelector(){return name;}};
  const document={
    readyState:'complete',visibilityState:'visible',head:{appendChild(){}},addEventListener(){},
    createElement(){return{id:'',textContent:''};},
    getElementById(id){if(id==='shck-milk')return check;if(id==='si-milk')return visualRow;return null;}
  };
  const sandbox={window,document,console,setTimeout,clearTimeout,Object,Array,String,Promise,JSON,Date,Math};
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'shopInteractionBurstPolish.js'});
  window.toggleShop('milk');window.toggleShop('milk');window.toggleShop('milk');
  assert.strictEqual(check.classList.contains('done'),true,'three rapid taps must paint the final checked state immediately');
  assert.strictEqual(writes.length,0,'rapid taps must not start Firebase writes before the idle window');
  await new Promise(resolve=>setTimeout(resolve,500));
  assert.strictEqual(writes.length,1,'three rapid taps on one item must coalesce to one canonical write');
  assert.strictEqual(writes[0].patch.done,true,'coalesced write must persist the final checked state');
  console.log('STEP 7 shopping burst interaction contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
