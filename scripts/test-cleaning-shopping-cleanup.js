'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const sandbox={
  console,Promise,JSON,Date,Math,
  setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},
  addEventListener:()=>{},dispatchEvent:()=>{},CustomEvent:function(name,options){this.type=name;this.detail=options&&options.detail;}
};
sandbox.window=sandbox;
const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningShoppingCleanup.js'),'utf8');
vm.runInNewContext(source,sandbox,{filename:'cleaningShoppingCleanup.js'});
const cleanup=sandbox.CleaningShoppingCleanup;
assert.ok(cleanup);
assert.strictEqual(cleanup.version,'0.1.0');

const cleaning={
  rooms:{
    kitchen:{id:'kitchen',active:true},
    bathroom:{id:'bathroom',active:false},
    utility:{id:'utility',active:true}
  },
  supplies:{
    soap:{id:'soap',name:'Allesreiniger',active:true},
    gloves:{id:'gloves',name:'Handschoenen',active:true},
    descaler:{id:'descaler',name:'Ontkalker',active:true},
    cloth:{id:'cloth',name:'Microvezeldoek',active:true}
  },
  routines:{
    worktop:{id:'worktop',roomId:'kitchen',active:true,supplyIds:['soap','cloth']},
    shower:{id:'shower',roomId:'bathroom',active:true,supplyIds:['descaler','gloves']},
    laundry:{id:'laundry',roomId:'utility',active:true,supplyIds:['gloves']},
    retired:{id:'retired',roomId:'kitchen',active:false,supplyIds:['descaler']}
  }
};

const needed=cleanup._requiredSupplyIds(cleaning);
assert.strictEqual(needed.soap,true);
assert.strictEqual(needed.cloth,true);
assert.strictEqual(needed.gloves,true,'shared supply stays needed through another active room');
assert.strictEqual(needed.descaler,undefined,'supplies used only by deleted/inactive sources are orphaned');

assert.strictEqual(cleanup._resolveSupplyId(cleaning,{name:' Ontkalker '}),'descaler','legacy cleaning items resolve safely by canonical supply name');
assert.strictEqual(cleanup._resolveSupplyId(cleaning,{name:'Iets onbekends'}),null,'unknown legacy name is not guessed');
assert.strictEqual(cleanup._resolveSupplyId(cleaning,{name:'Anders',cleaningSupplyId:'descaler'}),'descaler','explicit future metadata wins when present');

assert.strictEqual(cleanup._isCleaningCandidate(cleaning,{name:'Ontkalker',source:'cleaning',done:false}),true,'orphaned Cleaning item is removable');
assert.strictEqual(cleanup._isCleaningCandidate(cleaning,{name:'Handschoenen',source:'cleaning',done:false}),false,'item remains if another active routine still needs it');
assert.strictEqual(cleanup._isCleaningCandidate(cleaning,{name:'Ontkalker',source:null,done:false}),false,'manual item with same name is protected');
assert.strictEqual(cleanup._isCleaningCandidate(cleaning,{name:'Ontkalker',source:'recipe',done:false}),false,'recipe item is protected');
assert.strictEqual(cleanup._isCleaningCandidate(cleaning,{name:'Ontkalker',source:'cleaning',done:true}),false,'completed shopping history is protected');
assert.strictEqual(cleanup._isCleaningCandidate(cleaning,{name:'Onbekend',source:'cleaning',done:false}),false,'unknown legacy Cleaning item is preserved rather than guessed');

const shopping={
  shared:{
    household_default:{id:'household_default',items:{
      stale:{_key:'stale',name:'Ontkalker',source:'cleaning',done:false},
      keepShared:{_key:'keepShared',name:'Handschoenen',source:'cleaning',done:false},
      manual:{_key:'manual',name:'Ontkalker',source:null,done:false},
      done:{_key:'done',name:'Ontkalker',source:'cleaning',done:true}
    }}
  },
  private:{
    mine:{id:'mine',items:{
      explicit:{_key:'explicit',name:'Oud label',source:'cleaning',cleaningSupplyId:'descaler',done:false},
      active:{_key:'active',name:'Allesreiniger',source:'cleaning',done:false}
    }}
  }
};
const rows=cleanup._cleanupCandidates(cleaning,shopping);
assert.strictEqual(rows.length,2);
assert.deepStrictEqual(Array.from(rows).map((row)=>row.scope+':'+row.listId+':'+row.itemKey).sort(),[
  'private:mine:explicit',
  'shared:household_default:stale'
]);

assert.ok(source.includes("text(item.source).toLowerCase()!=='cleaning'"),'only explicit Cleaning-origin items can be auto-pruned');
assert.ok(source.includes('item.done===true'),'completed shopping history must remain');
assert.ok(source.includes('ShoppingListHouseholdRepository'),'cleanup uses the canonical shopping repository');
assert.ok(!source.includes('cleaning-approval-copy'),'shopping cleanup may not own Planning UI');

console.log('cleaning shopping lifecycle cleanup: ok');
