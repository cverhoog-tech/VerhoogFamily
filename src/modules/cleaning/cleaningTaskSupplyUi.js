'use strict';
// ============================================================
// CLEANING TASK SUPPLY UI v0.1.0
// Read-only exact supply context inside a managed Cleaning Task. Canonical
// supply/status management stays in Schoonmaken. The UI derives from the
// Cleaning aggregate at display time, so Task never becomes supply authority.
// ============================================================
(function(){
  if(window.CleaningTaskSupplyUi)return;

  var VERSION='0.1.0';
  var STATUS_LABEL={IN_STOCK:'Op voorraad',LOW:'Bijna op',OUT:'Op'};
  var state={currentTaskId:null,details:null,loading:false,loadToken:0,observer:null,queued:false,installTimer:null,installed:false};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function unique(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var id=text(value);if(id&&!seen[id]){seen[id]=true;out.push(id);}});return out;}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return domain&&domain.basePath?domain.basePath(householdId):'families/'+String(householdId||'')+'/cleaning';}

  function taskRepository(){return window.TaskHouseholdRepository||window.TaskRepository||null;}
  function taskById(id){
    var repo=taskRepository(),rows=[];try{rows=repo&&repo.list?repo.list():(window.taskData||[]);}catch(error){rows=[];}
    for(var i=0;i<rows.length;i++)if(text(rows[i]&&(rows[i].id||rows[i]._key))===text(id)||text(rows[i]&&rows[i]._key)===text(id))return rows[i];
    return null;
  }
  function occurrenceIds(task){
    var ids=[];(Array.isArray(task&&task.cleaningOccurrenceIds)?task.cleaningOccurrenceIds:[]).forEach(function(id){ids.push(id);});
    [task&&task.cleaningOccurrenceId,task&&task.sourceId].forEach(function(id){if(id)ids.push(id);});return unique(ids);
  }
  function isManaged(task){
    if(!task||typeof task!=='object')return false;
    var contract=window.CleaningExecutionSync;if(contract&&typeof contract._isCleaningProjection==='function')return contract._isCleaningProjection(task);
    return (task.projectionManaged===true||text(task.sourceType).indexOf('cleaning-occurrence')===0)&&occurrenceIds(task).length>0;
  }

  function inventoryStatus(root,supplyId){
    var row=root&&root.inventory&&root.inventory[supplyId],status=text(typeof row==='string'?row:row&&row.status).toUpperCase();
    return status==='LOW'||status==='OUT'?status:'IN_STOCK';
  }
  function routineIdsForTask(task,root){
    var ids=[];(Array.isArray(task&&task.subtasks)?task.subtasks:[]).forEach(function(item){var id=text(item&&(item.sourceRoutineItemId||item.routineItemId));if(id)ids.push(id);});
    if(!ids.length){
      var occurrences=root&&root.occurrences||{};occurrenceIds(task).forEach(function(id){var occurrence=occurrences[id];(Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[]).forEach(function(item){var routineId=text(item&&(item.routineItemId||item.id));if(routineId)ids.push(routineId);});});
    }
    return unique(ids);
  }
  function deriveDetails(task,root){
    root=root&&typeof root==='object'?root:{};var occurrences=root.occurrences||{},routines=root.routines||{},supplies=root.supplies||{},roomId=text(task&&task.cleaningRoomId),routineIds=routineIdsForTask(task,root),supplyIds=[];
    occurrenceIds(task).forEach(function(id){var occurrence=occurrences[id];if(!roomId&&occurrence)roomId=text(occurrence.roomId);});
    routineIds.forEach(function(routineId){var routine=routines[routineId];if(!routine||routine.active===false)return;supplyIds=supplyIds.concat(Array.isArray(routine.supplyIds)?routine.supplyIds:[]);});
    supplyIds=unique(supplyIds);
    var items=supplyIds.map(function(id){var supply=supplies[id];if(!supply||typeof supply!=='object'||supply.active===false)return null;return{id:id,name:text(supply.name)||'Benodigd item',status:inventoryStatus(root,id)};}).filter(Boolean).sort(function(a,b){return a.name.localeCompare(b.name,'nl');});
    var summary={total:items.length,inStock:0,low:0,out:0,attention:0,label:'Nog niets gekoppeld',tone:'empty'};
    items.forEach(function(item){if(item.status==='OUT')summary.out++;else if(item.status==='LOW')summary.low++;else summary.inStock++;});summary.attention=summary.low+summary.out;
    if(summary.out){summary.label=summary.out+' '+(summary.out===1?'ontbreekt':'ontbreken');summary.tone='out';}
    else if(summary.low){summary.label=summary.low+' bijna op';summary.tone='low';}
    else if(summary.total){summary.label='Alles aanwezig';summary.tone='ok';}
    return{roomId:roomId,routineIds:routineIds,supplyIds:supplyIds,items:items,summary:summary};
  }

  function repositoryRoot(){
    try{var repository=window.CleaningHouseholdRepository,snapshot=repository&&repository.snapshot?repository.snapshot():null;return snapshot&&snapshot.ready===true&&snapshot.data?clone(snapshot.data):null;}catch(error){return null;}
  }
  function readCleaningRoot(){
    var cached=repositoryRoot();if(cached)return Promise.resolve(cached);
    var ctx=context(),db=database();if(!ctx||ctx.ready!==true||!ctx.householdId||!db)return Promise.resolve(null);
    var path=cleaningPath(ctx.householdId);if(!path)return Promise.resolve(null);
    return db.ref(path).once('value').then(function(snapshot){var value=snapshot&&snapshot.val?snapshot.val():null;return value&&typeof value==='object'?value:{};}).catch(function(){return null;});
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-task-supply-ui-style'))return;var style=document.createElement('style');style.id='cleaning-task-supply-ui-style';
    style.textContent='\n'
      +'.tdp-cleaning-supplies{display:grid;gap:10px;margin-bottom:12px}.tdp-cleaning-supplies-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.tdp-cleaning-supplies-head strong{font-size:12px;color:var(--tdp-text,var(--c-text,#222))}.tdp-cleaning-supplies-head span{font-size:9px;font-weight:900;color:var(--tdp-text2,var(--c-text2,#777))}\n'
      +'.tdp-cleaning-supply-list{display:flex;flex-wrap:wrap;gap:6px}.tdp-cleaning-supply-chip{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border-radius:999px;border:1px solid var(--tdp-border,var(--c-border,#ddd));background:var(--tdp-surface2,var(--c-surface2,#f5f5f5));color:var(--tdp-text,var(--c-text,#222));font-size:9px;font-weight:850}.tdp-cleaning-supply-chip i{width:6px;height:6px;border-radius:50%;background:#4e9a70}.tdp-cleaning-supply-chip[data-status="LOW"] i{background:#c38718}.tdp-cleaning-supply-chip[data-status="OUT"] i{background:#c14b56}\n'
      +'.tdp-cleaning-supply-empty{font-size:10px;line-height:1.5;color:var(--tdp-text2,var(--c-text2,#777))}.tdp-cleaning-supply-open{min-height:42px;width:100%;border:1px solid var(--tdp-border,var(--c-border,#ddd));border-radius:12px;background:color-mix(in srgb,#7c3aed 9%,var(--tdp-surface,var(--c-surface,#fff)));color:var(--tdp-text,var(--c-text,#222));font:inherit;font-size:10px;font-weight:950;cursor:pointer}.tdp-cleaning-supply-loading{font-size:10px;color:var(--tdp-text2,var(--c-text2,#777))}\n';document.head.appendChild(style);
  }

  function panelHtml(details){
    if(state.loading&&!details)return '<div class="tdp-cleaning-supply-loading">Benodigdheden laden…</div>';
    details=details||{items:[],summary:{label:'Nog niets gekoppeld',tone:'empty'}};
    var list=details.items.length?'<div class="tdp-cleaning-supply-list">'+details.items.map(function(item){return '<span class="tdp-cleaning-supply-chip" data-status="'+escapeHtml(item.status)+'"><i></i>'+escapeHtml(item.name)+' · '+escapeHtml(STATUS_LABEL[item.status]||STATUS_LABEL.IN_STOCK)+'</span>';}).join('')+'</div>':'<div class="tdp-cleaning-supply-empty">Voor deze schoonmaaktaak zijn nog geen benodigdheden gekoppeld.</div>';
    return '<div class="tdp-cleaning-supplies-head"><strong>🧺 Benodigdheden</strong><span>'+escapeHtml(details.summary.label)+'</span></div>'+list+'<button type="button" class="tdp-cleaning-supply-open" data-cleaning-task-supplies-open>'+(details.items.length?'Beheer kamerbenodigdheden':'Koppel benodigdheden in Schoonmaken')+'</button>';
  }

  function decorate(){
    state.queued=false;ensureStyle();var overlay=document.getElementById('tdp-overlay'),body=overlay&&overlay.querySelector?overlay.querySelector('.tdp-body'):null,task=taskById(state.currentTaskId);if(!overlay||!body||!isManaged(task))return;
    var panel=body.querySelector('[data-cleaning-task-supplies]');if(!panel){panel=document.createElement('section');panel.className='tdp-box tdp-cleaning-supplies';panel.setAttribute('data-cleaning-task-supplies','1');var footer=body.querySelector('.tdp-footer');if(footer)body.insertBefore(panel,footer);else body.appendChild(panel);}
    var signature=JSON.stringify({id:state.currentTaskId,loading:state.loading,details:state.details});if(panel.getAttribute('data-signature')!==signature){panel.setAttribute('data-signature',signature);panel.innerHTML=panelHtml(state.details);}
    if(!state.loading&&!state.details)loadDetails(task);
  }
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function loadDetails(task){
    var token=++state.loadToken;state.loading=true;state.details=null;queue();readCleaningRoot().then(function(root){if(token!==state.loadToken)return;state.loading=false;state.details=root?deriveDetails(task,root):{roomId:'',routineIds:[],supplyIds:[],items:[],summary:{total:0,inStock:0,low:0,out:0,attention:0,label:'Open Schoonmaken',tone:'empty'}};queue();}).catch(function(){if(token!==state.loadToken)return;state.loading=false;state.details=null;queue();});
  }

  function install(){
    var popup=window.TaskDetailPopup;if(!popup||typeof popup.open!=='function')return false;if(popup.open.__cleaningTaskSupplyUi){state.installed=true;return true;}
    var rawOpen=popup.open;popup.open=function(id){state.currentTaskId=text(id);state.details=null;state.loading=false;state.loadToken++;var result=rawOpen.apply(this,arguments);queue();return result;};popup.open.__cleaningTaskSupplyUi=true;popup.open.__raw=rawOpen;state.installed=true;return true;
  }

  function openInCleaning(){
    var details=state.details||{},roomId=text(details.roomId),popup=window.TaskDetailPopup;if(popup&&typeof popup.close==='function')popup.close();if(typeof window.showScreen==='function')window.showScreen('cleaning');
    var tries=0,timer=window.setInterval(function(){tries++;var experience=window.CleaningSupplyExperience;if(experience&&typeof experience.openRoom==='function'&&roomId){window.clearInterval(timer);experience.openRoom(roomId);window.setTimeout(function(){var all=document.querySelector('[data-cleaning-supply-mode="all"]');if(all&&typeof all.click==='function')all.click();},40);return;}if(tries>100){window.clearInterval(timer);toastUnavailable();}},50);
  }
  function toastUnavailable(){if(typeof window.showToast==='function')window.showToast('Open de kamer bij Schoonmaken om benodigdheden te beheren');}

  function onClick(event){var target=event.target&&event.target.closest?event.target.closest('[data-cleaning-task-supplies-open]'):null;if(!target)return;event.preventDefault();event.stopPropagation();openInCleaning();}
  function onCleaningChanged(){var task=taskById(state.currentTaskId);if(isManaged(task)){state.details=null;state.loading=false;state.loadToken++;queue();}}

  function start(){
    if(window.__cleaningTaskSupplyUiStarted)return;window.__cleaningTaskSupplyUiStarted=true;ensureStyle();document.addEventListener('click',onClick,true);var target=document.body||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    window.addEventListener('familyapp:cleaning-repository',onCleaningChanged);if(!install()){var tries=0;state.installTimer=window.setInterval(function(){tries++;if(install()||tries>300){window.clearInterval(state.installTimer);state.installTimer=null;}},50);}queue();
  }

  window.CleaningTaskSupplyUi={version:VERSION,start:start,status:function(){return{version:VERSION,currentTaskId:state.currentTaskId,loading:state.loading,installed:state.installed};},_deriveDetails:deriveDetails,_occurrenceIds:occurrenceIds,_isManaged:isManaged,_panelHtml:panelHtml};
  start();
})();
