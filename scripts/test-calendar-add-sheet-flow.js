'use strict';
const fs=require('fs');
const assert=require('assert');
const vm=require('vm');

const source=fs.readFileSync('src/modules/calendar/calendarSharedLive.js','utf8');
function tick(){return new Promise(resolve=>setTimeout(resolve,0));}
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v));}

(async function(){
  const created=[];
  const rows=[];
  let subscriber=null;
  let closeCount=0;
  let decorated=0;
  let prevented=0;

  function element(value){
    return {
      value:value||'',
      textContent:'',
      disabled:false,
      attrs:{},
      onclick:null,
      setAttribute(k,v){this.attrs[k]=String(v);},
      removeAttribute(k){delete this.attrs[k];}
    };
  }
  const els={
    f1:element(''),
    f2:element(''),
    f3:element('10:00'),
    'cal-description':element(''),
    'sheet-title':element(''),
    button:element('')
  };
  els.button.textContent='Toevoegen';

  const repository={
    start(){return true;},
    subscribe(fn){subscriber=fn;fn(rows.slice(),{source:'test',ready:true,uid:'u1',householdId:'h1',revision:1});return function(){};},
    create(input){
      created.push(clone(input));
      const row=Object.assign({},clone(input),{id:'cal_test_1',_key:'id_cal_test_1',householdId:'h1',createdByUid:'u1',createdAt:1,updatedAt:2,schemaVersion:2});
      rows.push(row);
      return Promise.resolve(clone(row));
    },
    updateOne(){return Promise.reject(new Error('not used'));},
    remove(){return Promise.resolve(true);},
    get(id){return rows.find(r=>String(r.id)===String(id))||null;},
    status(){return{ready:true,uid:'u1',householdId:'h1',count:rows.length};}
  };
  const HouseholdContext={snapshot(){return{ready:true,uid:'u1',householdId:'h1',revision:1};}};
  const document={
    readyState:'complete',
    getElementById(id){return els[id]||null;},
    querySelector(selector){return selector==='#add-overlay .sheet-btn'?els.button:null;}
  };
  const window={
    CalendarEventHouseholdRepository:repository,
    HouseholdContext,
    currentAddType:'',
    calSelDay:'2026-08-29',
    __calendarSelectedDate:'',
    calData:[],
    renderCal(){},
    updateStats(){},
    showToast(){},
    dispatchEvent(){},
    addEventListener(){},
    openAdd(type){
      this.currentAddType=type;
      els.f1.value='';els.f2.value='';els.f3.value='10:00';els['cal-description'].value='';
      els.button.textContent='Toevoegen';els.button.disabled=false;els.button.onclick=null;
      return true;
    },
    saveItem(){throw new Error('legacy saveItem must not own calendar button tap');},
    closeAdd(){closeCount++;this.currentAddType='';return true;},
    CalendarPremiumUi:{decorateSheet(){decorated++;}}
  };
  function CustomEvent(type,opts){this.type=type;this.detail=opts&&opts.detail;}
  const sandbox={window,document,HouseholdContext,CalendarPremiumUi:window.CalendarPremiumUi,CustomEvent,showToast:window.showToast,console,Promise,Date,Math,JSON,Object,String,Number,Array,setTimeout,clearTimeout,setInterval(){return 1;},clearInterval(){}};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'calendarSharedLive.js'});

  assert.ok(window.CalendarSharedLive,'CalendarSharedLive must register');
  assert.strictEqual(window.CalendarSharedLive.version,'2.0.3','interaction regression must target hardened calendar facade');

  // Exact user flow: selected day -> add sheet -> selected date is prefilled.
  window.openAdd('cal');
  assert.ok(decorated>=1,'calendar premium decorator must still run');
  assert.strictEqual(els.f2.value,'2026-08-29','selected agenda day must prefill the calendar date field');
  assert.strictEqual(els.button.textContent,'Toevoegen','create sheet must show Toevoegen');
  assert.strictEqual(typeof els.button.onclick,'function','visible calendar primary button must receive a direct submit handler');

  els.f1.value='Tandarts';
  els.f3.value='14:30';
  els['cal-description'].value='Controle';
  const result=els.button.onclick({preventDefault(){prevented++;}});
  assert.strictEqual(result,false,'calendar submit handler must consume the button tap');
  assert.strictEqual(prevented,1,'calendar primary button must prevent default browser behavior');
  assert.strictEqual(els.button.disabled,true,'calendar button must lock while the canonical write is pending');
  await tick();await tick();

  assert.strictEqual(created.length,1,'one button tap must create exactly one calendar event');
  assert.strictEqual(created[0].title,'Tandarts','created event must use entered title');
  assert.strictEqual(created[0].date,'2026-08-29','created event must preserve the selected/prefilled date');
  assert.strictEqual(created[0].time,'14:30','created event must use entered time');
  assert.strictEqual(created[0].description,'Controle','created event must use entered description');
  assert.strictEqual(closeCount,1,'successful create must close the add sheet');
  assert.ok(window.calData.some(r=>r.id==='cal_test_1'),'successful create must be projected immediately');

  // Explicit selection marker takes precedence when present (used as a robust
  // bridge if a UI layer does not expose calSelDay as a normal window value).
  window.__calendarSelectedDate='2026-09-03';
  window.openAdd('cal');
  assert.strictEqual(els.f2.value,'2026-09-03','explicit selected-date marker must prefill the next create sheet');

  console.log('STEP 6 calendar add-sheet interaction contract: PASS');
})().catch(error=>{console.error(error);process.exit(1);});
