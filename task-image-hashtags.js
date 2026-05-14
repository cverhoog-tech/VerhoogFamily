(function(){
try{
  if(window.__familyTaskImageHashtags){return;}
  window.__familyTaskImageHashtags=1;

  var IMAGE_TAGS={
    bathroom:{hashtags:['#badkamer','#douche','#wastafel','#spiegel','#bad','#bathroom'],keywords:['badkamer','douche','wastafel','spiegel','bad schoon','tegels','putje'],url:'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    livingroom:{hashtags:['#woonkamer','#bank','#salontafel','#tv','#livingroom'],keywords:['woonkamer','huiskamer','bank','salontafel','tv meubel','kleed','kussens'],url:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    toilet:{hashtags:['#wc','#toilet'],keywords:['wc','toilet','closet','bril schoon','toiletrol'],url:'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    bedroom:{hashtags:['#slaapkamer','#bed','#opmaken'],keywords:['slaapkamer','bed','dekbed','kussen','nachtkast','bed opmaken'],url:'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    attic:{hashtags:['#zolder','#opslag','#opruimen'],keywords:['zolder','opslag','dozen','berging','spullen uitzoeken'],url:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    vacuum:{hashtags:['#stofzuigen','#vloer','#schoonmaken'],keywords:['stofzuig','stofzuigen','vloer zuigen','kleed zuigen','tapijt'],url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    windows:{hashtags:['#ramen','#ramenzemen','#glas'],keywords:['ramen','ramenzemen','glas','raam','trekker','vensterbank'],url:'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    kidsroom:{hashtags:['#kinderkamer','#speelgoed','#kinderen'],keywords:['kinderkamer','speelgoed','knuffels','lego','kind','schooltas'],url:'https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    car:{hashtags:['#auto','#autowassen','#interieur'],keywords:['auto','autowassen','wassen auto','interieur','stofzuigen auto','tank','banden'],url:'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    familycar:{hashtags:['#gezin','#autorijden','#familycar'],keywords:['gezin auto','familie auto','kinderen auto','rit','wegbrengen','ophalen'],url:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    kitchen:{hashtags:['#keuken','#koken','#aanrecht'],keywords:['keuken','aanrecht','fornuis','oven','koelkast','koken'],url:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    dining:{hashtags:['#eettafel','#tafel','#eten'],keywords:['eettafel','tafel dekken','tafel afruimen','eten','diner'],url:'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    laundry:{hashtags:['#was','#wassen','#wasmachine'],keywords:['was','wassen','wasmachine','droger','wasmand','vouwen','strijken'],url:'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    dishes:{hashtags:['#afwas','#vaatwasser','#servies'],keywords:['afwas','vaat','vaatwasser','servies','borden','glazen','bestek'],url:'https://images.unsplash.com/photo-1607006483224-96f48b386c24?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    groceries:{hashtags:['#boodschappen','#voorraad','#winkel'],keywords:['boodschap','boodschappen','supermarkt','voorraad','winkel','lunchbox'],url:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    trash:{hashtags:['#afval','#vuilnis','#container'],keywords:['afval','vuilnis','container','prullenbak','papierbak','glasbak'],url:'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    closet:{hashtags:['#kast','#kleding','#opruimen'],keywords:['kast','kleding','kleren','schoenen','garderobe','opruimen kast'],url:'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    garden:{hashtags:['#tuin','#planten','#watergeven'],keywords:['tuin','planten','water geven','onkruid','bloemen','gras','gieter'],url:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    pet:{hashtags:['#huisdier','#hond','#kat'],keywords:['hond','kat','huisdier','voer','uitlaten','mand','dierenarts'],url:'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=90&fm=webp'},
    work:{hashtags:['#werkplek','#administratie','#planning'],keywords:['werkplek','bureau','administratie','planning','mail','documenten'],url:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=90&fm=webp'}
  };

  function norm(s){return (s||'').toString().toLowerCase();}
  function score(rule,text){
    var total=0;
    rule.hashtags.forEach(function(h){if(text.indexOf(h)>-1){total+=5;}});
    rule.keywords.forEach(function(k){if(text.indexOf(k)>-1){total+=2;}});
    return total;
  }
  function matchTaskImage(title,description){
    var text=norm(title+' '+(description||''));
    var best='work',bestScore=0;
    Object.keys(IMAGE_TAGS).forEach(function(key){
      var s=score(IMAGE_TAGS[key],text);
      if(s>bestScore){bestScore=s;best=key;}
    });
    return IMAGE_TAGS[best];
  }
  function applyToStorage(){
    var raw=localStorage.getItem('fam_tasks_v023');
    if(!raw){return false;}
    var changed=false;
    var tasks=JSON.parse(raw);
    tasks.forEach(function(t){
      var img=matchTaskImage(t[2],t[3]);
      if(img&&t[7]!==img.url){t[7]=img.url;changed=true;}
      if(img&&t.length<15){t[14]=img.hashtags.slice(0,3).join(' ');changed=true;}
    });
    if(changed){localStorage.setItem('fam_tasks_v023',JSON.stringify(tasks));}
    return changed;
  }
  function applyToDom(){
    var cards=[].slice.call(document.querySelectorAll('.fqCard'));
    cards.forEach(function(card){
      var title=card.querySelector('.fqTitle');
      var desc=card.querySelector('.fqDesc');
      var img=matchTaskImage(title&&title.textContent,desc&&desc.textContent);
      var box=card.querySelector('.fqImg');
      if(box&&img){box.style.backgroundImage='url('+img.url+')';}
    });
    var hero=document.querySelector('.fqHero');
    var modalTitle=document.querySelector('.fqHero h2');
    var modalText=document.querySelector('.fqContent p');
    if(hero&&modalTitle){
      var m=matchTaskImage(modalTitle.textContent,modalText&&modalText.textContent);
      if(m){hero.style.backgroundImage='url('+m.url+')';}
    }
  }
  function run(){
    applyToStorage();
    applyToDom();
    // No page reload here. Reloads reset the active screen and sent users to Home after creating a quest.
  }

  window.FamilyTaskImages={tags:IMAGE_TAGS,match:matchTaskImage,refresh:run};
  document.addEventListener('DOMContentLoaded',run);
  new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});
  setInterval(run,1500);
}catch(e){console.warn('task-image-hashtags failed',e);}
})();

(function(){
  if(window.__familyAppTaskCreateStayPatchV2) return;
  window.__familyAppTaskCreateStayPatchV2 = true;

  function forceTasksScreen(){
    try{
      if(typeof _currentScreen !== 'undefined') window._currentScreen = 'tasks';
      document.querySelectorAll('.screen').forEach(function(screen){ screen.classList.remove('active'); });
      var taskScreen = document.getElementById('screen-tasks');
      if(taskScreen) taskScreen.classList.add('active');
      var title = document.getElementById('hdr-title');
      if(title) title.textContent = 'Taken';
      document.querySelectorAll('.nav-btn').forEach(function(btn){
        var isTasks = btn.dataset && btn.dataset.goto === 'tasks';
        btn.classList.toggle('active', !!isTasks);
      });
      if(typeof renderTasks === 'function') renderTasks();
      if(typeof updateStats === 'function') updateStats();
    }catch(e){}
  }

  function persistTasksOnly(){
    try{
      if(window.AppState && typeof AppState.get === 'function'){
        var state = AppState.get();
        if(state){
          state.tasks = taskData;
          state.taskNextId = taskNextId;
          state.recur = recurData;
          state.recurNextId = recurNextId;
          state.meta = state.meta || {};
          state.meta.lastSaved = new Date().toISOString();
          localStorage.setItem('familieapp_state_v024', JSON.stringify(state));
        }
      }
      if(typeof syncToFirebase === 'function') syncToFirebase();
    }catch(e){}
  }

  function installSaveItemPatch(){
    if(typeof saveItem !== 'function' || saveItem.__stayOnTasksPatchV2) return;
    var originalSaveItem = saveItem;
    saveItem = function(){
      if(typeof currentAddType !== 'undefined' && currentAddType === 'task'){
        var f1 = document.getElementById('f1');
        var val = f1 ? f1.value.trim() : '';
        if(!val){ if(typeof closeAdd === 'function') closeAdd(); forceTasksScreen(); return; }

        if(typeof taskTypeMode !== 'undefined' && taskTypeMode === 'herhalend'){
          var who2=[];
          if(typeof wieRShane !== 'undefined' && wieRShane) who2.push('Shane');
          if(typeof wieREsra !== 'undefined' && wieREsra) who2.push('Esra');
          if(!who2.length) who2.push(myName);
          var r={id:'r'+recurNextId++,title:val,who:who2,freq:freqMode,days:[],streak:0,doneWeek:{},doneDates:{}};
          if(freqMode==='weekly'){
            document.querySelectorAll('#freq-days .day-pill.active').forEach(function(b){r.days.push(b.dataset.day);});
            if(!r.days.length){ if(typeof showToast === 'function') showToast('Kies minimaal één dag'); return; }
            r.freqLabel=r.days.map(function(d){return d.slice(0,2);}).join(', ');
          } else {
            var wkBtn=document.querySelector('[data-wk].active');
            var dayBtn=document.querySelector('#freq-month-days .day-pill.active');
            r.week=wkBtn?parseInt(wkBtn.dataset.wk,10):1;
            r.day=dayBtn?dayBtn.dataset.day:'maandag';
            r.weeks=freqMode==='monthly2'?[r.week,r.week+2]:[r.week];
            r.freqLabel='Week '+r.week+' · '+r.day.slice(0,2);
          }
          recurData.push(r);
          persistTasksOnly();
          if(typeof addActivity === 'function') addActivity('🔁','#e8f5e3',myName+' voegde vaste taak "'+val+'" toe');
        } else {
          var who=[];
          if(typeof wieShane !== 'undefined' && wieShane) who.push('Shane');
          if(typeof wieEsra !== 'undefined' && wieEsra) who.push('Esra');
          if(!who.length) who.push(myName);
          var date=(document.getElementById('f3')||{}).value||null;
          var prio=(document.getElementById('f4')||{}).value||'med';
          taskData.unshift({id:taskNextId++,title:val,who:who,date:date,done:false,prio:prio});
          persistTasksOnly();
          if(typeof addActivity === 'function') addActivity('📋','#f0ede8',myName+' maakte taak "'+val+'" aan');
          if(typeof addNotif === 'function') addNotif('📋','#f0ede8','Nieuwe taak',''+val);
        }

        if(typeof closeAdd === 'function') closeAdd();
        if(typeof renderTasks === 'function') renderTasks();
        if(typeof updateStats === 'function') updateStats();
        if(typeof taskTypeMode !== 'undefined') taskTypeMode='eenmalig';
        if(typeof wieShane !== 'undefined') wieShane=true;
        if(typeof wieEsra !== 'undefined') wieEsra=false;
        if(typeof wieRShane !== 'undefined') wieRShane=true;
        if(typeof wieREsra !== 'undefined') wieREsra=false;
        if(typeof freqMode !== 'undefined') freqMode='weekly';
        [0,80,200,500].forEach(function(delay){ setTimeout(forceTasksScreen, delay); });
        return;
      }
      return originalSaveItem.apply(this, arguments);
    };
    saveItem.__stayOnTasksPatchV2 = true;
  }

  function installQuestOverlayPatch(){
    if(typeof openQuestCreator !== 'function' || openQuestCreator.__stayOnTasksPatchV2) return;
    var originalOpenQuestCreator = openQuestCreator;
    openQuestCreator = function(){
      var result = originalOpenQuestCreator.apply(this, arguments);
      setTimeout(function(){
        var buttons=[].slice.call(document.querySelectorAll('button'));
        buttons.forEach(function(btn){
          var label=(btn.textContent||'').toLowerCase();
          if(label.indexOf('quest')>-1 && (label.indexOf('toevoegen')>-1 || label.indexOf('opslaan')>-1 || label.indexOf('aanmaken')>-1)){
            btn.addEventListener('click', function(){
              [120,300,700,1200].forEach(function(delay){ setTimeout(forceTasksScreen, delay); });
            }, true);
          }
        });
      }, 120);
      return result;
    };
    openQuestCreator.__stayOnTasksPatchV2 = true;
  }

  function install(){ installSaveItemPatch(); installQuestOverlayPatch(); }
  window.addEventListener('load', function(){ [100,500,1200,2500].forEach(function(delay){ setTimeout(install, delay); }); });
  document.addEventListener('click', function(){ setTimeout(install, 50); }, true);
  setInterval(install, 1500);
})();
