'use strict';
// ============================================================
// CLEANING ROOM LIST CONTROLS v0.2.0
// Direct routine removal + persistent household room ordering.
// This module only decorates the Rooms tab and never touches Planning UI.
// ============================================================
(function(){
  if(window.CleaningRoomListControlsV2)return;

  var VERSION='0.2.0';
  var state={observer:null,queued:false,confirmId:null,confirmTimer:null,deleting:{},moving:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function repo(){return window.CleaningHouseholdRepository||null;}
  function snapshot(){try{var value=repo();return value&&value.snapshot?value.snapshot():null;}catch(error){return null;}}
  function context(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function capture(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function current(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function database(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function cleaningPath(householdId){var domain=window.CleaningDomain;return householdId&&domain&&domain.basePath?domain.basePath(householdId):null;}
  function finite(value){var number=Number(value);return Number.isFinite(number)?number:null;}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);else try{console.info('[CleaningRoomListControlsV2]',message);}catch(error){}}

  function compareRooms(a,b){
    var ao=finite(a&&a.sortOrder),bo=finite(b&&b.sortOrder);
    if(ao!==null||bo!==null){if(ao===null)return 1;if(bo===null)return-1;if(ao!==bo)return ao-bo;}
    var ac=Number(a&&a.createdAt)||0,bc=Number(b&&b.createdAt)||0;
    if(ac!==bc)return ac-bc;
    var byName=text(a&&a.name).localeCompare(text(b&&b.name),'nl');
    return byName||text(a&&a.id).localeCompare(text(b&&b.id),'nl');
  }

  function activeRoomsFrom(value){
    var rooms=value&&typeof value==='object'?value:{};
    return Object.keys(rooms).map(function(id){return Object.assign({id:id},clone(rooms[id]||{}));})
      .filter(function(room){return room.active!==false;}).sort(compareRooms);
  }

  function currentRooms(){var value=snapshot(),rooms=value&&value.data&&value.data.rooms;return activeRoomsFrom(rooms||{});}

  function reorderRooms(serverRooms,roomId,direction,actorUid,timestamp){
    var rooms=serverRooms&&typeof serverRooms==='object'?clone(serverRooms):{};
    var ordered=activeRoomsFrom(rooms),from=ordered.findIndex(function(room){return text(room.id)===text(roomId);});
    var to=from+(Number(direction)<0?-1:1);
    if(from<0||to<0||to>=ordered.length)return{changed:false,rooms:rooms,order:ordered.map(function(room){return room.id;})};
    ordered.splice(to,0,ordered.splice(from,1)[0]);
    ordered.forEach(function(room,index){var row=rooms[room.id]||{};row.sortOrder=(index+1)*1000;row.updatedAt=timestamp;row.updatedByUid=actorUid;rooms[room.id]=row;});
    return{changed:true,rooms:rooms,order:ordered.map(function(room){return room.id;})};
  }

  function writeContext(){
    var ctx=context(),db=database(),token=capture(),path=ctx&&cleaningPath(ctx.householdId);
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!db)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    if(!token||!current(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    return{ctx:ctx,db:db,token:token,path:path};
  }

  function moveRoom(roomId,direction){
    var write;try{write=writeContext();}catch(error){return Promise.reject(error);}
    var outcome=null,transitionError=null,timestamp=now();
    return write.db.ref(write.path+'/rooms').transaction(function(serverRooms){
      if(!current(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      outcome=reorderRooms(serverRooms||{},roomId,direction,write.ctx.uid,timestamp);transitionError=null;
      return outcome.changed?outcome.rooms:serverRooms;
    }).then(function(result){
      if(transitionError)throw transitionError;
      if(!current(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      if(!result||result.committed!==true)throw new Error('CLEANING_ROOM_ORDER_NOT_COMMITTED');
      return outcome||{changed:false,order:[]};
    });
  }

  function cardFor(roomId){
    var cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');
    for(var i=0;i<cards.length;i++)if(text(cards[i].getAttribute('data-cleaning-room-id'))===text(roomId))return cards[i];
    return null;
  }

  function scrollContainer(node){
    var cursor=node&&node.parentElement;
    while(cursor&&cursor!==document.body&&cursor!==document.documentElement){
      try{var style=window.getComputedStyle?window.getComputedStyle(cursor):null,overflow=text(style&&(style.overflowY||style.overflow));if(/auto|scroll|overlay/i.test(overflow)&&Number(cursor.scrollHeight)>Number(cursor.clientHeight)+1)return cursor;}catch(error){}
      cursor=cursor.parentElement;
    }
    return window;
  }

  function topOf(node){try{var box=node&&node.getBoundingClientRect?node.getBoundingClientRect():null;return box&&Number.isFinite(Number(box.top))?Number(box.top):null;}catch(error){return null;}}
  function scrollTop(container){return !container||container===window?Number(window.scrollY||window.pageYOffset||0):Number(container.scrollTop||0);}

  function captureRoom(roomId){
    var card=cardFor(roomId),anchor=card&&card.querySelector?card.querySelector('.cleaning-room-card-main')||card:card,container=scrollContainer(anchor);
    return{roomId:text(roomId),container:container,top:topOf(anchor),fallback:scrollTop(container)};
  }

  function restoreRoom(viewport){
    if(!viewport)return;
    var card=cardFor(viewport.roomId),anchor=card&&card.querySelector?card.querySelector('.cleaning-room-card-main')||card:card,nextTop=topOf(anchor);
    if(nextTop!==null&&viewport.top!==null){
      var delta=nextTop-viewport.top;if(Math.abs(delta)<0.5)return;
      if(viewport.container===window){if(window.scrollBy)window.scrollBy(0,delta);else if(window.scrollTo)window.scrollTo(0,scrollTop(window)+delta);}else viewport.container.scrollTop=scrollTop(viewport.container)+delta;
      return;
    }
    if(viewport.container===window){if(window.scrollTo)window.scrollTo(0,viewport.fallback);}else viewport.container.scrollTop=viewport.fallback;
  }

  function restoreFrames(viewport){var raf=window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);};raf(function(){restoreRoom(viewport);raf(function(){restoreRoom(viewport);});});}

  function removeRoutine(routineId,roomId){
    var repository=repo();if(!repository||typeof repository.removeRoutineItem!=='function')return Promise.reject(new Error('CLEANING_ROUTINE_REMOVE_UNAVAILABLE'));
    var viewport=captureRoom(roomId);state.deleting[routineId]=true;state.confirmId=null;queue();
    return repository.removeRoutineItem(routineId).then(function(result){delete state.deleting[routineId];restoreFrames(viewport);toast('Routine verwijderd ✓');queue();return result;})
      .catch(function(error){delete state.deleting[routineId];restoreFrames(viewport);toast('Routine verwijderen mislukt');queue();throw error;});
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-room-list-controls-v2-style'))return;
    var style=document.createElement('style');style.id='cleaning-room-list-controls-v2-style';
    style.textContent='\n'
      +'#screen-cleaning .cleaning-room-order-bar{display:none;align-items:center;justify-content:space-between;gap:10px;margin-top:11px;padding:9px 10px;border-top:1px solid var(--cleaning-border)}\n'
      +'#screen-cleaning .cleaning-room-card.is-expanded .cleaning-room-order-bar{display:flex}\n'
      +'#screen-cleaning .cleaning-room-order-bar>span{color:var(--cleaning-muted);font-size:10px;font-weight:850}\n'
      +'#screen-cleaning .cleaning-room-order-actions{display:flex;gap:7px}\n'
      +'#screen-cleaning .cleaning-room-order-button,#screen-cleaning .cleaning-routine-remove-button{min-height:34px;border:1px solid var(--cleaning-border);border-radius:10px;padding:0 10px;background:var(--cleaning-surface);color:var(--cleaning-text);font:inherit;font-size:10px;font-weight:900;cursor:pointer}\n'
      +'#screen-cleaning .cleaning-room-order-button:disabled,#screen-cleaning .cleaning-routine-remove-button:disabled{opacity:.45;cursor:default}\n'
      +'#screen-cleaning .cleaning-routine-remove-button{border-color:rgba(188,54,66,.22);background:rgba(188,54,66,.07);color:#b32636}\n'
      +'#screen-cleaning .cleaning-routine-remove-button.is-confirm{background:#b32636;color:#fff;border-color:#b32636}\n'
      +'[data-theme*="dark"] #screen-cleaning .cleaning-routine-remove-button{color:#ff9ba6}\n'
      +'[data-theme*="dark"] #screen-cleaning .cleaning-routine-remove-button.is-confirm{color:#fff}\n';
    document.head.appendChild(style);
  }

  function decorateHelp(){var help=document.querySelector('#screen-cleaning [data-cleaning-room-help]'),copy='Kamers staan standaard ingeklapt. Open een kamer voor routines, directe verwijdering, toewijzing en de gewenste kamer-volgorde.';if(help&&help.textContent!==copy)help.textContent=copy;}

  function orderMarkup(roomId,position,total,moving){
    return '<span>Volgorde in Kamers</span><div class="cleaning-room-order-actions">'
      +'<button type="button" class="cleaning-room-order-button" data-cleaning-room-move="-1" data-cleaning-room-order-id="'+roomId+'" aria-label="Kamer omhoog"'+((position===0||moving)?' disabled':'')+'>'+(moving?'Opslaan…':'↑ Omhoog')+'</button>'
      +'<button type="button" class="cleaning-room-order-button" data-cleaning-room-move="1" data-cleaning-room-order-id="'+roomId+'" aria-label="Kamer omlaag"'+((position===total-1||moving)?' disabled':'')+'>'+(moving?'Opslaan…':'↓ Omlaag')+'</button></div>';
  }

  function decorateRooms(){
    var rooms=currentRooms(),positions={};rooms.forEach(function(room,index){positions[room.id]=index;});
    var cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');
    for(var i=0;i<cards.length;i++){
      var card=cards[i],roomId=text(card.getAttribute('data-cleaning-room-id')),position=positions[roomId];if(position===undefined)continue;
      card.style.order=String(position);
      var bar=card.querySelector('[data-cleaning-room-order-bar]');
      if(!bar){bar=document.createElement('div');bar.className='cleaning-room-order-bar';bar.setAttribute('data-cleaning-room-order-bar',roomId);var main=card.querySelector('.cleaning-room-card-main');if(main&&main.parentNode)main.parentNode.insertBefore(bar,main.nextSibling);else card.insertBefore(bar,card.firstChild);}
      var moving=state.moving===roomId,signature=[position,rooms.length,moving?'1':'0'].join('|'),markup=orderMarkup(roomId,position,rooms.length,moving);
      if(bar.getAttribute('data-order-signature')!==signature){bar.setAttribute('data-order-signature',signature);bar.innerHTML=markup;}
    }
  }

  function decorateRoutineButtons(){
    var edits=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]');
    for(var i=0;i<edits.length;i++){
      var edit=edits[i],routineId=text(edit.getAttribute('data-cleaning-routine-edit')),item=edit.closest&&edit.closest('.cleaning-routine-item'),actions=item&&item.querySelector?item.querySelector('.cleaning-routine-item-actions'):null;if(!routineId||!actions)continue;
      var button=actions.querySelector('[data-cleaning-routine-remove]');
      if(!button){button=document.createElement('button');button.type='button';button.className='cleaning-routine-remove-button';button.setAttribute('data-cleaning-routine-remove',routineId);actions.appendChild(button);}
      var deleting=!!state.deleting[routineId],confirming=state.confirmId===routineId,label=deleting?'Verwijderen…':(confirming?'Zeker verwijderen?':'Verwijder');
      button.disabled=deleting;button.classList.toggle('is-confirm',confirming);if(button.textContent!==label)button.textContent=label;
      button.setAttribute('aria-label',confirming?'Routine definitief verwijderen':'Routine verwijderen');
    }
  }

  function decorate(){state.queued=false;ensureStyle();decorateHelp();decorateRooms();decorateRoutineButtons();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function askRemove(routineId){
    state.confirmId=routineId;if(state.confirmTimer)window.clearTimeout(state.confirmTimer);
    state.confirmTimer=window.setTimeout(function(){if(state.confirmId===routineId){state.confirmId=null;queue();}state.confirmTimer=null;},4200);queue();
  }

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;if(!closest)return;
    var remove=closest('[data-cleaning-routine-remove]');
    if(remove){
      event.preventDefault();event.stopPropagation();var routineId=text(remove.getAttribute('data-cleaning-routine-remove'));if(!routineId||state.deleting[routineId])return;
      if(state.confirmId!==routineId){askRemove(routineId);return;}
      if(state.confirmTimer){window.clearTimeout(state.confirmTimer);state.confirmTimer=null;}
      var card=remove.closest('.cleaning-room-card'),roomId=card&&text(card.getAttribute('data-cleaning-room-id'));
      removeRoutine(routineId,roomId).catch(function(error){try{console.warn('[CleaningRoomListControlsV2] remove failed',error);}catch(ignore){}});return;
    }
    var move=closest('[data-cleaning-room-move][data-cleaning-room-order-id]');
    if(move){
      event.preventDefault();event.stopPropagation();if(move.disabled||state.moving)return;
      var roomId=text(move.getAttribute('data-cleaning-room-order-id')),direction=Number(move.getAttribute('data-cleaning-room-move'))<0?-1:1,viewport=captureRoom(roomId);if(!roomId)return;
      state.moving=roomId;queue();
      moveRoom(roomId,direction).then(function(result){state.moving=null;restoreFrames(viewport);if(result&&result.changed)toast('Kamer-volgorde opgeslagen ✓');queue();})
        .catch(function(error){state.moving=null;restoreFrames(viewport);toast('Kamer verplaatsen mislukt');queue();try{console.warn('[CleaningRoomListControlsV2] move failed',error);}catch(ignore){}});
    }
  }

  function start(){
    if(window.__cleaningRoomListControlsV2Started)return;window.__cleaningRoomListControlsV2Started=true;ensureStyle();document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    window.addEventListener('familyapp:cleaning-repository',queue);queue();
  }

  window.CleaningRoomListControlsV2={version:VERSION,start:start,moveRoom:moveRoom,removeRoutine:removeRoutine,_compareRooms:compareRooms,_activeRoomsFrom:activeRoomsFrom,_reorderRooms:reorderRooms};
  start();
})();
