'use strict';
// ============================================================
// CLEANING ROOM LIST CONTROLS v0.1.0
// Progressive controls around the canonical room/routine list:
// - remove a routine directly from the expanded room card (two-tap confirm)
// - persist a household-wide room order with accessible up/down controls
// - preserve the visible room position while either action rerenders the list
// ============================================================
(function(){
  if(window.CleaningRoomListControls)return;

  var VERSION='0.1.0';
  var state={observer:null,queued:false,confirmRoutineId:null,confirmTimer:null,deleting:{},movingRoomId:null};

  function clone(value){if(value===undefined)return undefined;try{return JSON.parse(JSON.stringify(value));}catch(error){return value;}}
  function text(value){return String(value==null?'':value).trim();}
  function now(){return Date.now();}
  function repository(){return window.CleaningHouseholdRepository||null;}
  function repositorySnapshot(){try{var repo=repository();return repo&&repo.snapshot?repo.snapshot():null;}catch(error){return null;}}
  function contextSnapshot(){try{return window.HouseholdContext&&window.HouseholdContext.snapshot?window.HouseholdContext.snapshot():null;}catch(error){return null;}}
  function captureContext(){try{return window.HouseholdContext&&window.HouseholdContext.capture?window.HouseholdContext.capture():null;}catch(error){return null;}}
  function contextIsCurrent(token){try{return !!(window.HouseholdContext&&window.HouseholdContext.isCurrent&&window.HouseholdContext.isCurrent(token));}catch(error){return false;}}
  function firebaseDb(){try{return window.fbDb||(window.firebase&&window.firebase.database&&window.firebase.database())||null;}catch(error){return null;}}
  function basePath(householdId){var domain=window.CleaningDomain;return householdId&&domain&&domain.basePath?domain.basePath(householdId):null;}
  function finiteOrder(value){var number=Number(value);return Number.isFinite(number)?number:null;}

  function showToast(message){
    if(typeof window.showToast==='function'){window.showToast(message);return;}
    try{console.info('[CleaningRoomListControls]',message);}catch(error){}
  }

  function compareRooms(a,b){
    var aOrder=finiteOrder(a&&a.sortOrder),bOrder=finiteOrder(b&&b.sortOrder);
    if(aOrder!==null||bOrder!==null){
      if(aOrder===null)return 1;
      if(bOrder===null)return -1;
      if(aOrder!==bOrder)return aOrder-bOrder;
    }
    var aCreated=Number(a&&a.createdAt)||0,bCreated=Number(b&&b.createdAt)||0;
    if(aCreated!==bCreated)return aCreated-bCreated;
    var nameResult=text(a&&a.name).localeCompare(text(b&&b.name),'nl');
    if(nameResult)return nameResult;
    return text(a&&a.id).localeCompare(text(b&&b.id),'nl');
  }

  function activeRoomsFrom(value){
    var rooms=value&&typeof value==='object'?value:{};
    return Object.keys(rooms).map(function(id){return Object.assign({id:id},clone(rooms[id]||{}));})
      .filter(function(room){return room&&room.active!==false;})
      .sort(compareRooms);
  }

  function currentRooms(){
    var snapshot=repositorySnapshot(),rooms=snapshot&&snapshot.data&&snapshot.data.rooms;
    return activeRoomsFrom(rooms||{});
  }

  function reorderRooms(serverRooms,roomId,direction,actorUid,timestamp){
    var rooms=serverRooms&&typeof serverRooms==='object'?clone(serverRooms):{};
    var ordered=activeRoomsFrom(rooms),index=ordered.findIndex(function(room){return text(room.id)===text(roomId);});
    var target=index+(Number(direction)<0?-1:1);
    if(index<0||target<0||target>=ordered.length)return{changed:false,rooms:rooms,order:ordered.map(function(room){return room.id;})};
    var moved=ordered.splice(index,1)[0];ordered.splice(target,0,moved);
    ordered.forEach(function(room,position){
      var id=room.id,row=rooms[id]&&typeof rooms[id]==='object'?rooms[id]:{};
      row.sortOrder=(position+1)*1000;
      row.updatedAt=timestamp;
      row.updatedByUid=actorUid;
      rooms[id]=row;
    });
    return{changed:true,rooms:rooms,order:ordered.map(function(room){return room.id;})};
  }

  function requireWriteContext(){
    var ctx=contextSnapshot(),database=firebaseDb(),token=captureContext();
    if(!ctx||ctx.ready!==true||!ctx.uid||!ctx.householdId)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    if(!database)throw new Error('FIREBASE_DATABASE_UNAVAILABLE');
    if(!token||!contextIsCurrent(token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED');
    var path=basePath(ctx.householdId);
    if(!path)throw new Error('ACTIVE_HOUSEHOLD_REQUIRED');
    return{ctx:ctx,database:database,token:token,path:path};
  }

  function moveRoom(roomId,direction){
    var write;
    try{write=requireWriteContext();}catch(error){return Promise.reject(error);}
    var transition=null,transitionError=null,timestamp=now();
    return write.database.ref(write.path+'/rooms').transaction(function(serverRooms){
      if(!contextIsCurrent(write.token)){transitionError=new Error('HOUSEHOLD_CONTEXT_CHANGED');return;}
      transition=reorderRooms(serverRooms||{},roomId,direction,write.ctx.uid,timestamp);
      transitionError=null;
      return transition.changed?transition.rooms:serverRooms;
    }).then(function(result){
      if(transitionError)throw transitionError;
      if(!contextIsCurrent(write.token))throw new Error('HOUSEHOLD_CONTEXT_CHANGED_AFTER_WRITE');
      if(!result||result.committed!==true)throw new Error('CLEANING_ROOM_ORDER_NOT_COMMITTED');
      return transition||{changed:false,order:[]};
    });
  }

  function scrollContainerFor(node){
    var cursor=node&&node.parentElement;
    while(cursor&&cursor!==document.body&&cursor!==document.documentElement){
      try{
        var style=window.getComputedStyle?window.getComputedStyle(cursor):null;
        var overflow=text(style&&(style.overflowY||style.overflow));
        if(/auto|scroll|overlay/i.test(overflow)&&Number(cursor.scrollHeight)>Number(cursor.clientHeight)+1)return cursor;
      }catch(error){}
      cursor=cursor.parentElement;
    }
    return window;
  }

  function scrollPosition(container){return !container||container===window?Number(window.scrollY||window.pageYOffset||0):Number(container.scrollTop||0);}
  function boxTop(node){try{var box=node&&node.getBoundingClientRect?node.getBoundingClientRect():null;return box&&Number.isFinite(Number(box.top))?Number(box.top):null;}catch(error){return null;}}

  function captureRoomViewport(roomId){
    var card=findRoomCard(roomId),anchor=card&&card.querySelector?card.querySelector('.cleaning-room-card-main')||card:card;
    return{roomId:text(roomId),container:scrollContainerFor(anchor),top:boxTop(anchor),fallback:scrollPosition(scrollContainerFor(anchor))};
  }

  function findRoomCard(roomId){
    var cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');
    for(var i=0;i<cards.length;i++)if(text(cards[i].getAttribute('data-cleaning-room-id'))===text(roomId))return cards[i];
    return null;
  }

  function restoreRoomViewport(viewport){
    if(!viewport)return;
    var card=findRoomCard(viewport.roomId),anchor=card&&card.querySelector?card.querySelector('.cleaning-room-card-main')||card:card;
    var top=boxTop(anchor);
    if(top!==null&&viewport.top!==null){
      var delta=top-viewport.top;
      if(Math.abs(delta)>0.5){
        if(viewport.container===window){
          if(window.scrollBy)window.scrollBy(0,delta);else if(window.scrollTo)window.scrollTo(0,scrollPosition(window)+delta);
        }else viewport.container.scrollTop=scrollPosition(viewport.container)+delta;
      }
    }else{
      var current=scrollPosition(viewport.container),fallback=Number(viewport.fallback)||0;
      if(Math.abs(current-fallback)>1){
        if(viewport.container===window){if(window.scrollTo)window.scrollTo(0,fallback);}else viewport.container.scrollTop=fallback;
      }
    }
  }

  function restoreAcrossFrames(viewport){
    var raf=window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);};
    raf(function(){restoreRoomViewport(viewport);raf(function(){restoreRoomViewport(viewport);});});
  }

  function removeRoutine(routineId,roomId){
    var repo=repository();
    if(!repo||typeof repo.removeRoutineItem!=='function')return Promise.reject(new Error('CLEANING_ROUTINE_REMOVE_UNAVAILABLE'));
    var viewport=captureRoomViewport(roomId);
    state.deleting[routineId]=true;
    state.confirmRoutineId=null;
    queue();
    return repo.removeRoutineItem(routineId).then(function(result){
      delete state.deleting[routineId];
      restoreAcrossFrames(viewport);
      showToast('Routine verwijderd ✓');
      queue();
      return result;
    }).catch(function(error){
      delete state.deleting[routineId];
      state.confirmRoutineId=null;
      restoreAcrossFrames(viewport);
      showToast('Routine verwijderen mislukt');
      queue();
      throw error;
    });
  }

  function ensureStyle(){
    if(document.getElementById('cleaning-room-list-controls-style'))return;
    var style=document.createElement('style');
    style.id='cleaning-room-list-controls-style';
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

  function decorateHelp(){
    var help=document.querySelector('#screen-cleaning [data-cleaning-room-help]');
    if(help)help.textContent='Kamers staan standaard ingeklapt. Open een kamer voor routines, directe verwijdering, toewijzing en de gewenste kamer-volgorde.';
  }

  function decorateRoomOrder(){
    var ordered=currentRooms(),positions={};
    ordered.forEach(function(room,index){positions[room.id]=index;});
    var cards=document.querySelectorAll('#screen-cleaning .cleaning-room-card[data-cleaning-room-id]');
    for(var i=0;i<cards.length;i++){
      var card=cards[i],roomId=text(card.getAttribute('data-cleaning-room-id')),position=positions[roomId];
      if(position===undefined)continue;
      card.style.order=String(position);
      var bar=card.querySelector('[data-cleaning-room-order-bar]');
      if(!bar){
        bar=document.createElement('div');
        bar.className='cleaning-room-order-bar';
        bar.setAttribute('data-cleaning-room-order-bar',roomId);
        var main=card.querySelector('.cleaning-room-card-main');
        if(main&&main.parentNode)main.parentNode.insertBefore(bar,main.nextSibling);else card.insertBefore(bar,card.firstChild);
      }
      var moving=state.movingRoomId===roomId;
      bar.innerHTML='<span>Volgorde in Kamers</span><div class="cleaning-room-order-actions">'
        +'<button type="button" class="cleaning-room-order-button" data-cleaning-room-move="-1" data-cleaning-room-order-id="'+roomId+'" aria-label="Kamer omhoog"'+((position===0||moving)?' disabled':'')+'>'+(moving?'Opslaan…':'↑ Omhoog')+'</button>'
        +'<button type="button" class="cleaning-room-order-button" data-cleaning-room-move="1" data-cleaning-room-order-id="'+roomId+'" aria-label="Kamer omlaag"'+((position===ordered.length-1||moving)?' disabled':'')+'>'+(moving?'Opslaan…':'↓ Omlaag')+'</button>'
        +'</div>';
    }
  }

  function decorateRoutineRemove(){
    var edits=document.querySelectorAll('#screen-cleaning [data-cleaning-routine-edit]');
    for(var i=0;i<edits.length;i++){
      var edit=edits[i],routineId=text(edit.getAttribute('data-cleaning-routine-edit')),item=edit.closest&&edit.closest('.cleaning-routine-item'),actions=item&&item.querySelector?item.querySelector('.cleaning-routine-item-actions'):null;
      if(!routineId||!actions)continue;
      var button=actions.querySelector('[data-cleaning-routine-remove]');
      if(!button){button=document.createElement('button');button.type='button';button.className='cleaning-routine-remove-button';button.setAttribute('data-cleaning-routine-remove',routineId);actions.appendChild(button);}
      var deleting=!!state.deleting[routineId],confirming=state.confirmRoutineId===routineId;
      button.disabled=deleting;
      button.classList.toggle('is-confirm',confirming);
      button.textContent=deleting?'Verwijderen…':(confirming?'Zeker verwijderen?':'Verwijder');
      button.setAttribute('aria-label',confirming?'Routine definitief verwijderen':'Routine verwijderen');
    }
  }

  function decorate(){state.queued=false;ensureStyle();decorateHelp();decorateRoomOrder();decorateRoutineRemove();}
  function queue(){if(state.queued)return;state.queued=true;(window.requestAnimationFrame||function(callback){return window.setTimeout(callback,0);})(decorate);}

  function confirmRoutineRemoval(routineId){
    state.confirmRoutineId=routineId;
    if(state.confirmTimer)window.clearTimeout(state.confirmTimer);
    state.confirmTimer=window.setTimeout(function(){if(state.confirmRoutineId===routineId){state.confirmRoutineId=null;queue();}state.confirmTimer=null;},4200);
    queue();
  }

  function onClick(event){
    var target=event.target,closest=target&&target.closest?target.closest.bind(target):null;
    if(!closest)return;

    var remove=closest('[data-cleaning-routine-remove]');
    if(remove){
      event.preventDefault();event.stopPropagation();
      var routineId=text(remove.getAttribute('data-cleaning-routine-remove'));
      if(!routineId||state.deleting[routineId])return;
      if(state.confirmRoutineId!==routineId){confirmRoutineRemoval(routineId);return;}
      if(state.confirmTimer){window.clearTimeout(state.confirmTimer);state.confirmTimer=null;}
      var card=remove.closest('.cleaning-room-card'),roomId=card&&text(card.getAttribute('data-cleaning-room-id'));
      removeRoutine(routineId,roomId).catch(function(error){try{console.warn('[CleaningRoomListControls] remove failed',error);}catch(ignore){}});
      return;
    }

    var move=closest('[data-cleaning-room-move][data-cleaning-room-order-id]');
    if(move){
      event.preventDefault();event.stopPropagation();
      if(move.disabled)return;
      var roomId=text(move.getAttribute('data-cleaning-room-order-id')),direction=Number(move.getAttribute('data-cleaning-room-move'))<0?-1:1;
      if(!roomId||state.movingRoomId)return;
      var viewport=captureRoomViewport(roomId);
      state.movingRoomId=roomId;queue();
      moveRoom(roomId,direction).then(function(result){
        state.movingRoomId=null;
        restoreAcrossFrames(viewport);
        if(result&&result.changed)showToast('Kamer-volgorde opgeslagen ✓');
        queue();
      }).catch(function(error){
        state.movingRoomId=null;
        restoreAcrossFrames(viewport);
        showToast('Kamer verplaatsen mislukt');
        queue();
        try{console.warn('[CleaningRoomListControls] move failed',error);}catch(ignore){}
      });
    }
  }

  function start(){
    if(window.__cleaningRoomListControlsStarted)return;
    window.__cleaningRoomListControlsStarted=true;
    ensureStyle();
    document.addEventListener('click',onClick,true);
    var target=document.getElementById('screen-cleaning')||document.documentElement;
    if(typeof MutationObserver!=='undefined'&&target){state.observer=new MutationObserver(queue);state.observer.observe(target,{childList:true,subtree:true});}
    window.addEventListener('familyapp:cleaning-repository',queue);
    queue();
  }

  window.CleaningRoomListControls={
    version:VERSION,
    start:start,
    moveRoom:moveRoom,
    removeRoutine:removeRoutine,
    _compareRooms:compareRooms,
    _activeRoomsFrom:activeRoomsFrom,
    _reorderRooms:reorderRooms
  };
  start();
})();
