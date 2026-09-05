'use strict';
// ============================================================
// CLEANING WEEK ASSIST v0.1.0
// Advisory layer for the next seven days:
// - detects timed Cleaning/Agenda conflicts without moving work automatically
// - offers explicit same-day alternatives through the canonical execution runtime
// - bundles LOW/OUT supplies required by upcoming CleaningOccurrences
// - only adds supplies to Shopping after an explicit user action
// - after a linked Shopping item is checked off, offers an explicit IN_STOCK reset
//
// CleaningOccurrence remains canonical. Calendar and Shopping stay their own
// repositories; this module derives presentation and invokes their public
// boundaries only after a user action. It never owns Planning approval copy.
// ============================================================
(function(){
  if(window.CleaningWeekAssist)return;

  var VERSION='0.1.0';
  var DAY_MS=86400000;
  var STATUS={IN_STOCK:'IN_STOCK',LOW:'LOW',OUT:'OUT'};
  var state={
    cleaning:{},calendar:[],shopping:{shared:{},private:{}},
    calendarUnsub:null,shoppingUnsub:null,observer:null,attachTimer:null,
    queued:false,busy:{},lastSignature:''
  };

  function text(value){return String(value==null?'':value).trim();}
  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function attr(value){return esc(value).replace(/`/g,'&#96;');}
  function pad(value){return value<10?'0'+value:String(value);}
  function now(){return Date.now();}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);else try{console.info('[CleaningWeekAssist]',message);}catch(error){}}
  function canonicalName(value){return text(value).toLocaleLowerCase('nl-NL').replace(/\s+/g,' ');}
  function unique(values){var seen={},out=[];(Array.isArray(values)?values:[]).forEach(function(value){var key=text(value);if(key&&!seen[key]){seen[key]=true;out.push(key);}});return out;}

  function localIso(timestamp){var d=new Date(Number(timestamp)||now());return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function isoAddDays(iso,days){var parts=text(iso).split('-').map(Number);if(parts.length!==3||!parts[0]||!parts[1]||!parts[2])return'';var d=new Date(parts[0],parts[1]-1,parts[2]+Number(days||0),12,0,0,0);return localIso(d.getTime());}
  function occurrenceDate(row){var explicit=text(row&&row.scheduledDate);if(/^\d{4}-\d{2}-\d{2}$/.test(explicit))return explicit;var stamp=Number(row&&row.scheduledStartAt)||Number(row&&row.slotAt)||Number(row&&row.flexibleWindow&&row.flexibleWindow.startAt)||Number(row&&row.earliestDueAt)||0;return stamp?localIso(stamp):'';}
  function timeMinutes(value){var match=/^(\d{1,2}):(\d{2})$/.exec(text(value));if(!match)return null;var hour=Number(match[1]),minute=Number(match[2]);if(hour<0||hour>23||minute<0||minute>59)return null;return hour*60+minute;}
  function minuteTime(value){value=Math.max(0,Math.min(1439,Math.round(Number(value)||0)));return pad(Math.floor(value/60))+':'+pad(value%60);}
  function intervalOverlap(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&bStart<aEnd;}
  function activeOccurrence(row){var status=text(row&&row.status).toUpperCase(),assignment=text(row&&row.assignmentStatus).toUpperCase();return !!row&&row.active!==false&&status!=='CANCELLED'&&status!=='SKIPPED'&&status!=='COMPLETED'&&assignment!=='COMPLETED'&&assignment!=='SKIPPED'&&['ACTIVE','ACCEPTED'].indexOf(assignment)>=0;}
  function occurrenceIds(row){var ids=[];(Array.isArray(row&&row.cleaningOccurrenceIds)?row.cleaningOccurrenceIds:[]).forEach(function(id){if(text(id))ids.push(text(id));});[row&&row.cleaningOccurrenceId,row&&row.sourceId].forEach(function(id){if(text(id))ids.push(text(id));});return unique(ids);}
  function routineIds(row){var ids=[];(Array.isArray(row&&row.checklist)?row.checklist:[]).forEach(function(item){var id=text(item&&(item.routineItemId||item.id));if(id)ids.push(id);});(Array.isArray(row&&row.routineItemIds)?row.routineItemIds:[]).forEach(function(id){if(text(id))ids.push(text(id));});return unique(ids);}
  function cleaningEvent(row){return !!(row&&row.projectionManaged===true&&(text(row.sourceType)==='cleaning-occurrence'||text(row.sourceType)==='cleaning-occurrence-group'||text(row.cleaningOccurrenceId)||Array.isArray(row.cleaningOccurrenceIds)));}
  function sameProjection(a,b){var left=occurrenceIds(a),lookup={};left.forEach(function(id){lookup[id]=true;});return occurrenceIds(b).some(function(id){return !!lookup[id];});}
  function relevantParticipant(cleaning,other){var a=text(cleaning&&cleaning.assignedToUid),b=text(other&&other.assignedToUid);if(a&&b&&a!==b)return false;return true;}

  function cleaningDuration(root,event){
    var map=root&&root.occurrences||{},total=0;occurrenceIds(event).forEach(function(id){var row=map[id];if(row)total+=Math.max(0,Number(row.estimatedMinutes)||0);});
    if(total>0)return{minutes:total,estimated:false};
    var match=/(\d+)\s*min\b/i.exec(text(event&&event.description));if(match&&Number(match[1])>0)return{minutes:Number(match[1]),estimated:false};
    return{minutes:30,estimated:true};
  }
  function genericDuration(event){
    var explicit=Number(event&&event.durationMinutes);if(Number.isFinite(explicit)&&explicit>0)return{minutes:Math.min(720,explicit),estimated:false};
    var start=timeMinutes(event&&event.time),end=timeMinutes(event&&event.endTime);if(start!==null&&end!==null&&end>start)return{minutes:end-start,estimated:false};
    return{minutes:60,estimated:true};
  }
  function blockFor(root,event){var start=timeMinutes(event&&event.time);if(start===null)return null;var duration=cleaningEvent(event)?cleaningDuration(root,event):genericDuration(event);return{start:start,end:start+duration.minutes,duration:duration.minutes,estimated:duration.estimated};}

  function deriveConflicts(root,events,options){
    options=options||{};var from=text(options.fromIso)||localIso(options.nowAt),days=Math.max(1,Number(options.days)||7),until=isoAddDays(from,days),rows=Array.isArray(events)?events:[],out=[];
    rows.forEach(function(event){
      if(!cleaningEvent(event)||event.completed===true||event.flexible===true||!text(event.time)||text(event.date)<from||text(event.date)>=until)return;
      var own=blockFor(root,event);if(!own)return;var hits=[];
      rows.forEach(function(other){
        if(!other||other===event||event.completed===true||other.completed===true||text(other.date)!==text(event.date)||!text(other.time)||sameProjection(event,other)||text(other.sourceType)==='cleaning-pause-resume'||!relevantParticipant(event,other))return;
        var block=blockFor(root,other);if(!block||!intervalOverlap(own.start,own.end,block.start,block.end))return;
        hits.push({id:text(other.id||other._key),title:text(other.title)||'Agenda-afspraak',time:text(other.time),durationMinutes:block.duration,potential:block.estimated||!text(other.assignedToUid)});
      });
      if(hits.length){out.push({id:text(event.id||event._key),date:text(event.date),time:text(event.time),title:text(event.title)||'Schoonmaken',assignedToUid:text(event.assignedToUid),durationMinutes:own.duration,potential:own.estimated||hits.some(function(hit){return hit.potential;}),conflicts:hits,event:clone(event)});}
    });
    return out.sort(function(a,b){var d=a.date.localeCompare(b.date);return d||a.time.localeCompare(b.time)||a.id.localeCompare(b.id);});
  }

  function suggestTimes(root,event,events,limit){
    limit=Math.max(1,Number(limit)||3);if(!event||!text(event.date))return[];var own=blockFor(root,event),duration=own?own.duration:30,original=timeMinutes(event.time);if(original===null)original=12*60;
    var blockers=[];(Array.isArray(events)?events:[]).forEach(function(other){
      if(!other||other===event||other.completed===true||text(other.date)!==text(event.date)||!text(other.time)||sameProjection(event,other)||text(other.sourceType)==='cleaning-pause-resume'||!relevantParticipant(event,other))return;var block=blockFor(root,other);if(block)blockers.push(block);
    });
    var candidates=[];for(var minute=8*60;minute+duration<=21*60;minute+=30){if(minute===original)continue;var free=blockers.every(function(block){return !intervalOverlap(minute,minute+duration,block.start,block.end);});if(free)candidates.push(minute);}
    candidates.sort(function(a,b){var da=Math.abs(a-original),db=Math.abs(b-original);return da-db||a-b;});return candidates.slice(0,limit).map(minuteTime);
  }

  function inventoryRow(root,id){var row=root&&root.inventory&&root.inventory[id];if(typeof row==='string')return{status:text(row).toUpperCase(),updatedAt:0};return row&&typeof row==='object'?row:{};}
  function inventoryStatus(root,id){var status=text(inventoryRow(root,id).status).toUpperCase();return STATUS[status]?status:STATUS.IN_STOCK;}
  function weeklySupplyNeeds(root,options){
    options=options||{};root=root&&typeof root==='object'?root:{};var start=text(options.fromIso)||localIso(options.nowAt),days=Math.max(1,Number(options.days)||7),end=isoAddDays(start,days),occurrences=root.occurrences||{},routines=root.routines||{},supplies=root.supplies||{},rooms=root.rooms||{},bySupply={};
    Object.keys(occurrences).forEach(function(id){var occurrence=occurrences[id],date=occurrenceDate(occurrence);if(!activeOccurrence(occurrence)||!date||date<start||date>=end)return;routineIds(occurrence).forEach(function(routineId){var routine=routines[routineId];if(!routine||routine.active===false)return;(Array.isArray(routine.supplyIds)?routine.supplyIds:[]).forEach(function(rawId){var supplyId=text(rawId),supply=supplies[supplyId],status=inventoryStatus(root,supplyId);if(!supplyId||!supply||supply.active===false||(status!==STATUS.LOW&&status!==STATUS.OUT))return;if(!bySupply[supplyId])bySupply[supplyId]={id:supplyId,name:text(supply.name)||'Benodigd item',status:status,occurrenceIds:[],roomIds:[],dates:[]};var row=bySupply[supplyId];row.occurrenceIds.push(id);if(text(occurrence.roomId))row.roomIds.push(text(occurrence.roomId));row.dates.push(date);});});});
    return Object.keys(bySupply).map(function(id){var row=bySupply[id];row.occurrenceIds=unique(row.occurrenceIds);row.roomIds=unique(row.roomIds);row.dates=unique(row.dates).sort();row.roomNames=unique(row.roomIds.map(function(roomId){return text(rooms[roomId]&&rooms[roomId].name)||'Ruimte';}));return row;}).sort(function(a,b){if(a.status!==b.status)return a.status===STATUS.OUT?-1:1;return a.name.localeCompare(b.name,'nl');});
  }

  function shoppingRows(projection){var out=[];['shared','private'].forEach(function(scope){var lists=projection&&projection[scope]||{};Object.keys(lists).forEach(function(listId){var list=lists[listId],items=list&&list.items||{};Object.keys(items).forEach(function(key){if(items[key])out.push({scope:scope,listId:listId,key:key,item:items[key]});});});});return out;}
  function resolveSupplyId(root,item){var explicit=text(item&&item.cleaningSupplyId);if(explicit&&root&&root.supplies&&root.supplies[explicit]&&root.supplies[explicit].active!==false)return explicit;var name=canonicalName(item&&item.name),matches=[];Object.keys(root&&root.supplies||{}).forEach(function(id){var row=root.supplies[id];if(row&&row.active!==false&&canonicalName(row.name)===name)matches.push(id);});return matches.length===1?matches[0]:'';}
  function openShoppingLookup(root,projection){var lookup={};shoppingRows(projection).forEach(function(row){var item=row.item;if(!item||item.done===true||text(item.source).toLowerCase()!=='cleaning')return;var id=resolveSupplyId(root,item);if(id)lookup[id]=true;});return lookup;}
  function purchasedSupplySuggestions(root,projection){
    root=root&&typeof root==='object'?root:{};var best={};shoppingRows(projection).forEach(function(row){var item=row.item;if(!item||item.done!==true||text(item.source).toLowerCase()!=='cleaning')return;var id=resolveSupplyId(root,item);if(!id)return;var status=inventoryStatus(root,id);if(status!==STATUS.LOW&&status!==STATUS.OUT)return;var inventoryUpdated=Number(inventoryRow(root,id).updatedAt)||0,itemUpdated=Number(item.updatedAt)||Number(item.completedAt)||Number(item.createdAt)||0;if(itemUpdated<=inventoryUpdated)return;var existing=best[id];if(!existing||itemUpdated>existing.itemUpdated)best[id]={id:id,name:text(root.supplies&&root.supplies[id]&&root.supplies[id].name)||text(item.name)||'Benodigd item',status:status,itemKey:row.key,listId:row.listId,scope:row.scope,itemUpdated:itemUpdated};});
    return Object.keys(best).map(function(id){return best[id];}).sort(function(a,b){return b.itemUpdated-a.itemUpdated||a.name.localeCompare(b.name,'nl');});
  }
  function shoppingRecordsForNeeds(needs){return (Array.isArray(needs)?needs:[]).map(function(row){return{name:row.name,qty:'1 st',cat:'Overig',who:'Gezin',source:'cleaning',cleaningSupplyId:row.id,cleaningOccurrenceIds:unique(row.occurrenceIds),cleaningRoomIds:unique(row.roomIds)};});}

  function calendarRepository(){return window.CalendarEventHouseholdRepository||window.CalendarEventRepository||null;}
  function shoppingRepository(){return window.ShoppingListHouseholdRepository||null;}
  function cleaningRoot(){return state.cleaning&&typeof state.cleaning==='object'?state.cleaning:{};}
  function prime(){try{var c=window.CleaningHouseholdRepository,snap=c&&c.snapshot?c.snapshot():null;if(snap&&snap.data)state.cleaning=snap.data;}catch(error){}try{var cal=calendarRepository();if(cal&&typeof cal.list==='function')state.calendar=cal.list();}catch(error){}try{var shop=shoppingRepository();if(shop&&typeof shop.snapshot==='function')state.shopping=shop.snapshot();}catch(error){}}
  function attachRepositories(){var cal=calendarRepository(),shop=shoppingRepository();if(!state.calendarUnsub&&cal&&typeof cal.subscribe==='function')state.calendarUnsub=cal.subscribe(function(rows){state.calendar=Array.isArray(rows)?rows:[];queue();});if(!state.shoppingUnsub&&shop&&typeof shop.subscribe==='function')state.shoppingUnsub=shop.subscribe(function(projection){state.shopping=projection||{shared:{},private:{}};queue();});return !!(state.calendarUnsub&&state.shoppingUnsub);}

  function model(){
    var root=cleaningRoot(),conflicts=deriveConflicts(root,state.calendar,{days:7}),openLookup=openShoppingLookup(root,state.shopping),needs=weeklySupplyNeeds(root,{days:7});needs.forEach(function(row){row.onShopping=!!openLookup[row.id];});
    conflicts.forEach(function(row){row.suggestions=suggestTimes(root,row.event,state.calendar,3);});
    return{conflicts:conflicts,needs:needs,purchased:purchasedSupplySuggestions(root,state.shopping)};
  }
  function dateLabel(iso){if(!iso)return'';var today=localIso();if(iso===today)return'Vandaag';if(iso===isoAddDays(today,1))return'Morgen';try{return new Date(iso+'T12:00:00').toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'});}catch(error){return iso;}}
  function statusLabel(status){return status===STATUS.OUT?'Op':'Bijna op';}

  function ensureStyle(){if(document.getElementById('cleaning-week-assist-style'))return;var style=document.createElement('style');style.id='cleaning-week-assist-style';style.textContent='\n'
    +'#screen-cleaning .cleaning-week-assist{display:grid;gap:10px}.cleaning-week-assist-card{padding:14px;border:1px solid var(--cleaning-border);border-radius:18px;background:var(--cleaning-surface);box-shadow:var(--cleaning-shadow)}.cleaning-week-assist-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.cleaning-week-assist-head strong{display:block;font-size:13px}.cleaning-week-assist-head span{display:block;margin-top:2px;color:var(--cleaning-muted);font-size:9px;line-height:1.4}.cleaning-week-badge{flex:0 0 auto;padding:4px 7px;border-radius:999px;background:color-mix(in srgb,var(--cleaning-accent) 9%,var(--cleaning-surface));color:var(--cleaning-accent);font-size:8px!important;font-weight:900}.cleaning-week-list{display:grid;gap:7px}.cleaning-week-row{padding:10px;border-radius:13px;background:color-mix(in srgb,var(--cleaning-accent) 4%,var(--cleaning-surface));border:1px solid color-mix(in srgb,var(--cleaning-accent) 7%,var(--cleaning-border))}.cleaning-week-row-top{display:flex;justify-content:space-between;gap:9px}.cleaning-week-row strong{font-size:10.5px}.cleaning-week-row small{display:block;margin-top:3px;color:var(--cleaning-muted);font-size:8.5px;line-height:1.4}.cleaning-week-row-tag{font-size:8px;font-weight:900;color:#a45a00;white-space:nowrap}.cleaning-week-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.cleaning-week-suggestion{min-height:32px;border:1px solid color-mix(in srgb,var(--cleaning-accent) 22%,var(--cleaning-border));border-radius:999px;padding:0 10px;background:var(--cleaning-surface);color:var(--cleaning-accent);font:inherit;font-size:8.5px;font-weight:900}.cleaning-week-suggestion:disabled{opacity:.5}.cleaning-week-action{width:100%;min-height:40px;margin-top:10px;border:0;border-radius:12px;padding:0 12px;background:var(--cleaning-accent);color:#fff;font:inherit;font-size:10px;font-weight:900}.cleaning-week-action:disabled{opacity:.5}.cleaning-week-ok{padding:9px 10px;border-radius:12px;background:color-mix(in srgb,#2f8f52 8%,var(--cleaning-surface));color:var(--cleaning-muted);font-size:9px;line-height:1.4}.cleaning-week-restock{display:flex;gap:7px;align-items:center}.cleaning-week-restock>div{min-width:0;flex:1}.cleaning-week-restock button{min-height:34px;border:0;border-radius:10px;padding:0 10px;background:color-mix(in srgb,var(--cleaning-accent) 12%,var(--cleaning-surface));color:var(--cleaning-accent);font:inherit;font-size:8px;font-weight:900}.cleaning-week-restock button:disabled{opacity:.5}\n';document.head.appendChild(style);}

  function conflictMarkup(rows){if(!rows.length)return'<div class="cleaning-week-ok">✓ Geen tijdconflicten gevonden bij de geplande schoonmaakbeurten voor de komende 7 dagen.</div>';return'<div class="cleaning-week-list">'+rows.map(function(row){var hit=row.conflicts[0],more=row.conflicts.length>1?' + '+(row.conflicts.length-1)+' meer':'',buttons=row.suggestions.map(function(time){var key='move:'+row.id;return'<button type="button" class="cleaning-week-suggestion" data-cleaning-week-move="'+attr(row.id)+'" data-cleaning-week-date="'+attr(row.date)+'" data-cleaning-week-time="'+attr(time)+'"'+(state.busy[key]?' disabled':'')+'>'+esc(time)+'</button>';}).join('');return'<div class="cleaning-week-row"><div class="cleaning-week-row-top"><div><strong>'+esc(row.title)+' · '+esc(row.time)+'</strong><small>'+esc(dateLabel(row.date))+' · botst met '+esc(hit.title)+' '+esc(hit.time)+esc(more)+'</small></div><span class="cleaning-week-row-tag">'+(row.potential?'MOGELIJK':'CONFLICT')+'</span></div>'+(buttons?'<div class="cleaning-week-suggestions"><small style="width:100%;margin:0">Vrije alternatieven op dezelfde dag</small>'+buttons+'</div>':'<small>Geen vrij alternatief gevonden tussen 08:00 en 21:00.</small>')+'</div>';}).join('')+'</div>';}
  function needsMarkup(rows){if(!rows.length)return'<div class="cleaning-week-ok">✓ Voor de komende 7 dagen zijn geen gekoppelde benodigdheden met status Bijna op of Op nodig.</div>';var pending=rows.filter(function(row){return !row.onShopping;});var list='<div class="cleaning-week-list">'+rows.map(function(row){return'<div class="cleaning-week-row"><div class="cleaning-week-row-top"><div><strong>'+esc(row.name)+'</strong><small>'+esc(row.roomNames.join(', ')||'Schoonmaken')+' · nodig '+esc(row.dates.map(dateLabel).join(', '))+'</small></div><span class="cleaning-week-row-tag">'+(row.onShopping?'OP LIJST':esc(statusLabel(row.status)).toUpperCase())+'</span></div></div>';}).join('')+'</div>';var key='shopping:add';return list+(pending.length?'<button type="button" class="cleaning-week-action" data-cleaning-week-add-shopping'+(state.busy[key]?' disabled':'')+'>'+(state.busy[key]?'Toevoegen…':pending.length+' '+(pending.length===1?'benodigdheid':'benodigdheden')+' naar Boodschappen')+'</button>':'');}
  function purchasedMarkup(rows){if(!rows.length)return'';return'<article class="cleaning-week-assist-card"><div class="cleaning-week-assist-head"><div><strong>Aangevuld?</strong><span>Deze schoonmaakbenodigdheden zijn in Boodschappen afgevinkt. Bevestig zelf wanneer ze weer op voorraad zijn.</span></div><span class="cleaning-week-badge">VOORRAAD</span></div><div class="cleaning-week-list">'+rows.map(function(row){var key='restock:'+row.id;return'<div class="cleaning-week-row cleaning-week-restock"><div><strong>'+esc(row.name)+'</strong><small>Nu nog '+esc(statusLabel(row.status).toLowerCase())+'</small></div><button type="button" data-cleaning-week-restock="'+attr(row.id)+'"'+(state.busy[key]?' disabled':'')+'>'+(state.busy[key]?'Bijwerken…':'Zet op voorraad')+'</button></div>';}).join('')+'</div></article>';}
  function markup(view){return'<div class="cleaning-week-assist" data-cleaning-week-assist><article class="cleaning-week-assist-card"><div class="cleaning-week-assist-head"><div><strong>Planningcheck</strong><span>FamilyApp vergelijkt geplande schoonmaakmomenten met jullie Agenda. Er wordt nooit automatisch verplaatst.</span></div><span class="cleaning-week-badge">7 DAGEN</span></div>'+conflictMarkup(view.conflicts)+'</article><article class="cleaning-week-assist-card"><div class="cleaning-week-assist-head"><div><strong>Weekvoorraad</strong><span>Alleen benodigdheden die deze week echt nodig zijn én Bijna op/Op staan.</span></div><span class="cleaning-week-badge">SLIM BUNDELEN</span></div>'+needsMarkup(view.needs)+'</article>'+purchasedMarkup(view.purchased)+'</div>';}
  function signature(view){return JSON.stringify({conflicts:view.conflicts.map(function(row){return[row.id,row.date,row.time,row.potential,row.conflicts.map(function(hit){return[hit.id,hit.time,hit.potential];}),row.suggestions];}),needs:view.needs.map(function(row){return[row.id,row.status,row.onShopping,row.dates];}),purchased:view.purchased.map(function(row){return[row.id,row.status,row.itemUpdated];}),busy:Object.keys(state.busy).sort()});}

  function decorate(){state.queued=false;ensureStyle();var overview=document.querySelector('#screen-cleaning [data-cleaning-live-overview]');if(!overview)return;var view=model(),sig=signature(view),existing=overview.querySelector('[data-cleaning-week-assist]');if(existing&&existing.getAttribute('data-signature')===sig)return;var holder=document.createElement('div');holder.innerHTML=markup(view);var next=holder.firstChild;next.setAttribute('data-signature',sig);if(existing)existing.replaceWith(next);else{var stats=overview.querySelector('.cleaning-overview-stats');if(stats&&stats.parentNode)stats.insertAdjacentElement('afterend',next);else overview.appendChild(next);}state.lastSignature=sig;}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function moveCleaning(button){var id=text(button&&button.getAttribute('data-cleaning-week-move')),date=text(button&&button.getAttribute('data-cleaning-week-date')),time=text(button&&button.getAttribute('data-cleaning-week-time')),key='move:'+id;if(!id||!date||!time||state.busy[key])return;var runtime=window.CleaningExecutionWriteRuntime;if(!runtime||typeof runtime.transact!=='function'){toast('Schoonmaakplanning wordt nog geladen');return;}state.busy[key]=true;queue();Promise.resolve(runtime.transact('calendar',id,{date:date,time:time,flexible:false})).then(function(){toast('Schoonmaakmoment verplaatst ✓');}).catch(function(error){toast((error&&error.message)||'Verplaatsen mislukt');}).finally(function(){delete state.busy[key];queue();});}
  function addWeekSupplies(){var key='shopping:add';if(state.busy[key])return;var root=cleaningRoot(),open=openShoppingLookup(root,state.shopping),needs=weeklySupplyNeeds(root,{days:7}).filter(function(row){return !open[row.id];}),records=shoppingRecordsForNeeds(needs),store=window.ShoppingListStore;if(!records.length)return;if(!store||typeof store.addItems!=='function'){toast('Boodschappenlijst is nog niet beschikbaar');return;}state.busy[key]=true;queue();Promise.resolve(store.addItems(null,records,{dedupe:true})).then(function(result){var added=result&&Array.isArray(result.added)?result.added.length:0,skipped=result&&Array.isArray(result.skipped)?result.skipped.length:0;if(added)toast(added+' '+(added===1?'benodigdheid toegevoegd':'benodigdheden toegevoegd')+' ✓');else if(skipped)toast('Benodigdheden staan al op de lijst ✓');else toast('Geen benodigdheden toegevoegd');}).catch(function(error){toast((error&&error.message)||'Toevoegen aan Boodschappen mislukt');}).finally(function(){delete state.busy[key];queue();});}
  function restockSupply(id){id=text(id);var key='restock:'+id;if(!id||state.busy[key])return;var supplies=window.CleaningSupplyExperience;if(!supplies||typeof supplies.setSupplyStatus!=='function'){toast('Voorraadbeheer is nog niet beschikbaar');return;}state.busy[key]=true;queue();Promise.resolve(supplies.setSupplyStatus(id,STATUS.IN_STOCK)).then(function(){toast('Voorraad staat weer op Op voorraad ✓');}).catch(function(error){toast((error&&error.message)||'Voorraad bijwerken mislukt');}).finally(function(){delete state.busy[key];queue();});}
  function onClick(event){var target=event.target&&event.target.closest?event.target:null;if(!target)return;var move=target.closest('[data-cleaning-week-move]');if(move){event.preventDefault();moveCleaning(move);return;}if(target.closest('[data-cleaning-week-add-shopping]')){event.preventDefault();addWeekSupplies();return;}var restock=target.closest('[data-cleaning-week-restock]');if(restock){event.preventDefault();restockSupply(restock.getAttribute('data-cleaning-week-restock'));}}
  function onCleaning(event){var detail=event&&event.detail;if(detail&&detail.data&&typeof detail.data==='object'){state.cleaning=detail.data;queue();}}
  function start(){if(window.__cleaningWeekAssistStarted)return;window.__cleaningWeekAssistStarted=true;prime();attachRepositories();window.addEventListener('familyapp:cleaning-repository',onCleaning);document.addEventListener('click',onClick,true);var target=document.getElementById('screen-cleaning')||document.documentElement;if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(function(){queue();});state.observer.observe(target,{childList:true,subtree:true});}if(!attachRepositories()){var tries=0;state.attachTimer=window.setInterval(function(){tries++;if(attachRepositories()||tries>300){window.clearInterval(state.attachTimer);state.attachTimer=null;}},50);}queue();}
  function stop(){if(state.calendarUnsub)try{state.calendarUnsub();}catch(error){}if(state.shoppingUnsub)try{state.shoppingUnsub();}catch(error){}if(state.attachTimer)window.clearInterval(state.attachTimer);if(state.observer)state.observer.disconnect();state.calendarUnsub=null;state.shoppingUnsub=null;state.attachTimer=null;state.observer=null;}

  window.CleaningWeekAssist={
    version:VERSION,start:start,stop:stop,
    _deriveConflicts:deriveConflicts,_suggestTimes:suggestTimes,_weeklySupplyNeeds:weeklySupplyNeeds,
    _purchasedSupplySuggestions:purchasedSupplySuggestions,_shoppingRecordsForNeeds:shoppingRecordsForNeeds,
    _openShoppingLookup:openShoppingLookup,_occurrenceDate:occurrenceDate,_timeMinutes:timeMinutes
  };
  if(typeof document!=='undefined')start();
})();
