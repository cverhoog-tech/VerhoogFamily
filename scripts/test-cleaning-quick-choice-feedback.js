'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningQuickChoiceFeedback.js'),'utf8');

function harness(){
  let clock=1000;
  let windowScroll=620;
  let buttons=[];
  let roomCards=[];
  const listeners={};
  const attributes={};
  const toasts=[];
  const timers=[];

  const documentElement={
    setAttribute:(name,value)=>{attributes[name]=value;},
    removeAttribute:(name)=>{delete attributes[name];}
  };
  const body={};
  const document={
    documentElement,
    body,
    head:{appendChild:()=>{}},
    getElementById:()=>null,
    createElement:()=>({
      id:'',textContent:'',style:{cssText:''},parentNode:null,
      setAttribute:()=>{},remove:()=>{}
    }),
    addEventListener:(name,callback)=>{listeners[name]=callback;},
    querySelectorAll:(selector)=>{
      if(selector.indexOf('.cleaning-room-card')>=0)return roomCards;
      if(selector.indexOf('data-cleaning-template-add')>=0)return buttons;
      return [];
    }
  };
  const context={
    console,
    Date:{now:()=>clock},
    document,
    MutationObserver:function MutationObserver(){this.observe=()=>{};},
    requestAnimationFrame:(callback)=>{callback();return 1;},
    setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},
    clearTimeout:()=>{},
    addEventListener:()=>{},
    showToast:(message)=>{toasts.push(message);},
    getComputedStyle:(node)=>({overflowY:node&&node.__scrollContainer?'auto':'visible'}),
    get scrollY(){return windowScroll;},
    get pageYOffset(){return windowScroll;},
    scrollTo:(value,y)=>{windowScroll=typeof value==='object'?Number(value.top)||0:Number(y)||0;},
    scrollBy:(x,y)=>{windowScroll+=Number(y)||0;}
  };
  context.window=context;
  vm.runInNewContext(source,context,{filename:'cleaningQuickChoiceFeedback.js'});

  function preset(roomId,key,disabled){
    return{
      disabled:!!disabled,
      parentElement:null,
      previousElementSibling:null,
      getAttribute:(name)=>name==='data-cleaning-template-add'?roomId:name==='data-cleaning-template-key'?key:null,
      hasAttribute:(name)=>name==='data-cleaning-template-key',
      closest:()=>null,
      getBoundingClientRect:()=>({top:0})
    };
  }

  return{
    context,listeners,attributes,toasts,timers,body,
    setClock:(value)=>{clock=value;},
    setWindowScroll:(value)=>{windowScroll=value;},
    getWindowScroll:()=>windowScroll,
    setButtons:(value)=>{buttons=value;},
    setRoomCards:(value)=>{roomCards=value;},
    preset
  };
}

// Successful quick choice using the window as fallback scroll container.
{
  const h=harness();
  const preset=h.preset('room-1','preset-1',false);
  h.setButtons([preset]);
  h.listeners.click({target:{closest:()=>preset}});
  assert.strictEqual(h.context.CleaningQuickChoiceFeedback.version,'0.3.0');
  assert.strictEqual(h.attributes['data-cleaning-quick-choice-pending'],'1');
  assert.deepStrictEqual(h.toasts,[]);

  preset.disabled=true;
  h.setWindowScroll(0);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.strictEqual(h.getWindowScroll(),620,'pending render must restore the fallback window position');
  assert.deepStrictEqual(h.toasts,[]);

  h.setButtons([]);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.strictEqual(h.getWindowScroll(),620,'repository echo must not jump to the top');
  assert.deepStrictEqual(h.toasts,['Routine toegevoegd ✓']);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.deepStrictEqual(h.toasts,['Routine toegevoegd ✓'],'success toast must be emitted once');
}

// The app scrolls inside a nested screen container on iPhone. Preserve the
// visible anchor there rather than restoring window.scrollY.
{
  const h=harness();
  const container={__scrollContainer:true,scrollTop:400,scrollHeight:1400,clientHeight:500,parentElement:h.body};
  let anchorTop=420;
  const previous=h.preset('room-1','preset-0',false);
  previous.parentElement=container;
  previous.getBoundingClientRect=()=>({top:anchorTop});
  const clicked=h.preset('room-1','preset-1',false);
  clicked.parentElement=container;
  clicked.previousElementSibling=previous;
  const card={
    getAttribute:(name)=>name==='data-cleaning-room-id'?'room-1':null,
    querySelectorAll:(selector)=>selector.indexOf('data-cleaning-template-key')>=0?[previous,clicked]:[],
    querySelector:()=>null
  };
  h.setButtons([previous,clicked]);
  h.setRoomCards([card]);

  const viewport=h.context.CleaningQuickChoiceFeedback._captureViewport(clicked,'room-1');
  assert.strictEqual(viewport.container,container);
  assert.strictEqual(viewport.anchorKind,'template');
  assert.strictEqual(viewport.anchorKey,'preset-0');
  assert.strictEqual(viewport.anchorTop,420);

  // The new routine is inserted above the suggestions, moving the previous
  // preset 40px upward. The nested container must compensate by 40px.
  anchorTop=380;
  h.context.CleaningQuickChoiceFeedback._restoreViewport({viewport});
  assert.strictEqual(container.scrollTop,360,'nested scroll container must keep the same visual anchor');
  assert.strictEqual(h.getWindowScroll(),620,'window scroll must remain untouched');
}

// Failed write: original button returns enabled; no success toast.
{
  const h=harness();
  const preset=h.preset('room-1','preset-1',false);
  h.setButtons([preset]);
  h.listeners.click({target:{closest:()=>preset}});
  preset.disabled=true;
  h.setClock(1100);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  preset.disabled=false;
  h.setClock(1300);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.strictEqual(h.attributes['data-cleaning-quick-choice-pending'],undefined);
  assert.deepStrictEqual(h.toasts,[]);
}

assert.ok(source.includes('scrollContainerFor'));
assert.ok(source.includes('anchorTop'));
assert.ok(!source.includes('scrollIntoView'));
console.log('cleaning quick-choice toast + nested scroll anchoring: ok');
