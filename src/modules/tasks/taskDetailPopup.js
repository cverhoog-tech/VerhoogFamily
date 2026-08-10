'use strict';
// ============================================================
// TASK DETAIL POPUP v1 (compact home companion)
// Renders the light/dark quest-detail card shown in the reference
// screenshots. All mutations (subtasks, notes, help, edit, delete,
// complete) go through TaskSharedData so they stay authoritative in
// families/{householdId}/shared/tasks/{taskId}. Does not touch the
// legacy fq (#fqModal) detail popup used by the "Overzicht" tab.
// ============================================================
(function(){
  if(window.__taskDetailPopupV1) return;
  window.__taskDetailPopupV1 = true;

  var openId = null;
  var helpPickerOpen = false;
  var detailsOpen = false;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function currentUid(){try{return (window.fbUser||(window.firebase&&firebase.auth&&firebase.auth().currentUser)||{}).uid||null;}catch(e){return null;}}
  function currentName(){return localStorage.getItem('familyapp-profile-name-v1')||'Ik';}
  function members(){try{if(window.TaskSharedData&&typeof window.TaskSharedData.members==='function')return window.TaskSharedData.members()||[];}catch(e){}return[];}
  function memberByUid(uidVal){var list=members();for(var i=0;i<list.length;i++){var m=list[i];if((m.uid||m.id)===uidVal)return m;}return null;}
  function memberName(uidVal){var m=memberByUid(uidVal);if(m)return m.displayName||m.name||'Gezinslid';if(uidVal===currentUid())return currentName();return 'Gezinslid';}
  function initials(name){return String(name||'G').trim().split(/\s+/).map(function(p){return p.charAt(0);}).join('').slice(0,2).toUpperCase()||'G';}
  function avatarUrlFor(m){if(!m)return'';var name=(m.displayName||m.name||'').toLowerCase();try{return m.avatarUrl||m.photoURL||localStorage.getItem('fam_avatar_'+name)||'';}catch(e){return'';}}

  function isDark(){var attr=document.documentElement.getAttribute('data-theme')||'';return attr.indexOf('dark')>-1;}

  function findTask(id){return (window.taskData||[]).find(function(t){return String(t.id)===String(id);})||null;}

  function subtasks(task){var s=task&&task.subtasks;return Array.isArray(s)?s.filter(function(x){return x&&typeof x==='object';}):[];}
  function assignees(task){
    var out=[];
    if(task.assignedToUids&&typeof task.assignedToUids==='object'){
      Object.keys(task.assignedToUids).forEach(function(uidVal){if(task.assignedToUids[uidVal])out.push({uid:uidVal,name:memberName(uidVal)});});
    }
    if(!out.length&&Array.isArray(task.who))task.who.forEach(function(n){out.push({uid:null,name:n});});
    return out;
  }
  function xpLabel(task){if(task.xp)return task.xp;if(task.xpReward)return task.xpReward;var n=task.xpAmount||20;return '+'+n+' XP';}
  function xpNumber(task){var m=String(xpLabel(task)).match(/(\d+)/);return m?parseInt(m[1],10):20;}
  function prioLabel(p){var m={hoog:'Hoge prioriteit',high:'Hoge prioriteit',normaal:'Normale prioriteit',medium:'Normale prioriteit',laag:'Lage prioriteit',low:'Lage prioriteit'};return m[String(p||'laag').toLowerCase()]||'Normale prioriteit';}
  function dateTimeLabel(task){
    if(!task.date)return'Geen datum';
    var d=new Date(task.date+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);
    var diff=Math.round((d-today)/86400000),label;
    if(diff===0)label='Vandaag';else if(diff===1)label='Morgen';else if(diff===-1)label='Gisteren';
    else label=d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});
    return label+(task.time?' '+task.time:'');
  }
  function heroGradientFor(task){
    var seedStr=String(task.title||task.id||''),h=0;
    for(var i=0;i<seedStr.length;i++)h=(h*31+seedStr.charCodeAt(i))>>>0;
    var hue=h%360;
    return 'linear-gradient(135deg,hsl('+hue+',55%,52%),hsl('+((hue+40)%360)+',60%,32%))';
  }

  function ready(){return !!(window.TaskSharedData&&typeof window.TaskSharedData.update==='function'&&window.TaskSharedData.status&&window.TaskSharedData.status().ready);}
  function persistLocal(task){
    try{
      var idx=(window.taskData||[]).findIndex(function(t){return String(t.id)===String(task.id);});
      if(idx>-1)window.taskData[idx]=task;
      if(window.AppState&&typeof window.AppState.save==='function')window.AppState.save();
    }catch(e){}
  }
  // Every mutation from this popup goes through TaskSharedData.update() so writes land in
  // families/{householdId}/shared/tasks/{taskId}. If the shared store is not ready yet
  // (offline / not-yet-connected household) we fall back to a local-only patch so the UI
  // stays responsive; this local branch is a cache fallback, never the authority.
  function patch(id,patchObj,cb){
    var task=findTask(id);
    if(ready()){
      window.TaskSharedData.update(id,patchObj).then(function(saved){
        persistLocal(saved);
        if(typeof window.renderTasks==='function')window.renderTasks();
        if(typeof window.updateStats==='function')window.updateStats();
        if(cb)cb(saved);
      }).catch(function(err){
        console.warn('[TaskDetailPopup] shared update failed',err);
        if(typeof window.showToast==='function')window.showToast('Kon niet opslaan — probeer opnieuw');
      });
      return;
    }
    if(!task)return;
    Object.keys(patchObj).forEach(function(k){task[k]=patchObj[k];});
    task.updatedAt=Date.now();
    persistLocal(task);
    if(typeof window.renderTasks==='function')window.renderTasks();
    if(typeof window.updateStats==='function')window.updateStats();
    if(cb)cb(task);
  }

  function injectStyles(){
    if(document.getElementById('task-detail-popup-style'))return;
    var s=document.createElement('style');s.id='task-detail-popup-style';
    s.textContent =
      '.tdp-overlay{position:fixed;inset:0;background:rgba(10,8,20,.55);z-index:9500;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s}'+
      '.tdp-overlay.open{opacity:1}'+
      '.tdp-card{width:100%;max-width:480px;max-height:92vh;overflow-y:auto;background:#fff;border-radius:26px 26px 0 0;transform:translateY(24px);transition:transform .25s;box-shadow:0 -10px 50px rgba(0,0,0,.25)}'+
      '.tdp-overlay.open .tdp-card{transform:translateY(0)}'+
      '[data-theme*="dark"] .tdp-card{background:#141024;border:1px solid rgba(234,179,8,.25);border-bottom:none}'+
      '.tdp-hero{position:relative;height:150px;border-radius:26px 26px 0 0;background-size:cover;background-position:center;overflow:hidden}'+
      '.tdp-close{position:absolute;top:14px;left:14px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);border:none;font-size:15px;color:#111827;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2}'+
      '[data-theme*="dark"] .tdp-close{background:rgba(20,16,36,.85);color:#f3ecff}'+
      '.tdp-xp-ribbon{position:absolute;top:0;right:18px;background:#fff;color:#6d28d9;font-weight:900;font-size:14px;text-align:center;padding:8px 12px 10px;border-radius:0 0 10px 10px;box-shadow:0 4px 12px rgba(0,0,0,.15);line-height:1.1}'+
      '[data-theme*="dark"] .tdp-xp-ribbon{background:#1c1533;color:#eab308;box-shadow:0 4px 16px rgba(234,179,8,.25)}'+
      '.tdp-xp-ribbon small{display:block;font-size:9px;font-weight:800;opacity:.7;letter-spacing:.5px}'+
      '.tdp-body{padding:0 18px 24px}'+
      '.tdp-icon{width:64px;height:64px;border-radius:18px;background:#fff;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.12);margin-top:-32px;display:flex;align-items:center;justify-content:center;font-size:28px;position:relative;z-index:2}'+
      '[data-theme*="dark"] .tdp-icon{background:#1c1533;border-color:#1c1533;box-shadow:0 6px 20px rgba(234,179,8,.2)}'+
      '.tdp-title{font-size:22px;font-weight:950;color:#111827;margin:12px 0 8px;letter-spacing:-.3px}'+
      '[data-theme*="dark"] .tdp-title{color:#f6f1ff}'+
      '.tdp-person{display:flex;align-items:center;gap:9px;margin-bottom:16px}'+
      '.tdp-person-avatar{width:30px;height:30px;border-radius:50%;background:#6d28d9;color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;object-fit:cover;flex-shrink:0}'+
      '.tdp-person-meta{font-size:12.5px;color:#8792a3;font-weight:700;display:flex;gap:6px;flex-wrap:wrap;align-items:center}'+
      '.tdp-person-name{font-size:14.5px;font-weight:900;color:#111827}'+
      '[data-theme*="dark"] .tdp-person-name{color:#f0eaff}'+
      '[data-theme*="dark"] .tdp-person-meta{color:#a99fc9}'+
      '.tdp-desc{font-size:13.5px;color:#5b6472;line-height:1.5;margin-bottom:16px}'+
      '[data-theme*="dark"] .tdp-desc{color:#c7bfe0}'+
      '.tdp-box{background:#f8f8f6;border:1px solid #edf0ec;border-radius:18px;padding:16px;margin-bottom:14px}'+
      '[data-theme*="dark"] .tdp-box{background:#1a1530;border-color:rgba(234,179,8,.18)}'+
      '.tdp-box-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}'+
      '.tdp-box-label{font-size:11px;font-weight:900;color:#8792a3;letter-spacing:.6px;text-transform:uppercase}'+
      '[data-theme*="dark"] .tdp-box-label{color:#c8a8f0}'+
      '.tdp-box-value{font-size:13px;font-weight:900;color:#6d28d9}'+
      '[data-theme*="dark"] .tdp-box-value{color:#c9a4ff}'+
      '.tdp-progress-track{display:flex;gap:5px;margin-bottom:4px}'+
      '.tdp-progress-seg{flex:1;height:8px;border-radius:99px;background:#e5e0f5}'+
      '.tdp-progress-seg.done{background:linear-gradient(90deg,#7c3aed,#a855f7)}'+
      '[data-theme*="dark"] .tdp-progress-seg{background:rgba(255,255,255,.08)}'+
      '.tdp-hint{font-size:11.5px;color:#98a2b3;text-align:center;margin:10px 0 4px;font-style:italic}'+
      '.tdp-sub{display:flex;align-items:center;gap:11px;padding:11px 4px;border-bottom:1px solid #eef0f2}'+
      '[data-theme*="dark"] .tdp-sub{border-color:rgba(255,255,255,.06)}'+
      '.tdp-sub:last-child{border-bottom:none}'+
      '.tdp-sub-chk{width:26px;height:26px;border-radius:50%;border:2px solid #d8d4e6;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;color:#fff;font-size:12px}'+
      '.tdp-sub-chk.done{background:#7c3aed;border-color:#7c3aed}'+
      '.tdp-sub-text{flex:1;font-size:14px;font-weight:800;color:#111827}'+
      '[data-theme*="dark"] .tdp-sub-text{color:#efe9fb}'+
      '.tdp-sub.done .tdp-sub-text{text-decoration:line-through;color:#9aa1af}'+
      '.tdp-sub-del{background:none;border:none;color:#c7cbd3;font-size:13px;cursor:pointer;padding:4px}'+
      '.tdp-sub-add{width:100%;margin-top:8px;background:none;border:1.5px dashed #d8d4e6;border-radius:12px;padding:9px;font-size:12.5px;font-weight:800;color:#6d28d9;cursor:pointer}'+
      '[data-theme*="dark"] .tdp-sub-add{border-color:rgba(234,179,8,.3);color:#eab308}'+
      '.tdp-help-btn{width:100%;border:none;border-radius:14px;padding:13px;font-size:14px;font-weight:900;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;cursor:pointer;box-shadow:0 6px 18px rgba(124,58,237,.3)}'+
      '.tdp-member-pick{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'+
      '.tdp-member-chip{border:1.5px solid #e2ddf2;background:#fff;border-radius:99px;padding:7px 13px;font-size:12.5px;font-weight:800;color:#4a4560;cursor:pointer}'+
      '[data-theme*="dark"] .tdp-member-chip{background:#241a3f;border-color:rgba(234,179,8,.25);color:#ece3ff}'+
      '.tdp-note{padding:10px 0;border-bottom:1px solid #eef0f2}'+
      '[data-theme*="dark"] .tdp-note{border-color:rgba(255,255,255,.06)}'+
      '.tdp-note:last-child{border-bottom:none}'+
      '.tdp-note-head{display:flex;justify-content:space-between;font-size:11px;font-weight:900;color:#8792a3;margin-bottom:3px}'+
      '.tdp-note-text{font-size:13.5px;color:#333;line-height:1.4}'+
      '[data-theme*="dark"] .tdp-note-text{color:#e6dffa}'+
      '.tdp-note-form{display:flex;gap:8px;margin-top:10px}'+
      '.tdp-note-input{flex:1;border:1.5px solid #e2ddf2;border-radius:12px;padding:10px 12px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#111827}'+
      '[data-theme*="dark"] .tdp-note-input{background:#241a3f;border-color:rgba(234,179,8,.25);color:#f3ecff}'+
      '.tdp-note-send{border:none;background:#6d28d9;color:#fff;border-radius:12px;padding:0 16px;font-weight:900;cursor:pointer}'+
      '.tdp-more{width:100%;background:none;border:none;text-align:center;font-size:13px;font-weight:800;color:#6d28d9;padding:8px 0 2px;cursor:pointer}'+
      '[data-theme*="dark"] .tdp-more{color:#eab308}'+
      '.tdp-edit-field{margin-bottom:12px}'+
      '.tdp-edit-label{font-size:11px;font-weight:900;color:#8792a3;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}'+
      '.tdp-edit-input,.tdp-edit-select,.tdp-edit-textarea{width:100%;box-sizing:border-box;border:1.5px solid #e2ddf2;border-radius:12px;padding:10px 12px;font-size:13.5px;font-family:inherit;background:#fff;color:#111827;outline:none}'+
      '[data-theme*="dark"] .tdp-edit-input,[data-theme*="dark"] .tdp-edit-select,[data-theme*="dark"] .tdp-edit-textarea{background:#241a3f;border-color:rgba(234,179,8,.25);color:#f3ecff}'+
      '.tdp-footer{display:flex;gap:10px;margin-top:6px}'+
      '.tdp-save{width:56px;flex-shrink:0;border-radius:14px;border:1.5px solid #e2ddf2;background:#fff;color:#6d28d9;font-size:18px;cursor:pointer}'+
      '[data-theme*="dark"] .tdp-save{background:#241a3f;border-color:rgba(234,179,8,.25);color:#eab308}'+
      '.tdp-cta{flex:1;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;background:#f0edf7;color:#b7b0cc}'+
      '.tdp-cta.active{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;box-shadow:0 6px 18px rgba(124,58,237,.32)}'+
      '.tdp-cta.done-state{background:#16a34a;color:#fff}'+
      '.tdp-del-btn{width:100%;background:none;border:none;color:#dc2626;font-size:13px;font-weight:800;padding:12px 0 0;cursor:pointer}';
    document.head.appendChild(s);
  }

  function overlayEl(){
    var el=document.getElementById('tdp-overlay');
    if(!el){el=document.createElement('div');el.id='tdp-overlay';el.className='tdp-overlay';document.body.appendChild(el);}
    return el;
  }

  function close(){
    var ov=document.getElementById('tdp-overlay');
    if(ov){ov.classList.remove('open');setTimeout(function(){ov.innerHTML='';},220);}
    openId=null;helpPickerOpen=false;detailsOpen=false;
    document.body.style.overflow='';
  }

  function render(){
    var task=findTask(openId);
    if(!task){close();return;}
    injectStyles();
    var ov=overlayEl();
    var subs=subtasks(task);
    var subDone=subs.filter(function(s){return s.done;}).length;
    var totalXp=xpNumber(task);
    var allSubsDone=!subs.length||subDone===subs.length;
    var people=assignees(task);
    var mainPerson=people[0];
    var mainAvatar=mainPerson?memberByUid(mainPerson.uid):null;
    var mainAvatarUrl=mainAvatar?avatarUrlFor(mainAvatar):'';

    var progressSegs='';
    if(subs.length){
      progressSegs='<div class="tdp-progress-track">'+subs.map(function(s){return '<div class="tdp-progress-seg'+(s.done?' done':'')+'"></div>';}).join('')+'</div>';
    }

    var subsHtml=subs.map(function(s){
      return '<div class="tdp-sub'+(s.done?' done':'')+'" data-sub="'+esc(s.id)+'">'+
        '<button class="tdp-sub-chk'+(s.done?' done':'')+'" data-sub-toggle="'+esc(s.id)+'">'+(s.done?'✓':'')+'</button>'+
        '<span class="tdp-sub-text">'+esc(s.title)+'</span>'+
        '<button class="tdp-sub-del" data-sub-del="'+esc(s.id)+'" title="Verwijderen">✕</button>'+
      '</div>';
    }).join('');

    var notes=Array.isArray(task.notes)?task.notes.slice().reverse():[];
    var notesHtml=notes.length?notes.map(function(n){
      var when='';try{when=new Date(n.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){}
      return '<div class="tdp-note"><div class="tdp-note-head"><span>'+esc(memberName(n.createdByUid))+'</span><span>'+esc(when)+'</span></div><div class="tdp-note-text">'+esc(n.text)+'</div></div>';
    }).join('') : '<div style="font-size:12.5px;color:#98a2b3;padding:2px 0 4px">Nog geen opmerkingen.</div>';

    var helpableMembers=members().filter(function(m){var id=m.uid||m.id;return id&&id!==currentUid()&&!(task.assignedToUids&&task.assignedToUids[id]);});
    var helpChips=helpableMembers.length?helpableMembers.map(function(m){var id=m.uid||m.id;return '<button class="tdp-member-chip" data-help-pick="'+esc(id)+'">'+esc(m.displayName||m.name||'Gezinslid')+'</button>';}).join(''):'<div style="font-size:12px;color:#98a2b3">Geen andere gezinsleden gevonden.</div>';

    var ctaState = allSubsDone ? (task.done?'active done-state':'active') : '';
    var ctaLabel = allSubsDone ? (task.done?'↩ Heropenen':'✓ Voltooien') : '🔒 Voltooi eerst alle stappen';

    var detailsHtml = detailsOpen ? (
      '<div class="tdp-box">'+
        '<div class="tdp-edit-field"><label class="tdp-edit-label">Beschrijving</label><textarea class="tdp-edit-textarea" id="tdp-edit-desc" rows="3">'+esc(task.desc||task.description||'')+'</textarea></div>'+
        '<div style="display:flex;gap:10px">'+
          '<div class="tdp-edit-field" style="flex:1"><label class="tdp-edit-label">Datum</label><input class="tdp-edit-input" type="date" id="tdp-edit-date" value="'+esc(task.date||'')+'"></div>'+
          '<div class="tdp-edit-field" style="flex:1"><label class="tdp-edit-label">Prioriteit</label><select class="tdp-edit-select" id="tdp-edit-prio">'+
            ['laag','normaal','hoog'].map(function(p){return '<option value="'+p+'"'+((task.prio||'laag')===p?' selected':'')+'>'+prioLabel(p)+'</option>';}).join('')+
          '</select></div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;margin-top:4px">'+
          '<button class="tdp-cta active" id="tdp-save-edit" style="flex:1;padding:11px">Wijzigingen opslaan</button>'+
        '</div>'+
        '<button class="tdp-del-btn" id="tdp-delete-btn">🗑 Taak verwijderen</button>'+
      '</div>'
    ) : '';

    var html =
      '<div class="tdp-card" role="dialog" aria-modal="true">'+
        '<div class="tdp-hero" style="background-image:'+(task.img||task.imageUrl?('url('+esc(task.img||task.imageUrl)+')'):heroGradientFor(task))+'">'+
          '<button class="tdp-close" id="tdp-close-btn">✕</button>'+
          '<div class="tdp-xp-ribbon">+'+totalXp+'<small>XP</small></div>'+
        '</div>'+
        '<div class="tdp-body">'+
          '<div class="tdp-icon">'+(task.icon||'📋')+'</div>'+
          '<div class="tdp-title">'+esc(task.title||'Taak')+'</div>'+
          '<div class="tdp-person">'+
            (mainAvatarUrl?'<img class="tdp-person-avatar" src="'+esc(mainAvatarUrl)+'">':'<div class="tdp-person-avatar">'+esc(initials(mainPerson?mainPerson.name:'?'))+'</div>')+
            '<div>'+
              '<div class="tdp-person-name">'+esc(people.map(function(p){return p.name;}).join(', ')||'Niet toegewezen')+'</div>'+
              '<div class="tdp-person-meta"><span>📅 '+esc(dateTimeLabel(task))+'</span><span>·</span><span>'+esc(prioLabel(task.prio||task.priority))+'</span></div>'+
            '</div>'+
          '</div>'+
          (task.desc||task.description?('<div class="tdp-desc">'+esc(task.desc||task.description)+'</div>'):'')+
          '<div class="tdp-box">'+
            '<div class="tdp-box-head"><span class="tdp-box-label">Voortgang</span><span class="tdp-box-value">'+(subs.length?(subDone+' van '+subs.length+' voltooid'):(task.done?'Voltooid':'Open'))+'</span></div>'+
            progressSegs+
            (subs.length?'<div class="tdp-hint">Vink alle stappen aan om deze taak te voltooien.</div>':'')+
            (subs.length?('<div id="tdp-sub-list">'+subsHtml+'</div>'):'')+
            '<button class="tdp-sub-add" id="tdp-sub-add-btn">+ Subtaak toevoegen</button>'+
          '</div>'+
          '<div class="tdp-box">'+
            '<div class="tdp-box-head"><span class="tdp-box-label">Hulp nodig?</span></div>'+
            '<div style="font-size:12.5px;color:#8792a3;margin-bottom:10px">Vraag iemand uit je party om te helpen en deel de taak samen.</div>'+
            '<button class="tdp-help-btn" id="tdp-help-btn">🤝 Hulp vragen</button>'+
            (helpPickerOpen?('<div class="tdp-member-pick">'+helpChips+'</div>'):'')+
            (task.helpRequested?'<div style="margin-top:10px;font-size:12px;font-weight:800;color:#7c3aed">Hulp gevraagd aan '+esc(memberName(task.helpRequestedForUid))+'</div>':'')+
          '</div>'+
          '<div class="tdp-box">'+
            '<div class="tdp-box-head"><span class="tdp-box-label">Opmerkingen</span></div>'+
            '<div id="tdp-notes-list">'+notesHtml+'</div>'+
            '<div class="tdp-note-form"><input class="tdp-note-input" id="tdp-note-input" placeholder="Laat een opmerking achter…"><button class="tdp-note-send" id="tdp-note-send">Plaats</button></div>'+
          '</div>'+
          detailsHtml+
          '<div class="tdp-footer">'+
            '<button class="tdp-save" title="Opslaan" id="tdp-bookmark-btn">🔖</button>'+
            '<button class="tdp-cta '+ctaState+'" id="tdp-complete-btn" '+(allSubsDone?'':'disabled')+'>'+ctaLabel+'</button>'+
          '</div>'+
          '<button class="tdp-more" id="tdp-more-btn">'+(detailsOpen?'Minder details ⌃':'Meer details ⌄')+'</button>'+
        '</div>'+
      '</div>';

    ov.innerHTML=html;
    requestAnimationFrame(function(){ov.classList.add('open');});
    document.body.style.overflow='hidden';
    bind(ov,task,subs);
  }

  function bind(ov,task,subs){
    ov.onclick=function(e){if(e.target===ov)close();};
    var closeBtn=document.getElementById('tdp-close-btn');if(closeBtn)closeBtn.onclick=close;
    var moreBtn=document.getElementById('tdp-more-btn');if(moreBtn)moreBtn.onclick=function(){detailsOpen=!detailsOpen;render();};

    document.querySelectorAll('[data-sub-toggle]').forEach(function(btn){
      btn.onclick=function(){
        var id=btn.getAttribute('data-sub-toggle');
        var next=subs.map(function(s){return s.id===id?Object.assign({},s,{done:!s.done}):s;});
        patch(task.id,{subtasks:next});
      };
    });
    document.querySelectorAll('[data-sub-del]').forEach(function(btn){
      btn.onclick=function(){
        var id=btn.getAttribute('data-sub-del');
        var next=subs.filter(function(s){return s.id!==id;});
        patch(task.id,{subtasks:next},function(){render();});
      };
    });
    var addBtn=document.getElementById('tdp-sub-add-btn');
    if(addBtn)addBtn.onclick=function(){
      var title=(prompt('Naam van de subtaak?')||'').trim();
      if(!title)return;
      var id='sub_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      var next=subs.concat([{id:id,title:title,done:false}]);
      patch(task.id,{subtasks:next},function(){render();});
    };

    var completeBtn=document.getElementById('tdp-complete-btn');
    if(completeBtn)completeBtn.onclick=function(){
      if(completeBtn.disabled)return;
      patch(task.id,{done:!task.done},function(){render();});
    };

    var helpBtn=document.getElementById('tdp-help-btn');
    if(helpBtn)helpBtn.onclick=function(){helpPickerOpen=!helpPickerOpen;render();};
    document.querySelectorAll('[data-help-pick]').forEach(function(btn){
      btn.onclick=function(){
        var targetUid=btn.getAttribute('data-help-pick');
        patch(task.id,{helpRequested:true,helpRequestedByUid:currentUid(),helpRequestedForUid:targetUid},function(){
          helpPickerOpen=false;render();
          // NOTE: addActivity/addNotif below are the app's existing legacy, name-based
          // notification layer. They are not part of the shared-task authority and are
          // kept as-is per scope — see report for details.
          try{if(typeof window.addActivity==='function')window.addActivity('🤝','#efe9fb',currentName()+' vraagt hulp bij "'+task.title+'"');}catch(e){}
          try{if(typeof window.addNotif==='function')window.addNotif('🤝','#efe9fb','Hulp gevraagd',currentName()+' vraagt hulp bij "'+task.title+'"');}catch(e){}
          if(typeof window.showToast==='function')window.showToast('Hulp gevraagd aan '+memberName(targetUid)+' 🤝');
        });
      };
    });

    var noteSend=document.getElementById('tdp-note-send');
    var noteInput=document.getElementById('tdp-note-input');
    function submitNote(){
      var text=(noteInput&&noteInput.value||'').trim();
      if(!text)return;
      var note={id:'note_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:text,createdByUid:currentUid(),createdAt:Date.now()};
      var nextNotes=(Array.isArray(task.notes)?task.notes:[]).concat([note]);
      patch(task.id,{notes:nextNotes},function(){render();});
    }
    if(noteSend)noteSend.onclick=submitNote;
    if(noteInput)noteInput.addEventListener('keydown',function(e){if(e.key==='Enter')submitNote();});

    if(detailsOpen){
      var saveEdit=document.getElementById('tdp-save-edit');
      if(saveEdit)saveEdit.onclick=function(){
        var desc=(document.getElementById('tdp-edit-desc')||{}).value||'';
        var date=(document.getElementById('tdp-edit-date')||{}).value||'';
        var prio=(document.getElementById('tdp-edit-prio')||{}).value||'laag';
        patch(task.id,{desc:desc,date:date,prio:prio},function(){detailsOpen=false;render();if(typeof window.showToast==='function')window.showToast('Taak bijgewerkt ✓');});
      };
      var delBtn=document.getElementById('tdp-delete-btn');
      if(delBtn)delBtn.onclick=function(){
        if(!confirm('Deze taak verwijderen?'))return;
        if(ready()){
          window.TaskSharedData.remove(task.id).then(function(){
            window.taskData=(window.taskData||[]).filter(function(t){return String(t.id)!==String(task.id);});
            if(window.AppState&&window.AppState.save)window.AppState.save();
            close();
            if(typeof window.renderTasks==='function')window.renderTasks();
          }).catch(function(err){console.warn('[TaskDetailPopup] delete failed',err);if(typeof window.showToast==='function')window.showToast('Verwijderen mislukt');});
        } else if(typeof window.deleteTask==='function'){
          window.deleteTask(task.id);close();
        }
      };
    }

    var bookmarkBtn=document.getElementById('tdp-bookmark-btn');
    if(bookmarkBtn)bookmarkBtn.onclick=function(){if(typeof window.showToast==='function')window.showToast('Opgeslagen 🔖');};
  }

  function open(id){
    openId=id;helpPickerOpen=false;detailsOpen=false;
    render();
  }

  window.TaskDetailPopup={open:open,close:close,isOpen:function(){return !!openId;}};
})();
