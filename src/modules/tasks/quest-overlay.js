'use strict';
// ============================================================
// TASK MVP RENDERER v0.302
// Replaces the old quest-overlay monolith with one compact task renderer.
// One data path: fam_tasks_v023 -> render -> mutate -> save -> render.
// ============================================================

(function(){
  if(window.__TaskMvpRendererV302) return;
  window.__TaskMvpRendererV302 = true;

  var STORE = 'fam_tasks_v023';
  var LEGACY = ['fam_tasks_v022','fam_tasks_v021'];
  var SUB_PREFIX = 'fqsub_';
  var lang = localStorage.getItem('fam_lang') || 'nl';

  var I = {
    today:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=95&fm=webp',
    level:'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=95&fm=webp',
    streak:'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=900&q=95&fm=webp',
    party:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=95&fm=webp',
    home:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=92&fm=webp',
    plant:'https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=900&q=92&fm=webp',
    car:'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=92&fm=webp',
    kids:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=92&fm=webp',
    food:'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=92&fm=webp',
    work:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=92&fm=webp',
    laundry:'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=900&q=92&fm=webp'
  };

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[ch] || ch; }); }
  function parse(raw, fb){ try { return raw ? JSON.parse(raw) : fb; } catch(e){ return fb; } }
  function A(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function txt(el){ return String(el && el.textContent || '').toLowerCase(); }
  function root(){ return document.getElementById('task-content') || document.querySelector('.task-content'); }
  function isTaskScreen(){ return !!root() && (document.body.classList.contains('screen-tasks') || txt(document.querySelector('.header-title')).match(/taken|tasks/) || document.getElementById('screen-tasks') && document.getElementById('screen-tasks').classList.contains('active')); }
  function isOverview(){ var a=document.querySelector('.ttab.active,.task-tabs .active'); return !a || txt(a).match(/overzicht|overview/); }

  function pick(s){
    s = String(s || '').toLowerCase();
    if(s.indexOf('kind') > -1 || s.indexOf('baby') > -1 || s.indexOf('school') > -1) return I.kids;
    if(s.indexOf('auto') > -1 || s.indexOf('car') > -1) return I.car;
    if(s.indexOf('plant') > -1) return I.plant;
    if(s.indexOf('was') > -1 || s.indexOf('laundry') > -1) return I.laundry;
    if(s.indexOf('eten') > -1 || s.indexOf('kook') > -1 || s.indexOf('boodschap') > -1) return I.food;
    if(s.indexOf('kamer') > -1 || s.indexOf('huis') > -1 || s.indexOf('stof') > -1) return I.home;
    return I.work;
  }

  function defaultTasks(){
    return [
      ['living','SIDE QUEST','Stofzuigen woonkamer','Maak de woonkamer weer fris.',today(),'Esra','+20 XP',I.home,['Kussens opruimen','Vloer stofzuigen','Kleed schoonmaken'],0,'once',today(),'laag','',[]],
      ['plant','SIDE QUEST','Planten water geven','Zorg dat alle planten genoeg water hebben.',todayPlus(1),'Esra','+10 XP',I.plant,['Gieter vullen','Alle planten nalopen'],0,'once',todayPlus(1),'laag','',[]],
      ['car','SIDE QUEST','Auto wassen','Maak de auto van buiten en binnen schoon.',todayPlus(3),'Shane','+30 XP',I.car,['Buitenkant wassen','Interieur opruimen'],0,'once',todayPlus(3),'normaal','',[]]
    ];
  }

  function today(){ return new Date().toISOString().slice(0,10); }
  function todayPlus(n){ var d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

  function tasks(){
    var data = parse(localStorage.getItem(STORE), null);
    if(Array.isArray(data)) return normalize(data);
    for(var i=0;i<LEGACY.length;i++){
      data = parse(localStorage.getItem(LEGACY[i]), null);
      if(Array.isArray(data)) return normalize(data);
    }
    return normalize(defaultTasks());
  }

  function normalize(data){
    return (Array.isArray(data) ? data : []).map(function(x){
      x[0] = x[0] || ('q' + Date.now() + Math.random().toString(16).slice(2));
      x[1] = x[1] || 'SIDE QUEST';
      x[2] = x[2] || 'Nieuwe quest';
      x[3] = x[3] || 'Geen beschrijving.';
      x[4] = x[4] || today();
      x[5] = x[5] || 'Shane';
      x[6] = x[6] || '+10 XP';
      x[7] = x[7] || pick(x[2] + ' ' + x[3]);
      x[8] = Array.isArray(x[8]) && x[8].length ? x[8] : ['Eerste stap'];
      x[9] = x[9] ? 1 : 0;
      x[10] = x[10] || 'once';
      x[11] = x[11] || x[4];
      x[12] = x[12] || 'laag';
      x[13] = x[13] || '';
      x[14] = Array.isArray(x[14]) ? x[14] : [];
      return x;
    });
  }

  function save(data, meta){
    data = normalize(data);
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch(e) {}
    try { window.taskData = data.slice(); } catch(e) {}
    try { if(window.TaskRepositoryAdapter && window.TaskRepositoryAdapter.saveTasks) window.TaskRepositoryAdapter.saveTasks(data, Object.assign({ source:'TaskMvpRenderer' }, meta || {})); } catch(e) {}
    try { if(window.HouseholdRepository && window.HouseholdRepository.saveTasks) window.HouseholdRepository.saveTasks(data, Object.assign({ source:'TaskMvpRenderer' }, meta || {})); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent('familyapp:tasks-updated', { detail:Object.assign({ tasks:data, source:'TaskMvpRenderer' }, meta || {}) })); } catch(e) {}
    return data;
  }

  function get(id){ return tasks().find(function(x){ return String(x[0]) === String(id); }); }
  function put(task, meta){ var data=tasks().map(function(x){ return String(x[0]) === String(task[0]) ? task : x; }); save(data, meta); render(true); }
  function remove(id){ save(tasks().filter(function(x){ return String(x[0]) !== String(id); }), { operation:'deleteTask', id:id }); render(true); }

  function prioCls(p){ p=String(p||'laag').toLowerCase(); return p==='hoog'||p==='high'?'hoog':(p==='normaal'||p==='medium'||p==='normal'?'normaal':'laag'); }
  function prioLabel(p){ return ({hoog:'Hoog',high:'Hoog',normaal:'Normaal',medium:'Normaal',normal:'Normaal',laag:'Laag',low:'Laag'})[String(p||'laag').toLowerCase()] || p; }
  function xpFor(type, prio){ type=String(type||'SIDE QUEST'); prio=String(prio||'laag').toLowerCase(); if(type.indexOf('RAID')>-1) return '+120 XP'; if(type.indexOf('DUNGEON')>-1) return '+60 XP'; if(prio==='hoog'||prio==='high') return '+30 XP'; if(prio==='normaal'||prio==='medium'||prio==='normal') return '+20 XP'; return '+10 XP'; }

  function member(){
    var id='shane', name='Shane';
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getActiveMemberId) id=String(window.HouseholdIdentity.getActiveMemberId()||id); } catch(e) {}
    try { if(window.HouseholdIdentity && window.HouseholdIdentity.getProfile){ var p=window.HouseholdIdentity.getProfile(id)||{}; name=p.name||p.displayName||name; } } catch(e) {}
    try { if(window.myName) name=String(window.myName); } catch(e) {}
    return { memberId:id, name:name, initials:String(name||id).slice(0,2).toUpperCase(), joinedAt:new Date().toISOString() };
  }

  function group(x){
    var d=new Date(x[11]||x[4]); var now=new Date(); now.setHours(0,0,0,0);
    var diff=Math.round((new Date(d.toDateString())-now)/86400000);
    if(isNaN(diff)) return 'Later';
    if(diff===0) return 'Vandaag';
    if(diff===1) return 'Morgen';
    if(diff===2) return 'Overmorgen';
    if(diff>2 && diff<8) return 'Volgende week';
    return 'Later';
  }

  function subState(x){
    var s=parse(localStorage.getItem(SUB_PREFIX+x[0]), null);
    if(Array.isArray(s) && s.length === x[8].length) return s;
    return x[8].map(function(){ return !!x[9]; });
  }
  function saveSub(x, s){ try { localStorage.setItem(SUB_PREFIX+x[0], JSON.stringify(s)); } catch(e) {} }

  function stats(done,total){
    var pct=Math.round(done/Math.max(total,1)*100);
    return '<div class="fqStats">'+
      '<div class="fqStat" data-stat="today" style="background-image:url('+I.today+')"><div class="fqIcon">📅</div><h4>VANDAAG</h4><b>'+total+'</b><div class="fqBar p"><i style="width:'+pct+'%"></i></div><p>'+done+' voltooid</p><div class="fqNext">›</div></div>'+
      '<div class="fqStat" data-stat="level" style="background-image:url('+I.level+')"><div class="fqIcon">⭐</div><h4>LEVEL</h4><b>12</b><p>450 / 800 XP</p><div class="fqNext">›</div></div>'+
      '<div class="fqStat" data-stat="party" style="background-image:url('+I.party+')"><div class="fqIcon">👥</div><h4>PARTY</h4><b>2</b><p>Shane & Esra</p><div class="fqNext">›</div></div>'+
    '</div>';
  }

  function helperHtml(x){
    var helpers = Array.isArray(x[14]) ? x[14] : [];
    if(!helpers.length) return '';
    return '<div class="fqAssistants">'+helpers.slice(0,4).map(function(h){ return '<span class="fqAssistAvatar" title="'+esc(h.name||h.memberId)+'">'+esc(h.initials||String(h.name||'?').slice(0,2).toUpperCase())+'</span>'; }).join('')+'<span class="fqHelpSharedBadge">'+helpers.length+' joined</span></div>';
  }

  function joinRow(x){
    if(!x[13]) return '';
    var me=member();
    var helpers=Array.isArray(x[14])?x[14]:[];
    var joined=helpers.some(function(h){ return String(h.memberId)===String(me.memberId) || String(h.name)===String(me.name); });
    return '<div class="fqJoinRow" data-native-help="1"><span class="fqHelpState">👥 Hulp gevraagd</span>'+helperHtml(x)+'<button class="fqJoinBtn '+(joined?'joined':'')+'" type="button" data-join="'+esc(x[0])+'">'+(joined?'Joined':'Join')+'</button></div>';
  }

  function card(x){
    var isRaid=String(x[1]).indexOf('RAID')>-1;
    var isDung=String(x[1]).indexOf('DUNGEON')>-1;
    var cls=isRaid?'raid':(isDung?'dungeon':'');
    var prio=x[12]||'laag';
    var typeBadge='<span class="fqBadge '+(isRaid?'raid':(isDung?'dungeon':'side'))+'">'+esc(x[1])+'</span>';
    var prioBadge='<span class="fqBadge '+prioCls(prio)+'">'+esc(prioLabel(prio))+'</span>';
    var action=(isRaid||isDung)?'<button class="fqStartBtn '+(isRaid?'raid':'dungeon')+'">'+(isRaid?'Start raid':'Start dungeon')+'</button>':'<div class="fqArrow">›</div>';
    var pp=x[13]?'<span class="fqMetaTag pp">👥 '+esc(x[13])+'</span>':'';
    return '<div class="fqCard '+(x[9]?'done ':'')+cls+' '+(x[13]?'helpRequested ':'')+'" data-id="'+esc(x[0])+'">'+
      '<button class="fqDel" data-del="'+esc(x[0])+'">✕</button>'+
      '<div class="fqImg" style="background-image:url('+esc(x[7])+')"><div class="fqChk">'+(x[9]?'✓':'')+'</div></div>'+
      '<div class="fqBody"><div class="fqBadges">'+typeBadge+prioBadge+'</div><div class="fqTitle">'+esc(x[2])+'</div><div class="fqDesc">'+esc(x[3])+'</div><div class="fqMeta"><span class="fqMetaTag">📅 '+esc(x[11]||x[4])+'</span><span class="fqMetaTag">'+esc(x[5])+'</span>'+pp+'<span class="fqMetaTag xp">'+esc(x[6])+'</span></div>'+joinRow(x)+'</div>'+action+'</div>';
  }

  function render(force){
    var r=root();
    if(!r || !isTaskScreen()) return;
    document.body.classList.add('famTask');
    if(!isOverview()){ r.dataset.mvp302=''; return; }
    if(!force && r.dataset.mvp302==='1') return;
    r.dataset.mvp302='1';
    var data=tasks();
    var done=data.filter(function(x){ return x[9]; }).length;
    var groups={};
    data.forEach(function(x){ var g=group(x); (groups[g]||(groups[g]=[])).push(x); });
    var order=['Vandaag','Morgen','Overmorgen','Volgende week','Later'];
    var html=order.filter(function(g){ return groups[g]; }).map(function(g){
      var arr=groups[g]; var d=arr.filter(function(x){return x[9];}).length; var pct=Math.round(d/Math.max(arr.length,1)*100);
      return '<div class="fqHead" id="grp-'+g.replace(/\s+/g,'-')+'"><h3>'+g+'</h3><span>'+d+' / '+arr.length+' voltooid</span></div><div class="fqDayBar"><i style="width:'+pct+'%"></i></div>'+arr.map(card).join('');
    }).join('');
    r.innerHTML='<div class="fq"><div class="fqTop"><button class="fqAdd">+ Quest toevoegen</button></div>'+stats(done,data.length)+html+'</div>';
    bindCards(r);
  }

  function bindCards(r){
    A('.fqAdd',r).forEach(function(b){ b.onclick=openCreate; });
    A('.fqCard',r).forEach(function(c){
      c.onclick=function(ev){
        var del=ev.target.closest('[data-del]');
        if(del){ ev.preventDefault(); ev.stopPropagation(); remove(del.dataset.del); return; }
        var join=ev.target.closest('[data-join],.fqJoinBtn');
        if(join){ ev.preventDefault(); ev.stopPropagation(); toggleJoin(c.dataset.id); return; }
        detail(c.dataset.id);
      };
    });
  }

  function modal(html){
    var m=document.getElementById('fqModal');
    if(!m){ m=document.createElement('div'); m.id='fqModal'; m.className='fqModal'; document.body.appendChild(m); }
    m.innerHTML=html;
    document.body.style.overflow='hidden';
    requestAnimationFrame(function(){ m.classList.add('open'); });
    m.onclick=function(e){ if(e.target===m) closeModal(); };
    A('.fqBackBtn,.fqClose',m).forEach(function(b){ b.onclick=closeModal; });
    return m;
  }
  function closeModal(){ var m=document.getElementById('fqModal'); if(m){ m.classList.remove('open'); document.body.style.overflow=''; } }
  window.closeModal=window.closeModal||closeModal;

  function hero(img,badges,title,meta){
    return '<div class="fqPage"><button class="fqBackBtn">←</button><div class="fqHero" style="background-image:url('+esc(img)+')"><div class="fqHeroT">'+(badges?'<div class="fqBadges">'+badges+'</div>':'')+'<h2>'+esc(title)+'</h2>'+(meta?'<small>'+meta+'</small>':'')+'</div></div><div class="fqContent">';
  }

  function detail(id){
    var x=get(id); if(!x) return;
    var isRaid=String(x[1]).indexOf('RAID')>-1;
    var isDung=String(x[1]).indexOf('DUNGEON')>-1;
    var typeBadge='<span class="fqBadge '+(isRaid?'raid':(isDung?'dungeon':'side'))+'">'+esc(x[1])+'</span><span class="fqBadge '+prioCls(x[12])+'">'+esc(prioLabel(x[12]))+'</span>';
    var st=subState(x);
    var subHtml=x[8].map(function(s,i){ return '<div class="fqSub '+(st[i]?'done':'')+'" data-si="'+i+'"><div class="fqSubChk">'+(st[i]?'✓':'')+'</div><span class="fqSubText">'+esc(s)+'</span><span class="fqSubXP">+5 XP</span></div>'; }).join('');
    var helpers=(Array.isArray(x[14])?x[14]:[]).length;
    var m=modal(hero(x[7],typeBadge,x[2],esc((x[11]||x[4])+' · '+x[5]+' · '+x[6]))+
      '<p>'+esc(x[3])+'</p><div class="fqBox"><div class="fqProgLabel" id="fqPL"></div><div class="fqProgBar"><i id="fqPB"></i></div><div id="fqSubList">'+subHtml+'</div><button class="fqSubAdd">+ Subquest toevoegen</button></div>'+
      '<div class="fqBox '+(x[13]?'fqHelpBoxActive':'')+'"><b>Vraag om hulp</b><p>Maak er een gezamenlijke quest van.</p><button class="fqHelp fqHelpBtn">'+(x[13]?(helpers?'👥 Hulp gevraagd · '+helpers+' joined':'👥 Hulp gevraagd'):'Vraag hulp 👥')+'</button></div></div></div>');
    function upd(){
      st=A('.fqSub',m).map(function(row){ return row.classList.contains('done'); });
      var d=st.filter(Boolean).length,t=st.length;
      var pb=document.getElementById('fqPB'); if(pb) pb.style.width=(t?Math.round(d/t*100):0)+'%';
      var pl=document.getElementById('fqPL'); if(pl) pl.textContent=d+' / '+t+' voltooid';
      x[9]=(t&&d===t)?1:0; saveSub(x,st); put(x,{ operation:'updateSubtasks', id:x[0] });
    }
    A('.fqSub',m).forEach(function(row){ row.onclick=function(){ row.classList.toggle('done'); var chk=row.querySelector('.fqSubChk'); if(chk) chk.textContent=row.classList.contains('done')?'✓':''; upd(); }; });
    A('.fqSubAdd',m).forEach(function(b){ b.onclick=function(){ var s=prompt('Subquest naam?'); if(!s) return; x[8].push(s); st.push(false); saveSub(x,st); put(x,{ operation:'addSubtask', id:x[0] }); detail(x[0]); }; });
    A('.fqHelpBtn',m).forEach(function(b){ b.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); requestHelp(x[0]); b.textContent='👥 Hulp gevraagd'; var box=b.closest('.fqBox'); if(box) box.classList.add('fqHelpBoxActive'); }; });
    var d=st.filter(Boolean).length,t=st.length; var pb=document.getElementById('fqPB'); if(pb) pb.style.width=(t?Math.round(d/t*100):0)+'%'; var pl=document.getElementById('fqPL'); if(pl) pl.textContent=d+' / '+t+' voltooid';
  }

  function requestHelp(id){
    var x=get(id); if(!x) return;
    x[13]='Hulp gevraagd'; if(!Array.isArray(x[14])) x[14]=[];
    put(x,{ operation:'requestHelp', id:id });
    try { if(typeof window.showToast==='function') window.showToast('Hulpvraag geplaatst 👥'); } catch(e) {}
  }

  function toggleJoin(id){
    var x=get(id); if(!x) return;
    x[13]='Hulp gevraagd'; if(!Array.isArray(x[14])) x[14]=[];
    var me=member(); var joined=x[14].some(function(h){ return String(h.memberId)===String(me.memberId)||String(h.name)===String(me.name); });
    if(joined) x[14]=x[14].filter(function(h){ return String(h.memberId)!==String(me.memberId)&&String(h.name)!==String(me.name); });
    else x[14].push(me);
    put(x,{ operation:joined?'unjoinHelpTask':'joinHelpTask', id:id, memberId:me.memberId });
    try { if(typeof window.showToast==='function') window.showToast(joined?'Hulp verlaten':me.name+' joined 👥'); } catch(e) {}
  }

  function openCreate(){
    var m=modal('<div class="fqPage"><button class="fqBackBtn">←</button><div class="fqHero" style="background-image:url('+I.work+')"><div class="fqHeroT"><div class="fqBadges"><span class="fqBadge side">NIEUW</span></div><h2>Nieuwe quest</h2><small>MVP aanmaakflow</small></div></div><div class="fqContent">'+
      '<div class="fqBox"><input id="qn" placeholder="Titel" style="width:100%;margin-bottom:10px"><textarea id="qd" placeholder="Beschrijving" style="width:100%;min-height:80px;margin-bottom:10px"></textarea><input id="qdate" type="date" value="'+today()+'" style="width:100%;margin-bottom:10px"><select id="qtype" style="width:100%;margin-bottom:10px"><option>SIDE QUEST</option><option>DUNGEON QUEST</option><option>RAID QUEST</option></select><select id="qprio" style="width:100%"><option value="laag">Laag</option><option value="normaal">Normaal</option><option value="hoog">Hoog</option></select></div></div><div class="fqDoneWrap"><button class="fqDone" id="qsave">Quest aanmaken</button></div></div>');
    document.getElementById('qsave').onclick=function(){
      var n=document.getElementById('qn').value.trim(); if(!n){ document.getElementById('qn').focus(); return; }
      var d=document.getElementById('qd').value.trim() || 'Nieuwe quest.';
      var date=document.getElementById('qdate').value || today();
      var type=document.getElementById('qtype').value;
      var prio=document.getElementById('qprio').value;
      var who=(window.myName || 'Shane');
      var task=['q'+Date.now(),type,n,d,date,who,xpFor(type,prio),pick(n+' '+d),['Eerste stap'],0,'once',date,prio,'',[]];
      var data=tasks(); data.unshift(task); save(data,{ operation:'createTask', id:task[0] }); closeModal(); render(true);
      try { if(typeof window.showToast==='function') window.showToast('Quest aangemaakt ✓'); } catch(e) {}
    };
  }

  function bindTabs(){
    A('.ttab,.task-tabs button,.nav-btn').forEach(function(t){
      if(t.__taskMvpBound) return; t.__taskMvpBound=true;
      t.addEventListener('click',function(){ var r=root(); if(r) r.dataset.mvp302=''; setTimeout(function(){ render(true); },80); });
    });
  }

  function run(){ bindTabs(); render(false); }
  window.renderTasks=function(){ var r=root(); if(r) r.dataset.mvp302=''; render(true); };
  window.TaskMvpRenderer={ render:render, tasks:tasks, save:save, requestHelp:requestHelp, toggleJoin:toggleJoin, detail:detail };

  document.addEventListener('DOMContentLoaded',function(){ run(); setTimeout(function(){ render(true); },100); });
  window.addEventListener('load',function(){ run(); setTimeout(function(){ render(true); },180); });
  window.addEventListener('familyapp:tasks-updated',function(){ var r=root(); if(r) r.dataset.mvp302=''; setTimeout(function(){ render(true); },80); });
  for(var i=0;i<8;i++) setTimeout(run,i*220);
})();
