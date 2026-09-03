'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','src','modules','cleaning','cleaningQuickChoiceFeedback.js'),'utf8');

function harness(){
  let clock=1000;
  let scrollTop=620;
  let buttons=[];
  const listeners={};
  const attributes={};
  const toasts=[];
  const timers=[];

  const documentElement={
    setAttribute:(name,value)=>{attributes[name]=value;},
    removeAttribute:(name)=>{delete attributes[name];}
  };
  const document={
    documentElement,
    body:{appendChild:()=>{}},
    head:{appendChild:()=>{}},
    getElementById:()=>null,
    createElement:()=>({
      id:'',textContent:'',style:{cssText:''},parentNode:null,
      setAttribute:()=>{},remove:()=>{}
    }),
    addEventListener:(name,callback)=>{listeners[name]=callback;},
    querySelectorAll:(selector)=>selector.indexOf('data-cleaning-template-add')>=0?buttons:[]
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
    get scrollY(){return scrollTop;},
    get pageYOffset(){return scrollTop;},
    scrollTo:(value,y)=>{scrollTop=typeof value==='object'?Number(value.top)||0:Number(y)||0;}
  };
  context.window=context;
  vm.runInNewContext(source,context,{filename:'cleaningQuickChoiceFeedback.js'});

  function button(disabled){
    return{
      disabled:!!disabled,
      getAttribute:(name)=>name==='data-cleaning-template-add'?'room-1':name==='data-cleaning-template-key'?'preset-1':null,
      closest:(selector)=>selector.indexOf('data-cleaning-template-add')>=0?this:null
    };
  }

  return{
    context,listeners,attributes,toasts,timers,
    setClock:(value)=>{clock=value;},
    setScroll:(value)=>{scrollTop=value;},
    getScroll:()=>scrollTop,
    setButtons:(value)=>{buttons=value;},
    button
  };
}

// Successful quick choice: stay at the current position and show one toast
// only after the canonical echo removes the preset from the list.
{
  const h=harness();
  const preset=h.button(false);
  h.setButtons([preset]);
  h.listeners.click({target:{closest:()=>preset}});
  assert.strictEqual(h.attributes['data-cleaning-quick-choice-pending'],'1');
  assert.deepStrictEqual(h.toasts,[]);

  preset.disabled=true;
  h.setScroll(0);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.strictEqual(h.getScroll(),620,'pending render must restore the captured position');
  assert.deepStrictEqual(h.toasts,[]);

  h.setButtons([]);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.strictEqual(h.getScroll(),620,'repository echo must not jump to the top');
  assert.deepStrictEqual(h.toasts,['Routine toegevoegd ✓']);
  h.context.CleaningQuickChoiceFeedback._reconcile();
  assert.deepStrictEqual(h.toasts,['Routine toegevoegd ✓'],'success toast must be emitted once');
}

// Failed write: the button returns enabled, suppression is removed and no
// success toast is shown, so the normal inline error can remain visible.
{
  const h=harness();
  const preset=h.button(false);
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

assert.ok(!source.includes('scrollIntoView'));
console.log('cleaning quick-choice toast + scroll preservation: ok');
