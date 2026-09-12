'use strict';
// ============================================================
// TASK COMPACT HOME v3.0 — "Warm Minimal" redesign
// Canonical task overview. shared taskData is authoritative.
// Visual language: warm cream / deep green / soft gold, editorial,
// photographic thumbnails, thin borders, minimal shadows.
// No render-only preview tasks: hydration uses a stable skeleton instead.
// Member avatars come from household identity; active Party Quests render as party state.
// ============================================================
(function(){
  if(window.__taskCompactHomeV22)return;
  window.__taskCompactHomeV22=true;
  var state={filter:'all',expanded:{Vandaag:true,Morgen:true,Later:true,Voltooid:false}};

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function members(){try{return window.TaskSharedData&&TaskSharedData.members?TaskSharedData.members()||[]:[];}catch(e){return[];}}
  function member(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function initials(n){return String(n||'G').trim().split(/\s+/).map(function(x){return x[0]||'';}).join('').slice(0,2).toUpperCase()||'G';}
  function avatar(m){
    if(!m)return'';
    var direct=m.avatar||m.avatarUrl||m.photoURL||m.profilePhoto||'';
    if(direct)return direct;
    try{return localStorage.getItem('fam_avatar_'+String(m.displayName||m.name||'').toLowerCase())||'';}catch(e){return'';}
  }
  function realTasks(){return Array.isArray(window.taskData)?window.taskData:[];}
  function hydrated(){try{return !!(window.TaskSharedData&&TaskSharedData.status&&TaskSharedData.status().sharedSnapshot);}catch(e){return realTasks().length>0;}}
  function tasks(){return realTasks();}
  function assignees(t){
    var out=[];
    if(t.assignedToUids&&typeof t.assignedToUids==='object')Object.keys(t.assignedToUids).forEach(function(uid){if(t.assignedToUids[uid]){var m=member(uid);out.push({uid:uid,name:m&&(m.displayName||m.name)||'Gezinslid',member:m});}});
    if(!out.length&&Array.isArray(t.who))t.who.forEach(function(n){out.push({uid:null,name:n,member:null});});
    return out;
  }
  function partyQuestForTask(t){
    try{
      var list=window.PartyQuestActiveView&&typeof PartyQuestActiveView.list==='function'?PartyQuestActiveView.list():[];
      return list.find(function(q){return String(q.questId||q.taskId||'')===String(t.id||t._key||'');})||null;
    }catch(e){return null;}
  }
  function partyParticipants(q){
    if(!q)return[];
    var out=[];
    function add(uid,name){if(!uid||out.some(function(x){return String(x.uid)===String(uid);} ))return;var m=member(uid);out.push({uid:String(uid),name:(m&&(m.displayName||m.name))||name||'Gezinslid',member:m});}
    add(q.inviterUid,q.inviterName);
    var inv=q.invitees&&typeof q.invitees==='object'?q.invitees:{};
    Object.keys(inv).forEach(function(uid){var x=inv[uid];if(x&&x.status==='active')add(uid,x.name);});
    return out;
  }
  function dayDiff(t){if(!t||!t.date)return null;var d=new Date(t.date+'T00:00:00'),now=new Date();now.setHours(0,0,0,0);return Math.round((d-now)/86400000);}
  // Verlopen/Voltooid are first-class buckets computed here, at render time,
  // from the same data every other group uses (see historical note in git
  // blame for why this must not move to a post-render DOM-shuffling layer).
  function group(t){if(t.done)return'Voltooid';var diff=dayDiff(t);if(diff===null)return'Later';if(diff<0)return'Verlopen';if(diff===0)return'Vandaag';if(diff===1)return'Morgen';return'Later';}
  function isImportant(t){var p=String(t.prio||t.priority||'').toLowerCase();return !t.done&&(p==='hoog'||p==='high');}
  function isOverdue(t){return !t.done&&group(t)==='Verlopen';}
  function xp(t){var m=String(t.xp||t.xpReward||('+'+(t.xpAmount||20)+' XP')).match(/(\d+)/);return m?parseInt(m[1],10):20;}
  function iconCategory(t){var raw=String(t.category||t.type||t.title||'').toLowerCase();if(/was|laundry|kleding/.test(raw))return'laundry';if(/stof|schoon|clean|dweil|badkamer|toilet/.test(raw))return'cleaning';if(/vaat|keuken|kitchen|koken/.test(raw))return'kitchen';if(/bood|supermarkt|grocer/.test(raw))return'groceries';if(/admin|contract|rekening|factuur|bank/.test(raw))return'admin';if(/kind|speel|family|gezin/.test(raw))return'family';if(/tuin|garden|plant/.test(raw))return'garden';return'quest';}
  // Warm/earthy accent palette — no purple, no fantasy hues.
  var CATEGORY_ACCENT={laundry:'#4A6A82',cleaning:'#6E8B5E',kitchen:'#9C6B3C',groceries:'#4F7A52',admin:'#7A7060',family:'#A15D68',garden:'#5C7A45',quest:'#2F5233'};
  var CATEGORY_ICON_PATH={laundry:'<path d="M6 3.5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4.2"/><path d="M7 7h2m2 0h1"/>',cleaning:'<path d="m8 3 8 18M5 18l12-5 2 5H5Z"/><path d="M7 6h5"/>',kitchen:'<path d="M7 3v7m-3-7v5a3 3 0 0 0 6 0V3M7 10v11M16 3v18M16 3c3 2 3 7 0 9"/>',groceries:'<path d="M3 5h2l2 10h9.5l2-7H6"/><circle cx="9" cy="19" r="1.2"/><circle cx="16" cy="19" r="1.2"/>',admin:'<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',family:'<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M13 20a4 4 0 0 1 7.5-1.8"/>',garden:'<path d="M12 21V10M12 13c-5 0-7-3-7-7 5 0 7 3 7 7Zm0 2c5 0 7-3 7-7-5 0-7 3-7 7Z"/>',quest:'<path d="M8 4v5.2c0 1 .4 2 1.1 2.7L12 14.6l2.9-2.7A3.8 3.8 0 0 0 16 9.2V4M8 4h8M8 20h8M12 14.6V20"/>'};
  function iconSvg(cat,size){return'<svg viewBox="0 0 24 24" width="'+(size||14)+'" height="'+(size||14)+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(CATEGORY_ICON_PATH[cat]||CATEGORY_ICON_PATH.quest)+'</svg>';}
  var UI_ICONS={
    clipboard:'<rect x="5" y="4" width="14" height="17" rx="2.3"/><path d="M9 4V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2V4M8.5 10h7M8.5 13.5h7M8.5 17h4.5"/>',
    star:'<path d="m12 3.5 2.5 5.3 5.7.7-4.2 4 1 5.9-5-2.8-5 2.8 1-5.9-4.2-4 5.7-.7Z"/>',
    clock:'<circle cx="12" cy="12" r="8.3"/><path d="M12 7.5V12l3.2 1.9"/>',
    check:'<path d="M5 13l4 4L19 7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    chevronDown:'<path d="m6 9 6 6 6-6"/>',
    chevronUp:'<path d="m18 15-6-6-6 6"/>',
    chevronRight:'<path d="m9 6 6 6-6 6"/>',
    leaf:'<path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z"/><path d="M5 19c2-4 5-7 9-9"/>',
    users:'<circle cx="9" cy="8.2" r="3"/><circle cx="16.2" cy="9.3" r="2.1"/><path d="M3.3 19.2a5.7 5.7 0 0 1 11.4 0M13.6 19.2a4.1 4.1 0 0 1 7.1-2"/>'
  };
  function ui(name,size){return'<svg viewBox="0 0 24 24" width="'+(size||14)+'" height="'+(size||14)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(UI_ICONS[name]||'')+'</svg>';}
  function thumbFor(t){
    try{if(window.TaskModel&&typeof TaskModel.getImage==='function'){var own=TaskModel.getImage(t);if(own)return own;}}catch(e){}
    var direct=t.imageUrl||t.image||t.photo||t.cover||'';
    if(direct)return direct;
    try{
      var cat=iconCategory(t);
      if(window.TaskHeroTemplates&&TaskHeroTemplates.templates&&TaskHeroTemplates.templates[cat]&&TaskHeroTemplates.templates[cat].image)return TaskHeroTemplates.templates[cat].image;
    }catch(e){}
    return'';
  }
  function dateMeta(t,groupName){
    if(groupName==='Voltooid')return'Voltooid';
    if(isOverdue(t)){var days=Math.abs(dayDiff(t)||0);return'Verlopen · '+days+' '+(days===1?'dag':'dagen');}
    if(!t.date)return'Geen datum';
    var d=new Date(t.date+'T00:00:00'),now=new Date();now.setHours(0,0,0,0);var diff=Math.round((d-now)/86400000);
    return diff<=0?'Vandaag':diff===1?'Morgen':d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});
  }
  function personAvatar(p){var u=p.member&&avatar(p.member);return u?'<img class="tko-mini-avatar" src="'+esc(u)+'" alt="'+esc(p.name)+'">':'<span class="tko-mini-avatar">'+esc(initials(p.name))+'</span>';}

  function injectStyles(){
    if(document.getElementById('task-overview-warm-style'))return;
    var s=document.createElement('style');s.id='task-overview-warm-style';
    s.textContent=`
.tko-page{--tko-bg:#faf6ee;--tko-surface:#ffffff;--tko-surface-2:#f3ecdc;--tko-border:#e7dcc4;--tko-border-soft:#efe8d8;--tko-text:#2b2a22;--tko-text2:#8b8270;--tko-green:#2f5233;--tko-green-2:#274a2b;--tko-gold:#b08c4c;--tko-danger:#a4433a;--tko-danger-bg:#f7e9e6;padding:0 14px 100px;max-width:520px;margin:auto;background:var(--tko-bg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--tko-text)}
[data-theme*="dark"] .tko-page{--tko-bg:#161c17;--tko-surface:#1e261f;--tko-surface-2:#212a22;--tko-border:#38442f;--tko-border-soft:#2c3729;--tko-text:#f1ead9;--tko-text2:#a6ad9b;--tko-green:#6fa377;--tko-green-2:#5c8d66;--tko-gold:#d7b978;--tko-danger:#e08a7f;--tko-danger-bg:#2c2019}
.tko-toprow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0 12px}
.tko-h1{font:700 27px/1 Georgia,"Times New Roman",serif;margin:0;color:var(--tko-text)}
.tko-add-btn{display:inline-flex;align-items:center;gap:6px;background:var(--tko-green);color:#fff;border:none;border-radius:11px;padding:9px 15px;font-size:13px;font-weight:700;white-space:nowrap}
.tko-add-btn svg{width:14px;height:14px}
.tko-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.tko-stat{background:var(--tko-surface);border:1px solid var(--tko-border-soft);border-radius:13px;padding:10px 8px;text-align:left}
.tko-stat b{display:block;font-size:20px;font-weight:800;line-height:1.1;color:var(--tko-text)}
.tko-stat small{display:block;font-size:10.5px;color:var(--tko-text2);font-weight:600;margin-top:2px}
.tko-stat .tko-stat-icon{color:var(--tko-text2);margin-bottom:5px;display:block}
.tko-stat--warn{background:#fbf3e2}.tko-stat--warn b{color:#a9791f}.tko-stat--warn .tko-stat-icon{color:#c99a35}
.tko-stat--danger{background:var(--tko-danger-bg)}.tko-stat--danger b{color:var(--tko-danger)}.tko-stat--danger .tko-stat-icon{color:var(--tko-danger)}
[data-theme*="dark"] .tko-stat--warn{background:#2c2515}[data-theme*="dark"] .tko-stat--warn b{color:#e0b85b}
.tko-banner{display:flex;align-items:center;gap:10px;background:var(--tko-surface-2);border:1px solid var(--tko-border-soft);border-radius:13px;padding:11px 13px;margin-bottom:14px}
.tko-banner-icon{width:28px;height:28px;border-radius:50%;background:var(--tko-surface);color:var(--tko-green);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tko-banner b{display:block;font-size:12.5px;font-weight:700;color:var(--tko-text)}
.tko-banner small{display:block;font-size:10.5px;color:var(--tko-text2);margin-top:1px}
.tko-filters{display:flex;gap:7px;overflow-x:auto;padding-bottom:14px;scrollbar-width:none}
.tko-filters::-webkit-scrollbar{display:none}
.tko-chip{white-space:nowrap;border:1px solid var(--tko-border-soft);background:var(--tko-surface);color:var(--tko-text2);border-radius:9px;height:30px;padding:0 14px;font-size:12px;font-weight:700}
.tko-chip.active{background:var(--tko-green);border-color:var(--tko-green);color:#fff}
.tko-group{margin-bottom:9px}
.tko-group-head{width:100%;border:none;background:transparent;padding:4px 2px 8px;display:flex;align-items:center;justify-content:space-between;text-align:left}
.tko-group-head b{font-size:14px;font-weight:700;color:var(--tko-text)}
.tko-group-head em{font-style:normal;font-size:11px;color:var(--tko-text2);font-weight:600;margin-left:2px}
.tko-group-head .tko-chev{color:var(--tko-text2)}
.tko-list{background:var(--tko-surface);border:1px solid var(--tko-border-soft);border-radius:14px;overflow:hidden}
.tko-row{display:flex;align-items:center;gap:9px;padding:9px 10px;border-top:1px solid var(--tko-border-soft)}
.tko-row:first-child{border-top:none}
.tko-check{box-sizing:border-box;width:19px;height:19px;min-width:19px;border-radius:50%;border:1.6px solid var(--tko-border);background:var(--tko-surface);display:flex;align-items:center;justify-content:center;padding:0;color:#fff;flex-shrink:0}
.tko-check.done{background:var(--tko-green);border-color:var(--tko-green)}
.tko-check svg{width:10px;height:10px}
.tko-thumb{width:42px;height:42px;border-radius:10px;flex:0 0 42px;background-size:cover;background-position:center;background-color:var(--tko-surface-2)}
.tko-thumb--fallback{display:flex;align-items:center;justify-content:center;color:#fff}
.tko-main{min-width:0;flex:1}
.tko-title-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tko-title{font-size:13px;font-weight:700;color:var(--tko-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tko-badge-overdue{font-size:8.5px;font-weight:800;letter-spacing:.3px;color:var(--tko-danger);background:var(--tko-danger-bg);border-radius:5px;padding:2px 5px}
.tko-badge-party{font-size:8.5px;font-weight:800;letter-spacing:.3px;color:var(--tko-green);background:var(--tko-surface-2);border-radius:5px;padding:2px 5px}
.tko-meta{display:flex;align-items:center;gap:4px;margin-top:3px;font-size:10.5px;color:var(--tko-text2);font-weight:500;overflow:hidden;white-space:nowrap}
.tko-meta i{font-style:normal;color:var(--tko-border);flex-shrink:0}
.tko-mini-avatar{width:16px;height:16px;border-radius:50%;object-fit:cover;background:var(--tko-green);color:#fff;font-size:6.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.tko-xp{flex-shrink:0;font-size:10px;font-weight:800;color:var(--tko-gold);background:var(--tko-surface-2);border-radius:8px;padding:3px 7px;white-space:nowrap}
.tko-xp small{font-weight:700;opacity:.8}
.tko-chevron{color:var(--tko-border);flex-shrink:0}
.tko-row.is-done{opacity:.55}
.tko-row.is-done .tko-title{text-decoration:line-through}
.tko-empty{padding:14px;text-align:center;font-size:11.5px;color:var(--tko-text2);background:var(--tko-surface)}
.tko-group-add{font-size:10.5px;font-weight:700;color:var(--tko-text2);background:none;border:none;padding:4px 2px}
.tko-party-card{width:100%;border:1px solid var(--tko-border-soft);border-radius:13px;background:var(--tko-surface);padding:10px 12px;display:flex;align-items:center;gap:10px;text-align:left;color:var(--tko-text);margin-top:4px}
.tko-party-icon{width:32px;height:32px;border-radius:50%;background:var(--tko-surface-2);color:var(--tko-green);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tko-party-card b{display:block;font-size:12px}
.tko-party-card small{display:block;color:var(--tko-text2);font-size:10.5px;margin-top:1px}
.tko-loading{padding:10px 0}
.tko-loading-label{font-size:11px;color:var(--tko-text2);font-weight:700;margin:6px 2px}
.tko-skel{height:60px;margin:8px 0;border-radius:14px;background:linear-gradient(90deg,var(--tko-surface-2),var(--tko-surface),var(--tko-surface-2));background-size:200% 100%;animation:tkoSkel 1.2s ease-in-out infinite}
@keyframes tkoSkel{0%{background-position:0 0}100%{background-position:200% 0}}
`;
    document.head.appendChild(s);
  }

  function statsCards(){
    var real=realTasks();
    var open=real.filter(function(t){return !t.done;}).length;
    var important=real.filter(isImportant).length;
    var overdue=real.filter(isOverdue).length;
    return'<div class="tko-stats">'
      +'<div class="tko-stat"><span class="tko-stat-icon">'+ui('clipboard',16)+'</span><b>'+open+'</b><small>open taken</small></div>'
      +'<div class="tko-stat tko-stat--warn"><span class="tko-stat-icon">'+ui('star',16)+'</span><b>'+important+'</b><small>belangrijk</small></div>'
      +'<div class="tko-stat tko-stat--danger"><span class="tko-stat-icon">'+ui('clock',16)+'</span><b>'+overdue+'</b><small>verlopen</small></div>'
      +'</div>';
  }
  function banner(){
    return'<div class="tko-banner"><span class="tko-banner-icon">'+ui('leaf',15)+'</span><span><b>Kleine taken, een rustiger thuis</b><small>Samen maken we tijd voor wat echt telt</small></span></div>';
  }
  function filterBar(){
    var defs=[['all','Alle taken'],['vandaag','Vandaag'],['morgen','Morgen'],['later','Later'],['voltooid','Voltooid']];
    return'<div class="tko-filters">'+defs.map(function(d){return'<button class="tko-chip '+(state.filter===d[0]?'active':'')+'" data-filter="'+d[0]+'">'+d[1]+'</button>';}).join('')+'</div>';
  }
  function row(t,groupName){
    var normalPeople=assignees(t),q=partyQuestForTask(t),people=q?partyParticipants(q):normalPeople;
    var cat=iconCategory(t),accent=CATEGORY_ACCENT[cat]||CATEGORY_ACCENT.quest;
    var thumbUrl=thumbFor(t);
    var thumbHtml=thumbUrl?'<div class="tko-thumb" style="background-image:url(\''+esc(thumbUrl).replace(/'/g,"\\'")+'\')"></div>':'<div class="tko-thumb tko-thumb--fallback" style="background:'+accent+'22;color:'+accent+'">'+iconSvg(cat,18)+'</div>';
    var overdueBadge=isOverdue(t)?'<span class="tko-badge-overdue">VERLOPEN</span>':'';
    var partyBadge=q?'<span class="tko-badge-party">SAMEN</span>':'';
    var mainPerson=people[0];
    var avatarHtml=mainPerson?personAvatar(mainPerson):'';
    var nameText=people.map(function(p){return p.name;}).join(', ')||'Niet toegewezen';
    var xpVal=xp(t);
    return'<article class="tko-row'+(t.done?' is-done':'')+(q?' is-party':'')+'" data-task-id="'+esc(t.id)+'">'
      +'<button class="tko-check'+(t.done?' done':'')+'" data-quick-toggle="'+esc(t.id)+'" aria-label="Voltooien">'+(t.done?ui('check',10):'')+'</button>'
      +thumbHtml
      +'<div class="tko-main">'
        +'<div class="tko-title-row"><span class="tko-title">'+esc(t.title||'Taak')+'</span>'+overdueBadge+partyBadge+'</div>'
        +'<div class="tko-meta">'+avatarHtml+'<span>'+esc(nameText)+'</span><i>·</i><span>'+esc(dateMeta(t,groupName))+'</span></div>'
      +'</div>'
      +'<div class="tko-xp">+'+xpVal+' <small>XP</small></div>'
      +'<div class="tko-chevron">'+ui('chevronRight',15)+'</div>'
      +'</article>';
  }
  function clearCompletedButton(){return'<button type="button" class="tko-group-add" data-clear-completed="1">Opschonen</button>';}
  function section(name,list){
    var open=!!state.expanded[name];
    return'<section class="tko-group" data-life-group="'+name+'">'
      +'<button class="tko-group-head" data-group-toggle="'+name+'"><span><b>'+name+'</b><em>'+list.length+' '+(list.length===1?'taak':'taken')+'</em></span><span class="tko-chev">'+ui(open?'chevronUp':'chevronDown',15)+'</span></button>'
      +(open?'<div class="tko-list">'+(list.length?list.map(function(t){return row(t,name);}).join(''):'<div class="tko-empty">Geen taken in deze groep.</div>')+(name==='Voltooid'&&list.length?clearCompletedButton():'')+'</div>':'')
      +'</section>';
  }
  function loadingBody(){return'<div class="tko-loading"><div class="tko-loading-label">Taken synchroniseren…</div><div class="tko-skel"></div><div class="tko-skel"></div><div class="tko-skel"></div></div>';}
  function partyCard(){return'<button class="tko-party-card" id="tch-party-quest"><span class="tko-party-icon">'+ui('users',16)+'</span><span><b>Groepstaken</b><small>Werk samen en verdien bonus XP</small></span><span class="tko-chevron">'+ui('chevronRight',15)+'</span></button>';}
  function shell(inner){
    return'<div class="tko-page"><div class="tko-toprow"><h1 class="tko-h1">Taken</h1><button class="tko-add-btn" data-quick-add="1">'+ui('plus',13)+' Nieuwe taak</button></div>'+inner+'</div>';
  }
  function render(el){
    if(!el)el=document.getElementById('task-content');if(!el)return;
    injectStyles();
    var real=tasks();
    if(!real.length&&!hydrated()){
      el.innerHTML=shell(statsCards()+banner()+filterBar()+loadingBody()+partyCard());
      bind(el);return;
    }
    var g={Vandaag:[],Morgen:[],Later:[],Voltooid:[]};
    real.forEach(function(t){var gr=group(t);if(gr==='Verlopen')g.Vandaag.push(t);else g[gr].push(t);});
    Object.keys(g).forEach(function(k){g[k].sort(function(a,b){
      var ao=isOverdue(a)?0:1,bo=isOverdue(b)?0:1;if(ao!==bo)return ao-bo;
      return String(a.date||'9999').localeCompare(String(b.date||'9999'));
    });});
    var order=['Vandaag','Morgen','Later','Voltooid'];
    var toShow=state.filter==='all'?order:[state.filter==='vandaag'?'Vandaag':state.filter==='morgen'?'Morgen':state.filter==='later'?'Later':'Voltooid'];
    var sectionsHtml=toShow.map(function(name){return section(name,g[name]);}).join('');
    el.innerHTML=shell(statsCards()+banner()+filterBar()+sectionsHtml+partyCard());
    bind(el);
  }
  function bind(el){
    el.querySelectorAll('[data-filter]').forEach(function(b){b.onclick=function(){state.filter=b.dataset.filter;if(state.filter!=='all'){var map={vandaag:'Vandaag',morgen:'Morgen',later:'Later',voltooid:'Voltooid'};state.expanded[map[state.filter]]=true;}render(el);};});
    el.querySelectorAll('[data-group-toggle]').forEach(function(h){h.onclick=function(e){if(e.target.closest('[data-clear-completed]'))return;var n=h.dataset.groupToggle;state.expanded[n]=!state.expanded[n];render(el);};});
    el.querySelectorAll('[data-quick-add]').forEach(function(b){b.onclick=function(e){e.stopPropagation();if(window.TaskDetailPopup&&typeof window.TaskDetailPopup.openCreate==='function')window.TaskDetailPopup.openCreate();};});
    el.querySelectorAll('[data-clear-completed]').forEach(function(b){b.onclick=function(e){e.stopPropagation();e.preventDefault();var done=realTasks().filter(function(t){return t&&t.done;});if(!done.length)return;if(!confirm('Alle '+done.length+' voltooide taken verwijderen?'))return;if(typeof window.deleteTask!=='function'){if(typeof window.showToast==='function')showToast('Opschonen is nog niet beschikbaar');return;}done.forEach(function(t){window.deleteTask(t.id);});if(typeof window.showToast==='function')showToast(done.length+' voltooide '+(done.length===1?'taak verwijderd':'taken verwijderd'));};});
    el.querySelectorAll('[data-quick-toggle]').forEach(function(b){b.onclick=function(e){e.stopPropagation();var id=b.dataset.quickToggle,t=realTasks().find(function(x){return String(x.id)===String(id);}),subs=t&&Array.isArray(t.subtasks)?t.subtasks:[];if(subs.length&&!t.done&&!subs.every(function(s){return s.done;})){if(window.TaskDetailPopup)TaskDetailPopup.open(id);if(typeof window.showToast==='function')showToast('Voltooi eerst alle stappen');return;}if(typeof window.toggleTask==='function')window.toggleTask(id);};});
    el.querySelectorAll('[data-task-id]').forEach(function(r){r.onclick=function(e){if(e.target.closest('[data-quick-toggle]'))return;if(window.TaskDetailPopup)TaskDetailPopup.open(r.dataset.taskId);};});
    var party=document.getElementById('tch-party-quest');if(party)party.onclick=function(){if(window.PartyQuestActiveView&&PartyQuestActiveView.open)PartyQuestActiveView.open();else if(typeof window.showGQPopup==='function')showGQPopup('Groepsquest');};
  }

  window.TaskCompactHome={render:render,state:state,isHydrated:hydrated,partyQuestForTask:partyQuestForTask};
  window.addEventListener('familyapp:tasks-updated',function(){if(window.taskTab==='compact')render();});
  window.addEventListener('familyapp:household-identity-synced',function(){if(window.taskTab==='compact')render();});
  window.addEventListener('familyapp:party-quests-updated',function(){if(window.taskTab==='compact')render();});
})();
