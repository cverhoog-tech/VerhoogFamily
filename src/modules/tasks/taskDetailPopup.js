'use strict';
// ============================================================
// TASK DETAIL POPUP v2 (compact home companion — premium RPG redesign)
// Visual reproduction of the light/dark reference screenshots.
// All mutations (subtasks, notes, help, edit, delete, complete) go
// through TaskSharedData so they stay authoritative in
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
  function frequencyLabel(task){
    var r=String(task.recurrence||'once').toLowerCase();
    var m={once:'Eenmalige taak',daily:'Dagelijkse taak',weekly:'Wekelijkse taak',monthly:'Maandelijkse taak'};
    return m[r]||'Eenmalige taak';
  }
  function dateTimeLabel(task){
    if(!task.date)return'Geen datum';
    var d=new Date(task.date+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);
    var diff=Math.round((d-today)/86400000),label;
    if(diff===0)label='Vandaag';else if(diff===1)label='Morgen';else if(diff===-1)label='Gisteren';
    else label=d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});
    return label+(task.time?' '+task.time:'');
  }

  // ---- category detection (mirrors TaskCompactHome's category logic so the
  // popup icon/accent visually matches the row icon shown in the list) ----
  function iconCategory(task){
    var raw=String(task.category||task.type||task.title||'').toLowerCase();
    if(/was|laundry|kleding/.test(raw))return'laundry';
    if(/stof|schoon|clean|dweil|badkamer|toilet/.test(raw))return'cleaning';
    if(/vaat|keuken|kitchen|koken/.test(raw))return'kitchen';
    if(/bood|supermarkt|grocer/.test(raw))return'groceries';
    if(/admin|contract|rekening|factuur|bank/.test(raw))return'admin';
    if(/kind|speel|family|gezin/.test(raw))return'family';
    if(/tuin|garden|plant/.test(raw))return'garden';
    return'quest';
  }
  var CATEGORY_ACCENT={laundry:'#0284c7',cleaning:'#7c3aed',kitchen:'#0d9488',groceries:'#059669',admin:'#6366f1',family:'#db2777',garden:'#65a30d',quest:'#7c3aed'};
  var CATEGORY_ICON_PATH={
    laundry:'<path d="M6 3.5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4.2"/><path d="M7 7h2m2 0h1"/>',
    cleaning:'<path d="m8 3 8 18M5 18l12-5 2 5H5Z"/><path d="M7 6h5"/>',
    kitchen:'<path d="M7 3v7m-3-7v5a3 3 0 0 0 6 0V3M7 10v11M16 3v18M16 3c3 2 3 7 0 9"/>',
    groceries:'<path d="M3 5h2l2 10h9.5l2-7H6"/><circle cx="9" cy="19" r="1.2"/><circle cx="16" cy="19" r="1.2"/>',
    admin:'<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    family:'<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M13 20a4 4 0 0 1 7.5-1.8"/>',
    garden:'<path d="M12 21V10M12 13c-5 0-7-3-7-7 5 0 7 3 7 7Zm0 2c5 0 7-3 7-7-5 0-7 3-7 7Z"/>',
    quest:'<path d="m13 2-7 11h6l-1 9 7-12h-6Z"/>'
  };
  function categorySvg(cat,size){
    return '<svg viewBox="0 0 24 24" width="'+(size||26)+'" height="'+(size||26)+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(CATEGORY_ICON_PATH[cat]||CATEGORY_ICON_PATH.quest)+'</svg>';
  }
  // small keyword-based icon for individual subtask rows (basket / drawer / appliance / generic)
  var SUB_ICON_PATHS={
    basket:'<path d="M3 9h18l-1.6 9.2A2 2 0 0 1 17.4 20H6.6a2 2 0 0 1-2-1.8L3 9Z"/><path d="M7 9V7a5 5 0 0 1 10 0v2"/>',
    drawer:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 12h16M9 12v3m6-3v3"/>',
    appliance:'<rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="13" r="4.3"/><path d="M8 6.5h1m3 0h1"/>',
    sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>'
  };
  function subIcon(title){
    var raw=String(title||'').toLowerCase();
    var key='sparkle';
    if(/rek|mand|korf/.test(raw))key='basket';
    else if(/bestek|lade|la\b/.test(raw))key='drawer';
    else if(/vaatwasser|wasmachine|machine|controleren/.test(raw))key='appliance';
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+SUB_ICON_PATHS[key]+'</svg>';
  }

  function heroImageUrl(task){
    try{if(window.TaskModel&&typeof window.TaskModel.getImage==='function'){var v=window.TaskModel.getImage(task);if(v)return v;}}catch(e){}
    return task.heroImage||task.img||task.imageUrl||task.image||task.photo||task.cover||'';
  }
  // Procedural fallback while a task has no hero image yet — a soft duotone
  // gradient in the category accent colour plus a faint watermark icon, so a
  // real per-task/category hero asset can later replace this without any
  // popup changes (see report: heroImageUrl() checks TaskModel.getImage()
  // first, then task.heroImage/img/imageUrl/image/photo/cover).
  function heroFallbackStyle(task){
    var cat=iconCategory(task);
    var accent=CATEGORY_ACCENT[cat]||CATEGORY_ACCENT.quest;
    return 'background-image:radial-gradient(120% 140% at 85% -10%,'+accent+'55,transparent 60%),linear-gradient(150deg,'+accent+'d9,#241a3fdd 78%)';
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
    var old=document.getElementById('task-detail-popup-style');
    if(old)return;
    var s=document.createElement('style');s.id='task-detail-popup-style';
    s.textContent =
      '@import url(\'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap\');'+

      '.tdp-overlay{position:fixed;inset:0;background:rgba(8,6,16,.62);z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .22s;box-sizing:border-box}'+
      '.tdp-overlay.open{opacity:1}'+

      '.tdp-card{--tdp-bg:#fbf7ee;--tdp-surface:#ffffff;--tdp-surface-2:#f7f2e5;--tdp-border:rgba(180,138,60,.32);--tdp-border-soft:#efe7d6;--tdp-text:#241f1a;--tdp-text2:#8c8271;--tdp-purple:#6d28d9;--tdp-purple-2:#a855f7;--tdp-gold:#a9761f;--tdp-gold-strong:#8a621a;'+
        'width:100%;max-width:440px;max-height:calc(100dvh - 32px);overflow-y:auto;-webkit-overflow-scrolling:touch;'+
        'background:var(--tdp-bg);color:var(--tdp-text);border-radius:28px;border:1.5px solid var(--tdp-border);'+
        'transform:translateY(18px) scale(.98);transition:transform .25s;box-shadow:0 24px 70px rgba(20,10,40,.28);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}'+
      '.tdp-overlay.open .tdp-card{transform:translateY(0) scale(1)}'+
      '[data-theme*="dark"] .tdp-card{--tdp-bg:#120e1f;--tdp-surface:#1a1530;--tdp-surface-2:#1f1a38;--tdp-border:#c89a4c;--tdp-border-soft:rgba(234,197,94,.16);--tdp-text:#f5efe0;--tdp-text2:#b3a6d6;--tdp-purple:#a78bfa;--tdp-purple-2:#c4b5fd;--tdp-gold:#e2b659;--tdp-gold-strong:#f4c86a;'+
        'box-shadow:0 0 0 1px rgba(234,197,94,.08),0 30px 90px rgba(0,0,0,.6)}'+

      '.tdp-hero{position:relative;height:196px;border-radius:26px 26px 0 0;background-size:cover;background-position:center;overflow:hidden;background-color:var(--tdp-surface-2)}'+
      '.tdp-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.16),rgba(0,0,0,.08) 40%,rgba(0,0,0,.34));pointer-events:none}'+
      '.tdp-close{position:absolute;top:14px;left:14px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);border:1.5px solid rgba(255,255,255,.6);font-size:14px;color:#241f1a;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 4px 12px rgba(0,0,0,.2)}'+
      '[data-theme*="dark"] .tdp-close{background:rgba(20,15,36,.85);border-color:rgba(234,197,94,.4);color:#f3ecff}'+

      '.tdp-xp-ribbon{position:absolute;top:0;right:20px;z-index:3;min-width:52px;padding:9px 12px 16px;background:#ffffff;border:1.5px solid var(--tdp-border,rgba(180,138,60,.5));border-top:none;clip-path:polygon(0 0,100% 0,100% 76%,50% 100%,0 76%);text-align:center;box-shadow:0 6px 16px rgba(0,0,0,.18)}'+
      '[data-theme*="dark"] .tdp-xp-ribbon{background:#1c1533;border-color:#caa153}'+
      '.tdp-xp-ribbon .tdp-xp-num{display:block;font-family:"Cinzel",Georgia,serif;font-weight:900;font-size:15px;color:#6d28d9;letter-spacing:.2px}'+
      '[data-theme*="dark"] .tdp-xp-ribbon .tdp-xp-num{color:#eab308}'+
      '.tdp-xp-ribbon .tdp-xp-lbl{display:block;font-size:9px;font-weight:800;letter-spacing:1px;color:#6d28d9;opacity:.75;border-top:1px solid rgba(109,40,217,.25);margin-top:3px;padding-top:2px}'+
      '[data-theme*="dark"] .tdp-xp-ribbon .tdp-xp-lbl{color:#eab308;border-top-color:rgba(234,179,8,.3)}'+

      '.tdp-body{padding:0 18px 22px;position:relative}'+
      '.tdp-icon-ring{width:74px;height:74px;aspect-ratio:1/1;flex-shrink:0;border-radius:50%;background:var(--tdp-surface);border:3px solid var(--tdp-surface);box-shadow:0 0 0 2px var(--tdp-border,rgba(180,138,60,.55)),0 8px 20px rgba(0,0,0,.16);margin-top:-37px;position:relative;z-index:2;display:flex;align-items:center;justify-content:center}'+
      '[data-theme*="dark"] .tdp-icon-ring{box-shadow:0 0 0 2px #caa153,0 0 22px rgba(234,179,8,.22),0 8px 24px rgba(0,0,0,.4)}'+
      '.tdp-icon-ring i{position:absolute;width:6px;height:6px;background:var(--tdp-gold);border-radius:1.5px;transform:rotate(45deg);opacity:.85}'+
      '.tdp-icon-ring i.n{top:-3px;left:50%;margin-left:-3px}.tdp-icon-ring i.s{bottom:-3px;left:50%;margin-left:-3px}.tdp-icon-ring i.e{right:-3px;top:50%;margin-top:-3px}.tdp-icon-ring i.w{left:-3px;top:50%;margin-top:-3px}'+
      '.tdp-icon-inner{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center}'+

      '.tdp-title{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:26px;color:var(--tdp-text);margin:10px 0 10px;letter-spacing:.1px;line-height:1.15}'+

      '.tdp-person{display:flex;align-items:center;gap:10px;margin-bottom:14px}'+
      '.tdp-person-avatar{width:40px;height:40px;aspect-ratio:1/1;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;object-fit:cover;border:2px solid var(--tdp-surface);box-shadow:0 0 0 1.5px var(--tdp-border-soft)}'+
      '.tdp-person-name{font-size:15px;font-weight:800;color:var(--tdp-text)}'+
      '.tdp-person-meta{font-size:12.5px;color:var(--tdp-purple);font-weight:700;display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:2px}'+
      '.tdp-person-meta em{font-style:normal;opacity:.5;color:var(--tdp-text2)}'+
      '.tdp-person-meta span{display:inline-flex;align-items:center;gap:4px}'+

      '.tdp-divider{display:flex;align-items:center;gap:8px;margin:2px 0 16px;color:var(--tdp-gold);opacity:.6}'+
      '.tdp-divider:before,.tdp-divider:after{content:"";flex:1;height:1px;background:var(--tdp-border-soft)}'+
      '.tdp-divider span{font-size:10px}'+

      '.tdp-progress-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}'+
      '.tdp-progress-label{font-family:"Cinzel",Georgia,serif;font-size:11px;font-weight:700;color:var(--tdp-gold);letter-spacing:1.4px;text-transform:uppercase}'+
      '.tdp-progress-value{font-size:13px;font-weight:800;color:var(--tdp-purple)}'+
      '.tdp-progress-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}'+
      '.tdp-progress-track{flex:1;display:flex;gap:5px}'+
      '.tdp-progress-seg{flex:1;height:9px;border-radius:99px;background:var(--tdp-surface-2)}'+
      '.tdp-progress-seg.done{background:linear-gradient(90deg,#7c3aed,#a855f7)}'+
      '.tdp-xp-shield{flex-shrink:0;width:44px;height:48px;background:var(--tdp-surface);clip-path:polygon(50% 0%,100% 20%,100% 72%,50% 100%,0% 72%,0% 20%);box-shadow:0 0 0 1.5px var(--tdp-border,rgba(180,138,60,.5));display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05}'+
      '[data-theme*="dark"] .tdp-xp-shield{box-shadow:0 0 0 1.5px #caa153,0 0 12px rgba(234,179,8,.18)}'+
      '.tdp-xp-shield b{font-size:13px;color:var(--tdp-purple);font-weight:900}'+
      '.tdp-xp-shield small{font-size:8px;color:var(--tdp-text2);font-weight:800;letter-spacing:.5px}'+
      '.tdp-hint{font-size:11.5px;color:var(--tdp-text2);text-align:center;margin:2px 0 18px;font-style:italic;display:flex;align-items:center;gap:8px}'+
      '.tdp-hint:before,.tdp-hint:after{content:"◆";font-size:6px;color:var(--tdp-gold);opacity:.55}'+
      '.tdp-hint span{flex:0 0 auto}'+

      '.tdp-box{background:var(--tdp-surface);border:1px solid var(--tdp-border-soft);border-radius:20px;padding:6px 16px;margin-bottom:16px;box-shadow:0 8px 22px rgba(20,10,40,.05)}'+
      '[data-theme*="dark"] .tdp-box{box-shadow:0 8px 26px rgba(0,0,0,.3)}'+
      '.tdp-box-label{font-family:"Cinzel",Georgia,serif;font-size:11px;font-weight:700;color:var(--tdp-gold);letter-spacing:1.4px;text-transform:uppercase;margin:14px 0 2px}'+

      '.tdp-sub{display:flex;align-items:center;gap:12px;padding:12px 2px;border-bottom:1px solid var(--tdp-border-soft)}'+
      '.tdp-sub:last-child{border-bottom:none}'+
      '.tdp-sub-chk{width:27px;height:27px;aspect-ratio:1/1;flex-shrink:0;border-radius:50%;border:2px solid var(--tdp-border-soft);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:12px;padding:0}'+
      '.tdp-sub-chk.done{background:#7c3aed;border-color:#7c3aed}'+
      '.tdp-sub-icon{width:34px;height:34px;aspect-ratio:1/1;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center}'+
      '.tdp-sub-text{flex:1;font-size:14.5px;font-weight:700;color:var(--tdp-text)}'+
      '.tdp-sub.done .tdp-sub-text{text-decoration:line-through;color:var(--tdp-text2)}'+
      '.tdp-sub-accent{background:none;border:none;color:var(--tdp-gold);opacity:.55;font-size:13px;cursor:pointer;padding:6px;flex-shrink:0}'+
      '.tdp-sub-add{width:100%;margin:6px 0 10px;background:none;border:1.5px dashed var(--tdp-border,rgba(180,138,60,.45));border-radius:12px;padding:9px;font-size:12.5px;font-weight:800;color:var(--tdp-purple);cursor:pointer}'+

      '.tdp-help-box{position:relative;background:var(--tdp-surface);border:1.5px solid var(--tdp-border,rgba(180,138,60,.5));border-radius:20px;padding:16px;margin-bottom:16px;box-shadow:0 8px 22px rgba(20,10,40,.05)}'+
      '[data-theme*="dark"] .tdp-help-box{box-shadow:0 0 24px rgba(234,179,8,.08),0 8px 26px rgba(0,0,0,.3)}'+
      '.tdp-help-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}'+
      '.tdp-help-shield{width:38px;height:38px;flex-shrink:0;border-radius:12px;background:linear-gradient(150deg,#7c3aed,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1.5px var(--tdp-border,rgba(180,138,60,.5))}'+
      '.tdp-help-text{flex:1;min-width:150px}'+
      '.tdp-help-title{font-family:"Cinzel",Georgia,serif;font-size:11px;font-weight:700;color:var(--tdp-gold);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px}'+
      '.tdp-help-sub{font-size:12px;color:var(--tdp-text2);line-height:1.4}'+
      '.tdp-help-btn{flex-shrink:0;border:1.5px solid var(--tdp-purple);border-radius:13px;padding:10px 15px;font-size:13px;font-weight:800;background:transparent;color:var(--tdp-purple);cursor:pointer;display:flex;align-items:center;gap:6px}'+
      '[data-theme*="dark"] .tdp-help-btn{background:rgba(167,139,250,.08)}'+
      '.tdp-member-pick{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;width:100%}'+
      '.tdp-member-chip{border:1.5px solid var(--tdp-border-soft);background:var(--tdp-surface-2);border-radius:99px;padding:7px 13px;font-size:12.5px;font-weight:800;color:var(--tdp-text);cursor:pointer}'+
      '.tdp-help-status{margin-top:10px;font-size:12px;font-weight:800;color:var(--tdp-purple);width:100%}'+

      '.tdp-more{width:100%;background:none;border:none;text-align:center;font-size:13px;font-weight:800;color:var(--tdp-gold);padding:10px 0 2px;cursor:pointer}'+

      '.tdp-edit-field{margin-bottom:12px}'+
      '.tdp-edit-label{font-size:11px;font-weight:900;color:var(--tdp-text2);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}'+
      '.tdp-edit-input,.tdp-edit-select,.tdp-edit-textarea{width:100%;box-sizing:border-box;border:1.5px solid var(--tdp-border-soft);border-radius:12px;padding:10px 12px;font-size:13.5px;font-family:inherit;background:var(--tdp-surface-2);color:var(--tdp-text);outline:none}'+
      '.tdp-note{padding:10px 0;border-bottom:1px solid var(--tdp-border-soft)}'+
      '.tdp-note:last-child{border-bottom:none}'+
      '.tdp-note-head{display:flex;justify-content:space-between;font-size:11px;font-weight:900;color:var(--tdp-text2);margin-bottom:3px}'+
      '.tdp-note-text{font-size:13.5px;color:var(--tdp-text);line-height:1.4}'+
      '.tdp-note-form{display:flex;gap:8px;margin-top:10px}'+
      '.tdp-note-input{flex:1;border:1.5px solid var(--tdp-border-soft);border-radius:12px;padding:10px 12px;font-size:13px;font-family:inherit;outline:none;background:var(--tdp-surface-2);color:var(--tdp-text)}'+
      '.tdp-note-send{border:none;background:var(--tdp-purple);color:#fff;border-radius:12px;padding:0 16px;font-weight:900;cursor:pointer}'+
      '.tdp-del-btn{width:100%;background:none;border:none;color:#dc2626;font-size:13px;font-weight:800;padding:14px 0 4px;cursor:pointer}'+

      '.tdp-footer{display:flex;gap:10px;margin-top:4px}'+
      '.tdp-save{width:56px;height:56px;flex-shrink:0;border-radius:16px;border:1.5px solid var(--tdp-border-soft);background:var(--tdp-surface);color:var(--tdp-gold);font-size:19px;cursor:pointer;display:flex;align-items:center;justify-content:center}'+
      '.tdp-cta{flex:1;border:none;border-radius:16px;padding:14px 10px;font-size:14.5px;font-weight:900;cursor:pointer;background:var(--tdp-surface-2);color:var(--tdp-text2);display:flex;align-items:center;justify-content:center;gap:7px}'+
      '.tdp-cta.active{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;box-shadow:0 10px 26px rgba(124,58,237,.34)}'+
      '.tdp-cta.done-state{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff}';
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
    var cat=iconCategory(task);
    var accent=CATEGORY_ACCENT[cat]||CATEGORY_ACCENT.quest;
    var heroImg=heroImageUrl(task);

    var progressSegs='';
    if(subs.length){
      progressSegs=subs.map(function(s){return '<div class="tdp-progress-seg'+(s.done?' done':'')+'"></div>';}).join('');
    }

    var subsHtml=subs.map(function(s){
      return '<div class="tdp-sub'+(s.done?' done':'')+'" data-sub="'+esc(s.id)+'">'+
        '<button class="tdp-sub-chk'+(s.done?' done':'')+'" data-sub-toggle="'+esc(s.id)+'">'+(s.done?'✓':'')+'</button>'+
        '<span class="tdp-sub-icon" style="background:'+accent+'1f;color:'+accent+'">'+subIcon(s.title)+'</span>'+
        '<span class="tdp-sub-text">'+esc(s.title)+'</span>'+
        '<button class="tdp-sub-accent" data-sub-del="'+esc(s.id)+'" title="Verwijderen">✦</button>'+
      '</div>';
    }).join('');

    var notes=Array.isArray(task.notes)?task.notes.slice().reverse():[];
    var notesHtml=notes.length?notes.map(function(n){
      var when='';try{when=new Date(n.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){}
      return '<div class="tdp-note"><div class="tdp-note-head"><span>'+esc(memberName(n.createdByUid))+'</span><span>'+esc(when)+'</span></div><div class="tdp-note-text">'+esc(n.text)+'</div></div>';
    }).join('') : '<div style="font-size:12.5px;color:var(--tdp-text2);padding:2px 0 4px">Nog geen opmerkingen.</div>';

    var helpableMembers=members().filter(function(m){var id=m.uid||m.id;return id&&id!==currentUid()&&!(task.assignedToUids&&task.assignedToUids[id]);});
    var helpChips=helpableMembers.length?helpableMembers.map(function(m){var id=m.uid||m.id;return '<button class="tdp-member-chip" data-help-pick="'+esc(id)+'">'+esc(m.displayName||m.name||'Gezinslid')+'</button>';}).join(''):'<div style="font-size:12px;color:var(--tdp-text2)">Geen andere gezinsleden gevonden.</div>';

    var ctaState = allSubsDone ? (task.done?'active done-state':'active') : '';
    var ctaLabel = allSubsDone ? (task.done?'↩ Heropenen':'✓ Voltooien') : '🔒 Voltooi eerst alle stappen';

    var detailsHtml = detailsOpen ? (
      '<div class="tdp-box" style="padding-top:14px">'+
        '<div class="tdp-edit-field"><label class="tdp-edit-label">Beschrijving</label><textarea class="tdp-edit-textarea" id="tdp-edit-desc" rows="3">'+esc(task.desc||task.description||'')+'</textarea></div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
          '<div class="tdp-edit-field" style="flex:1;min-width:110px"><label class="tdp-edit-label">Datum</label><input class="tdp-edit-input" type="date" id="tdp-edit-date" value="'+esc(task.date||'')+'"></div>'+
          '<div class="tdp-edit-field" style="flex:1;min-width:90px"><label class="tdp-edit-label">Tijd</label><input class="tdp-edit-input" type="time" id="tdp-edit-time" value="'+esc(task.time||'')+'"></div>'+
        '</div>'+
        '<div class="tdp-edit-field"><label class="tdp-edit-label">Prioriteit</label><select class="tdp-edit-select" id="tdp-edit-prio">'+
          ['laag','normaal','hoog'].map(function(p){return '<option value="'+p+'"'+((task.prio||'laag')===p?' selected':'')+'>'+prioLabel(p)+'</option>';}).join('')+
        '</select></div>'+
        '<div class="tdp-box-label" style="margin-top:2px">Opmerkingen</div>'+
        '<div id="tdp-notes-list">'+notesHtml+'</div>'+
        '<div class="tdp-note-form"><input class="tdp-note-input" id="tdp-note-input" placeholder="Laat een opmerking achter…"><button class="tdp-note-send" id="tdp-note-send">Plaats</button></div>'+
        '<div style="display:flex;gap:10px;margin-top:16px">'+
          '<button class="tdp-cta active" id="tdp-save-edit" style="flex:1;padding:12px">Wijzigingen opslaan</button>'+
        '</div>'+
        '<button class="tdp-del-btn" id="tdp-delete-btn">🗑 Taak verwijderen</button>'+
      '</div>'
    ) : '';

    var html =
      '<div class="tdp-card" role="dialog" aria-modal="true">'+
        '<div class="tdp-hero" style="'+(heroImg?('background-image:url('+esc(heroImg)+')'):heroFallbackStyle(task))+'">'+
          '<button class="tdp-close" id="tdp-close-btn">✕</button>'+
          '<div class="tdp-xp-ribbon"><span class="tdp-xp-num">+'+totalXp+'</span><span class="tdp-xp-lbl">XP</span></div>'+
        '</div>'+
        '<div class="tdp-body">'+
          '<div class="tdp-icon-ring"><i class="n"></i><i class="s"></i><i class="e"></i><i class="w"></i>'+
            '<div class="tdp-icon-inner" style="background:'+accent+'22;color:'+accent+'">'+categorySvg(cat,28)+'</div>'+
          '</div>'+
          '<div class="tdp-title">'+esc(task.title||'Taak')+'</div>'+
          '<div class="tdp-person">'+
            (mainAvatarUrl?'<img class="tdp-person-avatar" src="'+esc(mainAvatarUrl)+'">':'<div class="tdp-person-avatar">'+esc(initials(mainPerson?mainPerson.name:'?'))+'</div>')+
            '<div>'+
              '<div class="tdp-person-name">'+esc(people.map(function(p){return p.name;}).join(', ')||'Niet toegewezen')+'</div>'+
              '<div class="tdp-person-meta"><span>📅 '+esc(dateTimeLabel(task))+'</span><em>•</em><span>🛡 '+esc(frequencyLabel(task))+'</span></div>'+
            '</div>'+
          '</div>'+
          '<div class="tdp-divider"><span>◆</span></div>'+
          '<div class="tdp-progress-head"><span class="tdp-progress-label">Voortgang</span><span class="tdp-progress-value">'+(subs.length?(subDone+' van '+subs.length+' voltooid'):(task.done?'Voltooid':'Open'))+'</span></div>'+
          (subs.length?(
            '<div class="tdp-progress-row"><div class="tdp-progress-track">'+progressSegs+'</div><div class="tdp-xp-shield"><b>'+totalXp+'</b><small>XP</small></div></div>'+
            '<div class="tdp-hint"><span>Vink alle stappen aan om deze taak te voltooien.</span></div>'+
            '<div class="tdp-box"><div id="tdp-sub-list" style="padding-top:4px">'+subsHtml+'</div><button class="tdp-sub-add" id="tdp-sub-add-btn">+ Subtaak toevoegen</button></div>'
          ):(
            '<div class="tdp-box" style="padding:14px 16px 16px"><div style="font-size:12.5px;color:var(--tdp-text2);margin-bottom:8px">Deze taak heeft nog geen subtaken.</div><button class="tdp-sub-add" id="tdp-sub-add-btn" style="margin:0">+ Subtaak toevoegen</button></div>'
          ))+
          '<div class="tdp-help-box">'+
            '<div class="tdp-help-row">'+
              '<div class="tdp-help-shield">'+categorySvg('family',20)+'</div>'+
              '<div class="tdp-help-text"><div class="tdp-help-title">Hulp nodig?</div><div class="tdp-help-sub">Vraag iemand uit je party om te helpen en deel de taak samen.</div></div>'+
              '<button class="tdp-help-btn" id="tdp-help-btn">🤝 Hulp vragen</button>'+
              (helpPickerOpen?('<div class="tdp-member-pick">'+helpChips+'</div>'):'')+
              (task.helpRequested?'<div class="tdp-help-status">Hulp gevraagd aan '+esc(memberName(task.helpRequestedForUid))+'</div>':'')+
            '</div>'+
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
        var time=(document.getElementById('tdp-edit-time')||{}).value||'';
        var prio=(document.getElementById('tdp-edit-prio')||{}).value||'laag';
        patch(task.id,{desc:desc,date:date,time:time,prio:prio},function(){detailsOpen=false;render();if(typeof window.showToast==='function')window.showToast('Taak bijgewerkt ✓');});
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
