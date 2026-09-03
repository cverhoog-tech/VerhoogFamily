'use strict';
// ============================================================
// CLEANING SUPPLY EXPERIENCE v0.1.0
// Canonical household supplies + lightweight inventory around CleaningRoutineItem.
// - routines own supplyIds
// - supplies are shared household catalog records
// - inventory is intentionally only IN_STOCK / LOW / OUT
// - room cards expose a fixed Benodigdheden action
// - adding LOW/OUT items to Shopping always requires an explicit user tap
// This module decorates Rooms/form UI only and never mutates Planning approval DOM.
// ============================================================
(function(){
  if(window.CleaningSupplyExperience)return;

  var VERSION='0.1.0';
  var STATUS={IN_STOCK:'IN_STOCK',LOW:'LOW',OUT:'OUT'};
  var STATUS_LABEL={IN_STOCK:'Op voorraad',LOW:'Bijna op',OUT:'Op'};
  var state={
    observer:null,
    queued:false,
    installTimer:null,
    repositoryPatched:false,
    form:{mode:null,routineId:null,roomId:null,selected:{}},
    modal:null,
    previousBodyOverflow:null,
    creating:false,
    statusInFlight:{},
    shoppingInFlight:false
  };

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function canonicalName(value){return text(value).toLocaleLowerCase('nl-NL').replace(/\s+/g,' ');}
  function hashText(value){var h=2166136261,s=String(value||'');for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
  function supplyIdForName(name){var key=canonicalName(name);return key?'supply_'+hashText(key):'';}
  function repo(){return window.CleaningHouseholdRepository||null;}
  function snapshot(){try{var r=repo();return r&&r.snapshot?r.snapshot():null;}catch(error){return null;}}
  function data(){var value=snapshot();return value&&value.data||{};}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return householdId&&domain&&domain.basePath?domain.basePath(householdId):null;}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);else try{console.info('[CleaningSupplyExperience]',message);}catch(error){}}

  function writeContext(){
    var ctx=context(),db=database(),token=capture(),path=ctx&&cleaningPath(ctx.householdId);
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    if(!token||!current(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    return{ctx:ctx,db:db,token:token,path:path};
  }

  function normalizeStatus(value){var status=text(value).toUpperCase();return STATUS[status]?status:STATUS.IN_STOCK;}
  function inventoryStatusFrom(root,supplyId){
    var inventory=root&&root.inventory&&root.inventory[supplyId];
    if(typeof inventory==='string')return normalizeStatus(inventory);
    return normalizeStatus(inventory&&inventory.status);
  }

  function supplyRowsFrom(root){
    var supplies=root&&root.supplies&&typeof root.supplies==='object'?root.supplies:{};
    return Object.keys(supplies).map(function(id){var row=supplies[id];return row&&typeof row==='object'?Object.assign({id:id},clone(row)):null;})
      .filter(function(row){return row&&row.active!==false&&text(row.name);})
      .sort(function(a,b){return text(a.name).localeCompare(text(b.name),'nl');});
  }
  function supplyRows(){return supplyRowsFrom(data());}
  function supplyById(id){var rows=data().supplies||{},row=rows[id];return row&&typeof row==='object'&&row.active!==false?Object.assign({id:id},clone(row)):null;}
  function routineById(id){var rows=data().routines||{},row=rows[id];return row&&typeof row==='object'&&row.active!==false?Object.assign({id:id},clone(row)):null;}
  function roomById(id){var rows=data().rooms||{},row=rows[id];return row&&typeof row==='object'&&row.active!==false?Object.assign({id:id},clone(row)):null;}
  function activeRoutinesForRoom(root,roomId){
    var routines=root&&root.routines&&typeof root.routines==='object'?root.routines:{};
    return Object.keys(routines).map(function(id){return Object.assign({id:id},clone(routines[id]||{}));})
      .filter(function(row){return row.active!==false&&text(row.roomId)===text(roomId);});
  }
  function uniqueIds(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var id=text(value);if(id&&!seen[id]){seen[id]=true;out.push(id);}});return out;}
  function routineSupplyIds(routine){return uniqueIds(routine&&routine.supplyIds);}

  function roomSupplyIdsFrom(root,roomId){
    var ids=[];activeRoutinesForRoom(root,roomId).forEach(function(routine){ids=ids.concat(routineSupplyIds(routine));});return uniqueIds(ids);
  }
  function occurrenceRoutineIds(occurrence){
    var ids=[];(Array.isArray(occurrence&&occurrence.checklist)?occurrence.checklist:[]).forEach(function(item){var id=text(item&&(item.routineItemId||item.id));if(id)ids.push(id);});
    if(!ids.length)ids=Array.isArray(occurrence&&occurrence.routineItemIds)?occurrence.routineItemIds.slice():[];
    return uniqueIds(ids);
  }
  function supplyIdsForRoutineIds(root,routineIds){
    var routines=root&&root.routines||{},ids=[];uniqueIds(routineIds).forEach(function(routineId){var routine=routines[routineId];if(routine&&routine.active!==false)ids=ids.concat(routineSupplyIds(routine));});return uniqueIds(ids);
  }
  function supplyIdsForOccurrenceFrom(root,occurrence){return supplyIdsForRoutineIds(root,occurrenceRoutineIds(occurrence));}

  function supplyRowsForIds(root,ids){
    var supplies=root&&root.supplies||{};
    return uniqueIds(ids).map(function(id){var row=supplies[id];if(!row||typeof row!=='object'||row.active===false)return null;return{id:id,name:text(row.name)||'Benodigd item',status:inventoryStatusFrom(root,id)};}).filter(Boolean)
      .sort(function(a,b){return a.name.localeCompare(b.name,'nl');});
  }
  function summaryForSupplyIds(root,ids){
    var rows=supplyRowsForIds(root,ids),result={total:rows.length,inStock:0,low:0,out:0,attention:0,label:'Nog niet ingesteld',tone:'empty'};
    rows.forEach(function(row){if(row.status===STATUS.OUT)result.out++;else if(row.status===STATUS.LOW)result.low++;else result.inStock++;});
    result.attention=result.low+result.out;
    if(!result.total)return result;
    if(result.out){result.label=result.out+' '+(result.out===1?'ontbreekt':'ontbreken');result.tone='out';return result;}
    if(result.low){result.label=result.low+' bijna op';result.tone='low';return result;}
    result.label='Alles aanwezig';result.tone='ok';return result;
  }

  function occurrenceAnchor(row){
    if(!row)return Number.MAX_SAFE_INTEGER;
    if(text(row.scheduledDate)){
      var parts=text(row.scheduledDate).split('-').map(Number);if(parts.length===3){var local=new Date(parts[0],parts[1]-1,parts[2],0,0,0,0).getTime();if(Number.isFinite(local))return local;}
    }
    return Number(row.scheduledStartAt)||Number(row.slotAt)||Number(row.flexibleWindow&&row.flexibleWindow.startAt)||Number(row.earliestDueAt)||Number.MAX_SAFE_INTEGER;
  }
  function currentOccurrenceForRoom(root,roomId){
    var rows=root&&root.occurrences&&typeof root.occurrences==='object'?root.occurrences:{};
    return Object.keys(rows).map(function(id){return Object.assign({id:id},clone(rows[id]||{}));})
      .filter(function(row){var status=text(row.status).toUpperCase(),assignment=text(row.assignmentStatus).toUpperCase();return text(row.roomId)===text(roomId)&&status!=='CANCELLED'&&status!=='SKIPPED'&&status!=='COMPLETED'&&assignment!=='COMPLETED'&&assignment!=='SKIPPED';})
      .sort(function(a,b){var aa=occurrenceAnchor(a),bb=occurrenceAnchor(b);return aa-bb||text(a.id).localeCompare(text(b.id));})[0]||null;
  }

  function selectedIds(){return Object.keys(state.form.selected||{}).filter(function(id){return state.form.selected[id]===true;}).sort();}
  function setSelected(values){var next={};uniqueIds(values).forEach(function(id){next[id]=true;});state.form.selected=next;}
  function startCreateForm(roomId){state.form={mode:'create',routineId:null,roomId:text(roomId),selected:{}};}
  function startEditForm(routineId){var routine=routineById(routineId);state.form={mode:'edit',routineId:text(routineId),roomId:text(routine&&routine.roomId),selected:{}};setSelected(routineSupplyIds(routine));}
  function toggleSelected(id){id=text(id);if(!id)return;if(state.form.selected[id])delete state.form.selected[id];else state.form.selected[id]=true;queue();}

  function createSupply(input){
    var name=text(input&&input.name||input);if(!name)return Promise.reject(new Error('CLEANING_SUPPLY_NAME_REQUIRED'));
    var existing=supplyRows().find(function(row){return canonicalName(row.name)===canonicalName(name);});if(existing)return Promise.resolve(clone(existing));
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var id=supplyIdForName(name),timestamp=now(),transitionError=null;if(!id)return Promise.reject(new Error('CLEANING_SUPPLY_ID_REQUIRED'));
    return write.db.ref(write.path).transaction(function(serverRoot){
      if(!current(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      var root=serverRoot&&typeof serverRoot==='object'?clone(serverRoot):{};if(!root.supplies||typeof root.supplies!=='object')root.supplies={};if(!root.inventory||typeof root.inventory!=='object')root.inventory={};
      var serverExisting=root.supplies[id];
      if(serverExisting&&serverExisting.active!==false&&canonicalName(serverExisting.name)===canonicalName(name)){transitionError=null;return root;}
      root.supplies[id]={id:id,householdId:write.ctx.householdId,name:name,active:true,createdAt:Number(serverExisting&&serverExisting.createdAt)||timestamp,createdByUid:text(serverExisting&&serverExisting.createdByUid)||write.ctx.uid,updatedAt:timestamp,updatedByUid:write.ctx.uid,schemaVersion:1};
      var inventory=root.inventory[id]&&typeof root.inventory[id]==='object'?root.inventory[id]:{};
      root.inventory[id]=Object.assign({},inventory,{supplyId:id,householdId:write.ctx.householdId,status:normalizeStatus(inventory.status),createdAt:Number(inventory.createdAt)||timestamp,createdByUid:text(inventory.createdByUid)||write.ctx.uid,updatedAt:timestamp,updatedByUid:write.ctx.uid,schemaVersion:1});transitionError=null;return root;
    }).then(function(result){if(transitionError)throw transitionError;if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_SUPPLY_WRITE_NOT_COMMITTED');return{id:id,name:name,active:true};});
  }

  function setSupplyStatus(supplyId,status){
    var id=text(supplyId),nextStatus=normalizeStatus(status),write;try{write=writeContext();}catch(error){return Promise.reject(error);}if(!id)return Promise.reject(new Error('CLEANING_SUPPLY_ID_REQUIRED'));if(!supplyById(id))return Promise.reject(new Error('CLEANING_SUPPLY_NOT_FOUND'));
    var timestamp=now(),transitionError=null;
    return write.db.ref(write.path+'/inventory/'+id).transaction(function(serverInventory){
      if(!current(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      var row=serverInventory&&typeof serverInventory==='object'?clone(serverInventory):{};row.supplyId=id;row.householdId=write.ctx.householdId;row.status=nextStatus;row.createdAt=Number(row.createdAt)||timestamp;row.createdByUid=text(row.createdByUid)||write.ctx.uid;row.updatedAt=timestamp;row.updatedByUid=write.ctx.uid;row.schemaVersion=1;transitionError=null;return row;
    }).then(function(result){if(transitionError)throw transitionError;if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');if(!result||result.committed!==true)throw new Error('CLEANING_SUPPLY_STATUS_NOT_COMMITTED');return clone(result.snapshot&&result.snapshot.val?result.snapshot.val():null);});
  }

  function installRepository(){
    var r=repo();if(!r)return false;
    // RoutineExperience must own assignment/repeat persistence first. We wrap
    // that final public boundary so supplies and assignment are written once.
    if(!r.__routineExperienceV3)return false;
    if(typeof r.createSupply!=='function')r.createSupply=createSupply;
    if(typeof r.setSupplyStatus!=='function')r.setSupplyStatus=setSupplyStatus;
    if(r.__cleaningSupplyExperienceWrapped){state.repositoryPatched=true;return true;}
    if(typeof r.createRoutineItem!=='function'||typeof r.updateRoutineItem!=='function')return false;
    var rawCreate=r.createRoutineItem.bind(r),rawUpdate=r.updateRoutineItem.bind(r);
    r.createRoutineItem=function(input){
      var next=Object.assign({},input||{});
      if(!next.templateKey&&state.form.mode==='create'&&text(next.roomId)===text(state.form.roomId))next.supplyIds=selectedIds();
      else if(!Array.isArray(next.supplyIds))next.supplyIds=[];
      return rawCreate(next);
    };
    r.updateRoutineItem=function(id,input){
      var next=Object.assign({},input||{}),routine=routineById(id);
      if(state.form.mode==='edit'&&text(state.form.routineId)===text(id))next.supplyIds=selectedIds();
      else if(!Array.isArray(next.supplyIds))next.supplyIds=routineSupplyIds(routine);
      return rawUpdate(id,next);
    };
    r.__cleaningSupplyExperienceWrapped=true;state.repositoryPatched=true;return true;
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-supply-experience-style'))return;
    var style=document.createElement('style');style.id='cleaning-supply-experience-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-supply-form{display:grid;gap:11px;padding:14px;border:1px solid var(--cleaning-border);border-radius:16px;background:color-mix(in srgb,var(--cleaning-accent) 4%,var(--cleaning-surface));margin:2px 0 4px}\n'
      +'#screen-cleaning .cleaning-supply-form-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}\n'
      +'#screen-cleaning .cleaning-supply-form-head strong{font-size:12px;color:var(--cleaning-text)}#screen-cleaning .cleaning-supply-form-head span{font-size:10px;color:var(--cleaning-muted);font-weight:800}\n'
      +'#screen-cleaning .cleaning-supply-chip-grid{display:flex;flex-wrap:wrap;gap:7px}\n'
      +'#screen-cleaning .cleaning-supply-chip{min-height:36px;padding:7px 10px;border-radius:999px;border:1px solid var(--cleaning-border);background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-size:10px;font-weight:850;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-supply-chip.is-selected{border-color:color-mix(in srgb,var(--cleaning-accent) 50%,var(--cleaning-border));background:color-mix(in srgb,var(--cleaning-accent) 12%,var(--cleaning-surface));color:var(--cleaning-accent)}\n'
      +'#screen-cleaning .cleaning-supply-create-row{display:flex;gap:8px}#screen-cleaning .cleaning-supply-create-row input{min-width:0;flex:1;border:1px solid var(--cleaning-border);border-radius:12px;padding:10px 11px;background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-size:12px;outline:none}\n'
      +'#screen-cleaning .cleaning-supply-create-row button{min-height:40px;border:0;border-radius:12px;padding:0 12px;background:var(--cleaning-accent);color:#fff;font:inherit;font-size:10px;font-weight:950;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-routine-supply-count{display:block;margin-top:3px;color:var(--cleaning-accent);font-size:9px;font-weight:850}\n'
      +'#screen-cleaning .cleaning-room-supplies-bar{display:flex;padding:0 14px 11px}\n'
      +'#screen-cleaning .cleaning-room-supplies-button{width:100%;min-height:42px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--cleaning-border);border-radius:13px;padding:8px 11px;background:color-mix(in srgb,var(--cleaning-accent) 5%,var(--cleaning-surface));color:var(--cleaning-text);font:inherit;cursor:pointer;text-align:left}\n'
      +'#screen-cleaning .cleaning-room-supplies-button strong{font-size:11px}#screen-cleaning .cleaning-room-supplies-button span{font-size:9px;font-weight:900;color:var(--cleaning-muted)}\n'
      +'#screen-cleaning .cleaning-room-supplies-button[data-tone="ok"] span{color:#287a54}#screen-cleaning .cleaning-room-supplies-button[data-tone="low"] span{color:#a46c00}#screen-cleaning .cleaning-room-supplies-button[data-tone="out"] span{color:#b13b45}\n'
      +'.cleaning-supply-overlay{position:fixed;inset:0;z-index:12020;display:grid;align-items:end;background:rgba(12,16,22,.48);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding-top:max(24px,env(safe-area-inset-top))}\n'
      +'.cleaning-supply-sheet{width:100%;max-height:88vh;overflow:auto;border-radius:28px 28px 0 0;border:1px solid var(--cleaning-border,#ddd);border-bottom:0;background:var(--cleaning-surface,#fff);color:var(--cleaning-text,#1f2430);box-shadow:0 -20px 60px rgba(0,0,0,.2);padding:12px 16px calc(22px + env(safe-area-inset-bottom))}\n'
      +'.cleaning-supply-handle{width:38px;height:4px;border-radius:999px;background:var(--cleaning-border,#ddd);margin:0 auto 15px}.cleaning-supply-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.cleaning-supply-sheet-head p{margin:0 0 3px;font-size:10px;font-weight:900;color:var(--cleaning-accent,#6750a4);text-transform:uppercase;letter-spacing:.08em}.cleaning-supply-sheet-head h2{margin:0;font-size:22px}.cleaning-supply-close{width:40px;height:40px;border-radius:13px;border:1px solid var(--cleaning-border,#ddd);background:var(--cleaning-surface,#fff);color:inherit;font:inherit;font-size:18px;cursor:pointer}\n'
      +'.cleaning-supply-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:4px;border-radius:14px;background:color-mix(in srgb,var(--cleaning-accent,#6750a4) 6%,var(--cleaning-surface,#fff));margin-bottom:14px}.cleaning-supply-tab{min-height:40px;border:0;border-radius:11px;background:transparent;color:var(--cleaning-muted,#737784);font:inherit;font-size:11px;font-weight:900;cursor:pointer}.cleaning-supply-tab.is-active{background:var(--cleaning-surface,#fff);color:var(--cleaning-text,#1f2430);box-shadow:0 4px 14px rgba(20,20,35,.08)}.cleaning-supply-tab:disabled{opacity:.42}\n'
      +'.cleaning-supply-list{display:grid;gap:9px}.cleaning-supply-row{padding:12px;border:1px solid var(--cleaning-border,#ddd);border-radius:16px;background:color-mix(in srgb,var(--cleaning-accent,#6750a4) 3%,var(--cleaning-surface,#fff))}.cleaning-supply-row-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:9px}.cleaning-supply-row-head strong{font-size:13px}.cleaning-supply-row-head span{font-size:9px;font-weight:900;color:var(--cleaning-muted,#737784)}\n'
      +'.cleaning-supply-statuses{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.cleaning-supply-status{min-height:36px;border:1px solid var(--cleaning-border,#ddd);border-radius:10px;background:var(--cleaning-surface,#fff);color:var(--cleaning-muted,#737784);font:inherit;font-size:9px;font-weight:900;cursor:pointer;padding:4px}.cleaning-supply-status.is-active{color:var(--cleaning-text,#1f2430);border-color:color-mix(in srgb,var(--cleaning-accent,#6750a4) 45%,var(--cleaning-border,#ddd));background:color-mix(in srgb,var(--cleaning-accent,#6750a4) 10%,var(--cleaning-surface,#fff))}.cleaning-supply-status:disabled{opacity:.5}\n'
      +'.cleaning-supply-empty{padding:20px 14px;text-align:center;border:1px dashed var(--cleaning-border,#ddd);border-radius:16px;color:var(--cleaning-muted,#737784);font-size:11px;line-height:1.5}.cleaning-supply-footer{display:grid;gap:9px;margin-top:14px}.cleaning-supply-shopping{min-height:48px;border:0;border-radius:14px;background:var(--cleaning-accent,#6750a4);color:#fff;font:inherit;font-size:12px;font-weight:950;cursor:pointer}.cleaning-supply-shopping:disabled{opacity:.55}.cleaning-supply-footnote{margin:0;text-align:center;color:var(--cleaning-muted,#737784);font-size:9px;line-height:1.45;font-weight:750}\n';
    document.head.appendChild(style);
  }

  function decorateRoutineForm(){
    var form=document.querySelector('#screen-cleaning [data-cleaning-routine-form]');if(!form||form.querySelector('[data-cleaning-supply-form]'))return;
    var catalog=supplyRows(),selected=state.form.selected||{},box=document.createElement('section');box.className='cleaning-supply-form';box.setAttribute('data-cleaning-supply-form','1');
    var chips=catalog.length?catalog.map(function(supply){var on=!!selected[supply.id],status=inventoryStatusFrom(data(),supply.id);return '<button type="button" class="cleaning-supply-chip'+(on?' is-selected':'')+'" data-cleaning-supply-toggle="'+escapeHtml(supply.id)+'" aria-pressed="'+(on?'true':'false')+'">'+(on?'✓ ':'')+escapeHtml(supply.name)+' · '+escapeHtml(STATUS_LABEL[status])+'</button>';}).join(''):'<span style="font-size:10px;color:var(--cleaning-muted);font-weight:750">Nog geen benodigdheden in jullie huishouden.</span>';
    box.innerHTML='<div class="cleaning-supply-form-head"><div><strong>Benodigdheden</strong><div style="font-size:9px;color:var(--cleaning-muted);margin-top:2px">Koppel wat je voor deze routine nodig hebt.</div></div><span>'+selectedIds().length+' gekoppeld</span></div><div class="cleaning-supply-chip-grid">'+chips+'</div><div class="cleaning-supply-create-row"><input type="text" maxlength="60" autocomplete="off" placeholder="Bijv. Allesreiniger" data-cleaning-supply-new-name><button type="button" data-cleaning-supply-create'+(state.creating?' disabled':'')+'>'+(state.creating?'Toevoegen…':'＋ Nieuw')+'</button></div>';
    var actions=form.querySelector('.cleaning-form-actions');if(actions)form.insertBefore(box,actions);else form.appendChild(box);
  }

  function decorateRoutineRows(){
    var edits=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]');
    for(var i=0;i<edits.length;i++){
      var id=text(edits[i].getAttribute('data-cleaning-routine-edit')),routine=routineById(id),item=edits[i].closest&&edits[i].closest('.cleaning-routine-item'),copy=item&&item.querySelector?item.querySelector('.cleaning-routine-copy'):null;if(!routine||!copy)continue;
      var count=routineSupplyIds(routine).filter(function(supplyId){return !!supplyById(supplyId);}).length,badge=copy.querySelector('[data-cleaning-routine-supply-count]');
      if(!count){if(badge)badge.remove();continue;}
      if(!badge){badge=document.createElement('span');badge.className='cleaning-routine-supply-count';badge.setAttribute('data-cleaning-routine-supply-count','1');copy.appendChild(badge);}badge.textContent=count+' '+(count===1?'benodigd item':'benodigdheden');
    }
  }

  function decorateRoomButtons(){
    var root=data(),cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');
    for(var i=0;i<cards.length;i++){
      var card=cards[i],roomId=text(card.getAttribute('data-cleaning-room-id'));if(!roomId)continue;
      var summary=summaryForSupplyIds(root,roomSupplyIdsFrom(root,roomId)),bar=card.querySelector('[data-cleaning-room-supplies-bar]');
      if(!bar){bar=document.createElement('div');bar.className='cleaning-room-supplies-bar';bar.setAttribute('data-cleaning-room-supplies-bar',roomId);var order=card.querySelector('[data-cleaning-room-order-bar]'),main=card.querySelector('.cleaning-room-card-main');if(order&&order.parentNode)order.parentNode.insertBefore(bar,order);else if(main&&main.parentNode)main.parentNode.insertBefore(bar,main.nextSibling);else card.insertBefore(bar,card.firstChild);}
      var signature=[summary.total,summary.low,summary.out,summary.tone].join('|');if(bar.getAttribute('data-supply-signature')===signature)continue;bar.setAttribute('data-supply-signature',signature);bar.innerHTML='<button type="button" class="cleaning-room-supplies-button" data-cleaning-room-supplies="'+escapeHtml(roomId)+'" data-tone="'+escapeHtml(summary.tone)+'"><strong>🧺 Benodigdheden</strong><span>'+escapeHtml(summary.label)+'</span></button>';
    }
  }

  function routineUsageForSupply(root,roomId,supplyId,routineIds){
    var allowed={};uniqueIds(routineIds||[]).forEach(function(id){allowed[id]=true;});
    return activeRoutinesForRoom(root,roomId).filter(function(routine){return(!routineIds||!routineIds.length||allowed[routine.id])&&routineSupplyIds(routine).indexOf(supplyId)>=0;}).map(function(routine){return text(routine.title)||'Routine';});
  }

  function modalSupplyIds(root,roomId,mode,occurrence){return mode==='turn'&&occurrence?supplyIdsForOccurrenceFrom(root,occurrence):roomSupplyIdsFrom(root,roomId);}

  function renderModal(){
    if(!state.modal)return;ensureStyle();var root=data(),room=roomById(state.modal.roomId);if(!room){closeModal();return;}var occurrence=currentOccurrenceForRoom(root,room.id),hasTurn=!!occurrence;if(!hasTurn&&state.modal.mode==='turn')state.modal.mode='all';
    var ids=modalSupplyIds(root,room.id,state.modal.mode,occurrence),rows=supplyRowsForIds(root,ids),routineIds=state.modal.mode==='turn'&&occurrence?occurrenceRoutineIds(occurrence):[],attention=rows.filter(function(row){return row.status===STATUS.LOW||row.status===STATUS.OUT;});
    var overlay=document.getElementById('cleaning-supplies-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='cleaning-supplies-overlay';overlay.className='cleaning-supply-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');document.body.appendChild(overlay);}
    var list=rows.length?rows.map(function(row){var usage=routineUsageForSupply(root,room.id,row.id,routineIds),busy=!!state.statusInFlight[row.id];return '<article class="cleaning-supply-row"><div class="cleaning-supply-row-head"><strong>'+escapeHtml(row.name)+'</strong><span>'+(usage.length?escapeHtml(usage.join(' · ')):'Kameritem')+'</span></div><div class="cleaning-supply-statuses">'+[STATUS.IN_STOCK,STATUS.LOW,STATUS.OUT].map(function(status){return '<button type="button" class="cleaning-supply-status'+(row.status===status?' is-active':'')+'" data-cleaning-supply-status="'+escapeHtml(status)+'" data-cleaning-supply-status-id="'+escapeHtml(row.id)+'"'+(busy?' disabled':'')+'>'+escapeHtml(STATUS_LABEL[status])+'</button>';}).join('')+'</div></article>';}).join(''):'<div class="cleaning-supply-empty">'+(state.modal.mode==='turn'?'Voor deze schoonmaakbeurt zijn nog geen benodigdheden gekoppeld.':'Koppel benodigdheden aan een routine via <strong>Bewerken</strong>. Ze verschijnen daarna automatisch hier en in de schoonmaaktaak.')+'</div>';
    var action=attention.length?'<button type="button" class="cleaning-supply-shopping" data-cleaning-supply-shopping'+(state.shoppingInFlight?' disabled':'')+'>'+(state.shoppingInFlight?'Toevoegen…':attention.length+' '+(attention.length===1?'benodigd item':'benodigdheden')+' aanvullen → Boodschappen')+'</button>':'';
    overlay.innerHTML='<section class="cleaning-supply-sheet"><div class="cleaning-supply-handle"></div><div class="cleaning-supply-sheet-head"><div><p>'+escapeHtml(room.name)+'</p><h2>Benodigdheden</h2></div><button type="button" class="cleaning-supply-close" data-cleaning-supply-close aria-label="Sluiten">✕</button></div><div class="cleaning-supply-tabs"><button type="button" class="cleaning-supply-tab'+(state.modal.mode==='turn'?' is-active':'')+'" data-cleaning-supply-mode="turn"'+(!hasTurn?' disabled':'')+'>Voor deze beurt</button><button type="button" class="cleaning-supply-tab'+(state.modal.mode==='all'?' is-active':'')+'" data-cleaning-supply-mode="all">Alle kameritems</button></div><div class="cleaning-supply-list">'+list+'</div><div class="cleaning-supply-footer">'+action+'<p class="cleaning-supply-footnote">Voorraad blijft bewust simpel: Op voorraad, Bijna op of Op. Toevoegen aan Boodschappen gebeurt nooit automatisch.</p></div></section>';
  }

  function openModal(roomId){
    var root=data(),occurrence=currentOccurrenceForRoom(root,roomId);state.modal={roomId:text(roomId),mode:occurrence?'turn':'all'};if(state.previousBodyOverflow===null)state.previousBodyOverflow=document.body.style.overflow||'';document.body.style.overflow='hidden';renderModal();
  }
  function closeModal(){state.modal=null;var overlay=document.getElementById('cleaning-supplies-overlay');if(overlay&&overlay.remove)overlay.remove();if(state.previousBodyOverflow!==null){document.body.style.overflow=state.previousBodyOverflow;state.previousBodyOverflow=null;}}

  function createFromForm(){
    var input=document.querySelector('#screen-cleaning [data-cleaning-supply-new-name]'),name=text(input&&input.value);if(!name||state.creating)return;if(input)input.value='';state.creating=true;queue();
    createSupply(name).then(function(row){state.creating=false;if(row&&row.id)state.form.selected[row.id]=true;toast('Benodigd item toegevoegd ✓');queue();}).catch(function(error){state.creating=false;toast((error&&error.message)||'Benodigd item kon niet worden toegevoegd');queue();});
  }

  function changeStatus(id,status){
    if(state.statusInFlight[id])return;state.statusInFlight[id]=true;renderModal();setSupplyStatus(id,status).then(function(){delete state.statusInFlight[id];toast('Voorraad bijgewerkt ✓');renderModal();queue();}).catch(function(error){delete state.statusInFlight[id];toast((error&&error.message)||'Voorraad kon niet worden bijgewerkt');renderModal();});
  }

  function addAttentionToShopping(){
    if(!state.modal||state.shoppingInFlight)return;var root=data(),occurrence=currentOccurrenceForRoom(root,state.modal.roomId),ids=modalSupplyIds(root,state.modal.roomId,state.modal.mode,occurrence),rows=supplyRowsForIds(root,ids).filter(function(row){return row.status===STATUS.LOW||row.status===STATUS.OUT;});if(!rows.length)return;
    var store=window.ShoppingListStore;if(!store||typeof store.addItems!=='function'){toast('Boodschappenlijst is nog niet beschikbaar');return;}
    state.shoppingInFlight=true;renderModal();var items=rows.map(function(row){return{name:row.name,qty:'1 st',cat:'Overig',who:window.myName||'Gezin',source:'cleaning'};});
    store.addItems(null,items,{dedupe:true}).then(function(result){state.shoppingInFlight=false;var added=result&&Array.isArray(result.added)?result.added.length:0,skipped=result&&Array.isArray(result.skipped)?result.skipped.length:0;if(added)toast(added+' '+(added===1?'benodigd item toegevoegd':'benodigdheden toegevoegd')+' aan Boodschappen ✓');else if(skipped)toast('Staat al op de boodschappenlijst ✓');else toast('Geen benodigdheden toegevoegd');renderModal();}).catch(function(error){state.shoppingInFlight=false;toast((error&&error.message)||'Toevoegen aan Boodschappen mislukt');renderModal();});
  }

  function decorate(){state.queued=false;ensureStyle();installRepository();decorateRoutineForm();decorateRoutineRows();decorateRoomButtons();if(state.modal)renderModal();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;
    var edit=closest('[data-cleaning-routine-edit]');if(edit){startEditForm(text(edit.getAttribute('data-cleaning-routine-edit')));queue();return;}
    var add=closest('[data-cleaning-routine-add]');if(add){startCreateForm(text(add.getAttribute('data-cleaning-routine-add')));queue();return;}
    var cancel=closest('[data-cleaning-routine-cancel]');if(cancel){state.form={mode:null,routineId:null,roomId:null,selected:{}};return;}
    var toggle=closest('[data-cleaning-supply-toggle]');if(toggle){event.preventDefault();event.stopPropagation();toggleSelected(text(toggle.getAttribute('data-cleaning-supply-toggle')));return;}
    var create=closest('[data-cleaning-supply-create]');if(create){event.preventDefault();event.stopPropagation();createFromForm();return;}
    var roomButton=closest('[data-cleaning-room-supplies]');if(roomButton){event.preventDefault();event.stopPropagation();openModal(text(roomButton.getAttribute('data-cleaning-room-supplies')));return;}
    if(closest('[data-cleaning-supply-close]')){event.preventDefault();closeModal();return;}
    var mode=closest('[data-cleaning-supply-mode]');if(mode&&!mode.disabled&&state.modal){event.preventDefault();state.modal.mode=text(mode.getAttribute('data-cleaning-supply-mode'))==='turn'?'turn':'all';renderModal();return;}
    var status=closest('[data-cleaning-supply-status][data-cleaning-supply-status-id]');if(status){event.preventDefault();changeStatus(text(status.getAttribute('data-cleaning-supply-status-id')),text(status.getAttribute('data-cleaning-supply-status')));return;}
    if(closest('[data-cleaning-supply-shopping]')){event.preventDefault();addAttentionToShopping();return;}
    var overlay=closest('#cleaning-supplies-overlay');if(overlay&&target===overlay)closeModal();
  }

  function onKeydown(event){
    if(event.key==='Escape'&&state.modal){event.preventDefault();closeModal();return;}
    var target=event.target;if(event.key==='Enter'&&target&&target.matches&&target.matches('[data-cleaning-supply-new-name]')){event.preventDefault();createFromForm();}
  }

  function start(){
    if(window.__cleaningSupplyExperienceStarted)return;window.__cleaningSupplyExperienceStarted=true;ensureStyle();installRepository();document.addEventListener('click',onClick,true);document.addEventListener('keydown',onKeydown,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    window.addEventListener('familyapp:cleaning-repository',function(){queue();if(state.modal)renderModal();});
    if(!state.repositoryPatched){var tries=0;state.installTimer=window.setInterval(function(){tries++;if(installRepository()||tries>240){window.clearInterval(state.installTimer);state.installTimer=null;}},50);}queue();
  }

  window.CleaningSupplyExperience={
    version:VERSION,start:start,openRoom:openModal,close:closeModal,createSupply:createSupply,setSupplyStatus:setSupplyStatus,
    _supplyIdForName:supplyIdForName,_roomSupplyIds:roomSupplyIdsFrom,_supplyIdsForOccurrence:supplyIdsForOccurrenceFrom,_summaryForSupplyIds:summaryForSupplyIds,_currentOccurrenceForRoom:currentOccurrenceForRoom,_supplyRowsForIds:supplyRowsForIds
  };
  start();
})();
