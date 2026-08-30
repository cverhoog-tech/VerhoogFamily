'use strict';
// ============================================================
// FEED TAGGING v1.3.0 — STEP 13.4
// Structured member + recipe references and one canonical linked task.
// The former pin/task-link action is upgraded instead of duplicating task
// linking with a second authority.
// ============================================================
(function(){
  if(window.FeedTagging&&window.FeedTagging.version==='1.3.0')return;

  var pending=[];
  var picker=null;
  var inlinePicker=null;
  var originalCreate=null;
  var originalRenderPost=null;
  var patchedCreate=false;
  var patchedRender=false;

  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function safe(v){return esc(v).replace(/`/g,'&#096;');}
  function refs(value){return Array.isArray(value)?value.filter(function(r){return r&&((r.type==='member'&&r.uid)||(r.type==='recipe'&&r.recipeId));}).map(clone):[];}
  function key(r){return r.type==='member'?'member:'+String(r.uid):'recipe:'+String(r.recipeId);}
  function members(){try{if(window.FeedSharedData&&FeedSharedData.members)return FeedSharedData.members()||[];}catch(e){}try{if(window.HouseholdIdentityFirebaseBridge&&HouseholdIdentityFirebaseBridge.getMembers)return HouseholdIdentityFirebaseBridge.getMembers()||[];}catch(e){}try{if(window.TaskSharedData&&TaskSharedData.members)return TaskSharedData.members()||[];}catch(e){}return[];}
  function recipes(){try{if(window.RecipeStore&&RecipeStore.list)return RecipeStore.list()||[];}catch(e){}return Array.isArray(window.recipesData)?window.recipesData:[];}
  function tasks(){return Array.isArray(window.taskData)?window.taskData.filter(function(t){return t&&t.id!==undefined&&t.id!==null;}):[];}
  function memberByUid(uid){return members().find(function(m){return String(m.uid||m.id)===String(uid);})||null;}
  function memberAvatar(m){if(!m)return'';return m.avatar||m.avatarUrl||m.photoURL||m.photoUrl||m.profilePhoto||'';}
  function memberName(uid){var m=memberByUid(uid);return m&&(m.displayName||m.name)||'Gezinslid';}
  function memberRef(m){return{type:'member',uid:String(m.uid||m.id),displayName:String(m.displayName||m.name||'Gezinslid')};}
  function recipeRef(r){return{type:'recipe',recipeId:String(r.id),title:String(r.name||r.title||'Recept')};}
  function taskRef(t){return{type:'task',taskId:String(t.id||t._key),title:String(t.title||t.name||'Taak'),category:String(t.category||t.type||''),date:String(t.date||''),done:!!t.done};}
  function taskById(id){return tasks().find(function(t){return String(t.id||t._key)===String(id);})||null;}
  function linkedTask(){var t=window.composeLinkedTask;return t&&t.type==='task'&&t.taskId?clone(t):null;}
  function has(r){var k=key(r);return pending.some(function(x){return key(x)===k;});}
  function add(r){if(!r||has(r))return;pending.push(clone(r));renderPending();closeAllPickers();}
  function remove(k){pending=pending.filter(function(r){return key(r)!==String(k);});renderPending();}
  function clear(){pending=[];renderPending();}
  function pendingRefs(){return pending.map(clone);}

  function iconSvg(type,size){
    var paths={
      photo:'<rect x="3.5" y="6.5" width="17" height="13" rx="3"/><path d="M8 6.5 9.4 4.5h5.2L16 6.5"/><circle cx="12" cy="13" r="3.4"/>',
      task:'<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 4.5V3.7h6v.8M8.5 12.5l2.1 2.1 4.9-5"/>',
      member:'<circle cx="9.5" cy="8" r="3.2"/><path d="M4.5 19c.4-4 2.5-6 5-6 1.4 0 2.7.6 3.6 1.6"/><path d="M16.3 13.2c-2.2 0-3.3 1.5-3.3 3.3s1.1 3.3 2.8 3.3c1 0 1.7-.5 2.1-1.2v1h1.6v-6.2h-1.6v.9c-.4-.7-1-1.1-1.6-1.1Z"/>',
      recipe:'<path d="M7 11.2c-2.2-.2-3.5-1.5-3.5-3.3 0-2 1.6-3.5 3.6-3.5.6-1.5 2-2.4 3.7-2.4 1.8 0 3.2.9 3.8 2.5 2.3 0 4 1.6 4 3.7 0 1.7-1.2 2.9-3.2 3.1"/><path d="M7 10.5v9h9v-9M9.5 16h4"/>'
    };
    return '<svg viewBox="0 0 24 24" width="'+(size||20)+'" height="'+(size||20)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[type]||paths.task)+'</svg>';
  }

  function avatarMarkup(r,sizeClass){
    if(r.type==='recipe')return'<span class="fs-tag-avatar fs-tag-recipe-avatar">'+iconSvg('recipe',18)+'</span>';
    if(r.type==='task')return'<span class="fs-tag-avatar fs-tag-task-avatar">'+iconSvg('task',18)+'</span>';
    var m=memberByUid(r.uid),url=memberAvatar(m);
    if(url)return'<img class="fs-tag-avatar '+(sizeClass||'')+'" src="'+safe(url)+'" alt="'+esc(r.displayName||'Gezinslid')+'">';
    var initials=String(r.displayName||'G').trim().split(/\s+/).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase();
    return'<span class="fs-tag-avatar '+(sizeClass||'')+'">'+esc(initials||'@')+'</span>';
  }

  function chip(r,removable){
    var label,action,mini='';
    if(r.type==='member'){label='@'+(r.displayName||'Gezinslid');action="openFeedReference('member','"+safe(r.uid)+"')";mini=avatarMarkup(r,'fs-tag-avatar-mini');}
    else if(r.type==='task'){label=r.title||'Taak';action="openFeedReference('task','"+safe(r.taskId)+"')";mini='<span class="fs-tag-chip-icon">'+iconSvg('task',14)+'</span>';}
    else{label=r.title||'Recept';action="openFeedReference('recipe','"+safe(r.recipeId)+"')";mini='<span class="fs-tag-chip-icon">'+iconSvg('recipe',14)+'</span>';}
    return '<span class="fs-tag-wrap"><button type="button" class="fs-tag-chip fs-tag-'+esc(r.type)+'" onclick="event.stopPropagation();'+action+'">'+mini+'<b>'+esc(label)+'</b></button>'+(removable?'<button type="button" class="fs-tag-remove" aria-label="Tag verwijderen" onclick="event.stopPropagation();removeFeedTag(\''+safe(key(r))+'\')">×</button>':'')+'</span>';
  }
  function chipsHtml(list,task){list=refs(list);var all=list.slice();if(task&&task.type==='task'&&task.taskId)all.push(task);return all.length?'<div class="fs-post-tags">'+all.map(function(r){return chip(r,false);}).join('')+'</div>':'';}
  function renderPending(){var host=document.getElementById('feed-tag-pending');if(host)host.innerHTML=pending.length?'<div class="fs-compose-tags">'+pending.map(function(r){return chip(r,true);}).join('')+'</div>':'';}

  function taskAssignee(task){
    var uid='';
    if(task&&task.assignedToUid)uid=task.assignedToUid;
    else if(task&&task.assignedToUids&&typeof task.assignedToUids==='object')uid=Object.keys(task.assignedToUids).find(function(k){return task.assignedToUids[k];})||'';
    var m=uid?memberByUid(uid):null;
    return{uid:uid,name:m&&(m.displayName||m.name)||'',avatar:memberAvatar(m)};
  }
  function taskDateLabel(task){if(!task||!task.date)return task&&task.done?'Afgerond':'Geen datum';var d=new Date(task.date+'T00:00:00'),today=new Date();today.setHours(0,0,0,0);var diff=Math.round((d-today)/86400000);if(diff===0)return'Vandaag';if(diff===1)return'Morgen';if(diff===-1)return'Gisteren';return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'});}
  function filteredRows(type,q){
    q=String(q||'').trim().toLowerCase();
    if(type==='member')return members().filter(function(m){return !q||String(m.displayName||m.name||'').toLowerCase().indexOf(q)>-1;}).map(memberRef);
    if(type==='recipe')return recipes().filter(function(r){return !q||String(r.name||r.title||'').toLowerCase().indexOf(q)>-1;}).map(recipeRef);
    return tasks().filter(function(t){return !q||String(t.title||t.name||'').toLowerCase().indexOf(q)>-1;}).sort(function(a,b){if(!!a.done!==!!b.done)return a.done?1:-1;return String(a.date||'9999').localeCompare(String(b.date||'9999'));}).map(taskRef);
  }
  function rowHtml(r,compact){
    var id,label,sub,avatar;
    if(r.type==='member'){id=r.uid;label=r.displayName;sub='Gezinslid';avatar=avatarMarkup(r,'');}
    else if(r.type==='recipe'){id=r.recipeId;label=r.title;sub='Recept';avatar=avatarMarkup(r,'');}
    else{
      id=r.taskId;label=r.title;var task=taskById(id),ass=taskAssignee(task);sub=(r.done?'Afgerond':taskDateLabel(task))+(ass.name?' · '+ass.name:'');
      avatar=ass.avatar?'<img class="fs-tag-avatar" src="'+safe(ass.avatar)+'" alt="'+esc(ass.name)+'">':avatarMarkup(r,'');
    }
    return '<button type="button" class="'+(compact?'fs-tag-inline-row':'fs-tag-choice')+' fs-tag-choice-'+esc(r.type)+'" onclick="selectFeedTag(\''+r.type+'\',\''+safe(id)+'\')">'+avatar+'<span><b>'+esc(label)+'</b><small>'+esc(sub)+'</small></span><i>+</i></button>';
  }

  function closePicker(){if(picker&&picker.parentNode)picker.remove();picker=null;}
  function closeInline(){if(inlinePicker&&inlinePicker.parentNode)inlinePicker.remove();inlinePicker=null;}
  function closeAllPickers(){closePicker();closeInline();}
  function openPicker(type){
    closeAllPickers();
    var title=type==='member'?'Persoon':type==='recipe'?'Recept':'Taak';
    var rows=filteredRows(type,'');
    var root=document.createElement('div');root.className='fs-tag-picker';
    root.innerHTML='<div class="fs-tag-backdrop" onclick="closeFeedTagPicker()"></div><section class="fs-tag-sheet"><div class="fs-tag-sheet-head"><div><small>TAG TOEVOEGEN</small><h3>'+title+' selecteren</h3></div><button type="button" onclick="closeFeedTagPicker()">×</button></div>'+(type==='task'?'<div class="fs-tag-search-wrap"><span>⌕</span><input id="feed-task-tag-search" placeholder="Zoek een taak…" autocomplete="off"></div>':'')+'<div class="fs-tag-choices" id="feed-tag-choice-list">'+(rows.length?rows.map(function(r){return rowHtml(r,false);}).join(''):'<div class="fs-tag-empty">Geen opties beschikbaar</div>')+'</div></section>';
    document.body.appendChild(root);picker=root;
    if(type==='task'){
      var input=document.getElementById('feed-task-tag-search'),list=document.getElementById('feed-tag-choice-list');
      if(input&&list)input.addEventListener('input',function(){var next=filteredRows('task',input.value);list.innerHTML=next.length?next.map(function(r){return rowHtml(r,false);}).join(''):'<div class="fs-tag-empty">Geen taken gevonden</div>';});
    }
  }
  function openInline(type,query){
    closeInline();var ca=document.getElementById('compose-area');if(!ca)return;var rows=filteredRows(type,query).slice(0,6),root=document.createElement('div');root.className='fs-tag-inline';
    root.innerHTML='<div class="fs-tag-inline-head"><b>'+(type==='member'?'Persoon taggen':'Recept taggen')+'</b><small>'+(query?esc(query):'Kies een optie')+'</small></div><div class="fs-tag-inline-list">'+(rows.length?rows.map(function(r){return rowHtml(r,true);}).join(''):'<div class="fs-tag-empty">Geen resultaten</div>')+'</div>';
    document.body.appendChild(root);inlinePicker=root;positionInline(root,ca);
  }
  function positionInline(root,ca){var r=ca.getBoundingClientRect(),vv=window.visualViewport,viewportTop=vv?vv.offsetTop:0,viewportH=vv?vv.height:window.innerHeight,bottom=Math.max(12,window.innerHeight-(viewportTop+viewportH)+12);root.style.left=Math.max(12,r.left)+'px';root.style.width=Math.min(r.width,window.innerWidth-24)+'px';root.style.bottom=bottom+'px';}

  function select(type,id){
    if(type==='member'){var m=memberByUid(id);if(m)add(memberRef(m));return;}
    if(type==='recipe'){var r=recipes().find(function(x){return String(x.id)===String(id);});if(r)add(recipeRef(r));return;}
    var t=taskById(id);if(!t)return;
    window.composeLinkedTask=taskRef(t);
    var row=document.getElementById('feed-status-row'),label=document.getElementById('feed-status-task-label');
    if(row){row.style.display='block';row.classList.add('fs-task-link-status');}
    if(label)label.textContent=t.title||t.name||'Taak';
    closeAllPickers();
  }

  function openRef(type,id){
    closeAllPickers();
    if(type==='task'){
      try{if(typeof window.showScreen==='function')window.showScreen('tasks');}catch(e){}
      setTimeout(function(){try{if(window.TaskDetailPopup&&typeof TaskDetailPopup.open==='function')TaskDetailPopup.open(id);}catch(e){}},120);
      return;
    }
    if(type==='recipe'){
      try{if(typeof window.showScreenMore==='function')window.showScreenMore('recipes');else if(typeof window.showScreen==='function')window.showScreen('recipes');}catch(e){}
      setTimeout(function(){try{if(typeof window.openRecipeDetail==='function')window.openRecipeDetail(id);}catch(e){}},120);return;
    }
    window.__familyFeedMemberFocusUid=String(id);
    try{if(typeof window.showScreen==='function')window.showScreen('tasks');}catch(e){}
    setTimeout(function(){try{var personTab=document.querySelector('#screen-tasks [data-tab="person"],#screen-tasks [data-task-tab="person"],#screen-tasks .ttab-person,#screen-tasks .task-tab-person');if(personTab&&personTab.click)personTab.click();setTimeout(function(){var btn=document.querySelector('[data-pt2-member="'+CSS.escape(String(id))+'"]');if(btn)btn.click();},80);}catch(e){}},80);
  }

  function decorateComposer(){
    var card=document.getElementById('feed-compose-card')||document.querySelector('#screen-feed .feed-compose-card');if(!card)return;
    var actions=card.querySelector('.feed-compose-actions');
    if(actions){
      var post=actions.querySelector('#feed-send-btn')||null;
      var photo=actions.querySelector('[onclick*="feed-photo-inp"]');
      var task=actions.querySelector('[onclick*="openTaskStatusPicker"]')||document.getElementById('feed-tag-task-btn');
      if(photo){photo.className='fs-compose-tool fs-compose-tool-photo';photo.innerHTML=iconSvg('photo',20);photo.setAttribute('aria-label','Foto toevoegen');photo.title='Foto toevoegen';}
      if(task){task.id='feed-tag-task-btn';task.className='fs-compose-tool fs-compose-tool-task';task.innerHTML=iconSvg('task',20);task.setAttribute('onclick',"openFeedTagPicker('task')");task.setAttribute('aria-label','Taak taggen');task.title='Taak taggen';}
      if(!document.getElementById('feed-tag-member-btn')){
        var memberBtn=document.createElement('button');memberBtn.type='button';memberBtn.id='feed-tag-member-btn';memberBtn.className='fs-compose-tool fs-compose-tool-member';memberBtn.setAttribute('aria-label','Persoon taggen');memberBtn.title='Persoon taggen';memberBtn.setAttribute('onclick',"openFeedTagPicker('member')");memberBtn.innerHTML=iconSvg('member',20);actions.insertBefore(memberBtn,post);
      }
      if(!document.getElementById('feed-tag-recipe-btn')){
        var recipeBtn=document.createElement('button');recipeBtn.type='button';recipeBtn.id='feed-tag-recipe-btn';recipeBtn.className='fs-compose-tool fs-compose-tool-recipe';recipeBtn.setAttribute('aria-label','Recept taggen');recipeBtn.title='Recept taggen';recipeBtn.setAttribute('onclick',"openFeedTagPicker('recipe')");recipeBtn.innerHTML=iconSvg('recipe',20);actions.insertBefore(recipeBtn,post);
      }
    }
    if(!document.getElementById('feed-tag-pending')){
      var pendingHost=document.createElement('div');pendingHost.id='feed-tag-pending';var input=card.querySelector('#compose-area,.compose-input');if(input&&input.parentNode)input.parentNode.insertBefore(pendingHost,input.nextSibling);else card.appendChild(pendingHost);renderPending();
    }
    var ca=document.getElementById('compose-area');
    if(ca&&ca.dataset.feedTagWired!=='1'){
      ca.dataset.feedTagWired='1';
      ca.addEventListener('input',function(){var text=String(ca.innerText||ca.textContent||''),match=text.match(/(?:^|\s)([@#])([^\s@#]{0,30})$/);if(match)openInline(match[1]==='@'?'member':'recipe',match[2]||'');else closeInline();});
      ca.addEventListener('blur',function(){setTimeout(function(){if(!document.activeElement||!document.activeElement.closest||!document.activeElement.closest('.fs-tag-inline'))closeInline();},120);});
    }
  }

  function patchCreate(){
    if(patchedCreate||!window.FeedSharedData||typeof FeedSharedData.createPost!=='function')return false;
    originalCreate=FeedSharedData.createPost;
    FeedSharedData.createPost=function(data){data=Object.assign({},data||{});var supplied=refs(data.references),current=pendingRefs();data.references=supplied.concat(current.filter(function(r){return !supplied.some(function(x){return key(x)===key(r);});}));return Promise.resolve(originalCreate.call(FeedSharedData,data)).then(function(row){clear();return row;});};
    patchedCreate=true;return true;
  }
  function patchRender(){
    if(patchedRender||typeof window.renderPostHTML!=='function')return false;
    originalRenderPost=window.renderPostHTML;
    window.renderPostHTML=function(p){var html=originalRenderPost(p);if(!p||p.type!=='post')return html;var task=p.linkedEntity&&p.linkedEntity.type==='task'?p.linkedEntity:null;var tags=chipsHtml(p.references,task);if(!tags)return html;var re=/(<div class="fs-post-text">[\s\S]*?<\/div>)/;return re.test(html)?html.replace(re,'$1'+tags):html.replace('</article>',tags+'</article>');};
    patchedRender=true;return true;
  }

  function css(){
    if(document.getElementById('feed-tagging-css-v4'))return;
    var s=document.createElement('style');s.id='feed-tagging-css-v4';s.textContent=''
      +'.fs-compose-tool{width:34px;height:34px;min-width:34px;border:1px solid var(--c-border,#e3e7eb)!important;border-radius:11px!important;background:var(--c-surface,#fff)!important;color:var(--c-text2,#667085)!important;display:grid!important;place-items:center!important;padding:0!important;flex:0 0 auto!important;box-shadow:0 2px 8px rgba(17,24,39,.035);transition:transform .12s ease,background .12s ease,color .12s ease}.fs-compose-tool:active{transform:scale(.94)}.fs-compose-tool-photo:active{background:#edf7ef!important;color:#397343!important}.fs-compose-tool-task:active{background:#edf7ef!important;color:#397343!important}.fs-compose-tool-member:active{background:#eef3ff!important;color:#4f70a6!important}.fs-compose-tool-recipe:active{background:#fff1e8!important;color:#ad6340!important}'
      +'.fs-compose-tags,.fs-post-tags{display:flex;gap:5px;flex-wrap:wrap}.fs-compose-tags{margin:7px 0 0}.fs-post-tags{margin:0 0 10px}.fs-tag-wrap{display:inline-flex;align-items:center}.fs-tag-chip{height:27px;display:inline-flex;align-items:center;gap:5px;border:0;border-radius:9px;padding:0 8px;background:#eef6ee;color:#47714b;font-size:11.5px;max-width:210px}.fs-tag-chip.fs-tag-recipe{background:#fff1e8;color:#9b5b3e}.fs-tag-chip.fs-tag-task{background:#edf7ef;color:#3f7147}.fs-tag-chip b{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fs-tag-chip-icon{display:grid;place-items:center;flex:0 0 auto}.fs-tag-remove{margin-left:2px;width:20px;height:20px;border:0;border-radius:7px;background:transparent;color:#98a0ab;font-size:15px;padding:0;display:grid;place-items:center}'
      +'.fs-tag-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;background:var(--c-surface2,#f3f4f6);display:grid;place-items:center;font-size:12px;font-weight:900;color:var(--c-text2,#667085);box-shadow:0 2px 7px rgba(17,24,39,.08)}.fs-tag-avatar-mini{width:18px;height:18px;box-shadow:none}.fs-tag-recipe-avatar,.fs-tag-task-avatar{border-radius:10px}.fs-tag-recipe-avatar{background:#fff1e8;color:#ad6340}.fs-tag-task-avatar{background:#edf7ef;color:#397343}'
      +'.fs-task-link-status{border:1px solid #dcebdc!important;background:#f2f9f1!important;border-radius:12px!important;padding:8px 10px!important}.fs-task-link-status>div:first-child{color:#4c7d53!important}'
      +'.fs-tag-inline{position:fixed;z-index:100030;background:var(--c-surface,#fff);border:1px solid var(--c-border,#e5e7eb);border-radius:16px;box-shadow:0 16px 40px rgba(17,24,39,.16);padding:8px;max-height:240px;overflow:auto}.fs-tag-inline-head{display:flex;align-items:center;justify-content:space-between;padding:3px 6px 7px}.fs-tag-inline-head b{font-size:12px}.fs-tag-inline-head small{font-size:10px;color:var(--c-text3,#9aa3b2)}.fs-tag-inline-list{display:flex;flex-direction:column;gap:2px}.fs-tag-inline-row,.fs-tag-choice{width:100%;display:grid;grid-template-columns:34px 1fr 20px;gap:9px;align-items:center;text-align:left;border:0;background:transparent;color:var(--c-text,#111827)}.fs-tag-inline-row{border-radius:11px;padding:7px}.fs-tag-inline-row:active{background:var(--c-surface2,#f3f5f4)}.fs-tag-inline-row b,.fs-tag-choice b{display:block;font-size:13px}.fs-tag-inline-row small,.fs-tag-choice small{display:block;font-size:10px;color:var(--c-text2,#7c8592)}.fs-tag-inline-row i,.fs-tag-choice i{font-style:normal;color:var(--c-primary,#3f7f2f);font-weight:900}'
      +'.fs-tag-picker{position:fixed;inset:0;z-index:100020;display:flex;align-items:flex-end;justify-content:center}.fs-tag-backdrop{position:absolute;inset:0;background:rgba(14,18,25,.28);backdrop-filter:blur(4px)}.fs-tag-sheet{position:relative;width:min(100%,520px);max-height:68vh;background:var(--c-surface,#fff);border-radius:22px 22px 0 0;padding:14px 14px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -16px 50px rgba(0,0,0,.18)}.fs-tag-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.fs-tag-sheet-head small{font-size:9px;letter-spacing:.1em;color:var(--c-text3,#9aa3b2);font-weight:900}.fs-tag-sheet-head h3{margin:1px 0 0;font-size:18px}.fs-tag-sheet-head>button{width:30px;height:30px;border:0;border-radius:10px;background:var(--c-surface2,#f1f3f2);font-size:21px;color:var(--c-text2,#667085)}.fs-tag-search-wrap{height:39px;border:1px solid var(--c-border,#e5e7eb);border-radius:12px;display:flex;align-items:center;gap:7px;padding:0 10px;margin:3px 0 9px;color:var(--c-text3,#9aa3b2)}.fs-tag-search-wrap input{border:0;outline:0;background:transparent;flex:1;min-width:0;color:var(--c-text,#111827);font-size:13px}.fs-tag-choices{display:flex;flex-direction:column;gap:3px;overflow:auto;max-height:calc(68vh - 118px)}.fs-tag-choice{border-bottom:1px solid var(--c-border,#eef0f2);padding:9px 4px}.fs-tag-choice-task{border:1px solid var(--c-border,#e8ece8);border-radius:13px;padding:9px;margin-bottom:3px}.fs-tag-empty{text-align:center;padding:24px;color:var(--c-text2,#7c8592);font-size:12px}'
      +'[data-theme="dark"] .fs-tag-chip,.dark .fs-tag-chip,body.dark-mode .fs-tag-chip{background:#243128;color:#a9d0ad}[data-theme="dark"] .fs-tag-chip.fs-tag-recipe,.dark .fs-tag-chip.fs-tag-recipe,body.dark-mode .fs-tag-chip.fs-tag-recipe{background:#3c2c25;color:#e4b59e}[data-theme="dark"] .fs-tag-chip.fs-tag-task,.dark .fs-tag-chip.fs-tag-task,body.dark-mode .fs-tag-chip.fs-tag-task{background:#26352a;color:#a6d0ad}';
    document.head.appendChild(s);
  }

  function boot(){
    css();patchCreate();patchRender();decorateComposer();
    var obs=new MutationObserver(function(){patchCreate();patchRender();decorateComposer();});obs.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('familyapp:feed-updated',function(){setTimeout(decorateComposer,0);});
    window.addEventListener('familyapp:tasks-updated',function(){if(picker&&document.getElementById('feed-task-tag-search')){var input=document.getElementById('feed-task-tag-search'),list=document.getElementById('feed-tag-choice-list'),next=filteredRows('task',input?input.value:'');if(list)list.innerHTML=next.length?next.map(function(r){return rowHtml(r,false);}).join(''):'<div class="fs-tag-empty">Geen taken gevonden</div>';}});
    if(window.visualViewport)visualViewport.addEventListener('resize',function(){if(inlinePicker){var ca=document.getElementById('compose-area');if(ca)positionInline(inlinePicker,ca);}});
  }

  window.FeedTagging={version:'1.3.0',pending:pendingRefs,clear:clear,add:add,remove:remove,openPicker:openPicker,closePicker:closeAllPickers,select:select,openReference:openRef,decorateComposer:decorateComposer,iconSvg:iconSvg};
  window.openFeedTagPicker=openPicker;window.closeFeedTagPicker=closeAllPickers;window.selectFeedTag=select;window.removeFeedTag=remove;window.openFeedReference=openRef;window.openTaskStatusPicker=function(){openPicker('task');};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
