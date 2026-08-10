'use strict';
// ============================================================
// TASK COMPACT HOME v1
// New compact Taken overview per the reference screenshots. Lives on its
// own "Compact" tab, next to the existing "Overzicht" (legacy fq) and
// "Persoon" tabs — the old overview is untouched. Reads window.taskData,
// which TaskSharedData keeps authoritative from
// families/{householdId}/shared/tasks. Row clicks open TaskDetailPopup.
// ============================================================
(function(){
  if(window.__taskCompactHomeV1) return;
  window.__taskCompactHomeV1 = true;

  var state={range:'today',personUid:'all',sortDesc:false,expanded:{Vandaag:true,Morgen:false,Later:false}};

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function members(){try{if(window.TaskSharedData&&typeof window.TaskSharedData.members==='function')return window.TaskSharedData.members()||[];}catch(e){}return[];}
  function memberByUid(uidVal){var list=members();for(var i=0;i<list.length;i++){var m=list[i];if((m.uid||m.id)===uidVal)return m;}return null;}
  function initials(name){return String(name||'G').trim().split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function avatarUrlFor(m){if(!m)return'';var name=(m.displayName||m.name||'').toLowerCase();try{return m.avatarUrl||m.photoURL||localStorage.getItem('fam_avatar_'+name)||'';}catch(e){return'';}}

  function tasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function assignees(task){
    var out=[];
    if(task.assignedToUids&&typeof task.assignedToUids==='object'){
      Object.keys(task.assignedToUids).forEach(function(uidVal){
        if(!task.assignedToUids[uidVal])return;
        var m=memberByUid(uidVal);
        out.push({uid:uidVal,name:(m&&(m.displayName||m.name))||'Gezinslid',member:m});
      });
    }
    if(!out.length&&Array.isArray(task.who))task.who.forEach(function(n){out.push({uid:null,name:n,member:null});});
    return out;
  }
  function groupFor(task){
    if(!task.date)return'Later';
    var d=new Date(task.date+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);
    var diff=Math.round((d-today)/86400000);
    if(diff<=0)return'Vandaag';
    if(diff===1)return'Morgen';
    return'Later';
  }
  function xpLabel(task){if(task.xp)return task.xp;if(task.xpReward)return task.xpReward;return'+'+(task.xpAmount||20)+' XP';}
  function xpNumber(task){var m=String(xpLabel(task)).match(/(\d+)/);return m?parseInt(m[1],10):20;}
  function prioColor(p){var m={hoog:'#dc2626',high:'#dc2626',normaal:'#d97706',medium:'#d97706'};return m[String(p||'').toLowerCase()]||'#9aa3af';}
  function timeLabel(task){return task.time||'';}

  function isDark(){var attr=document.documentElement.getAttribute('data-theme')||'';return attr.indexOf('dark')>-1;}

  // ── XP / level header — intentionally simple & self-contained. Full
  // progression-engine integration is out of scope for this UI phase
  // (see PROGRESSION/XP note in the brief); this renders a light local
  // estimate from myXP/partnerXP so the header isn't empty.
  function levelInfo(){
    var totalXp=(Number(window.myXP)||0)+(Number(window.partnerXP)||0);
    var perLevel=200;
    var level=Math.max(1,Math.floor(totalXp/perLevel)+1);
    var into=totalXp%perLevel;
    var streak=Number(window.currentStreak||window.streakCount||0)||0;
    return{xp:totalXp,level:level,into:into,need:perLevel,streak:streak};
  }

  function injectStyles(){
    if(document.getElementById('task-compact-home-style'))return;
    var s=document.createElement('style');s.id='task-compact-home-style';
    s.textContent =
      '.tch-wrap{padding:14px 14px 110px}'+
      '.tch-header{background:#fff;border:1px solid #edf0ec;border-radius:22px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:12px;box-shadow:0 3px 14px rgba(17,24,39,.05)}'+
      '[data-theme*="dark"] .tch-header{background:linear-gradient(160deg,#1c1533,#120d24);border-color:rgba(234,179,8,.2);box-shadow:0 4px 22px rgba(0,0,0,.4)}'+
      '.tch-shield{width:60px;height:60px;border-radius:16px;background:linear-gradient(160deg,#6d28d9,#4338ca);color:#fbbf24;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(76,29,149,.35)}'+
      '.tch-shield b{font-size:19px;font-weight:950;line-height:1}'+
      '.tch-shield span{font-size:8px;font-weight:900;letter-spacing:.5px;opacity:.85}'+
      '.tch-header-mid{flex:1;min-width:0}'+
      '.tch-xp-row{font-size:13px;font-weight:900;color:#111827;margin-bottom:5px}'+
      '[data-theme*="dark"] .tch-xp-row{color:#f0e9ff}'+
      '.tch-xp-bar{height:7px;border-radius:99px;background:#edeaf5;overflow:hidden;margin-bottom:6px}'+
      '[data-theme*="dark"] .tch-xp-bar{background:rgba(255,255,255,.08)}'+
      '.tch-xp-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:99px}'+
      '.tch-streak{font-size:12px;font-weight:800;color:#d97706}'+
      '.tch-party{text-align:right;flex-shrink:0}'+
      '.tch-party-avatars{display:flex;justify-content:flex-end}'+
      '.tch-party-avatar{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-8px;background:#6d28d9;color:#fff;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;object-fit:cover}'+
      '[data-theme*="dark"] .tch-party-avatar{border-color:#1c1533}'+
      '.tch-party-avatar:first-child{margin-left:0}'+
      '.tch-party-label{font-size:10.5px;font-weight:800;color:#8792a3;margin-top:4px}'+
      '.tch-tabs{display:flex;gap:8px;margin-bottom:12px}'+
      '.tch-tab-btn{flex:1;border:1px solid #e5e7eb;background:#fff;color:#667085;border-radius:14px;padding:10px;font-size:12.5px;font-weight:900;cursor:pointer;letter-spacing:.3px}'+
      '.tch-tab-btn.active{background:#6d28d9;color:#fff;border-color:#6d28d9}'+
      '[data-theme*="dark"] .tch-tab-btn{background:#1c1533;border-color:rgba(234,179,8,.2);color:#c8bde3}'+
      '[data-theme*="dark"] .tch-tab-btn.active{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border-color:transparent}'+
      '.tch-filters{display:flex;gap:8px;margin-bottom:12px;overflow-x:auto;padding-bottom:2px}'+
      '.tch-chip{flex-shrink:0;border:1px solid #e5e7eb;background:#fff;color:#667085;border-radius:99px;padding:8px 13px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}'+
      '.tch-chip.active{background:#efe9fb;border-color:#c9b3f0;color:#6d28d9}'+
      '[data-theme*="dark"] .tch-chip{background:#1c1533;border-color:rgba(234,179,8,.18);color:#c8bde3}'+
      '[data-theme*="dark"] .tch-chip.active{background:rgba(234,179,8,.18);border-color:#eab308;color:#f6e6b4}'+
      '.tch-sort-btn{flex-shrink:0;width:38px;height:38px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;font-size:14px;cursor:pointer}'+
      '[data-theme*="dark"] .tch-sort-btn{background:#1c1533;border-color:rgba(234,179,8,.18);color:#e5d8ff}'+
      '.tch-group{background:#fff;border:1px solid #edf0ec;border-radius:20px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 10px rgba(17,24,39,.04)}'+
      '[data-theme*="dark"] .tch-group{background:#150f28;border-color:rgba(234,179,8,.14)}'+
      '.tch-group-head{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;cursor:pointer}'+
      '.tch-group-title{font-size:14.5px;font-weight:900;color:#111827}'+
      '[data-theme*="dark"] .tch-group-title{color:#f4eeff}'+
      '.tch-group-add{font-size:12.5px;font-weight:800;color:#6d28d9;background:none;border:none;cursor:pointer}'+
      '[data-theme*="dark"] .tch-group-add{color:#eab308}'+
      '.tch-group-chevron{font-size:13px;color:#98a2b3;margin-left:8px}'+
      '.tch-row{display:flex;align-items:center;gap:10px;padding:10px 15px;border-top:1px solid #f1f3f5;cursor:pointer}'+
      '[data-theme*="dark"] .tch-row{border-color:rgba(255,255,255,.05)}'+
      '.tch-check{width:25px;height:25px;border-radius:50%;border:2px solid #d0d5dd;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;color:#fff}'+
      '.tch-check.done{background:#16a34a;border-color:#16a34a}'+
      '.tch-icon{width:34px;height:34px;border-radius:10px;background:#f2eefb;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}'+
      '[data-theme*="dark"] .tch-icon{background:rgba(124,58,237,.22)}'+
      '.tch-main{flex:1;min-width:0}'+
      '.tch-name{font-size:14px;font-weight:850;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
      '[data-theme*="dark"] .tch-name{color:#f4eeff}'+
      '.tch-row.is-done .tch-name{text-decoration:line-through;color:#9aa1af}'+
      '.tch-meta{display:flex;gap:6px;margin-top:2px;font-size:11px;font-weight:700;color:#98a2b3;flex-wrap:wrap}'+
      '.tch-avatars{display:flex;flex:0 0 auto}'+
      '.tch-avatar{width:24px;height:24px;border-radius:50%;margin-left:-6px;border:2px solid #fff;background:#6d28d9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;object-fit:cover}'+
      '[data-theme*="dark"] .tch-avatar{border-color:#150f28}'+
      '.tch-avatar:first-child{margin-left:0}'+
      '.tch-xp{font-size:12.5px;font-weight:900;text-align:right;min-width:50px}'+
      '.tch-chevron{color:#c7cbd3;font-size:16px;flex-shrink:0}'+
      '.tch-empty{padding:26px;text-align:center;color:#98a2b3;font-size:13px;font-weight:700}'+
      '.tch-party-card{background:linear-gradient(135deg,#efe9fb,#f5eeff);border:1px solid #ddd6fe;border-radius:20px;padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer}'+
      '[data-theme*="dark"] .tch-party-card{background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(234,179,8,.1));border-color:rgba(234,179,8,.3)}'+
      '.tch-party-icon{font-size:26px}'+
      '.tch-party-title{font-size:14.5px;font-weight:900;color:#5b21b6}'+
      '[data-theme*="dark"] .tch-party-title{color:#eab308}'+
      '.tch-party-sub{font-size:12px;color:#7c6fa5;font-weight:700}'+
      '[data-theme*="dark"] .tch-party-sub{color:#c8bde3}';
    document.head.appendChild(s);
  }

  function headerHtml(){
    var lv=levelInfo();
    var pct=Math.min(100,Math.round(lv.into/lv.need*100));
    var mList=members();
    var avatarsHtml=mList.slice(0,4).map(function(m){
      var url=avatarUrlFor(m);
      return url?('<img class="tch-party-avatar" src="'+esc(url)+'">'):('<div class="tch-party-avatar">'+esc(initials(m.displayName||m.name))+'</div>');
    }).join('');
    if(!mList.length){
      var myName=localStorage.getItem('familyapp-profile-name-v1')||'Ik';
      var partName=localStorage.getItem('familyapp-partner-name-v1')||'';
      avatarsHtml='<div class="tch-party-avatar">'+esc(initials(myName))+'</div>'+(partName?'<div class="tch-party-avatar">'+esc(initials(partName))+'</div>':'');
    }
    return '<div class="tch-header">'+
      '<div class="tch-shield"><b>'+lv.level+'</b><span>LEVEL</span></div>'+
      '<div class="tch-header-mid">'+
        '<div class="tch-xp-row">'+lv.into+' / '+lv.need+' XP</div>'+
        '<div class="tch-xp-bar"><div class="tch-xp-fill" style="width:'+pct+'%"></div></div>'+
        '<div class="tch-streak">🔥 '+lv.streak+' dagen streak</div>'+
      '</div>'+
      '<div class="tch-party">'+
        '<div class="tch-party-avatars">'+avatarsHtml+'</div>'+
        '<div class="tch-party-label">Party · '+(mList.length||(avatarsHtml?2:1))+' leden</div>'+
      '</div>'+
    '</div>';
  }

  function tabsHtml(){
    return '<div class="tch-tabs">'+
      '<button class="tch-tab-btn" id="tch-goto-overzicht">▦ OVERZICHT</button>'+
      '<button class="tch-tab-btn active">☰ COMPACT</button>'+
    '</div>';
  }

  function filtersHtml(){
    var mList=members();
    var personLabel='Alle personen';
    if(state.personUid!=='all'){var m=memberByUid(state.personUid);if(m)personLabel=m.displayName||m.name;}
    return '<div class="tch-filters">'+
      ['today','week','all'].map(function(r){
        var labels={today:'Vandaag',week:'Deze week',all:'Alles'};
        return '<button class="tch-chip'+(state.range===r?' active':'')+'" data-range="'+r+'">'+labels[r]+'</button>';
      }).join('')+
      (mList.length?('<button class="tch-chip" id="tch-person-btn">👤 '+esc(personLabel)+' ⌄</button>'):'')+
      '<button class="tch-sort-btn" id="tch-sort-btn" title="Sorteren">'+(state.sortDesc?'↓':'↑')+'</button>'+
    '</div>';
  }

  function rowHtml(task){
    var people=assignees(task);
    var subs=Array.isArray(task.subtasks)?task.subtasks.filter(function(s){return s&&typeof s==='object';}):[];
    var metaBits=[];
    if(timeLabel(task))metaBits.push(esc(timeLabel(task)));
    metaBits.push(esc(people.map(function(p){return p.name;}).join(', ')||'Niet toegewezen'));
    if(subs.length)metaBits.push(subs.filter(function(s){return s.done;}).length+'/'+subs.length+' stappen');
    var avatarsHtml=people.slice(0,3).map(function(p){
      var url=p.member?avatarUrlFor(p.member):'';
      return url?('<img class="tch-avatar" src="'+esc(url)+'" title="'+esc(p.name)+'">'):('<span class="tch-avatar" title="'+esc(p.name)+'">'+esc(initials(p.name))+'</span>');
    }).join('');
    var xp=xpNumber(task);
    return '<div class="tch-row'+(task.done?' is-done':'')+'" data-task-id="'+esc(task.id)+'">'+
      '<button class="tch-check'+(task.done?' done':'')+'" data-quick-toggle="'+esc(task.id)+'">'+(task.done?'✓':'')+'</button>'+
      '<div class="tch-icon">'+(task.icon||'📋')+'</div>'+
      '<div class="tch-main">'+
        '<div class="tch-name">'+esc(task.title||'Taak')+'</div>'+
        '<div class="tch-meta">'+metaBits.map(function(b,i){return (i>0?'<span>·</span>':'')+'<span>'+b+'</span>';}).join('')+'</div>'+
      '</div>'+
      '<div class="tch-avatars">'+avatarsHtml+'</div>'+
      '<div class="tch-xp" style="color:'+prioColor(task.prio||task.priority)+'">+'+xp+'<div style="font-size:9px;font-weight:800;color:#c7cbd3">XP</div></div>'+
      '<div class="tch-chevron">›</div>'+
    '</div>';
  }

  function groupHtml(name,list){
    var open=!!state.expanded[name];
    var body=list.length?list.map(rowHtml).join(''):'<div class="tch-empty">Geen taken.</div>';
    return '<div class="tch-group">'+
      '<div class="tch-group-head" data-group-toggle="'+esc(name)+'">'+
        '<div class="tch-group-title">'+esc(name)+' · '+list.length+' taken</div>'+
        '<div style="display:flex;align-items:center"><button class="tch-group-add" data-quick-add="1">+ Taak</button><span class="tch-group-chevron">'+(open?'⌃':'⌄')+'</span></div>'+
      '</div>'+
      (open?body:'')+
    '</div>';
  }

  function render(el){
    if(!el)el=document.getElementById('task-content');
    if(!el)return;
    injectStyles();
    var all=tasks().slice();
    if(state.personUid!=='all')all=all.filter(function(t){return t.assignedToUids&&t.assignedToUids[state.personUid];});
    all.sort(function(a,b){
      var da=a.date||'9999-99-99',db=b.date||'9999-99-99';
      var cmp=String(da).localeCompare(String(db));
      return state.sortDesc?-cmp:cmp;
    });
    var groups={Vandaag:[],Morgen:[],Later:[]};
    all.forEach(function(t){groups[groupFor(t)].push(t);});
    if(state.range==='today'){/* all groups shown, Vandaag expanded by default via state */}

    var html='<div class="tch-wrap">'+
      headerHtml()+
      tabsHtml()+
      filtersHtml()+
      groupHtml('Vandaag',groups.Vandaag)+
      groupHtml('Morgen',groups.Morgen)+
      groupHtml('Later',groups.Later)+
      '<div class="tch-party-card" id="tch-party-quest"><div class="tch-party-icon">🧰</div><div><div class="tch-party-title">Party Quest actief!</div><div class="tch-party-sub">Werk samen en verdien bonus XP</div></div></div>'+
    '</div>';
    el.innerHTML=html;
    bind(el);
  }

  function bind(el){
    var gotoBtn=document.getElementById('tch-goto-overzicht');
    if(gotoBtn)gotoBtn.onclick=function(){
      var btn=document.querySelector('.ttab');
      if(typeof window.setTaskTab==='function')window.setTaskTab('overzicht',btn);
    };
    el.querySelectorAll('[data-range]').forEach(function(btn){
      btn.onclick=function(){
        state.range=btn.getAttribute('data-range');
        state.expanded.Vandaag=true;
        state.expanded.Morgen=state.range!=='today';
        state.expanded.Later=state.range==='all';
        render(el);
      };
    });
    var sortBtn=document.getElementById('tch-sort-btn');
    if(sortBtn)sortBtn.onclick=function(){state.sortDesc=!state.sortDesc;render(el);};
    var personBtn=document.getElementById('tch-person-btn');
    if(personBtn)personBtn.onclick=function(){
      var mList=members();
      var options=['Alle personen'].concat(mList.map(function(m){return m.displayName||m.name;}));
      var choice=prompt('Filter op persoon:\n'+options.map(function(o,i){return i+': '+o;}).join('\n'),'0');
      var idx=parseInt(choice,10);
      if(isNaN(idx)||idx<=0){state.personUid='all';}
      else{var m=mList[idx-1];state.personUid=m?(m.uid||m.id):'all';}
      render(el);
    };
    el.querySelectorAll('[data-group-toggle]').forEach(function(head){
      head.addEventListener('click',function(e){
        if(e.target.closest('[data-quick-add]'))return;
        var name=head.getAttribute('data-group-toggle');
        state.expanded[name]=!state.expanded[name];
        render(el);
      });
    });
    el.querySelectorAll('[data-quick-add]').forEach(function(btn){
      btn.onclick=function(e){e.stopPropagation();if(typeof window.openAdd==='function')window.openAdd('task');};
    });
    el.querySelectorAll('[data-quick-toggle]').forEach(function(btn){
      btn.onclick=function(e){
        e.stopPropagation();
        var id=btn.getAttribute('data-quick-toggle');
        var task=(window.taskData||[]).find(function(t){return String(t.id)===String(id);});
        var subs=task&&Array.isArray(task.subtasks)?task.subtasks.filter(function(s){return s&&typeof s==='object';}):[];
        if(subs.length&&!task.done){
          if(typeof window.showToast==='function')window.showToast('Voltooi eerst alle stappen in de taak');
          if(window.TaskDetailPopup)window.TaskDetailPopup.open(id);
          return;
        }
        if(typeof window.toggleTask==='function')window.toggleTask(id);
      };
    });
    el.querySelectorAll('[data-task-id]').forEach(function(row){
      row.addEventListener('click',function(e){
        if(e.target.closest('[data-quick-toggle]'))return;
        var id=row.getAttribute('data-task-id');
        if(window.TaskDetailPopup)window.TaskDetailPopup.open(id);
      });
    });
    var partyBtn=document.getElementById('tch-party-quest');
    if(partyBtn)partyBtn.onclick=function(){if(typeof window.showGQPopup==='function')window.showGQPopup('Groepsquest');};
  }

  window.TaskCompactHome={render:render,state:state};
  window.addEventListener('familyapp:tasks-updated',function(){
    if(window.taskTab==='compact'){var el=document.getElementById('task-content');if(el)render(el);}
  });
})();
