'use strict';
// ============================================================
// TASK DETAIL POPUP v2.2 (compact home companion — premium RPG redesign)
// Visual reproduction of the light/dark reference screenshots, density-
// corrected and then polished so it reads as a compact premium mobile
// card rather than a "web modal with RPG styling" — see commit message
// for the exact list of fixes (hero/badge/title further reduced, all
// system emoji replaced with inline SVGs, oversized Hulp Nodig button
// fixed, green Heropenen removed, completed-task subtasks read-only).
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
  var closeTimer = null;
  var prevBodyOverflow = null;
  var scrollLockActive = false; // true from the first open() of a session until finalizeCleanup() runs
  // ---- shared Task Card: create mode -------------------------------------
  // The same overlay/card/CSS this file already owns is reused for creating
  // a new task. 'mode' picks which face renders; 'draftTask' is an in-memory
  // task-shaped object that only touches TaskSharedData once the person taps
  // "Taak aanmaken" — never written to Firebase or localStorage before that.
  var mode = null; // 'detail' | 'create'
  var draftTask = null;
  var assigneePickerOpen = false;
  var catPickerOpen = false;

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
  // Create-mode category picker: same category set iconCategory()/CATEGORY_ACCENT
  // already understand, just exposed as tappable chips. No new category system.
  var CATEGORY_ORDER=['quest','laundry','cleaning','kitchen','groceries','admin','family','garden'];
  var CATEGORY_LABEL={laundry:'Wasgoed',cleaning:'Schoonmaak',kitchen:'Keuken',groceries:'Boodschappen',admin:'Administratie',family:'Gezin',garden:'Tuin',quest:'Quest'};
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
    return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+SUB_ICON_PATHS[key]+'</svg>';
  }

  var UI_ICON_PATHS={
    close:'<path d="M6 6l12 12M18 6 6 18"/>',
    check:'<path d="M5 13l4 4L19 7"/>',
    lock:'<rect x="5" y="10.5" width="14" height="9" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    reopen:'<path d="M4 4.5V9h4.5"/><path d="M4.7 9A7.5 7.5 0 1 1 6 15"/>',
    calendar:'<rect x="4" y="5.5" width="16" height="15" rx="2.3"/><path d="M4 10h16M8 3.3v4M16 3.3v4"/>',
    shield:'<path d="M12 3.2 18.5 6v5.3c0 4.3-2.8 7.1-6.5 8.5-3.7-1.4-6.5-4.2-6.5-8.5V6L12 3.2Z"/>',
    link:'<circle cx="9" cy="12" r="4.6"/><circle cx="15" cy="12" r="4.6"/>',
    bookmark:'<path d="M7 4.2h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.2a1 1 0 0 1 1-1Z"/>',
    trash:'<path d="M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"/>'
  };
  function uiIcon(name,size){
    return '<svg viewBox="0 0 24 24" width="'+(size||14)+'" height="'+(size||14)+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">'+(UI_ICON_PATHS[name]||'')+'</svg>';
  }

  // Small fantasy/RPG "party crest" for the Hulp Nodig? badge — shield
  // silhouette, purple inner fill, thin gold outer contour + fainter inner
  // contour, a soft highlight near the top, and two simple figures inside.
  // Pure inline SVG (no image asset), consistent with the gold/purple
  // language used by the level badge elsewhere in the app.
  function helpCrestSvg(){
    return '<svg viewBox="0 0 32 36" width="30" height="34" aria-hidden="true">'+
      '<path d="M16 2 L29 7 V17 C29 25.2 23.4 31.2 16 34 C8.6 31.2 3 25.2 3 17 V7 Z" fill="#6d28d9" stroke="#c9a24a" stroke-width="1.3"/>'+
      '<path d="M16 4.6 L26.4 8.5 V17 C26.4 24 21.8 29 16 31.4 C10.2 29 5.6 24 5.6 17 V8.5 Z" fill="none" stroke="#e9c874" stroke-width=".6" opacity=".55"/>'+
      '<ellipse cx="16" cy="10.5" rx="8" ry="4.2" fill="#ffffff" opacity=".1"/>'+
      '<g fill="none" stroke="#f3ecff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".95">'+
        '<circle cx="12.6" cy="14.6" r="2.5"/>'+
        '<circle cx="19.3" cy="15.5" r="2"/>'+
        '<path d="M8.4 22.8c.4-3 2.2-4.7 4.2-4.7s3.8 1.7 4.2 4.7"/>'+
        '<path d="M16.9 22.8c.3-2.3 1.8-3.7 3.4-3.7"/>'+
      '</g>'+
    '</svg>';
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

  // Local date (not UTC) in YYYY-MM-DD, so "today" in create mode matches the
  // person's own calendar day regardless of timezone offset.
  function todayIso(){var d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
  // Fresh in-memory draft for create mode. Assignee defaults to the current
  // user only (mirrors taskUidCreateBridge.reset()) — UID-based, never a name.
  function makeDraftTask(){
    var assigned={};
    var me=currentUid();
    if(me) assigned[me]=true;
    return {title:'',desc:'',category:null,date:todayIso(),time:'',prio:'laag',recurrence:'once',assignedToUids:assigned,subtasks:[]};
  }

  function injectStyles(){
    var old=document.getElementById('task-detail-popup-style');
    if(old)return;
    var s=document.createElement('style');s.id='task-detail-popup-style';
    s.textContent =
      '@import url(\'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap\');'+

      '.tdp-overlay{position:fixed;inset:0;background:rgba(8,6,16,.62);z-index:9500;display:flex;align-items:center;justify-content:center;padding:14px;opacity:0;pointer-events:none;transition:opacity .22s;box-sizing:border-box}'+
      '.tdp-overlay.open{opacity:1;pointer-events:auto}'+

      '.tdp-card{--tdp-bg:#fbf7ee;--tdp-surface:#ffffff;--tdp-surface-2:#f7f2e5;--tdp-border:rgba(180,138,60,.32);--tdp-border-soft:#efe7d6;--tdp-text:#241f1a;--tdp-text2:#8c8271;--tdp-purple:#6d28d9;--tdp-purple-2:#a855f7;--tdp-gold:#a9761f;--tdp-gold-strong:#8a621a;'+
        'width:100%;max-width:400px;max-height:calc(100dvh - 28px);overflow-y:auto;-webkit-overflow-scrolling:touch;'+
        'background:var(--tdp-bg);color:var(--tdp-text);border-radius:22px;border:1.5px solid var(--tdp-border);'+
        'transform:translateY(18px) scale(.98);transition:transform .25s;box-shadow:0 20px 56px rgba(20,10,40,.26);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}'+
      '.tdp-overlay.open .tdp-card{transform:translateY(0) scale(1)}'+
      '[data-theme*="dark"] .tdp-card{--tdp-bg:#120e1f;--tdp-surface:#1a1530;--tdp-surface-2:#1f1a38;--tdp-border:#c89a4c;--tdp-border-soft:rgba(234,197,94,.16);--tdp-text:#f5efe0;--tdp-text2:#b3a6d6;--tdp-purple:#a78bfa;--tdp-purple-2:#c4b5fd;--tdp-gold:#e2b659;--tdp-gold-strong:#f4c86a;'+
        'box-shadow:0 0 0 1px rgba(234,197,94,.08),0 30px 90px rgba(0,0,0,.6)}'+

      '.tdp-hero{position:relative;height:104px;border-radius:22px 22px 0 0;background-size:cover;background-position:center;overflow:hidden;background-color:var(--tdp-surface-2)}'+
      '.tdp-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.16),rgba(0,0,0,.08) 40%,rgba(0,0,0,.34));pointer-events:none}'+
      '.tdp-close{position:absolute;top:9px;left:9px;width:26px;height:26px;min-width:26px;min-height:26px;max-width:26px;max-height:26px;aspect-ratio:1/1;flex-shrink:0;box-sizing:border-box;border-radius:50%;background:rgba(255,255,255,.92);border:1.5px solid rgba(255,255,255,.6);font-size:12px;color:#241f1a;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 3px 8px rgba(0,0,0,.2);-webkit-appearance:none;appearance:none;padding:0}'+
      '[data-theme*="dark"] .tdp-close{background:rgba(20,15,36,.85);border-color:rgba(234,197,94,.4);color:#f3ecff}'+

      '.tdp-xp-ribbon{position:absolute;top:0;right:15px;z-index:3;min-width:38px;padding:6px 8px 10px;background:#ffffff;border:1.5px solid var(--tdp-border,rgba(180,138,60,.5));border-top:none;clip-path:polygon(0 0,100% 0,100% 76%,50% 100%,0 76%);text-align:center;box-shadow:0 4px 10px rgba(0,0,0,.15)}'+
      '[data-theme*="dark"] .tdp-xp-ribbon{background:#1c1533;border-color:#caa153}'+
      '.tdp-xp-ribbon .tdp-xp-num{display:block;font-family:"Cinzel",Georgia,serif;font-weight:900;font-size:11.5px;color:#6d28d9;letter-spacing:.2px}'+
      '[data-theme*="dark"] .tdp-xp-ribbon .tdp-xp-num{color:#eab308}'+
      '.tdp-xp-ribbon .tdp-xp-lbl{display:block;font-size:7px;font-weight:800;letter-spacing:.7px;color:#6d28d9;opacity:.75;border-top:1px solid rgba(109,40,217,.25);margin-top:2px;padding-top:1px}'+
      '[data-theme*="dark"] .tdp-xp-ribbon .tdp-xp-lbl{color:#eab308;border-top-color:rgba(234,179,8,.3)}'+

      '.tdp-body{padding:0 14px 13px;position:relative}'+
      '.tdp-icon-ring{width:46px;height:46px;min-width:46px;min-height:46px;aspect-ratio:1/1;flex-shrink:0;border-radius:50%;background:var(--tdp-surface);border:2px solid var(--tdp-surface);box-shadow:0 0 0 2px var(--tdp-border,rgba(180,138,60,.55)),0 4px 10px rgba(0,0,0,.15);margin-top:-21px;position:relative;z-index:2;display:flex;align-items:center;justify-content:center}'+
      '[data-theme*="dark"] .tdp-icon-ring{box-shadow:0 0 0 2px #caa153,0 0 12px rgba(234,179,8,.18),0 4px 14px rgba(0,0,0,.4)}'+
      '.tdp-icon-ring i{position:absolute;width:4px;height:4px;background:var(--tdp-gold);border-radius:1px;transform:rotate(45deg);opacity:.85}'+
      '.tdp-icon-ring i.n{top:-2px;left:50%;margin-left:-2px}.tdp-icon-ring i.s{bottom:-2px;left:50%;margin-left:-2px}.tdp-icon-ring i.e{right:-2px;top:50%;margin-top:-2px}.tdp-icon-ring i.w{left:-2px;top:50%;margin-top:-2px}'+
      '.tdp-icon-inner{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center}'+

      '.tdp-title{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:16px;color:var(--tdp-text);margin:3px 0 5px;letter-spacing:.1px;line-height:1.12}'+

      '.tdp-person{display:flex;align-items:center;gap:7px;margin-bottom:8px}'+
      '.tdp-person-avatar{width:25px;height:25px;min-width:25px;min-height:25px;aspect-ratio:1/1;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:9.5px;font-weight:900;display:flex;align-items:center;justify-content:center;object-fit:cover;border:1.5px solid var(--tdp-surface);box-shadow:0 0 0 1.5px var(--tdp-border-soft)}'+
      '.tdp-person-name{font-size:12.5px;font-weight:800;color:var(--tdp-text)}'+
      '.tdp-person-meta{font-size:10.5px;color:var(--tdp-purple);font-weight:700;display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:1px}'+
      '.tdp-person-meta em{font-style:normal;opacity:.5;color:var(--tdp-text2)}'+
      '.tdp-person-meta span{display:inline-flex;align-items:center;gap:3px}'+

      '.tdp-divider{display:flex;align-items:center;gap:8px;margin:2px 0 9px;color:var(--tdp-gold);opacity:.6}'+
      '.tdp-divider:before,.tdp-divider:after{content:"";flex:1;height:1px;background:var(--tdp-border-soft)}'+
      '.tdp-divider span{font-size:9px}'+

      '.tdp-progress-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}'+
      '.tdp-progress-label{font-family:"Cinzel",Georgia,serif;font-size:9.5px;font-weight:700;color:var(--tdp-gold);letter-spacing:1.1px;text-transform:uppercase}'+
      '.tdp-progress-value{font-size:11.5px;font-weight:800;color:var(--tdp-purple)}'+
      '.tdp-progress-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}'+
      '.tdp-progress-track{flex:1;display:flex;gap:4px}'+
      '.tdp-progress-seg{flex:1;height:7px;border-radius:99px;background:var(--tdp-surface-2)}'+
      '.tdp-progress-seg.done{background:linear-gradient(90deg,#7c3aed,#a855f7)}'+
      '.tdp-xp-shield{flex-shrink:0;width:32px;height:36px;background:var(--tdp-surface);clip-path:polygon(50% 0%,100% 20%,100% 72%,50% 100%,0% 72%,0% 20%);box-shadow:0 0 0 1.5px var(--tdp-border,rgba(180,138,60,.5));display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05}'+
      '[data-theme*="dark"] .tdp-xp-shield{box-shadow:0 0 0 1.5px #caa153,0 0 8px rgba(234,179,8,.16)}'+
      '.tdp-xp-shield b{font-size:10px;color:var(--tdp-purple);font-weight:900}'+
      '.tdp-xp-shield small{font-size:6px;color:var(--tdp-text2);font-weight:800;letter-spacing:.4px}'+
      '.tdp-hint{font-size:10px;color:var(--tdp-text2);text-align:center;margin:2px 0 10px;font-style:italic;display:flex;align-items:center;gap:6px}'+
      '.tdp-hint:before,.tdp-hint:after{content:"◆";font-size:5px;color:var(--tdp-gold);opacity:.55}'+
      '.tdp-hint span{flex:0 0 auto}'+

      '.tdp-box{background:var(--tdp-surface);border:1px solid var(--tdp-border-soft);border-radius:15px;padding:2px 12px;margin-bottom:10px;box-shadow:0 3px 10px rgba(20,10,40,.04);position:relative}'+
      '[data-theme*="dark"] .tdp-box{box-shadow:0 4px 14px rgba(0,0,0,.24)}'+
      '.tdp-box:before{content:"";position:absolute;inset:0;border-radius:15px;box-shadow:inset 0 1px 0 rgba(255,255,255,.5);pointer-events:none}'+
      '[data-theme*="dark"] .tdp-box:before{box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}'+
      '.tdp-box-label{font-family:"Cinzel",Georgia,serif;font-size:9.5px;font-weight:700;color:var(--tdp-gold);letter-spacing:1.1px;text-transform:uppercase;margin:9px 0 2px}'+

      // Subtask row: checkboxes are the frequent iOS/Safari oval-rendering bug
      // (native button chrome overriding author sizing). -webkit-appearance/
      // appearance:none plus explicit min/max width+height on top of
      // width/height/aspect-ratio locks it to a true circle in every browser.
      '.tdp-sub{display:flex;align-items:center;gap:8px;padding:6.5px 2px;border-bottom:1px solid rgba(180,138,60,.14)}'+
      '[data-theme*="dark"] .tdp-sub{border-bottom-color:rgba(234,197,94,.1)}'+
      '.tdp-sub:last-child{border-bottom:none}'+
      '.tdp-sub-chk{-webkit-appearance:none;appearance:none;width:21px;height:21px;min-width:21px;min-height:21px;max-width:21px;max-height:21px;aspect-ratio:1/1;flex:0 0 auto;flex-shrink:0;align-self:center;box-sizing:border-box;border-radius:50%;border:2px solid var(--tdp-border-soft);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:10px;line-height:1;padding:0;margin:0;outline:none}'+
      '.tdp-sub-chk.done{background:#7c3aed;border-color:#7c3aed}'+
      '.tdp-sub-icon{width:21px;height:21px;min-width:21px;min-height:21px;aspect-ratio:1/1;flex:0 0 auto;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center}'+
      '.tdp-sub-text{flex:1;font-size:12.5px;font-weight:700;color:var(--tdp-text)}'+
      '.tdp-sub.done .tdp-sub-text{text-decoration:line-through;color:var(--tdp-text2)}'+
      '.tdp-sub-accent{background:none;border:none;color:var(--tdp-gold);opacity:.55;font-size:11px;cursor:pointer;padding:5px;flex-shrink:0}'+
      '.tdp-sub-add{width:100%;margin:5px 0 7px;background:none;border:1.5px dashed var(--tdp-border,rgba(180,138,60,.45));border-radius:11px;padding:6px;font-size:11px;font-weight:800;color:var(--tdp-purple);cursor:pointer}'+
      '.tdp-empty-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 2px}'+
      '.tdp-empty-row span{font-size:11px;color:var(--tdp-text2)}'+
      '.tdp-empty-add{flex-shrink:0;background:none;border:1.5px dashed var(--tdp-border,rgba(180,138,60,.5));border-radius:99px;padding:5px 11px;font-size:10.5px;font-weight:800;color:var(--tdp-purple);cursor:pointer;display:flex;align-items:center;gap:4px}'+
      '.tdp-sub.readonly .tdp-sub-chk{cursor:default;opacity:.75}'+
      '.tdp-sub.readonly .tdp-sub-accent{display:none}'+

      '.tdp-help-box{position:relative;background:var(--tdp-surface);border:1.5px solid var(--tdp-border,rgba(180,138,60,.5));border-radius:14px;padding:8px 10px;margin-bottom:10px;box-shadow:0 3px 10px rgba(20,10,40,.04)}'+
      '[data-theme*="dark"] .tdp-help-box{box-shadow:0 0 12px rgba(234,179,8,.05),0 4px 14px rgba(0,0,0,.24)}'+
      '.tdp-help-row{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}'+
      // Crest replaces the old flat purple square: a small shield/emblem
      // (inline SVG, purple inner fill, thin gold outer + inner contour,
      // faint highlight, subtle drop shadow) — no image asset.
      '.tdp-help-crest{flex-shrink:0;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 5px rgba(20,10,40,.22))}'+
      '[data-theme*="dark"] .tdp-help-crest{filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}'+
      '.tdp-help-text{flex:1;min-width:0}'+
      '.tdp-help-title{font-family:"Cinzel",Georgia,serif;font-size:9px;font-weight:700;color:var(--tdp-gold);letter-spacing:.9px;text-transform:uppercase;margin-bottom:2px}'+
      '.tdp-help-sub{font-size:10px;color:var(--tdp-text2);line-height:1.22}'+
      // Scoped selector (#tdp-overlay .tdp-help-row .tdp-help-btn) rather than
      // the bare .tdp-help-btn class: raises specificity above any generic
      // app-wide button rule (e.g. .screen button, .add-sheet button, .btn)
      // so this control can never again be silently overridden into a full
      // solid-purple tile. flex:0 0 auto is explicit (not just flex-shrink)
      // so no flex ancestor can stretch it either. No visual values changed.
      '#tdp-overlay .tdp-help-row .tdp-help-btn{flex:0 0 auto;flex-shrink:0;align-self:center;width:auto;max-width:max-content;border:1.4px solid var(--tdp-purple);border-radius:10px;padding:6px 10px;font-size:10.5px;font-weight:800;background:transparent;color:var(--tdp-purple);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap}'+
      '[data-theme*="dark"] #tdp-overlay .tdp-help-row .tdp-help-btn{background:rgba(167,139,250,.07);border-color:var(--tdp-purple-2)}'+
      '.tdp-member-pick{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;width:100%}'+
      '.tdp-member-chip{border:1.5px solid var(--tdp-border-soft);background:var(--tdp-surface-2);border-radius:99px;padding:5px 10px;font-size:11px;font-weight:800;color:var(--tdp-text);cursor:pointer}'+
      '.tdp-help-status{margin-top:7px;font-size:10.5px;font-weight:800;color:var(--tdp-purple);width:100%}'+

      '.tdp-more{width:100%;background:none;border:none;text-align:center;font-size:11px;font-weight:800;color:var(--tdp-gold);padding:6px 0 2px;cursor:pointer}'+

      '.tdp-edit-field{margin-bottom:7px}'+
      '.tdp-edit-label{font-size:9px;font-weight:900;color:var(--tdp-text2);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:3px}'+
      '.tdp-edit-input,.tdp-edit-select,.tdp-edit-textarea{width:100%;box-sizing:border-box;border:1.5px solid var(--tdp-border-soft);border-radius:10px;padding:6px 9px;font-size:12.5px;font-family:inherit;background:var(--tdp-surface-2);color:var(--tdp-text);outline:none}'+
      '.tdp-note{padding:6px 0;border-bottom:1px solid var(--tdp-border-soft)}'+
      '.tdp-note:last-child{border-bottom:none}'+
      '.tdp-note-head{display:flex;justify-content:space-between;font-size:10px;font-weight:900;color:var(--tdp-text2);margin-bottom:2px}'+
      '.tdp-note-text{font-size:12.5px;color:var(--tdp-text);line-height:1.35}'+
      '.tdp-note-form{display:flex;gap:6px;margin-top:7px}'+
      '.tdp-note-input{flex:1;border:1.5px solid var(--tdp-border-soft);border-radius:10px;padding:7px 9px;font-size:12px;font-family:inherit;outline:none;background:var(--tdp-surface-2);color:var(--tdp-text)}'+
      '.tdp-note-send{border:none;background:var(--tdp-purple);color:#fff;border-radius:10px;padding:0 12px;font-weight:900;font-size:12px;cursor:pointer}'+
      '.tdp-del-btn{width:100%;background:none;border:none;color:#dc2626;font-size:11.5px;font-weight:800;padding:10px 0 3px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}'+

      '.tdp-footer{display:flex;gap:7px;margin-top:0}'+
      '.tdp-save{width:40px;height:40px;min-width:40px;min-height:40px;aspect-ratio:1/1;flex:0 0 auto;flex-shrink:0;box-sizing:border-box;border-radius:12px;border:1.5px solid var(--tdp-border-soft);background:var(--tdp-surface);color:var(--tdp-gold);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-appearance:none;appearance:none;padding:0}'+
      '.tdp-cta{flex:1;border:none;border-radius:12px;padding:10px 8px;font-size:12px;font-weight:800;cursor:pointer;background:var(--tdp-surface-2);color:var(--tdp-text2);display:flex;align-items:center;justify-content:center;gap:6px}'+
      '.tdp-cta.active{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;box-shadow:0 3px 10px rgba(124,58,237,.22)}'+
      '.tdp-cta.done-state{background:var(--tdp-surface);color:var(--tdp-purple);border:1.5px solid var(--tdp-purple);box-shadow:none}'+

      // ---- create mode only — same card, a handful of interactive fields ----
      '.tdp-title-input{width:100%;border:none;border-bottom:1.5px dashed var(--tdp-border,rgba(180,138,60,.45));background:transparent;font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:16px;color:var(--tdp-text);margin:3px 0 5px;padding:2px 0 4px;outline:none}'+
      '.tdp-title-input::placeholder{color:var(--tdp-text2);font-weight:600;font-style:italic}'+
      '.tdp-assignee-row{display:flex;gap:5px;flex-wrap:wrap;align-items:center;cursor:pointer}'+
      '.tdp-inline-date,.tdp-inline-select{border:1.5px solid var(--tdp-border-soft);border-radius:8px;padding:2px 6px;font-size:10.5px;font-family:inherit;background:var(--tdp-surface-2);color:var(--tdp-text);outline:none;max-width:120px}'+
      '.tdp-cat-trigger{cursor:pointer}'+
      '.tdp-sub-text[data-sub-edit]{cursor:pointer}'+
      '.tdp-create-empty-person{font-size:12.5px;font-weight:800;color:var(--tdp-text2);font-style:italic}';
    document.head.appendChild(s);
  }

  function overlayEl(){
    var el=document.getElementById('tdp-overlay');
    if(!el){el=document.createElement('div');el.id='tdp-overlay';el.className='tdp-overlay';document.body.appendChild(el);}
    return el;
  }

  // Fully removes any overlay node and restores document state. Idempotent —
  // safe to call multiple times (e.g. close() invoked twice in a row, or a
  // stale overlay left over from a previous open/close cycle that was
  // interrupted). This is the ONLY place that clears body scroll-lock state,
  // so every close path (X button, backdrop click, re-open) converges here.
  function finalizeCleanup(){
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
    var ov=document.getElementById('tdp-overlay');
    if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
    document.body.style.overflow = prevBodyOverflow===null ? '' : prevBodyOverflow;
    prevBodyOverflow=null;
    scrollLockActive=false;
    openId=null;helpPickerOpen=false;detailsOpen=false;
    mode=null;draftTask=null;assigneePickerOpen=false;catPickerOpen=false;
  }

  function close(){
    var ov=document.getElementById('tdp-overlay');
    if(!ov){
      // Already closed / no overlay in the DOM — nothing to animate, but
      // still reset in-memory state so a stray close() call is a safe no-op.
      if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
      openId=null;helpPickerOpen=false;detailsOpen=false;
      scrollLockActive=false;prevBodyOverflow=null;
      mode=null;draftTask=null;assigneePickerOpen=false;catPickerOpen=false;
      return;
    }
    ov.classList.remove('open');
    // Belt-and-suspenders: kill pointer interaction on the overlay the
    // instant close() runs, synchronously, rather than waiting on the fade
    // transition or the removal timeout. This is what prevents the app from
    // freezing if the 220ms fade is ever interrupted (route change, iOS
    // backgrounding the tab, rapid re-open, etc.) — the invisible overlay
    // can no longer intercept touches even if it lingers in the DOM.
    ov.style.pointerEvents='none';
    if(closeTimer)clearTimeout(closeTimer);
    closeTimer=setTimeout(finalizeCleanup,220);
  }

  function render(){
    if(mode==='create'){renderCreate();return;}
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

    var isDone = !!task.done;
    var subsHtml=subs.map(function(s){
      return '<div class="tdp-sub'+(s.done?' done':'')+(isDone?' readonly':'')+'" data-sub="'+esc(s.id)+'">'+
        '<button class="tdp-sub-chk'+(s.done?' done':'')+'"'+(isDone?'':' data-sub-toggle="'+esc(s.id)+'"')+(isDone?' disabled':'')+'>'+(s.done?uiIcon('check',11):'')+'</button>'+
        '<span class="tdp-sub-icon" style="background:'+accent+'1f;color:'+accent+'">'+subIcon(s.title)+'</span>'+
        '<span class="tdp-sub-text">'+esc(s.title)+'</span>'+
        (isDone?'':'<button class="tdp-sub-accent" data-sub-del="'+esc(s.id)+'" title="Verwijderen">✦</button>')+
      '</div>';
    }).join('');

    var notes=Array.isArray(task.notes)?task.notes.slice().reverse():[];
    var notesHtml=notes.length?notes.map(function(n){
      var when='';try{when=new Date(n.createdAt).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){}
      return '<div class="tdp-note"><div class="tdp-note-head"><span>'+esc(memberName(n.createdByUid))+'</span><span>'+esc(when)+'</span></div><div class="tdp-note-text">'+esc(n.text)+'</div></div>';
    }).join('') : '<div style="font-size:11.5px;color:var(--tdp-text2);padding:2px 0 4px">Nog geen opmerkingen.</div>';

    var helpableMembers=members().filter(function(m){var id=m.uid||m.id;return id&&id!==currentUid()&&!(task.assignedToUids&&task.assignedToUids[id]);});
    var helpChips=helpableMembers.length?helpableMembers.map(function(m){var id=m.uid||m.id;return '<button class="tdp-member-chip" data-help-pick="'+esc(id)+'">'+esc(m.displayName||m.name||'Gezinslid')+'</button>';}).join(''):'<div style="font-size:12px;color:var(--tdp-text2)">Geen andere gezinsleden gevonden.</div>';

    var ctaState = allSubsDone ? (task.done?'active done-state':'active') : '';
    var ctaIcon = allSubsDone ? uiIcon(task.done?'reopen':'check',12) : uiIcon('lock',12);
    var ctaText = allSubsDone ? (task.done?'Heropenen':'Voltooien') : 'Voltooi eerst alle stappen';

    var detailsHtml = detailsOpen ? (
      '<div class="tdp-box" style="padding-top:10px">'+
        '<div class="tdp-edit-field"><label class="tdp-edit-label">Beschrijving</label><textarea class="tdp-edit-textarea" id="tdp-edit-desc" rows="2">'+esc(task.desc||task.description||'')+'</textarea></div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
          '<div class="tdp-edit-field" style="flex:1;min-width:100px"><label class="tdp-edit-label">Datum</label><input class="tdp-edit-input" type="date" id="tdp-edit-date" value="'+esc(task.date||'')+'"></div>'+
          '<div class="tdp-edit-field" style="flex:1;min-width:80px"><label class="tdp-edit-label">Tijd</label><input class="tdp-edit-input" type="time" id="tdp-edit-time" value="'+esc(task.time||'')+'"></div>'+
        '</div>'+
        '<div class="tdp-edit-field"><label class="tdp-edit-label">Prioriteit</label><select class="tdp-edit-select" id="tdp-edit-prio">'+
          ['laag','normaal','hoog'].map(function(p){return '<option value="'+p+'"'+((task.prio||'laag')===p?' selected':'')+'>'+prioLabel(p)+'</option>';}).join('')+
        '</select></div>'+
        '<div class="tdp-box-label" style="margin-top:0">Opmerkingen</div>'+
        '<div id="tdp-notes-list">'+notesHtml+'</div>'+
        '<div class="tdp-note-form"><input class="tdp-note-input" id="tdp-note-input" placeholder="Laat een opmerking achter…"><button class="tdp-note-send" id="tdp-note-send">Plaats</button></div>'+
        '<div style="display:flex;gap:8px;margin-top:11px">'+
          '<button class="tdp-cta active" id="tdp-save-edit" style="flex:1;padding:9px">Wijzigingen opslaan</button>'+
        '</div>'+
        '<button class="tdp-del-btn" id="tdp-delete-btn">'+uiIcon('trash',13)+' Taak verwijderen</button>'+
      '</div>'
    ) : '';

    var html =
      '<div class="tdp-card" role="dialog" aria-modal="true">'+
        '<div class="tdp-hero" style="'+(heroImg?('background-image:url('+esc(heroImg)+')'):heroFallbackStyle(task))+'">'+
          '<button class="tdp-close" id="tdp-close-btn">'+uiIcon('close',12)+'</button>'+
          '<div class="tdp-xp-ribbon"><span class="tdp-xp-num">+'+totalXp+'</span><span class="tdp-xp-lbl">XP</span></div>'+
        '</div>'+
        '<div class="tdp-body">'+
          '<div class="tdp-icon-ring"><i class="n"></i><i class="s"></i><i class="e"></i><i class="w"></i>'+
            '<div class="tdp-icon-inner" style="background:'+accent+'22;color:'+accent+'">'+categorySvg(cat,20)+'</div>'+
          '</div>'+
          '<div class="tdp-title">'+esc(task.title||'Taak')+'</div>'+
          '<div class="tdp-person">'+
            (mainAvatarUrl?'<img class="tdp-person-avatar" src="'+esc(mainAvatarUrl)+'">':'<div class="tdp-person-avatar">'+esc(initials(mainPerson?mainPerson.name:'?'))+'</div>')+
            '<div>'+
              '<div class="tdp-person-name">'+esc(people.map(function(p){return p.name;}).join(', ')||'Niet toegewezen')+'</div>'+
              '<div class="tdp-person-meta"><span>'+uiIcon('calendar',11)+esc(dateTimeLabel(task))+'</span><em>•</em><span>'+uiIcon('shield',11)+esc(frequencyLabel(task))+'</span></div>'+
            '</div>'+
          '</div>'+
          '<div class="tdp-divider"><span>◆</span></div>'+
          '<div class="tdp-progress-head"><span class="tdp-progress-label">Voortgang</span><span class="tdp-progress-value">'+(subs.length?(subDone+' van '+subs.length+' voltooid'):(task.done?'Voltooid':'Open'))+'</span></div>'+
          (subs.length?(
            '<div class="tdp-progress-row"><div class="tdp-progress-track">'+progressSegs+'</div><div class="tdp-xp-shield"><b>'+totalXp+'</b><small>XP</small></div></div>'+
            '<div class="tdp-hint"><span>Vink alle stappen aan om deze taak te voltooien.</span></div>'+
            '<div class="tdp-box"><div id="tdp-sub-list" style="padding-top:4px">'+subsHtml+'</div>'+(isDone?'':'<button class="tdp-sub-add" id="tdp-sub-add-btn">+ Subtaak toevoegen</button>')+'</div>'
          ):(
            '<div class="tdp-box"><div class="tdp-empty-row"><span>Geen subtaken</span>'+(isDone?'':'<button class="tdp-empty-add" id="tdp-sub-add-btn">+ Subtaak</button>')+'</div></div>'
          ))+
          '<div class="tdp-help-box">'+
            '<div class="tdp-help-row">'+
              '<div class="tdp-help-crest">'+helpCrestSvg()+'</div>'+
              '<div class="tdp-help-text"><div class="tdp-help-title">Hulp nodig?</div><div class="tdp-help-sub">Vraag iemand uit je party om te helpen en deel de taak samen.</div></div>'+
              '<button class="tdp-help-btn" id="tdp-help-btn">'+uiIcon('link',12)+'Hulp vragen</button>'+
              (helpPickerOpen?('<div class="tdp-member-pick">'+helpChips+'</div>'):'')+
              (task.helpRequested?'<div class="tdp-help-status">Hulp gevraagd aan '+esc(memberName(task.helpRequestedForUid))+'</div>':'')+
            '</div>'+
          '</div>'+
          detailsHtml+
          '<div class="tdp-footer">'+
            '<button class="tdp-save" title="Opslaan" id="tdp-bookmark-btn">'+uiIcon('bookmark',15)+'</button>'+
            '<button class="tdp-cta '+ctaState+'" id="tdp-complete-btn" '+(allSubsDone?'':'disabled')+'>'+ctaIcon+ctaText+'</button>'+
          '</div>'+
          '<button class="tdp-more" id="tdp-more-btn">'+(detailsOpen?'Minder details ⌃':'Meer details ⌄')+'</button>'+
        '</div>'+
      '</div>';

    ov.innerHTML=html;
    // Overlay may have been left with pointer-events:none by a close() that
    // got interrupted by a fast re-open (see open()); make sure it is
    // interactive again now that we're actively rendering it open.
    ov.style.pointerEvents='';
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
        patch(task.id,{subtasks:next},function(){render();});
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
          if(typeof window.showToast==='function')window.showToast('Hulp gevraagd aan '+memberName(targetUid));
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
    if(bookmarkBtn)bookmarkBtn.onclick=function(){if(typeof window.showToast==='function')window.showToast('Opgeslagen');};
  }

  // ============================================================
  // CREATE MODE — same overlay/card/CSS as render()/bind() above, a
  // different body. Nothing here writes to Firebase until saveCreate()
  // succeeds; until then draftTask lives only in memory.
  // ============================================================
  function renderCreate(){
    injectStyles();
    var ov=overlayEl();
    var draft=draftTask||(draftTask=makeDraftTask());
    var cat=draft.category||iconCategory(draft);
    var accent=CATEGORY_ACCENT[cat]||CATEGORY_ACCENT.quest;
    var totalXp=xpNumber(draft);

    var mList=members();
    var chosen=mList.filter(function(m){var id=m.uid||m.id;return id&&draft.assignedToUids[id];});
    var avatarsHtml=chosen.length?chosen.map(function(m){
      var u=avatarUrlFor(m);
      return u?'<img class="tdp-person-avatar" src="'+esc(u)+'">':'<div class="tdp-person-avatar">'+esc(initials(m.displayName||m.name))+'</div>';
    }).join(''):'<div class="tdp-person-avatar">?</div>';
    var chosenNames=chosen.map(function(m){return m.displayName||m.name||'Gezinslid';}).join(', ');

    var assigneePickHtml=assigneePickerOpen?(
      '<div class="tdp-member-pick">'+(mList.length?mList.map(function(m){
        var id=m.uid||m.id;
        return '<button class="tdp-member-chip'+(draft.assignedToUids[id]?' active':'')+'" data-assignee-toggle="'+esc(id)+'">'+esc(m.displayName||m.name||'Gezinslid')+'</button>';
      }).join(''):'<div style="font-size:12px;color:var(--tdp-text2)">Gezinsleden worden geladen…</div>')+'</div>'
    ):'';

    var catPickHtml=catPickerOpen?(
      '<div class="tdp-member-pick">'+CATEGORY_ORDER.map(function(c){
        return '<button class="tdp-member-chip'+(cat===c?' active':'')+'" data-cat-pick="'+c+'">'+esc(CATEGORY_LABEL[c])+'</button>';
      }).join('')+'</div>'
    ):'';

    var subs=draft.subtasks||[];
    // Checkboxes render disabled/always-empty: there is no "progress" yet for
    // a task that doesn't exist. Add/edit/delete stay active — see report.
    var subsHtml=subs.map(function(s){
      return '<div class="tdp-sub" data-sub="'+esc(s.id)+'">'+
        '<button class="tdp-sub-chk" disabled></button>'+
        '<span class="tdp-sub-icon" style="background:'+accent+'1f;color:'+accent+'">'+subIcon(s.title)+'</span>'+
        '<span class="tdp-sub-text" data-sub-edit="'+esc(s.id)+'">'+esc(s.title)+'</span>'+
        '<button class="tdp-sub-accent" data-sub-del="'+esc(s.id)+'" title="Verwijderen">✦</button>'+
      '</div>';
    }).join('');

    var detailsHtml=detailsOpen?(
      '<div class="tdp-box" style="padding-top:10px">'+
        '<div class="tdp-edit-field"><label class="tdp-edit-label">Beschrijving</label><textarea class="tdp-edit-textarea" id="tdp-create-desc" rows="2" placeholder="Extra notitie…">'+esc(draft.desc||'')+'</textarea></div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
          '<div class="tdp-edit-field" style="flex:1;min-width:80px"><label class="tdp-edit-label">Tijd</label><input class="tdp-edit-input" type="time" id="tdp-create-time" value="'+esc(draft.time||'')+'"></div>'+
          '<div class="tdp-edit-field" style="flex:1;min-width:100px"><label class="tdp-edit-label">Prioriteit</label><select class="tdp-edit-select" id="tdp-create-prio">'+
            ['laag','normaal','hoog'].map(function(p){return '<option value="'+p+'"'+((draft.prio||'laag')===p?' selected':'')+'>'+prioLabel(p)+'</option>';}).join('')+
          '</select></div>'+
        '</div>'+
      '</div>'
    ):'';

    var html =
      '<div class="tdp-card" role="dialog" aria-modal="true">'+
        '<div class="tdp-hero" style="'+heroFallbackStyle(draft)+'">'+
          '<button class="tdp-close" id="tdp-close-btn">'+uiIcon('close',12)+'</button>'+
          '<div class="tdp-xp-ribbon"><span class="tdp-xp-num">+'+totalXp+'</span><span class="tdp-xp-lbl">XP</span></div>'+
        '</div>'+
        '<div class="tdp-body">'+
          '<div class="tdp-icon-ring tdp-cat-trigger" id="tdp-cat-trigger"><i class="n"></i><i class="s"></i><i class="e"></i><i class="w"></i>'+
            '<div class="tdp-icon-inner" style="background:'+accent+'22;color:'+accent+'">'+categorySvg(cat,20)+'</div>'+
          '</div>'+
          '<input class="tdp-title-input" id="tdp-create-title" placeholder="Taaknaam…" value="'+esc(draft.title)+'" maxlength="80">'+
          catPickHtml+
          '<div class="tdp-person">'+
            '<div class="tdp-assignee-row" id="tdp-assignee-trigger">'+avatarsHtml+'</div>'+
            '<div>'+
              '<div class="tdp-person-name">'+(chosenNames?esc(chosenNames):'<span class="tdp-create-empty-person">Kies gezinslid(en)</span>')+'</div>'+
              '<div class="tdp-person-meta">'+
                '<span>'+uiIcon('calendar',11)+'<input type="date" class="tdp-inline-date" id="tdp-create-date" value="'+esc(draft.date||'')+'"></span>'+
                '<em>•</em>'+
                '<span>'+uiIcon('shield',11)+'<select class="tdp-inline-select" id="tdp-create-recurrence">'+
                  ['once','daily','weekly','monthly'].map(function(r){return '<option value="'+r+'"'+(draft.recurrence===r?' selected':'')+'>'+frequencyLabel({recurrence:r})+'</option>';}).join('')+
                '</select></span>'+
              '</div>'+
            '</div>'+
          '</div>'+
          assigneePickHtml+
          '<div class="tdp-divider"><span>◆</span></div>'+
          '<div class="tdp-progress-head"><span class="tdp-progress-label">Subtaken</span></div>'+
          '<div class="tdp-hint"><span>Voeg stappen toe die deze taak samen vormen.</span></div>'+
          (subs.length?(
            '<div class="tdp-box"><div id="tdp-sub-list" style="padding-top:4px">'+subsHtml+'</div><button class="tdp-sub-add" id="tdp-sub-add-btn">+ Subtaak toevoegen</button></div>'
          ):(
            '<div class="tdp-box"><div class="tdp-empty-row"><span>Geen subtaken</span><button class="tdp-empty-add" id="tdp-sub-add-btn">+ Subtaak</button></div></div>'
          ))+
          detailsHtml+
          '<div class="tdp-footer">'+
            '<button class="tdp-cta" id="tdp-cancel-btn" style="flex:1">Annuleren</button>'+
            '<button class="tdp-cta active" id="tdp-create-save-btn" style="flex:1">'+uiIcon('check',12)+'Taak aanmaken</button>'+
          '</div>'+
          '<button class="tdp-more" id="tdp-more-btn">'+(detailsOpen?'Minder details ⌃':'Meer details ⌄')+'</button>'+
        '</div>'+
      '</div>';

    ov.innerHTML=html;
    ov.style.pointerEvents='';
    requestAnimationFrame(function(){ov.classList.add('open');});
    document.body.style.overflow='hidden';
    bindCreate(ov,draft);
  }

  // Reads whatever is currently in the DOM inputs back into draftTask before
  // any action that triggers a re-render (toggling a picker, adding a
  // subtask, opening "Meer details"), so nothing the person already typed
  // is lost — the same class of gotcha the detail-mode edit form accepts,
  // avoided here since it's cheap to do for a handful of fields.
  function syncCreateFields(){
    if(!draftTask)return;
    var t=document.getElementById('tdp-create-title');if(t)draftTask.title=t.value;
    var d=document.getElementById('tdp-create-date');if(d)draftTask.date=d.value;
    var r=document.getElementById('tdp-create-recurrence');if(r)draftTask.recurrence=r.value;
    var de=document.getElementById('tdp-create-desc');if(de)draftTask.desc=de.value;
    var ti=document.getElementById('tdp-create-time');if(ti)draftTask.time=ti.value;
    var pr=document.getElementById('tdp-create-prio');if(pr)draftTask.prio=pr.value;
  }

  function cancelCreate(){close();}

  function bindCreate(ov,draft){
    ov.onclick=function(e){if(e.target===ov)cancelCreate();};
    var closeBtn=document.getElementById('tdp-close-btn');if(closeBtn)closeBtn.onclick=cancelCreate;
    var cancelBtn=document.getElementById('tdp-cancel-btn');if(cancelBtn)cancelBtn.onclick=cancelCreate;
    var moreBtn=document.getElementById('tdp-more-btn');if(moreBtn)moreBtn.onclick=function(){syncCreateFields();detailsOpen=!detailsOpen;renderCreate();};

    var titleInput=document.getElementById('tdp-create-title');
    if(titleInput)titleInput.oninput=function(){draft.title=titleInput.value;};

    var dateInput=document.getElementById('tdp-create-date');
    if(dateInput)dateInput.onchange=function(){draft.date=dateInput.value;};
    var recSelect=document.getElementById('tdp-create-recurrence');
    if(recSelect)recSelect.onchange=function(){draft.recurrence=recSelect.value;};

    var catTrigger=document.getElementById('tdp-cat-trigger');
    if(catTrigger)catTrigger.onclick=function(){syncCreateFields();catPickerOpen=!catPickerOpen;assigneePickerOpen=false;renderCreate();};
    document.querySelectorAll('[data-cat-pick]').forEach(function(btn){
      btn.onclick=function(){syncCreateFields();draft.category=btn.getAttribute('data-cat-pick');catPickerOpen=false;renderCreate();};
    });

    var assigneeTrigger=document.getElementById('tdp-assignee-trigger');
    if(assigneeTrigger)assigneeTrigger.onclick=function(){syncCreateFields();assigneePickerOpen=!assigneePickerOpen;catPickerOpen=false;renderCreate();};
    document.querySelectorAll('[data-assignee-toggle]').forEach(function(btn){
      btn.onclick=function(){
        syncCreateFields();
        var id=btn.getAttribute('data-assignee-toggle');
        if(draft.assignedToUids[id])delete draft.assignedToUids[id];else draft.assignedToUids[id]=true;
        renderCreate();
      };
    });

    document.querySelectorAll('[data-sub-edit]').forEach(function(span){
      span.onclick=function(){
        var id=span.getAttribute('data-sub-edit');
        var sub=draft.subtasks.find(function(s){return s.id===id;});
        if(!sub)return;
        var next=(prompt('Naam van de subtaak?',sub.title)||'').trim();
        if(!next)return;
        syncCreateFields();
        sub.title=next;
        renderCreate();
      };
    });
    document.querySelectorAll('[data-sub-del]').forEach(function(btn){
      btn.onclick=function(){
        syncCreateFields();
        var id=btn.getAttribute('data-sub-del');
        draft.subtasks=draft.subtasks.filter(function(s){return s.id!==id;});
        renderCreate();
      };
    });
    var addBtn=document.getElementById('tdp-sub-add-btn');
    if(addBtn)addBtn.onclick=function(){
      var title=(prompt('Naam van de subtaak?')||'').trim();
      if(!title)return;
      syncCreateFields();
      var id='sub_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      draft.subtasks.push({id:id,title:title,done:false});
      renderCreate();
    };

    if(detailsOpen){
      var descEl=document.getElementById('tdp-create-desc');if(descEl)descEl.oninput=function(){draft.desc=descEl.value;};
      var timeEl=document.getElementById('tdp-create-time');if(timeEl)timeEl.onchange=function(){draft.time=timeEl.value;};
      var prioEl=document.getElementById('tdp-create-prio');if(prioEl)prioEl.onchange=function(){draft.prio=prioEl.value;};
    }

    var saveBtn=document.getElementById('tdp-create-save-btn');
    if(saveBtn)saveBtn.onclick=function(){
      syncCreateFields();
      saveCreate(draft,saveBtn);
    };
  }

  // Saves through the same authoritative path as everything else in this
  // file: TaskSharedData.create() → families/{householdId}/shared/tasks/{id}.
  // No second Firebase writer, no localStorage-only fallback for new tasks.
  function saveCreate(draft,btnEl){
    var title=String(draft.title||'').trim();
    if(!title){
      var titleInput=document.getElementById('tdp-create-title');
      if(titleInput)titleInput.focus();
      if(typeof window.showToast==='function')window.showToast('Geef de taak een naam');
      return;
    }
    if(!Object.keys(draft.assignedToUids||{}).length){
      var me=currentUid();
      if(me)draft.assignedToUids[me]=true;
    }
    if(!Object.keys(draft.assignedToUids||{}).length){
      if(typeof window.showToast==='function')window.showToast('Kies minimaal één gezinslid');
      return;
    }
    if(!window.TaskSharedData||typeof window.TaskSharedData.create!=='function'){
      if(typeof window.showToast==='function')window.showToast('Taak kon niet worden opgeslagen');
      return;
    }
    var names=[];
    members().forEach(function(m){var id=m.uid||m.id;if(id&&draft.assignedToUids[id])names.push(m.displayName||m.name||'Gezinslid');});
    var payload={
      title:title,
      desc:draft.desc||'',
      description:draft.desc||'',
      category:draft.category||null,
      who:names,
      assignedToUids:draft.assignedToUids,
      createdByUid:currentUid(),
      date:draft.date||'',
      time:draft.time||'',
      prio:draft.prio||'laag',
      recurrence:draft.recurrence||'once',
      subtasks:draft.subtasks||[],
      done:false
    };
    if(btnEl){btnEl.disabled=true;btnEl.style.opacity='.6';}
    // TEMP DIAGNOSTIC (see report — remove once root cause is confirmed on
    // device): the .catch() below previously discarded the real reject
    // reason behind one generic toast. This captures the exact readiness/
    // identity state at the moment of the call and, on failure, the full
    // error object — console-only, the user-facing toast stays generic.
    var __diagAtCall={
      readinessFixInstalled:!!window.__taskCreateReadinessFix,
      createWrapped:!!(window.TaskSharedData&&window.TaskSharedData.create&&window.TaskSharedData.create.__resolvesHouseholdContext),
      taskSharedStatus:(window.TaskSharedData&&typeof window.TaskSharedData.status==='function')?window.TaskSharedData.status():null,
      familyDataStoreStatus:(window.FamilyDataStore&&typeof window.FamilyDataStore.status==='function')?window.FamilyDataStore.status():null,
      fbFamilyId:window.fbFamilyId||null,
      firebaseUid:currentUid(),
      offlineMode:!!window.offlineMode
    };
    console.log('[TaskDetailPopup][DIAG] create() call state',__diagAtCall);
    window.TaskSharedData.create(payload).then(function(saved){
      if(!Array.isArray(window.taskData))window.taskData=[];
      if(!window.taskData.some(function(t){return String(t.id)===String(saved.id);}))window.taskData.unshift(saved);
      try{
        if(window.AppState&&typeof window.AppState.save==='function')window.AppState.save();
        if(typeof window.renderTasks==='function')window.renderTasks();
        if(typeof window.updateStats==='function')window.updateStats();
      }catch(e){}
      // Same legacy activity/notification hooks the old addSheet-based create
      // flow used (see taskUidCreateBridge.js) — display-only, not part of
      // the shared-task authority.
      try{
        if(typeof window.addActivity==='function')window.addActivity('📋','#f0ede8',(window.myName||'Gezinslid')+' maakte taak "'+title+'" aan');
        if(typeof window.addNotif==='function')window.addNotif('📋','#f0ede8','Nieuwe taak',title);
      }catch(e){}
      if(typeof window.showToast==='function')window.showToast('Taak aangemaakt ✓');
      close();
    }).catch(function(err){
      var __diagOnFail={
        readinessFixInstalled:__diagAtCall.readinessFixInstalled,
        createWrapped:__diagAtCall.createWrapped,
        taskSharedStatus:(window.TaskSharedData&&typeof window.TaskSharedData.status==='function')?window.TaskSharedData.status():null,
        familyDataStoreStatus:(window.FamilyDataStore&&typeof window.FamilyDataStore.status==='function')?window.FamilyDataStore.status():null,
        fbFamilyId:window.fbFamilyId||null,
        firebaseUid:currentUid(),
        offlineMode:!!window.offlineMode,
        payload:payload,
        errorName:err&&err.name,
        errorCode:err&&err.code,
        errorMessage:err&&err.message,
        errorStack:err&&err.stack
      };
      console.warn('[TaskDetailPopup] create failed',err);
      console.warn('[TaskDetailPopup][DIAG] create() failure state',__diagOnFail);
      try{JSON.stringify(payload);}catch(jsonErr){console.warn('[TaskDetailPopup][DIAG] payload is not JSON-safe',jsonErr);}
      if(btnEl){btnEl.disabled=false;btnEl.style.opacity='';}
      if(typeof window.showToast==='function')window.showToast('Taak kon niet worden opgeslagen');
    });
  }

  function open(id){
    // Cancel any pending close cleanup and drop a stale overlay node
    // immediately, so opening the popup again right after closing it
    // (e.g. tapping another task fast) always starts from a clean DOM
    // state instead of racing the 220ms removal timer.
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
    var stale=document.getElementById('tdp-overlay');
    if(stale&&stale.parentNode)stale.parentNode.removeChild(stale);
    // Only capture the pre-popup overflow value once per open/close session.
    // A rapid re-open (close() pending, then open() again before its cleanup
    // timer fires) must NOT re-capture 'hidden' as if it were the original
    // value — that would permanently strand body scroll locked.
    if(!scrollLockActive){
      prevBodyOverflow=document.body.style.overflow||'';
      scrollLockActive=true;
    }
    mode='detail';
    openId=id;helpPickerOpen=false;detailsOpen=false;
    assigneePickerOpen=false;catPickerOpen=false;
    render();
  }

  // Opens the same overlay/card in create mode. Mirrors open()'s lifecycle
  // handling exactly (stale-overlay cleanup, scroll-lock capture) so the
  // freeze-fix and scroll-lock guarantees hold for this entrypoint too.
  function openCreate(){
    if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
    var stale=document.getElementById('tdp-overlay');
    if(stale&&stale.parentNode)stale.parentNode.removeChild(stale);
    if(!scrollLockActive){
      prevBodyOverflow=document.body.style.overflow||'';
      scrollLockActive=true;
    }
    mode='create';
    openId=null;helpPickerOpen=false;detailsOpen=false;
    assigneePickerOpen=false;catPickerOpen=false;
    draftTask=makeDraftTask();
    render();
  }

  window.TaskDetailPopup={open:open,close:close,openCreate:openCreate,isOpen:function(){return !!openId||!!mode;}};
})();
