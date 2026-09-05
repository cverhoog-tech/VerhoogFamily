'use strict';
// ============================================================
// CLEANING PREFERENCES UI v0.1.0
// Personal display preference (Tijd / Aantal / Beide) for Schoonmaken.
// Pure presentation: never influences FAIR_TIME distribution, assignments,
// or any canonical Cleaning data other than the user's own preferences row.
// ============================================================
(function(){
  if(window.CleaningPreferencesUi)return;

  var VERSION='0.1.0';
  var state={observer:null,queued:false,busy:false};

  var MODE_LABEL={TIME:'Tijd',COUNT:'Aantal',BOTH:'Beide'};
  var MODE_ORDER=['TIME','COUNT','BOTH'];

  function text(value){return String(value==null?'':value).trim();}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}

  function currentMode(){
    var repo=repository();
    try{
      var ctx=contextSnapshot();
      var prefs=repo&&typeof repo.getUserPreferences==='function'?repo.getUserPreferences(ctx&&ctx.uid):null;
      var mode=text(prefs&&prefs.displayMode).toUpperCase();
      return MODE_LABEL[mode]?mode:'BOTH';
    }catch(error){return'BOTH';}
  }

  // Shared formatter other Cleaning UI files can reuse so the preference is
  // applied consistently instead of every view re-implementing its own
  // Tijd/Aantal/Beide branching. Never called during distribution math.
  function format(minutes,count){
    var mode=currentMode();
    var minuteText=Math.max(0,Math.round(Number(minutes)||0))+' min';
    var countText=Math.max(0,Math.round(Number(count)||0))+' '+(Number(count)===1?'taak':'taken');
    if(mode==='TIME')return minuteText;
    if(mode==='COUNT')return countText;
    return minuteText+' · '+countText;
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-preferences-ui-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-preferences-ui-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-preferences-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;margin:0 0 12px;border:1px solid var(--cleaning-border);border-radius:16px;background:var(--cleaning-surface)}\n'
      +'#screen-cleaning .cleaning-preferences-row span{font-size:10px;font-weight:900;color:var(--cleaning-muted);text-transform:uppercase;letter-spacing:.06em}\n'
      +'#screen-cleaning .cleaning-preferences-toggle{display:inline-flex;border:1px solid var(--cleaning-border);border-radius:999px;padding:3px;background:color-mix(in srgb,var(--cleaning-accent) 4%,var(--cleaning-surface))}\n'
      +'#screen-cleaning .cleaning-preferences-option{min-height:32px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--cleaning-muted);font:inherit;font-size:10.5px;font-weight:850;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-preferences-option.is-active{background:var(--cleaning-accent);color:#fff}\n'
      +'#screen-cleaning .cleaning-preferences-option:disabled{opacity:.6;cursor:default}\n';
    document.head.appendChild(style);
  }

  function rowHtml(){
    var mode=currentMode();
    var buttons=MODE_ORDER.map(function(key){
      var active=key===mode;
      return '<button type="button" class="cleaning-preferences-option'+(active?' is-active':'')+'" data-cleaning-preferences-mode="'+escapeHtml(key)+'" aria-pressed="'+(active?'true':'false')+'"'+(state.busy?' disabled':'')+'>'+escapeHtml(MODE_LABEL[key])+'</button>';
    }).join('');
    return '<section class="cleaning-preferences-row" data-cleaning-preferences-row>'
      +'<span>Weergave</span>'
      +'<div class="cleaning-preferences-toggle" role="group" aria-label="Weergavevoorkeur Tijd, Aantal of Beide">'+buttons+'</div>'
      +'</section>';
  }

  function findAnchor(root){
    // Sits at the very top of the Overzicht panel, above the live house
    // status hero, so the preference is visible wherever counts/minutes
    // are shown without needing to touch every consuming view individually.
    var overview=root.querySelector('[data-cleaning-live-overview]');
    if(overview)return {parent:overview.parentNode,before:overview};
    var empty=root.querySelector('.cleaning-empty-card');
    if(empty&&/Huisoverzicht/.test(empty.textContent||''))return{parent:empty.parentNode,before:empty};
    return null;
  }

  function decorate(){
    state.queued=false;ensureStyle();
    var screen=document.getElementById('screen-cleaning');
    if(!screen)return;
    var overviewTab=screen.querySelector('[data-cleaning-tab="overview"].is-active');
    var panel=screen.querySelector('.cleaning-panel');
    if(!overviewTab||!panel)return;
    var existing=panel.querySelector('[data-cleaning-preferences-row]');
    var html=rowHtml();
    if(!existing){
      var anchor=findAnchor(panel);
      if(!anchor)return;
      var holder=document.createElement('div');
      holder.innerHTML=html;
      anchor.parent.insertBefore(holder.firstElementChild,anchor.before);
    }else if(existing.dataset.signature!==html){
      var next=document.createElement('div');
      next.innerHTML=html;
      var replacement=next.firstElementChild;
      replacement.dataset.signature=html;
      existing.replaceWith(replacement);
    }
    var row=panel.querySelector('[data-cleaning-preferences-row]');
    if(row)row.dataset.signature=html;
  }

  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function selectMode(mode){
    if(state.busy)return;
    var repo=repository();
    if(!repo||typeof repo.setUserPreferences!=='function'){
      if(typeof window.showToast==='function')window.showToast('Weergavevoorkeur is nog niet beschikbaar.');
      return;
    }
    if(mode===currentMode())return;
    state.busy=true;queue();
    repo.setUserPreferences({displayMode:mode}).then(function(){
      state.busy=false;queue();
    }).catch(function(error){
      state.busy=false;queue();
      if(typeof window.showToast==='function')window.showToast(text(error&&error.message)||'Weergavevoorkeur kon niet worden opgeslagen.');
    });
  }

  function onClick(event){
    var target=event.target&&event.target.closest?event.target.closest('[data-cleaning-preferences-mode]'):null;
    if(!target)return;
    event.preventDefault();
    selectMode(text(target.getAttribute('data-cleaning-preferences-mode')));
  }

  function start(){
    if(window.__cleaningPreferencesUiStarted)return;
    window.__cleaningPreferencesUiStarted=true;
    ensureStyle();
    document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'&&target){
      state.observer=new MutationObserver(queue);
      state.observer.observe(target,{childList:true,subtree:true});
    }
    window.addEventListener('familyapp:cleaning-repository',queue);
    window.addEventListener('familyapp:household-context',queue);
    queue();
  }

  window.CleaningPreferencesUi={version:VERSION,start:start,currentMode:currentMode,format:format};
  start();
})();
